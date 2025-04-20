'use server';

import { auth } from '@/auth';
import { aggregateRawOwnershipFilingsWithDecode } from '@/lib/dbconnector';
import { DashboardTimeframeFilterSchema } from '@/schemas/index';

/**
 * Fetches the filing counts for the last 1, 7, 30, 365 day(s) and total
 * @returns {Promise<Record<string, any> | null>} - A promise that resolves to the filing counts for the last 1, 7, 30, 365 day(s) and total or null if an error occurred
 */
export const getFilingCounts = async () => {
  // check if user is authenticated
  const session = await auth();
  if (!session?.user.id) return null;

  /**
   * reusable time filter for aggregation pipeline below --> always go back to the beginning of the day (00:00) to ensure consistent results
   * @param {number} days - The number of days to go back
   * @returns {Record<string, any>} - The time filter
   */
  const createTimeFilter = (days: number) => ({
    [days.toString() + 'd']: {
      $sum: {
        $cond: [
          {
            $gte: [
              {
                $dateFromParts: {
                  year: { $year: { $toDate: '$formData.periodOfReport' } },
                  month: { $month: { $toDate: '$formData.periodOfReport' } },
                  day: { $dayOfMonth: { $toDate: '$formData.periodOfReport' } },
                },
              },
              {
                $dateFromParts: {
                  year: {
                    $year: { $dateSubtract: { startDate: '$$NOW', unit: 'day', amount: days } },
                  },
                  month: {
                    $month: { $dateSubtract: { startDate: '$$NOW', unit: 'day', amount: days } },
                  },
                  day: {
                    $dayOfMonth: {
                      $dateSubtract: { startDate: '$$NOW', unit: 'day', amount: days },
                    },
                  },
                },
              },
            ],
          },
          1,
          0,
        ],
      },
    },
  });

  try {
    // query database to get filing counts for the last day, week, month and year
    const summary = await aggregateRawOwnershipFilingsWithDecode({
      pipeline: [
        {
          $group: {
            _id: { $ifNull: ['$formType', 'Unknown'] },
            total: { $sum: 1 },
            ...createTimeFilter(1),
            ...createTimeFilter(7),
            ...createTimeFilter(30),
            ...createTimeFilter(365),
          },
        },
      ],
    });
    return summary;
  } catch (error) {
    console.error(`Error fetching filing counts: ${error}`);
    return null;
  }
};

/**
 * Fetches the earliest and latest "dateFiled" timestamp across all available filings.
 *
 * @returns {Promise<{ earliest: Date; latest: Date } | null>} - A promise that resolves to the range or null if an error occurred.
 */
export const getDateFiledRange = async () => {
  const session = await auth();
  if (!session?.user.id) return null;

  try {
    const result = await aggregateRawOwnershipFilingsWithDecode({
      pipeline: [
        {
          $group: {
            _id: null,
            earliest: { $min: '$dateFiled' },
            latest: { $max: '$dateFiled' },
          },
        },
      ],
    });
    if (!result || result.length === 0) return null;
    const raw = result[0] as {
      earliest: { $date: string };
      latest: { $date: string };
    };

    return {
      earliest: new Date(raw.earliest.$date),
      latest: new Date(raw.latest.$date),
    };
  } catch (error) {
    console.error(`Error fetching dateFiled range: ${error}`);
    return null;
  }
};

/**
 * Returns the number of filings per day and form type for the last N days based on periodOfReport.
 *
 * @param {number} days - The number of days to look back for the filing trend (1-365)
 * @returns {Promise<Record<string, any> | null>} - A promise that resolves to the filing trend for the requested number of days or null if an error occurred
 */
export const getFilingTrend = async (days: number) => {
  // check if user is authenticated
  const session = await auth();
  if (!session?.user.id) return null;

  // check if days is valid
  const validationResult = DashboardTimeframeFilterSchema.safeParse(days);
  if (!validationResult.success) {
    console.error(`Invalid number of days: ${days}.`, validationResult.error.issues);
    return null;
  }

  try {
    // query database to get filing trend for the defined number of days
    const result = await aggregateRawOwnershipFilingsWithDecode({
      pipeline: [
        {
          $match: {
            'formData.periodOfReport': { $exists: true, $ne: null }, // filter out filings without periodOfReport
            $expr: {
              $gte: [
                { $toDate: '$formData.periodOfReport' },
                { $dateSubtract: { startDate: '$$NOW', unit: 'day', amount: days } }, // consider filings from the defined lookback period
              ],
            },
          },
        },
        {
          // group by date and form type
          $group: {
            _id: {
              date: {
                $dateFromParts: {
                  year: { $year: { $toDate: '$formData.periodOfReport' } },
                  month: { $month: { $toDate: '$formData.periodOfReport' } },
                  day: { $dayOfMonth: { $toDate: '$formData.periodOfReport' } },
                },
              },
              formType: '$formType',
            },
            count: { $sum: 1 }, // count number of filings
          },
        },
        {
          $sort: { '_id.date': 1 }, // sort by date (ascending)
        },
      ],
    });
    return result;
  } catch (error) {
    console.error(`Error fetching filing trend: ${error}`);
    return null;
  }
};

/**
 * Gets the top 10 issuers of form 4 filings by number of filings for the given number of days
 *
 * @param {number} days - The number of days to look back for the top issuers of form 4 filings (1-365)
 * @returns {Promise<Record<string, any> | null>} - A promise that resolves to the top 10 issuers or null if an error occurred
 */
export const getTopIssuer = async (days: number) => {
  // check if user is authenticated
  const session = await auth();
  if (!session?.user.id) return null;

  // check if days is valid
  const validationResult = DashboardTimeframeFilterSchema.safeParse(days);
  if (!validationResult.success) {
    console.error(`Invalid number of days: ${days}.`, validationResult.error.issues);
    return null;
  }

  const TOP_ISSUER_COUNT = 10; // show top 10 issuers

  try {
    // query database to get top issuers of form 4 filings by number of filings in the given number of days
    const result = await aggregateRawOwnershipFilingsWithDecode({
      pipeline: [
        // consider filings from the defined lookback period
        {
          $match: {
            formType: '4', // only consider form 4 filings
            'formData.periodOfReport': { $exists: true, $ne: null }, // filter out filings without periodOfReport
            $expr: {
              $gte: [
                { $toDate: '$formData.periodOfReport' },
                { $dateSubtract: { startDate: '$$NOW', unit: 'day', amount: days } }, // consider filings from defined lookback period
              ],
            },
          },
        },
        // sort descending by periodOfReport (to get latest cik info of issuers)
        {
          $sort: { 'formData.periodOfReport': -1 },
        },
        // group by issuer CIK and get the date of the latest entry (for name/ticker lookup)
        {
          $group: {
            _id: '$formData.issuer.issuerCik',
            count: { $sum: 1 },
            issuerName: { $first: '$formData.issuer.issuerName' },
            issuerTicker: { $first: '$formData.issuer.issuerTradingSymbol' },
          },
        },
        // sort by count (descending)
        { $sort: { count: -1 } },
        // get only the top issuers
        { $limit: TOP_ISSUER_COUNT },
      ],
    });
    return result;
  } catch (error) {
    console.error(`Error fetching top issuers: ${error}`);
    return null;
  }
};

/**
 * Gets the top 10 reporting owners in form 4 filings by number of filings for the given number of days
 *
 * @param {number} days - The number of days to look back for the top reporting owners in form 4 filings (1-365)
 * @returns {Promise<Record<string, any> | null>} - A promise that resolves to the top 10 reporting owners or null if an error occurred
 */
export const getTopReportingOwner = async (days: number) => {
  // check if user is authenticated
  const session = await auth();
  if (!session?.user.id) return null;

  // check if days is valid
  const validationResult = DashboardTimeframeFilterSchema.safeParse(days);
  if (!validationResult.success) {
    console.error(`Invalid number of days: ${days}.`, validationResult.error.issues);
    return null;
  }

  const TOP_REPORTING_OWNER_COUNT = 10; // show top 10 reporting owners

  try {
    // query database to get top reporting owners in form 4 filings by number of filings in the given number of days
    const result = await aggregateRawOwnershipFilingsWithDecode({
      pipeline: [
        // consider filings from the defined lookback period
        {
          $match: {
            formType: '4', // only consider form 4 filings
            'formData.periodOfReport': { $exists: true, $ne: null }, // filter out filings without periodOfReport
            $expr: {
              $gte: [
                { $toDate: '$formData.periodOfReport' },
                { $dateSubtract: { startDate: '$$NOW', unit: 'day', amount: days } }, // consider filings from defined lookback period
              ],
            },
          },
        },
        // unwind reportingOwner array to get the CIK when multiple owners are present
        { $unwind: '$formData.reportingOwner' },
        // sort descending by periodOfReport (to get latest cik info of reporting owners)
        {
          $sort: { 'formData.periodOfReport': -1 },
        },
        // group by reporting owner CIK and get the date of the latest entry (for name lookup)
        {
          $group: {
            _id: '$formData.reportingOwner.reportingOwnerId.rptOwnerCik',
            count: { $sum: 1 },
            ownerName: { $first: '$formData.reportingOwner.reportingOwnerId.rptOwnerName' },
          },
        },
        // sort by count (descending)
        { $sort: { count: -1 } },
        // get only the top reporting owners
        { $limit: TOP_REPORTING_OWNER_COUNT },
      ],
    });
    return result;
  } catch (error) {
    console.error(`Error fetching top reporting owners: ${error}`);
    return null;
  }
};
