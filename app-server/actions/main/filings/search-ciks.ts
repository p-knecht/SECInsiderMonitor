'use server';

import * as z from 'zod';
import { aggregateRawOwnershipFilingsWithDecode } from '@/lib/dbconnector';
import { auth } from '@/auth';
import { SearchCiksSchema } from '@/schemas';
import { CikObject } from '@/data/cik';

/**
 * Searches for CIKs containing the searchString in issuer and reporting owner data.
 *
 * @param {z.infer<typeof SearchCiksSchema>} data - input data to search ciks containing searchString, limit and limitType
 * @returns {Promise<CikObject[]>} - a promise that resolves with an array of cik objects matching the search string
 */
export const searchCiks = async (data: z.infer<typeof SearchCiksSchema>) => {
  // revalidate received (unsafe) values from client
  const validatedData = SearchCiksSchema.safeParse(data);
  if (!validatedData.success) return [];

  // check if user is authenticated
  const session = await auth();
  if (!session?.user.id) return [];

  // extract values from validated data
  const { searchString, limit, limitType } = validatedData.data;
  try {
    // prepare array of promises for parallel search of issuer and reporting owner
    const queries: Promise<any>[] = [];

    // prepare issuer query if requested
    if (!limitType || limitType === 'issuer') {
      queries.push(
        aggregateRawOwnershipFilingsWithDecode({
          pipeline: [
            {
              $match: {
                // search for string in issuer CIK, name and ticker
                $or: [
                  { 'formData.issuer.issuerCik': { $regex: searchString, $options: 'i' } },
                  { 'formData.issuer.issuerName': { $regex: searchString, $options: 'i' } },
                  {
                    $and: [
                      // search for issuer ticker only if it is not 'NONE' oder 'N/A' to avoid false positives
                      {
                        $nor: [
                          {
                            'formData.issuer.issuerTradingSymbol': {
                              $regex: '^none$',
                              $options: 'i',
                            },
                          },
                          {
                            'formData.issuer.issuerTradingSymbol': {
                              $regex: '^n/a$',
                              $options: 'i',
                            },
                          },
                        ],
                      },
                      {
                        'formData.issuer.issuerTradingSymbol': {
                          $regex: searchString,
                          $options: 'i',
                        },
                      },
                    ],
                  },
                ],
              },
            },
            { $sort: { 'formData.periodOfReport': -1 } }, // get latest filings first (as they are most current)
            {
              $group: {
                // group the results by CIK to avoid duplicates
                _id: '$formData.issuer.issuerCik',
                cikName: { $first: '$formData.issuer.issuerName' },
                cikTicker: { $first: '$formData.issuer.issuerTradingSymbol' },
              },
            },
            {
              $project: {
                // only return the necessary fields
                _id: 0,
                cik: '$_id',
                cikName: 1,
                cikTicker: 1,
              },
            },
            { $limit: limit }, // limit the results to the requested amount
          ],
        }),
      );
    }

    // prepare reporting owner query if requested
    if (!limitType || limitType === 'reportingOwner') {
      queries.push(
        aggregateRawOwnershipFilingsWithDecode({
          pipeline: [
            {
              $match: {
                // search for string in reporting owner CIK and name
                $or: [
                  {
                    'formData.reportingOwner.reportingOwnerId.rptOwnerCik': {
                      $regex: searchString,
                      $options: 'i',
                    },
                  },
                  {
                    'formData.reportingOwner.reportingOwnerId.rptOwnerName': {
                      $regex: searchString,
                      $options: 'i',
                    },
                  },
                ],
              },
            },
            { $sort: { 'formData.periodOfReport': -1 } }, // get latest filings first (as they are most current)
            { $unwind: '$formData.reportingOwner' }, // unwind the reporting owner array as we need to access the owner's name
            {
              $match: {
                // re-match the reporting owner data in unwinded objects to get the correct name for the CIK
                $or: [
                  {
                    'formData.reportingOwner.reportingOwnerId.rptOwnerCik': {
                      $regex: searchString,
                      $options: 'i',
                    },
                  },
                  {
                    'formData.reportingOwner.reportingOwnerId.rptOwnerName': {
                      $regex: searchString,
                      $options: 'i',
                    },
                  },
                ],
              },
            },
            {
              // group the results by CIK to avoid duplicates
              $group: {
                _id: '$formData.reportingOwner.reportingOwnerId.rptOwnerCik',
                cikName: { $first: '$formData.reportingOwner.reportingOwnerId.rptOwnerName' },
              },
            },
            {
              // only return the necessary fields
              $project: {
                _id: 0,
                cik: '$_id',
                cikName: 1,
                cikTicker: null, // reporting owner does not have a ticker
              },
            },
            { $limit: limit }, // limit the results to the requested amount
          ],
        }),
      );
    }

    // execute all queries in parallel
    const [issuerResults, reportingOwnerResults] = await Promise.all(queries);

    // prepare a map to store the return results and avoid duplicates
    const results = new Map<string, CikObject>();

    // prefer issuer data over reporting owner data as it contains more information (ticker)
    if (issuerResults && Array.isArray(issuerResults))
      issuerResults
        .filter((r): r is CikObject => r && typeof r.cik === 'string')
        .forEach((r) => results.set(r.cik, r));

    // add reporting owner data if not already in results
    if (reportingOwnerResults && Array.isArray(reportingOwnerResults))
      reportingOwnerResults
        .filter((r): r is CikObject => r && typeof r.cik === 'string' && !results.has(r.cik)) // only add if not already added through issuer data
        .forEach((r) => results.set(r.cik, r));

    // return the results as an array and limit the amount of results
    return Array.from(results.values()).slice(0, limit);
  } catch (error) {
    console.error(`Error in searchCiks for ${searchString}: ${error}`);
    return []; // return empty array in case of error
  }
};
