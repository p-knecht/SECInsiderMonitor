'use server';

import * as z from 'zod';
import { aggregateRawOwnershipFilingsWithDecode } from '@/lib/dbconnector';
import { AnalysisSchema } from '@/schemas';
import yahooFinance from 'yahoo-finance2';
import {
  authenticateAndHandleInputs,
  AuthenticatedAnalysisResult,
} from '@/actions/main/analysis/utils';
import {
  Footnote,
  FootnoteId,
  NumberWithFootnote,
  OptNumberWithFootnote,
  OwnershipNature,
  SecurityTitle,
  TransactionCoding,
  UnderlyingSecurity,
} from '@prisma/client';

/**
 * Transaction data for a single transaction
 */
export interface Transaction {
  filingId: string;
  filingDate: Date;
  aff10b5One?: boolean;
  footnotes?: Footnote[];
  reportingOwner: {
    cik: string;
    cikName: string;
  }[];
  transactionType: 'Derivative' | 'Non-Derivative';
  transactionDate: {
    value: Date;
    footnoteId?: { id: string }[];
  };
  securityTitle: SecurityTitle;
  transactionCoding: TransactionCoding;
  transactionAmounts?: {
    transactionShares?: NumberWithFootnote;
    transactionPricePerShare: OptNumberWithFootnote;
    transactionAcquiredDisposedCode: { value: string; footnoteId?: FootnoteId[] };
    transactionTotalValue?: NumberWithFootnote;
  };
  ownershipNature: OwnershipNature;

  underlyingSecurity?: UnderlyingSecurity;
  exercisePrice?: OptNumberWithFootnote;
  exerciseDate?: {
    value: Date;
    footnoteId?: { id: string }[];
  };
  expirationDate?: {
    value: Date;
    footnoteId?: { id: string }[];
  };
}

/**
 * Tagged stock data for a single day (stock data with transaction type that happend on this day)
 * transactionType coding: A = Acquired, D = Disposed, B = Both, O = Other, undefined = No transaction
 */
export interface TaggedStockData {
  date: Date;
  closePrice: number;
  transactionType: 'A' | 'D' | 'B' | 'O' | undefined;
}

/**
 * Return data for the analysis of a company
 */
export interface CompanyAnalysisData {
  error?: string;
  transactions?: Transaction[];
  taggedStockData?: TaggedStockData[];
  queryParams?: {
    cik: string;
    from: string;
    to: string;
  };
  queryCikInfo?: {
    cikName: string;
    cikTicker?: string;
  };
}

/**
 * Yahoo quote data for a single day
 */
interface YahooQuote {
  date: Date;
  high: number | null;
  low: number | null;
  open: number | null;
  close: number | null;
  volume: number | null;
  adjclose?: number | null;
}

/**
 * Check if the given ticker is a valid Yahoo ticker
 *
 * @param {string} ticker - The ticker to check for validity
 * @returns {Promise<boolean>} - A promise that resolves to true if the given ticker is a valid Yahoo ticker, otherwise false
 */
async function isValidYahooTicker(ticker: string): Promise<boolean> {
  try {
    const data = await yahooFinance.quote(ticker, {}, { validateResult: false }); // fetch quote data without extensive validation data to prevent filling the log with errors
    return data?.regularMarketPreviousClose != undefined; // if previous close is exists, ticker is valid
  } catch (e) {
    return false;
  }
}

/**
 * Function trying to get the Yahoo ticker for a given CIK ticker or name
 *
 * @param {string} cikTicker - The CIK ticker to get the Yahoo ticker for
 * @param {string} cikName - The CIK name to get the Yahoo ticker for (used as fallback if no ticker is found by CIK ticker)
 * @returns {Promise<string | null>} - A promise that resolves to the Yahoo ticker for the given CIK ticker or name, or null if no ticker was found
 */
async function getYahooTicker(cikTicker: string, cikName: string): Promise<string | null> {
  // yahoo tickers are always uppercase
  cikTicker = cikTicker.toUpperCase();

  // try different ticker variants starting with the most likely one
  const tickerVariants = [
    cikTicker, // default format
    cikTicker?.replace('.', '-'),
    cikTicker?.replace('-', ''),
    cikTicker?.replace('.', ''),
    cikTicker?.split('.')[0],
  ];
  for (const ticker of tickerVariants) if (await isValidYahooTicker(ticker)) return ticker; // if valid ticker found, return it

  // if no valid ticker found, try to find a ticker by name lookup
  const searchResults = await yahooFinance.search(cikName);
  if (!searchResults?.quotes || searchResults.quotes.length === 0) return null; // no search results

  /**
   *  Auxiliary function to check if a search result is a valid equity result used in filter statement below
   *  (i.e. has a symbol, shortname and quoteType of 'EQUITY')
   * @param {any} q - The search result to check
   * @returns {boolean} - True if the search result is a valid equity result, otherwise false
   */
  function isValidEquityResult(
    q: any,
  ): q is { symbol: string; shortname: string; quoteType: string } {
    return (
      typeof q?.symbol === 'string' && typeof q?.shortname === 'string' && q?.quoteType === 'EQUITY'
    );
  }
  const filteredResults = searchResults.quotes.filter(isValidEquityResult) as {
    symbol: string;
    shortname: string;
    quoteType: string;
  }[]; // filter out non-equity quotes or quotes without symbol and add type information to satisfy TypeScript compiler

  // check if there is a search result that matches the company fully or is at least 5 characters long and one contains the other
  const exactMatch = filteredResults.find(
    (q) =>
      q.shortname.toLowerCase() === cikName.toLowerCase() || // exact match
      (cikName.length >= 5 && // or if both names are at least 5 characters long and one contains the other
        q.shortname.length >= 5 &&
        (cikName.toLowerCase().includes(q.shortname.toLowerCase()) ||
          q.shortname.toLowerCase().includes(cikName.toLowerCase()))),
  );
  if (exactMatch) return exactMatch.symbol;

  return null;
}

/**
 *  Auxiliary function to convert $date fields to Date objects
 * @param {any} obj - The object to recursively convert $date fields in
 * @returns obj - The same object with all $date fields converted to Date objects
 */
function convertDates(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(convertDates);
  } else if (typeof obj === 'object' && obj !== null) {
    if (obj.$date) {
      return new Date(obj.$date); // convert $date to Date object if present
    }
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, convertDates(value)]),
    );
  }
  return obj;
}

/**
 * Try to download stock data for the given company from Yahoo Finance and add it to the given map
 * (returns an empty map if no data could be fetched)
 *
 * @param {string|undefined} cikTicker - The CIK ticker to get the Yahoo ticker for
 * @param {string} cikName - The CIK name to get the Yahoo ticker for (used as fallback if no ticker is found by CIK ticker)
 * @param {Date} fromDate - The start date of the time frame to fetch stock data for
 * @param {Date} toDate - The end date of the time frame to fetch stock data for
 * @returns {Promise<Map<string, YahooQuote>>} - A promise that resolves to a map of stock data entries for the given time frame
 */
async function fetchYahooStockData(
  cikTicker: string | undefined,
  cikName: string,
  fromDate: Date,
  toDate: Date,
) {
  const fetchedStockData = new Map<string, YahooQuote>();
  // if we have a ticker or company name, try to use it to get price history from  Yahoo Finance
  if (cikTicker || cikName) {
    try {
      // trying to get Yahoo ticker for CIK ticker or name
      const yahooTicker = await getYahooTicker(cikTicker || '', cikName);

      if (yahooTicker) {
        // only fetch stock data if a valid Yahoo ticker was found
        const data = await yahooFinance.chart(yahooTicker, {
          period1: fromDate,
          period2: toDate,
          interval: '1d',
        });

        // add stock data to map
        data.quotes.forEach((q: YahooQuote) => {
          if (q.close !== null) fetchedStockData.set(q.date.toISOString().split('T')[0], q);
        });
      }
    } catch (e) {
      console.error(`Failed to fetch price history for ${cikName}: ${e}`);
    }
  }
  return fetchedStockData;
}

/**
 * Fetches the relevant transactions for the given issuer and time frame from the database
 * (note: this function returns transacations contained in filings not filings itself --> as transaction date != filing date or date of report)
 *
 * @param {string} issuerCik - The CIK of the issuer to fetch transactions from database for
 * @param {Date} fromDate - The start date of the time frame to fetch transactions for
 * @param {Date} toDate - The end date of the time frame to fetch transactions for
 * @returns {Promise<Transaction[]>} - A promise that resolves to an array of transactions for the given issuer and time frame
 */
async function fetchRelevantTransactionsFromDatabase(
  issuerCik: string,
  fromDate: Date,
  toDate: Date,
) {
  return convertDates(
    await aggregateRawOwnershipFilingsWithDecode({
      pipeline: [
        {
          $match: {
            'formData.issuer.issuerCik': issuerCik, // only filings with given CIK as issuer
            $or: [
              // make sure at least one transaction exists
              { 'formData.derivativeTable.derivativeTransaction': { $exists: true, $ne: [] } },
              {
                'formData.nonDerivativeTable.nonDerivativeTransaction': { $exists: true, $ne: [] },
              },
            ],
          },
        },
        {
          $project: {
            // only include relevant fields
            _id: 0,
            filingId: 1,
            filingDate: '$dateFiled',
            aff10b5One: '$formData.aff10b5One',
            footnotes: '$formData.footnotes.footnote',
            reportingOwner: {
              // generate array of reporting owners with cik and name (other fields are not relevant)
              $map: {
                input: '$formData.reportingOwner',
                as: 'owner',
                in: {
                  cik: '$$owner.reportingOwnerId.rptOwnerCik',
                  cikName: '$$owner.reportingOwnerId.rptOwnerName',
                },
              },
            },
            derivativeTransactions: '$formData.derivativeTable.derivativeTransaction',
            nonDerivativeTransactions: '$formData.nonDerivativeTable.nonDerivativeTransaction',
          },
        },
        {
          // handle derivatives and non-derivatives separately
          $facet: {
            derivatives: [
              { $unwind: '$derivativeTransactions' }, // build one output entry per embedded derivative transaction
              {
                $match: {
                  'derivativeTransactions.transactionDate.value': {
                    // transaction must be within the given time frame
                    $gte: { $date: fromDate },
                    $lte: { $date: toDate },
                  },
                },
              },
              {
                $project: {
                  // filing fileds
                  filingId: 1,
                  filingDate: 1,
                  reportingOwner: 1,
                  aff10b5One: 1,
                  footnotes: 1,

                  // generic field
                  transactionType: 'Derivative',

                  // transaction fields
                  transactionDate: '$derivativeTransactions.transactionDate',
                  securityTitle: '$derivativeTransactions.securityTitle',
                  transactionCoding: '$derivativeTransactions.transactionCoding',
                  transactionAmounts: '$derivativeTransactions.transactionAmounts',
                  ownershipNature: '$derivativeTransactions.ownershipNature',
                  underlyingSecurity: '$derivativeTransactions.underlyingSecurity',
                  exercisePrice: '$derivativeTransactions.exercisePrice',
                  exerciseDate: '$derivativeTransactions.exerciseDate',
                  expirationDate: '$derivativeTransactions.expirationDate',
                },
              },
            ],
            nonDerivatives: [
              { $unwind: '$nonDerivativeTransactions' }, // build one output entry per embedded derivative transaction
              {
                $match: {
                  'nonDerivativeTransactions.transactionDate.value': {
                    // transaction must be within the given time frame
                    $gte: { $date: fromDate },
                    $lte: { $date: toDate },
                  },
                },
              },
              {
                $project: {
                  // filing fileds
                  filingId: 1,
                  filingDate: 1,
                  reportingOwner: 1,
                  aff10b5One: 1,
                  footnotes: 1,

                  // generic field
                  transactionType: 'Non-Derivative',

                  // transaction fields
                  transactionDate: '$nonDerivativeTransactions.transactionDate',
                  securityTitle: '$nonDerivativeTransactions.securityTitle',
                  transactionCoding: '$nonDerivativeTransactions.transactionCoding',
                  transactionAmounts: '$nonDerivativeTransactions.transactionAmounts',
                  ownershipNature: '$nonDerivativeTransactions.ownershipNature',
                },
              },
            ],
          },
        },
        {
          $project: {
            // combine derivatives and non-derivatives into one array (workaround: must be added as new field, which will be unwinded and unrooted later)
            transactions: { $concatArrays: ['$derivatives', '$nonDerivatives'] },
          },
        },
        { $unwind: '$transactions' }, // one output entry per transaction
        { $replaceRoot: { newRoot: '$transactions' } }, // "unnest" transactions
        { $sort: { transactionDate: 1 } }, // sort by transaction date (ascending)
      ],
    }),
  ) as Transaction[];
}

/**
 * Summarizes the types of transactions for each day
 *
 * @param {Transaction[]} transactions - The transactions to summarize by date
 * @returns {Map<string, string>} - A map with date index as key and the summarized transaction type as value
 */
function summarizeTransactions(transactions: Transaction[]) {
  const summarizedTransactions = new Map<string, string>();
  for (const transaction of transactions) {
    const transactionDateIndex = transaction.transactionDate.value.toISOString().split('T')[0];
    let transactionType =
      transaction.transactionAmounts?.transactionAcquiredDisposedCode?.value.toUpperCase() || 'O';
    if (!['A', 'D'].includes(transactionType)) transactionType = 'O'; // set transaction type to 'O' (= other) if it is not 'A' or 'D'

    if (!summarizedTransactions.has(transactionDateIndex)) {
      // if there is no transaction for this date yet, add it directly
      summarizedTransactions.set(transactionDateIndex, transactionType);
    } else {
      const previousTransactionType = summarizedTransactions.get(transactionDateIndex);
      if (previousTransactionType == 'O') {
        // if there is a transaction of type 'O' for this date, replace it with the new transaction type
        summarizedTransactions.set(transactionDateIndex, transactionType);
      } else if (previousTransactionType !== transactionType && transactionType !== 'O') {
        // if there is a transaction of a different known type (not 'O') for this date, set transaction type to 'B' (= both)
        summarizedTransactions.set(transactionDateIndex, 'B');
      }
    }
  }
  return summarizedTransactions;
}

/**
 * Analyse a company based on the given data
 *
 * @param {z.infer<typeof AnalysisSchema>} data - Data defining the analysis to perform (CIK, date range)
 * @returns {Promise<CompanyAnalysisData>} - A promise that resolves to the analysis result for the given company
 */
export const analyseCompany = async (
  data: z.infer<typeof AnalysisSchema>,
): Promise<CompanyAnalysisData> => {
  const preparedInputs: AuthenticatedAnalysisResult = await authenticateAndHandleInputs(
    data,
    false,
  );
  if (preparedInputs.error) return { error: preparedInputs.error }; // repropagate error if any occured in authenticateAndHandleInputs()

  // initialize returnData
  const returnData: CompanyAnalysisData = {
    queryParams: preparedInputs.queryParams,
    queryCikInfo: preparedInputs.queryCikInfo,
    taggedStockData: [],
    transactions: [],
  };

  // fetch relevant transactions for given company and time frame
  returnData.transactions = await fetchRelevantTransactionsFromDatabase(
    preparedInputs.queryParams?.cik!,
    preparedInputs.fromDate!,
    preparedInputs.toDate!,
  );

  // summarize transactions for each day with transactions
  const summarizedTransactions = summarizeTransactions(returnData.transactions);

  // fetch stock data for given company and add it to map
  const fetchedStockData = await fetchYahooStockData(
    preparedInputs.queryCikInfo?.cikTicker,
    preparedInputs.queryCikInfo?.cikName!,
    preparedInputs.fromDate!,
    preparedInputs.toDate!,
  );

  // create a tagged stock data entry for each day in the time frame and add stock data and transaction type (if available)
  let lastAddedDateIndex: string = '';
  for (
    let date = new Date(preparedInputs.fromDate!);
    date <= preparedInputs.toDate!;
    date.setDate(date.getDate() + 1)
  ) {
    let closePrice = 0;
    if (fetchedStockData.size > 0) {
      const currentDateIndex = date.toISOString().split('T')[0];
      if (fetchedStockData.has(currentDateIndex)) {
        // if stockData is available, get price for this date
        closePrice = fetchedStockData.get(currentDateIndex)?.close || 0;
        lastAddedDateIndex = date.toISOString().split('T')[0];
      } else if (!lastAddedDateIndex) {
        // if no stock data is available for this date and no previous date with stock data exists, get first available stock data open price
        closePrice = fetchedStockData.get(Array.from(fetchedStockData.keys())[0])?.open || 0;
      } else {
        // if no stock data is available for this date, use last added stock data close price
        closePrice = fetchedStockData.get(lastAddedDateIndex)?.close || 0;
      }

      // add tagged stock data entry to return data
      returnData.taggedStockData!.push({
        date: new Date(date), // create copy of date object to prevent reference issues
        closePrice: closePrice,
        transactionType:
          (summarizedTransactions.get(currentDateIndex) as 'A' | 'B' | 'D' | 'O') || undefined, // get and add transaction type if available
      });
    }
  }
  return returnData;
};
