'use server';

import * as z from 'zod';
import { dbconnector } from '@/lib/dbconnector';
import { auth } from '@/auth';
import { GetEmbeddedDocumentContentSchema } from '@/schemas';
import mime from 'mime-types';

/**
 * Provides the content of an embedded document (e.g. a PDF file) that is part of a filing.
 *
 * @param {z.infer<typeof GetEmbeddedDocumentContentSchema>} data - input data to get embedded document content containing filingId and document sequence number
 * @returns {Promise<{ fileName: string, content: string | Buffer<ArrayBuffer>, mimeType: string } | { error: string }>} - a promise that resolves with the document content, file name and MIME type or rejects with an error message
 */
export const getEmbeddedDocumentContent = async (
  data: z.infer<typeof GetEmbeddedDocumentContentSchema>,
) => {
  // revalidate received (unsafe) values from client
  const validatedData = GetEmbeddedDocumentContentSchema.safeParse(data);
  if (!validatedData.success) return { error: 'Ungültige Anfrage' };

  // check if user is authenticated
  const session = await auth();
  if (!session?.user.id) return { error: 'Nicht authentifiziert' };

  try {
    // search for filing and return error if not found
    const filing = await dbconnector.ownershipFiling.findFirst({
      where: { filingId: validatedData.data.filingId },
    });
    if (!filing || !filing.embeddedDocuments) return { error: 'Filing nicht gefunden' };

    // search for queried document and return error if not found
    const document = filing.embeddedDocuments.find(
      (doc: any) => doc.sequence === validatedData.data.sequence,
    );
    if (!document) return { error: 'Dokument nicht gefunden' };

    // determine MIME type based on file extension
    const mimeType = document.fileName
      ? mime.lookup(document.fileName) || 'application/octet-stream'
      : 'application/octet-stream';

    // return document content
    return {
      fileName: document.fileName,
      content: document.rawContent,
      mimeType,
    };
  } catch (error) {
    console.error(`Error in getEmbeddedDocumentContent: ${error}`);
    return { error: 'Interner Serverfehler' };
  }
};
