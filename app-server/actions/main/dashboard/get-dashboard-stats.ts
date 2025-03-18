'use server';

import { auth } from '@/auth';
import { aggregateRawOwnershipFilingsWithDecode } from '@/lib/dbconnector';

/**
 * Fetches the filing counts for the last day, week, month and year
 * @returns {Promise<Record<string, any> | null>} - A promise that resolves to the filing counts for the last day, week, month and year or null if an error occurred
 */
export const getFilingCounts = async () => {
  // check if user is authenticated
  const session = await auth();
  if (!session?.user.id) return null;

  /**
   * reusable time filter for aggregation pipeline below --> always go back to the beginning of the day (00:00) to ensure consistent results
   * @param {string} name - The name of the field to create
   * @param {number} days - The number of days to go back
   * @returns {Record<string, any>} - The time filter
   */
  const createTimeFilter = (name: string, days: number) => ({
    [name]: {
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
            ...createTimeFilter('lastDay', 1),
            ...createTimeFilter('lastWeek', 7),
            ...createTimeFilter('lastMonth', 30),
            ...createTimeFilter('lastYear', 365),
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
 * Gets the filing trend for the last 30 days
 *
 * @returns {Promise<Record<string, any> | null>} - A promise that resolves to the filing trend for the last 30 days or null if an error occurred
 */
export const getFilingTrend = async () => {
  // check if user is authenticated
  const session = await auth();
  if (!session?.user.id) return null;

  try {
    // query database to get filing trend for the last 30 days
    const result = await aggregateRawOwnershipFilingsWithDecode({
      pipeline: [
        {
          $match: {
            'formData.periodOfReport': { $exists: true, $ne: null }, // filter out filings without periodOfReport
            $expr: {
              $gte: [
                { $toDate: '$formData.periodOfReport' },
                { $dateSubtract: { startDate: '$$NOW', unit: 'day', amount: 30 } }, // consider filings from the last 30 days
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
 * Gets the top 10 issuers by number of filings in the last 30 days
 *
 * @returns {Promise<Record<string, any> | null>} - A promise that resolves to the top 10 issuers or null if an error occurred
 */
export const getTopIssuer = async () => {
  // check if user is authenticated
  const session = await auth();
  if (!session?.user.id) return null;

  const LOOKBACK_DAYS = 30; // look back 30 days
  const TOP_ISSUER_COUNT = 10; // show top 10 issuers

  try {
    // query database to get top issuers by number of filings in the last 30 days
    const result = await aggregateRawOwnershipFilingsWithDecode({
      pipeline: [
        // consider filings from the defined lookback period
        {
          $match: {
            'formData.periodOfReport': { $exists: true, $ne: null }, // filter out filings without periodOfReport
            $expr: {
              $gte: [
                { $toDate: '$formData.periodOfReport' },
                { $dateSubtract: { startDate: '$$NOW', unit: 'day', amount: LOOKBACK_DAYS } }, // consider filings from defined lookback period
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
 * Gets the top 10 reporting owners by number of filings in the last 30 days
 *
 * @returns {Promise<Record<string, any> | null>} - A promise that resolves to the top 10 reporting owners or null if an error occurred
 */
export const getTopReportingOwner = async () => {
  // check if user is authenticated
  const session = await auth();
  if (!session?.user.id) return null;

  const LOOKBACK_DAYS = 30; // look back 30 days
  const TOP_REPORTING_OWNER_COUNT = 10; // show top 10 reporting owners

  try {
    // query database to get top reporting owners by number of filings in the last 30 days
    const result = await aggregateRawOwnershipFilingsWithDecode({
      pipeline: [
        // consider filings from the defined lookback period
        {
          $match: {
            'formData.periodOfReport': { $exists: true, $ne: null }, // filter out filings without periodOfReport
            $expr: {
              $gte: [
                { $toDate: '$formData.periodOfReport' },
                { $dateSubtract: { startDate: '$$NOW', unit: 'day', amount: LOOKBACK_DAYS } }, // consider filings from defined lookback period
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
