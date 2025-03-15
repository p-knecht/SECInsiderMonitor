import pThrottle from 'p-throttle';
import {
  EdgarDailySummaryApiResponse,
  EdgarDailySummaryDirectoryItem,
  EdgarIdxFileEntry,
  EdgarEmbeddedDocument,
} from './types.js';
import nodemailer from 'nodemailer';
import logger from './logger.js';
import dbconnector from './dbconnector.js';
import { parseOwnershipForm } from './parser.js';
import { NotificationSubscription, OwnershipFiling } from '@prisma/client';

const EDGAR_BASE_URL: string = 'https://www.sec.gov/Archives';
const RELEVANT_FORM_TYPES: Array<string> = ['3', '4', '5']; // Form types to be fetched from the SEC database

// User agent and rate limits for HTTP requests to edgar database (conforming to SEC's guideline -> https://www.sec.gov/search-filings/edgar-search-assistance/accessing-edgar-data)
const USER_AGENT: string | undefined = process.env.USER_AGENT;
if (!USER_AGENT)
  throw new Error(
    'USER_AGENT environment variable not set. Please set it to a valid user agent string to comply with SEC terms of use.',
  );
const EDGAR_RATE_LIMITS = {
  limit: 5, // max 10 queries per time interval, but limitting to 5 to be on the safe side
  interval: 1000, // set time interval to 1 second --> 5 queries per second
};

// Check if the script was started directly or by another script (e.g. scheduler)
if (process.argv[1].endsWith('fetcher')) {
  logger.info(`Fetcher script was started directly, causing a on demand one-time fetch.`);
  fetchSecForms(); // Start fetching SEC forms if script was started directly
  logger.info(`Execution of on demand one-time fetch successfully completed.`);
}

/**
 * Queries the EDGAR database in rate-limited manner and returns the response.
 *
 * @param {string} query - The query string to append to the EDGAR base URL.
 * @returns {Promise<Response>} The response from the EDGAR database.
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
 * Parses an IDX file and converts it into a dataset.
 *
 * @param {Blob|string} idxFile - The IDX file to parse. Can be a Blob or a string.
 * @param {string} [separator='|'] - The separator used to split the file into columns. Defaults to '|'.
 * @returns {Promise<EdgarIdxFileEntry[]>} A promise that resolves to an array of EdgarIdxFileEntry representing the parsed data.
 */
async function parseIdxFile(idxFile: string | Blob, separator: string = '|') {
  if (idxFile instanceof Blob) idxFile = await idxFile.text(); // convert Blob to string

  const entries: EdgarIdxFileEntry[] = [];

  const lines: string[] = idxFile.split('\n');

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

/**
 *  Handles the fetching, parsing and storing of a single filing.
 *
 * @param {EdgarIdxFileEntry} entry - The EdgarIdxFileEntry representing the filing to handle.
 * @returns {Promise<boolean>} A promise that resolves to true if the filing was successfully handled, otherwise false.
 */
async function handleFiling(entry: EdgarIdxFileEntry) {
  // fetch filing
  const filingResponse: Response = await queryEdgarData(entry.filename);
  const filingContent: string = await filingResponse.text();
  logger.debug(`Successfully fetched filing ${entry.filename}`);

  // Extract document sequences from filing content and parse them
  const documentSequences = filingContent.match(/<DOCUMENT>[\s\S]*?<\/DOCUMENT>/g);
  const embeddedDocuments: EdgarEmbeddedDocument[] = documentSequences
    ? await Promise.all(documentSequences.map(extractEmbeddedDocument))
    : [];
  logger.debug(
    `Extracted ${embeddedDocuments.length} embedded document(s) from filing ${entry.filename}`,
  );

  // find primary document
  let parsedFilingData: null | Record<string, any> = null;
  const primaryDocument: EdgarEmbeddedDocument | undefined = embeddedDocuments.find(
    (doc) => doc.format == 'xml' && doc.type == entry.formType,
  );
  if (!primaryDocument) {
    logger.warn(`No primary document found in filing ${entry.filename}. Skip parsing.`);
  } else {
    // parse primary document
    try {
      parsedFilingData = parseOwnershipForm(primaryDocument.rawContent);
    } catch (error) {
      logger.warn(`Error while parsing primary document of filing ${entry.filename}: ${error}`);
    }
  }

  // store filing in database --> if parsedFilingData is null, only try once, otherwise try twice (second time without parsed data)
  const attempts: number = parsedFilingData ? 2 : 1;
  for (let i = 0; i < attempts; i++) {
    const ownershipFilingData = {
      filingId: entry.filingId,
      formType: entry.formType,
      dateFiled: entry.dateFiled,
      embeddedDocuments: embeddedDocuments,
      formData: parsedFilingData,
    };
    try {
      if (entry.action === 'create') {
        await dbconnector.ownershipFiling.create({ data: ownershipFilingData });
      } else if (entry.action === 'update') {
        await dbconnector.ownershipFiling.update({
          where: { filingId: entry.filingId },
          data: ownershipFilingData,
        });
      } else {
        logger.warn(
          `Skipping filing ${entry.filename}, as entry.action is not set to 'create' or 'update'`,
        );
        return false;
      }
      logger.info(`Successfully stored filing ${entry.filename} in database`);
      return true;
    } catch (error) {
      logger.error(`Error while storing filing ${entry.filename} in database: ${error}`);
      if (parsedFilingData === null) {
        throw error; // rethrow error
      } else {
        // setting parsedFilingData to null to retry one last time without parsed data
        parsedFilingData = null;
        logger.info('Retrying without parsed form data...');
      }
    }
  }
  return false;
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

  // extract raw content for known formats as specified in EDGAR Public Dissemination Subsystem Technical Specification
  const formats = ['XML', 'PDF', 'XRBL'];
  for (const format of formats) {
    const match = documentSequence.match(new RegExp(`<${format}>([\\s\\S]*?)</${format}>`));
    if (match) {
      embeddedDocument.rawContent = match[1];
      embeddedDocument.format = format.toLowerCase() as 'xml' | 'pdf' | 'xrbl';
      break;
    }
  }

  // extract raw content for other formats
  if (embeddedDocument.format == 'other') {
    match = documentSequence.match(/<TEXT>([\s\S]*?)<\/TEXT>/);
    if (match && match[1]) {
      embeddedDocument.rawContent = match[1];
    } else {
      logger.warn(
        'No <TEXT> tag found in document sequence. Using full document sequence as raw content.',
      );
      embeddedDocument.rawContent = documentSequence;
    }
  }

  // trim raw content
  embeddedDocument.rawContent = embeddedDocument.rawContent.trim();

  // extract size of embedded document
  embeddedDocument.size = Buffer.byteLength(embeddedDocument.rawContent);

  return embeddedDocument;
}

/**
 *  Verifies the configuration for mail transmission and prepares the nodemailer transporter object.
 *
 * @returns {Promise<nodemailer.Transporter | null>} A promise that resolves to the nodemailer transporter object if the configuration is valid, otherwise null (if configuration is invalid).
 */
async function prepareAndVerifyMailTransmission(): Promise<nodemailer.Transporter | null> {
  // check mandatory environment variables
  for (const envVar of ['SMTP_HOST', 'SMTP_FROM_NAME', 'SMTP_FROM_ADDRESS', 'SERVER_FQDN']) {
    if (!process.env[envVar]) {
      logger.error(`${envVar} is not set`);
      return null;
    }
  }

  // get optional environment variables (or use default values)
  const SMTP_PORT = parseInt(process.env.SMTP_PORT || '25', 10);
  const SMTP_USE_SSL = process.env.SMTP_USE_SSL?.toLowerCase() === 'true';
  const auth =
    process.env.SMTP_USERNAME && process.env.SMTP_PASSWORD
      ? { user: process.env.SMTP_USERNAME, pass: process.env.SMTP_PASSWORD }
      : undefined;

  // create transporter object
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_USE_SSL,
    auth,
  });

  // verify functionality of nodemailer transporter
  try {
    await transporter.verify();
    logger.debug('SMTP transporter successfully verified');
    return transporter;
  } catch (error) {
    logger.error(`SMTP transporter verification failed: ${error}`);
    return null;
  }
}

/**
 *  Gets all notification subscriptions from the database and groups them by user id.
 *
 * @returns {Promise<Record<string, NotificationSubscription[]>>} A promise that resolves to a dictionary of notification subscription grouped by user id.
 */
async function getAllNotificationSubscriptionsByUser(): Promise<
  Record<string, NotificationSubscription[]>
> {
  const subscriptions: NotificationSubscription[] =
    await dbconnector.notificationSubscription.findMany();
  return subscriptions.reduce<Record<string, NotificationSubscription[]>>((acc, entry) => {
    if (!acc[entry.subscriber]) acc[entry.subscriber] = [];
    acc[entry.subscriber].push(entry);
    return acc;
  }, {});
}

/**
 * Loops over all notification subscriptions of a user, checks for matching filings and sends an email to the user if applicable.
 *
 * @param {string} userId  - The id of the user to handle notification subscriptions for
 * @param {NotificationSubscription} userSubscriptions - The notification subscriptions of the user
 * @param {nodemailer.Transport} transporter - The nodemailer transporter object to send emails
 * @returns {Promise<void>} - A promise that resolves when all notification subscriptions of a user have been handled and user has been notified if applicable.
 */
async function handleNotificationSubscriptionsOfUser(
  userId: string,
  userSubscriptions: NotificationSubscription[],
  transporter: nodemailer.Transporter,
) {
  // check if user exists in database
  const user = await dbconnector.user.findUnique({ where: { id: userId } });
  if (!user) {
    logger.error(`User with id ${userId} not found in database!`);
    return;
  }

  let emailContent: string = '';
  const lastMatchingFilingDatePerSubscription: Record<string, Date> = {};

  // loop over each subscription, check if there are matching filings and add them to mail content
  for (const subscription of userSubscriptions) {
    const matchingFilings: OwnershipFiling[] =
      await getMatchingFilingsForSubscription(subscription);
    if (matchingFilings.length > 0) {
      // if there are matching filings, add them to the email content
      emailContent += `<h4>Benachrichtigungsabonnement '${subscription.description}'</h4><table style="border-collapse: collapse; width: 100%; border: 1px solid #ddd; font-family: Arial, sans-serif; font-size: 12px;"><thead><tr style="background-color: #f2f2f2; text-align: center;"><th>Einreichungs-ID</th><th>Formulartyp</th><th>Issuer</th><th>Reporting Owner</th><th>Einreichungsdatum</th><th>Link</th></tr></thead><tbody>`;
      for (const filing of matchingFilings) {
        // format issuer and owner information
        const issuer = filing.formData?.issuer?.issuerTradingSymbol
          ? `${filing.formData?.issuer?.issuerTradingSymbol} (${filing.formData?.issuer?.issuerName})`
          : filing.formData?.issuer?.issuerName;
        const owner = filing.formData?.reportingOwner
          ?.map((owner) => owner.reportingOwnerId?.rptOwnerName)
          .filter(Boolean)
          .join('<br />'); // one line per owner
        emailContent += `<tr style="border-bottom: 1px solid #ddd; text-align: center;"><td>${filing.filingId}</td><td>${filing.formType}</td><td>${issuer}</td><td>${owner}</td><td>${filing.dateFiled.toLocaleDateString()}</td><td><a href="https://${process.env.SERVER_FQDN}/filings/${filing.filingId}" target="_blank">SIM Link</a></td></tr>`;
      }
      emailContent += '</tbody></table>';

      // set last matching filing date for this subscription (to update lastTriggered date in database after sending email)
      lastMatchingFilingDatePerSubscription[subscription.id] =
        matchingFilings[matchingFilings.length - 1].dateAdded;
    }
  }

  // if email content is not empty, send email to user
  if (emailContent != '') {
    logger.info(
      `Found matching filings for notification subscriptions of user ${user.email}. Sending email...`,
    );
    // add email header
    emailContent = `<h3>SECInsiderMonitor: Neue SEC-Einreichungen gefunden</h3><p style='font-size: 14px'>Für die definierten Benachrichtigungsabonnements wurden folgende neuen Einreichungen wurden gefunden:</p>${emailContent}`;
    // send email
    await transporter.sendMail({
      from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM_ADDRESS}>`,
      to: user.email!,
      subject: '[SIM] Neue SEC-Einreichungen gefunden',
      html: emailContent,
    });
  } else {
    logger.info(`No matching filings found for notification subscriptions of user ${user.email}.`);
  }

  // update last triggered date of subscriptions with matches of this user
  for (const subscriptionId of Object.keys(lastMatchingFilingDatePerSubscription)) {
    await dbconnector.notificationSubscription.update({
      where: { id: subscriptionId },
      data: { lastTriggered: lastMatchingFilingDatePerSubscription[subscriptionId] },
    });
  }
}

/**
 * Gets all ownership filings that match a given notification subscription (since the last notified filing)
 *
 * @param {NotificationSubscription} subscription - the subscription to get matching filings for
 * @returns {Promise<OwnershipFiling[]>} - a promise that resolves to an array of ownership filings that match the subscription
 */
async function getMatchingFilingsForSubscription(
  subscription: NotificationSubscription,
): Promise<OwnershipFiling[]> {
  // create filter object for query
  const filter: any = {
    $and: [
      {
        // search filings added since last triggered filing or subscription creation date to make sure we don't miss any filings
        dateAdded: { $gt: { $date: subscription.lastTriggered || subscription.createdAt } },
      },
    ],
  };

  // if issuer CIKs are specified, add them to the filter
  if (subscription.issuerCiks.length > 0)
    filter.$and.push({ 'formData.issuer.issuerCik': { $in: subscription.issuerCiks } });

  // if form types are specified, add them to the filter
  if (subscription.formTypes.length > 0)
    filter.$and.push({ formType: { $in: subscription.formTypes } });

  // if reporting owner CIKs are specified, add them to the filter
  if (subscription.reportingOwnerCiks.length > 0)
    filter.$and.push({
      'formData.reportingOwner.reportingOwnerId.rptOwnerCik': {
        $in: subscription.reportingOwnerCiks,
      },
    });

  // query database for new filings matching the subscription since the reference date
  // note: we have to use raw aggregation queries here, as Prisma does not support nested filtering at the moment --> can be replaced with Prisma native queries once supported
  const rawFilings = await dbconnector.ownershipFiling.aggregateRaw({
    pipeline: [{ $match: filter }, { $sort: { dateAdded: 1 } }],
  });

  return Array.isArray(rawFilings)
    ? (rawFilings.map((filing) => ({
        ...filing,
        dateFiled: new Date(filing.dateFiled?.$date), // extract date object
        dateAdded: new Date(filing.dateAdded?.$date), // extract date object
      })) as OwnershipFiling[])
    : [];
}

/**
 * Fetches missed SEC filings since the last fetched filing date, parses them and stores them in the database.
 *
 * @returns {Promise<void>} - A promise that resolves when all missed filings have been fetched, parsed and stored.
 */
async function fetchSecForms() {
  // get last filing date from database (or use yesterday as default if there are no filings yet)
  const lastFilingDate: Date = await dbconnector.ownershipFiling
    .findFirst({
      select: { dateFiled: true },
      orderBy: { dateFiled: 'desc' },
    })
    .then(
      (filing: { dateFiled: Date } | null) => filing?.dateFiled || new Date(Date.now() - 86400000),
    );

  // get missed daily summaries since last filing date
  const relevantDailySummaries: string[] = await getRelevantDailySummaries(lastFilingDate);
  logger.info(`Found ${relevantDailySummaries.length} relevant daily summaries`);

  // fetch missed daily summaries, parse them and filter relevant filings
  const relevantFilings: EdgarIdxFileEntry[] = await getRelevantFilings(relevantDailySummaries);
  for (const entry of relevantFilings) {
    await handleFiling(entry);
  }

  // check if mail transmission for sending notifications is possible
  const transporter = await prepareAndVerifyMailTransmission();
  if (!transporter) {
    logger.error('Verification of mail settings failed. Skipping notification sending.');
  } else {
    // get and group notification subscriptions by user
    const subscriptionsByUser = await getAllNotificationSubscriptionsByUser();

    // loop over each user and send notification if there are matching filings
    for (const [userId, userSubscriptions] of Object.entries(subscriptionsByUser))
      await handleNotificationSubscriptionsOfUser(userId, userSubscriptions, transporter);

    logger.info('Handled all notification subscriptions');
  }
}

export default fetchSecForms;
