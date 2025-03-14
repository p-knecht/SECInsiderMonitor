'use server';

import * as z from 'zod';
import { dbconnector } from '@/lib/dbconnector';
import * as fs from 'fs';
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

export interface StockData {
  date: Date;
  closePrice?: number;
}

export interface TaggedStockData extends StockData {
  transactionType: 'A' | 'D' | 'B' | 'O' | undefined;
}

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

async function isValidYahooTicker(ticker: string): Promise<boolean> {
  try {
    await yahooFinance.quote(ticker);
    return true;
  } catch (e) {
    return false;
  }
}

async function getYahooTicker(
  cikTicker: string,
  cikName: string,
): Promise<{ yahooTicker: string; nameLookup: boolean } | null> {
  // yahoo tickers are always uppercase
  cikTicker = cikTicker.toUpperCase();

  // try different ticker variants starting with the most likely one
  const tickerVariants = [
    cikTicker, // default format
    cikTicker?.replace('.', '-'),
    cikTicker?.replace('-', ''),
    cikTicker?.replace('.', ''),
  ];
  for (const ticker of tickerVariants)
    if (await isValidYahooTicker(ticker)) return { yahooTicker: ticker, nameLookup: false }; // if valid ticker found, return it

  // if no valid ticker found, try to find a ticker by name lookup
  const searchResults = await yahooFinance.search(cikName);
  if (!searchResults?.quotes || searchResults.quotes.length === 0) return null; // no search results

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
  const exactMatch = filteredResults.find(
    (q) =>
      q.shortname.toLowerCase() === cikName.toLowerCase() || // exact match
      (cikName.length >= 5 && // or if both names are at least 5 characters long and one contains the other
        q.shortname.length >= 5 &&
        (cikName.toLowerCase().includes(q.shortname.toLowerCase()) ||
          q.shortname.toLowerCase().includes(cikName.toLowerCase()))),
  );
  if (exactMatch) return { yahooTicker: exactMatch.symbol, nameLookup: true };

  return null;
}

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

export const analyseCompany = async (
  data: z.infer<typeof AnalysisSchema>,
): Promise<CompanyAnalysisData> => {
  const preparedInputs: AuthenticatedAnalysisResult = await authenticateAndHandleInputs(
    data,
    false,
  );
  if (preparedInputs.error) return { error: preparedInputs.error }; // repropagate error if any occured

  // initialize returnData
  const returnData: CompanyAnalysisData = {
    queryParams: preparedInputs.queryParams,
    queryCikInfo: preparedInputs.queryCikInfo,
    taggedStockData: [],
    transactions: [],
  };

  if (returnData.queryCikInfo?.cikTicker) {
    // if we have a ticker, use it to get price history
    try {
      const yahooTicker = await getYahooTicker(
        returnData.queryCikInfo.cikTicker,
        returnData.queryCikInfo.cikName,
      );
      if (yahooTicker) {
        const data = await yahooFinance.chart(returnData.queryCikInfo.cikTicker, {
          period1: preparedInputs.fromDate!,
          period2: preparedInputs.toDate!,
          interval: '1d',
        });
        returnData.taggedStockData = data.quotes.map((q) => ({
          date: new Date(q.date.toISOString().split('T')[0]), // make sure date is a Date object and set time to 00:00:00
          closePrice: q.close !== null ? q.close : undefined,
          transactionType: undefined,
        }));
      }
    } catch (e) {
      console.error(`Failed to fetch price history for ${returnData.queryCikInfo.cikTicker}: ${e}`);
    }
  }

  if (!returnData.taggedStockData || returnData.taggedStockData?.length === 0) {
    // no stock data available or fetched --> generate empty stock data entries
    returnData.taggedStockData = [];
    for (
      let date = new Date(preparedInputs.fromDate!);
      date <= preparedInputs.toDate!;
      date.setDate(date.getDate() + 1)
    )
      returnData.taggedStockData.push({
        date: new Date(date), // create copy of date object
        closePrice: 0, // set close price to 0 --> allows to display transaction types on x-axis even if no stock data is available
        transactionType: undefined,
      }); // create stock data entries (price = 0) for requested time frame
  }

  const transactions: unknown = await dbconnector.ownershipFiling.aggregateRaw({
    pipeline: [
      {
        $match: {
          'formData.issuer.issuerCik': returnData.queryParams?.cik, // only filings with given CIK as issuer
          $or: [
            // make sure at least one transaction exists
            { 'formData.derivativeTable.derivativeTransaction': { $exists: true, $ne: [] } },
            { 'formData.nonDerivativeTable.nonDerivativeTransaction': { $exists: true, $ne: [] } },
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
                  $gte: { $date: preparedInputs.fromDate! },
                  $lte: { $date: preparedInputs.toDate! },
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
                  $gte: { $date: preparedInputs.fromDate! },
                  $lte: { $date: preparedInputs.toDate! },
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
  });
  returnData.transactions = convertDates(transactions) as Transaction[]; // cast to correct type

  // add transaction type (for transaction day) to stock data (and summarize multiple transactions on one day if necessary)
  for (const transaction of returnData.transactions) {
    const stockDataEntry = returnData.taggedStockData?.find(
      (entry) => entry.date.getTime() === transaction.transactionDate.value.getTime(),
    );
    if (!stockDataEntry) continue; // if there is no stock data entry for this transaction, skip it (should not happen)

    const transactionCode =
      (transaction.transactionAmounts?.transactionAcquiredDisposedCode?.value as 'A' | 'D' | 'O') ||
      'O'; // O = other
    if (!stockDataEntry.transactionType || stockDataEntry.transactionType == 'O') {
      stockDataEntry.transactionType = transactionCode;
    } else if (stockDataEntry.transactionType !== transactionCode && transactionCode !== null) {
      stockDataEntry.transactionType = 'B';
    }
  }

  return returnData;
};
