import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import pThrottle from 'p-throttle';
import { XMLParser } from 'fast-xml-parser';
import {
  EdgarDailySummaryApiResponse,
  EdgarDailySummaryDirectoryItem,
  EdgarIdxFileEntry,
  EdgarEmbeddedDocument,
} from './types.js';
import logger from './logger.js';
import dbconnector from './dbconnector.js';

const TMP_DIRECTORY: string = path.join(os.tmpdir(), 'SecFormsFetcher');

const EDGAR_BASE_URL: string = 'https://www.sec.gov/Archives';
const RELEVANT_FORM_TYPES: Array<string> = ['3', '4', '5']; // Form types to be fetched from the SEC database

// User agent and rate limits for HTTP requests to edgar database (conforming to SEC's guideline -> https://www.sec.gov/search-filings/edgar-search-assistance/accessing-edgar-data)
const USER_AGENT: string =
  'Pascal Knecht (student at Swiss Distance University of Applied Sciences) pascal.knecht@students.ffhs.ch';
const EDGAR_RATE_LIMITS = {
  limit: 3, // max 10 queries per time interval, but limitting to 3 to be on the safe side
  interval: 1000, // set time interval to 1 second --> 10 queries per second
};

// Check if the script was started directly or by another script
if (process.argv[1].endsWith('fetcher')) {
  logger.info(`${path.basename(new URL('', import.meta.url).pathname)} was started directly.`);
  fetchSecForms(); // Start fetching SEC forms if script was started directly
}

/**
 * Queries the EDGAR database in rate-limited manner and returns the response.
 *
 * @param {string} query - The query string to append to the EDGAR base URL.
 * @returns {Promise<Response>} - The response from the EDGAR database.
 * @throws {Error} - If the HTTP response status is not OK.
 */
const queryEdgarData: (_query: string) => Promise<Response> = pThrottle(EDGAR_RATE_LIMITS)(async (
  query: string,
): Promise<Response> => {
  const url = `${EDGAR_BASE_URL}/${query}`;
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, 'Accept-Encoding': 'gzip, deflate' },
  });
  if (!response.ok)
    throw new Error(
      `HTTP error while accessing ${url}! status: ${response.status} (${response.statusText})`,
    );
  return response;
});

/**
 * Retrieves a list of missed daily summaries of SEC filings since the last fetched date.
 *
 * @param {Date} lastFetchedDate - The date of the last fetched summary
 * @returns {Promise<string[]>} A promise that resolves to an array of query paths to missed daily summaries.
 */
async function getRelevantDailySummaries(lastFetchedDate: Date) {
  const missedDailySummaries: string[] = [];

  // get list of available items in main directory of EDGAR
  let queryResponse: Response = await queryEdgarData('edgar/daily-index/index.json');
  const availableItems: EdgarDailySummaryApiResponse =
    (await queryResponse.json()) as EdgarDailySummaryApiResponse;

  // compose list of relevant years
  const relevantYears: EdgarDailySummaryDirectoryItem[] = [];
  for (const item of availableItems.directory.item) {
    if (item.type !== 'dir' || !/^\d{4}$/.test(item.name)) {
      // ignore non-directory or 'non-year' items
      logger.debug(`Skipping non-directory or non-year item '${item.name}' of type '${item.type}'`);
    } else if (parseInt(item.name) < lastFetchedDate.getFullYear()) {
      // ignore years that are older than the last fetched date
      logger.debug(`Skipping irrelevant year '${item.name}'`);
    } else {
      logger.debug(`Adding relevant year '${item.name}'`);
      relevantYears.push(item);
    }
  }

  // handle each relevant year
  for (const yearItem of relevantYears) {
    // get list of available items in yearly directory of EDGAR
    queryResponse = await queryEdgarData(`edgar/daily-index/${yearItem.href}index.json`);
    const availableItems: EdgarDailySummaryApiResponse =
      (await queryResponse.json()) as EdgarDailySummaryApiResponse;

    // compose list of relevant quarters for this year
    const relevantQuarters: EdgarDailySummaryDirectoryItem[] = [];
    for (const item of availableItems.directory.item) {
      if (item.type !== 'dir' || !/^QTR\d$/.test(item.name)) {
        // ignore non-directory or 'non-quarter' items
        logger.debug(
          `Skipping non-directory or non-quarter item '${item.name}' of type '${item.type}' for year '${yearItem.name}'`,
        );
      } else if (
        parseInt(yearItem.name) === lastFetchedDate.getFullYear() &&
        parseInt(item.name.slice(-1)) < Math.floor(lastFetchedDate.getMonth() / 3) + 1
      ) {
        // ignore quarters that are older than the last fetched date
        logger.debug(`Skipping irrelevant quarter '${item.name}' for year '${yearItem.name}'`);
      } else {
        logger.debug(`Adding relevant quarter '${item.name}' for year '${yearItem.name}'`);
        relevantQuarters.push(item);
      }
    }

    // handle each relevant quarter for this year
    for (const quarterItem of relevantQuarters) {
      // get list of available items in quarterly directory of EDGAR
      queryResponse = await queryEdgarData(
        `edgar/daily-index/${yearItem.href}${quarterItem.href}index.json`,
      );
      const availableItems: EdgarDailySummaryApiResponse =
        (await queryResponse.json()) as EdgarDailySummaryApiResponse;

      // compose list of relevant daily master idx files for this quarter
      const relevantDays: EdgarDailySummaryDirectoryItem[] = [];
      for (const item of availableItems.directory.item) {
        if (item.type !== 'file' || !/^master\.\d{8}\.idx$/.test(item.name)) {
          // ignore non-directory or non-master-idx items
          logger.debug(
            `Skipping non-file or non-master-idx item '${item.name}' of type '${item.type}' in year '${yearItem.name}' and quarter '${quarterItem.name}'`,
          );
          continue;
        } else if (
          parseInt(item.name.slice(7, 11)) === lastFetchedDate.getFullYear() &&
          (parseInt(item.name.slice(11, 13)) < lastFetchedDate.getMonth() + 1 ||
            (parseInt(item.name.slice(11, 13)) === lastFetchedDate.getMonth() + 1 &&
              parseInt(item.name.slice(13, 15)) < lastFetchedDate.getDate()))
        ) {
          // ignore days that are older than the last fetched date
          logger.debug(
            `Skipping irrelevant day '${item.name}' for year '${yearItem.name}' and quarter '${quarterItem.name}'`,
          );
        } else {
          logger.debug(
            `Adding relevant day '${item.name}' for year '${yearItem.name}' and quarter '${quarterItem.name}'`,
          );
          relevantDays.push(item);
        }
      }
      relevantDays.sort((a, b) => a.name.localeCompare(b.name)); // sort relevant days in ascending order

      // handle each relevant day for this quarter
      for (const dayItem of relevantDays) {
        // compose path to missed daily summary
        missedDailySummaries.push(
          `edgar/daily-index/${yearItem.href}${quarterItem.href}${dayItem.href}`,
        );
      }
    }
  }
  return missedDailySummaries;
}

/**
 *  Fetches potentially relevant filings from the SEC database based on the provided daily summaries and filters them for relevant form types and duplicates.
 *
 * @param {string[]} relevantDailySummaries - An array of query paths to daily summaries that contain potentially relevant filings.
 * @returns {Promise<EdgarIdxFileEntry[]>} A promise that resolves when the potentially relevant filings have been fetched and filtered.
 */
async function getRelevantFilings(relevantDailySummaries: string[]) {
  let relevantFilings: EdgarIdxFileEntry[] = [];
  for (const missedDailySummary of relevantDailySummaries) {
    const queryResponse: Response = await queryEdgarData(missedDailySummary);
    const entries: EdgarIdxFileEntry[] = await parseIdxFile(await queryResponse.blob());
    relevantFilings.push(...entries);
  }
  logger.info(`Found ${relevantFilings.length} potentially relevant filings`);

  // filter irrelevant form types
  relevantFilings = relevantFilings.filter((entry) => RELEVANT_FORM_TYPES.includes(entry.formType));
  logger.info(
    `${relevantFilings.length} potentially relevant filings remaining after filtering for form types ${RELEVANT_FORM_TYPES}`,
  );

  // filter duplicates
  relevantFilings = Array.from(
    relevantFilings
      .reduce(
        (map, entry) => (map.has(entry.filingId) ? map : map.set(entry.filingId, entry)),
        new Map(),
      )
      .values(),
  );
  logger.info(
    `${relevantFilings.length} potentially relevant filings remaining after filtering duplicates`,
  );

  // filter filings that are already stored in the database, and mark the remaining ones for creation or update
  for (const filing of relevantFilings) {
    const existingFiling = await dbconnector.ownershipFiling.findUnique({
      where: { filingId: filing.filingId },
      select: { dateFiled: true },
    });

    if (!existingFiling) {
      filing.action = 'create';
    } else if (existingFiling.dateFiled < filing.dateFiled) {
      filing.action = 'update';
    } else {
      filing.action = 'skip';
    }
  }
  relevantFilings = relevantFilings.filter((entry) => entry.action !== 'skip');
  logger.info(
    `${relevantFilings.length} relevant filings remaining after filtering filings that are already stored in the database and up to date`,
  );

  return relevantFilings;
}

/**
 * Parses an IPX file and converts it into a dataset.
 *
 * @param {Blob|string} ipxFile - The IPX file to parse. Can be a Blob or a string.
 * @param {string} [separator='|'] - The separator used to split the file into columns. Defaults to '|'.
 * @returns {Promise<EdgarIdxFileEntry[]>} A promise that resolves to an array of EdgarIdxFileEntry representing the parsed data.
 */
async function parseIdxFile(ipxFile: string | Blob, separator: string = '|') {
  if (ipxFile instanceof Blob) ipxFile = await ipxFile.text(); // convert Blob to string

  const entries: EdgarIdxFileEntry[] = [];

  const lines: string[] = ipxFile.split('\n');

  let headerPassed: boolean = false; // flag to indicate that the header of the idx file has been passed
  for (const line of lines) {
    if (headerPassed) {
      const [cik, company, formType, dateFiled, filename] = line.split(separator);
      entries.push({
        cik,
        company,
        formType,
        dateFiled: new Date(dateFiled.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')),
        filename,
        filingId: filename.split('/')[filename.split('/').length - 1].split('.')[0],
        action: null,
      });
    } else if (line.startsWith('----')) {
      headerPassed = true;
    }
  }
  return entries;
}

async function handleFiling(entry: EdgarIdxFileEntry) {
  // fetch filing
  const filingResponse: Response = await queryEdgarData(entry.filename);
  const filingContent: string = await filingResponse.text();
  logger.debug(`Successfully fetched filing ${entry.filename}`);

  // Extract document sequences from filing content
  const documentSequences = filingContent.match(/<DOCUMENT>[\s\S]*?<\/DOCUMENT>/g);
  if (documentSequences === null)
    throw new Error(`No document sequences found in filing ${entry.filename}.`);

  // parse all embedded documents
  const embeddedDocuments: EdgarEmbeddedDocument[] = await Promise.all(
    documentSequences.map(extractEmbeddedDocument),
  );
  logger.debug(
    `Extracted ${embeddedDocuments.length} embedded document(s) from filing ${entry.filename}`,
  );

  // find primary filing document
  const primaryDocument: EdgarEmbeddedDocument | undefined = embeddedDocuments.find(
    (doc) => doc.format == 'xml' && doc.type == entry.formType,
  );
  if (primaryDocument === undefined)
    throw new Error(
      `No primary document found in filing ${entry.filename}. Causing filing: ${filingContent}`,
    );

  // parse primary document
  const parser: XMLParser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    textNodeName: 'text',
  });
  const parsedFilingData: { ownershipDocument: object } = parser.parse(primaryDocument.rawContent);

  // store filing in database
  try {
    if (entry.action === 'create') {
      await dbconnector.ownershipFiling.create({
        data: {
          filingId: entry.filingId,
          formType: entry.formType,
          dateFiled: entry.dateFiled,
          embeddedDocuments: embeddedDocuments,
          formData: null, //parsedFilingData['ownershipDocument']
        },
      });
      logger.info(`Successfully stored filing ${entry.filename} in database`);
    } else if (entry.action === 'update') {
      await dbconnector.ownershipFiling.update({
        where: { filingId: entry.filingId },
        data: {
          formType: entry.formType,
          dateFiled: entry.dateFiled,
          embeddedDocuments: embeddedDocuments,
          formData: null, //parsedFilingData['ownershipDocument']
        },
      });
      logger.info(`Successfully updated filing ${entry.filename} in database`);
    } else {
      logger.warn(
        `Skipping filing ${entry.filename}, as entry.action is not set to 'create' or 'update'`,
      );
      return false;
    }
  } catch (error) {
    logger.debug(JSON.stringify(parsedFilingData, null, 2));
    logger.error(`Error while storing filing ${entry.filename} in database: ${error}`);
    throw error; // rethrow error to stop further processing
  }
  return true;
}

/**
 *  Extracts an embedded document with meta information from a document sequence.
 *
 * @param {string} documentSequence - The document sequence to extract the embedded document from.
 * @returns {EdgarEmbeddedDocument} The extracted embedded document.
 */
async function extractEmbeddedDocument(documentSequence: string) {
  const embeddedDocument: EdgarEmbeddedDocument = {} as EdgarEmbeddedDocument;

  // extract type tag
  let match: RegExpMatchArray | null = documentSequence.match(/\n<TYPE>([^\n]+)\n/);
  embeddedDocument.type = match && match[1] ? match[1] : null;

  // extract sequence tag
  match = documentSequence.match(/\n<SEQUENCE>([^\n]+)\n/);
  embeddedDocument.sequence = match && match[1] ? parseInt(match[1]) : null;

  // extract description tag
  match = documentSequence.match(/\n<DESCRIPTION>([^\n]+)\n/);
  embeddedDocument.description = match && match[1] ? match[1] : null;

  // extract filename tag
  match = documentSequence.match(/\n<FILENAME>([^\n]+)\n/);
  embeddedDocument.fileName = match && match[1] ? match[1] : null;

  // extract content
  embeddedDocument.format = 'other'; // default to 'other' format

  // check if embedded document is in XML format
  match = documentSequence.match(/<XML>([\s\S]*?)<\/XML>/);
  if (match && match[1]) {
    embeddedDocument.rawContent = match[1];
    embeddedDocument.format = 'xml';
  }

  // check if embedded document is in HTML format
  if (embeddedDocument.format == 'other') {
    match = documentSequence.match(/<HTML>([\s\S]*?)<\/HTML>/);
    if (match && match[1]) {
      embeddedDocument.rawContent = match[1];
      embeddedDocument.format = 'html';
    }
  }

  // check if embedded document is in PDF format
  if (embeddedDocument.format == 'other') {
    match = documentSequence.match(/<PDF>([\s\S]*?)<\/PDF>/);
    if (match && match[1]) {
      embeddedDocument.rawContent = match[1];
      embeddedDocument.format = 'pdf';
    }
  }

  // extract raw content for other formats
  if (embeddedDocument.format == 'other') {
    match = documentSequence.match(/<TEXT>([\s\S]*?)<\/TEXT>/);
    if (match && match[1]) {
      embeddedDocument.rawContent = match[1];
    } else {
      throw new Error(
        'No <TEXT> tag found in document sequence. Causing document sequence: ' + documentSequence,
      );
    }
  }

  // trim raw content
  embeddedDocument.rawContent = embeddedDocument.rawContent.trim();

  // extract size of embedded document
  embeddedDocument.size = Buffer.byteLength(embeddedDocument.rawContent);

  return embeddedDocument;
}

// Main function to fetch SEC forms
async function fetchSecForms() {
  // Clear or create tmp directory
  if (fs.existsSync(TMP_DIRECTORY)) await fs.promises.rm(TMP_DIRECTORY, { recursive: true });
  await fs.promises.mkdir(TMP_DIRECTORY);

  // get last filing date from database (or use yesterday as default if there are no filings yet)
  const lastFilingDate: Date = await dbconnector.ownershipFiling
    .findFirst({
      select: { dateFiled: true },
      orderBy: { dateFiled: 'desc' },
    })
    .then((filing) => filing?.dateFiled || new Date(Date.now() - 86400000));

  // get missed daily summaries since last filing date
  const relevantDailySummaries: string[] = await getRelevantDailySummaries(lastFilingDate);
  logger.info(`Found ${relevantDailySummaries.length} relevant daily summaries`);

  // fetch missed daily summaries, parse them and filter relevant filings
  const relevantFilings: EdgarIdxFileEntry[] = await getRelevantFilings(relevantDailySummaries);
  for (const entry of relevantFilings.splice(0, 1)) {
    await handleFiling(entry);
  }
}

export default fetchSecForms;
