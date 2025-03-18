'use server';

import * as z from 'zod';
import { dbconnector, decodeStrings } from '@/lib/dbconnector';
import { auth } from '@/auth';
import { GetFilingSchema } from '@/schemas';

/**
 * Provides a filing contents of the specified filingId (but removes embedded document content to keep response small).
 *
 * @param {z.infer<typeof GetFilingSchema>} data - input data to get filing containing filingId
 * @returns {Promise<object|null>} - a promise that resolves with the filing or rejects with null
 */
export const getFiling = async (data: z.infer<typeof GetFilingSchema>) => {
  // revalidate received (unsafe) values from client
  const validatedData = GetFilingSchema.safeParse(data);
  if (!validatedData.success) return null;

  // check if user is authenticated
  const session = await auth();
  if (!session?.user.id) return null;

  // search for filing
  const result = decodeStrings(
    await dbconnector.ownershipFiling.findFirst({
      where: {
        filingId: validatedData.data.filingId,
      },
    }),
  );

  if (!result) return null;

  // remove content of all embedded documents to keep response small --> embedded documents can be fetched on demand
  result.embeddedDocuments.forEach((doc: any) => {
    delete doc.rawContent;
  });

  return result;
};
