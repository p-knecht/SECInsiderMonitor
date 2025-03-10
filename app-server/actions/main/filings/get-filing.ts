'use server';

import * as z from 'zod';
import { dbconnector } from '@/lib/dbconnector';
import { auth } from '@/auth';
import { GetFilingSchema } from '@/schemas';

export const getFiling = async (data: z.infer<typeof GetFilingSchema>) => {
  // revalidate received (unsafe) values from client
  const validatedData = GetFilingSchema.safeParse(data);
  if (!validatedData.success) return null;

  // check if user is authenticated
  const session = await auth();
  if (!session?.user.id) return null;

  // search for filing
  const result = await dbconnector.ownershipFiling.findFirst({
    where: {
      filingId: validatedData.data.filingId,
    },
  });

  if (!result) return null;

  // remove content of all embedded documents to keep response small --> embedded documents can be fetched on demand
  result.embeddedDocuments.forEach((doc: any) => {
    delete doc.rawContent;
  });
  return result;
};
