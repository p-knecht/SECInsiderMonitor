'use server';

import * as z from 'zod';
import { auth } from '@/auth';
import { LookupCikSchema } from '@/schemas';
import { CikObject } from '@/data/cik';
import { dbconnector, decodeStrings } from '@/lib/dbconnector';

/**
 * Provides a cik object containing the cik, cikName and cikTicker of the requested cik.
 *
 * @param {z.infer<typeof LookupCikSchema>} data - input data to lookup cik containing cik
 * @returns {Promise<CikObject|null>} - a promise that resolves with the cik object or rejects with null
 */
export const lookupCik = async (
  data: z.infer<typeof LookupCikSchema>,
): Promise<CikObject | null> => {
  // revalidate received (unsafe) values from client
  const validatedData = LookupCikSchema.safeParse(data);
  if (!validatedData.success) return null; // return no results if data is invalid

  // check if user is authenticated
  const session = await auth();
  if (!session?.user.id) return null; // return no results if user is not authenticated

  try {
    // parallelized MongoDB queries for issuer & reportingOwner ciks
    const [issuerResult, reportingOwnerResult] = await Promise.all([
      decodeStrings(
        await dbconnector.ownershipFiling.findRaw({
          // ISSUER
          filter: { 'formData.issuer.issuerCik': validatedData.data.cik },
          options: { sort: { 'formData.periodOfReport': -1 }, limit: 1 }, // sort by latest filings to get most recent data
        }),
      ),
      decodeStrings(
        dbconnector.ownershipFiling.findRaw({
          // REPORTING OWNER
          filter: {
            'formData.reportingOwner.reportingOwnerId.rptOwnerCik': validatedData.data.cik,
          },
          options: { sort: { 'formData.periodOfReport': -1 }, limit: 1 }, // sort by latest filings to get most recent data
        }),
      ),
    ]);

    // check if object exists as issuer in database (prefered, as it contains more data --> ticker)
    if (Array.isArray(issuerResult) && issuerResult.length > 0) {
      return {
        cik: validatedData.data.cik,
        cikName: issuerResult[0].formData.issuer.issuerName,
        cikTicker: issuerResult[0].formData.issuer.issuerTradingSymbol || undefined,
      };
    }

    // check if object exists as reportingOwner in database
    if (Array.isArray(reportingOwnerResult) && reportingOwnerResult.length > 0) {
      // we have to find the name of the owner matching the cik (as there can be multiple owners in the same filing)
      const matchingOwner = reportingOwnerResult[0].formData.reportingOwner.find(
        (owner: { reportingOwnerId: { rptOwnerCik: string } }) =>
          owner.reportingOwnerId.rptOwnerCik === validatedData.data.cik,
      );

      if (matchingOwner) {
        return {
          cik: validatedData.data.cik,
          cikName: matchingOwner.reportingOwnerId.rptOwnerName,
          cikTicker: undefined,
        };
      }
    }
  } catch (error) {
    console.error(`Error in lookupCik for ${validatedData.data.cik}: ${error}`);
  }
  return null; // return null if an error occured or no cik was found
};
