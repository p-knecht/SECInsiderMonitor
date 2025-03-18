'use server';

import * as z from 'zod';
import { dbconnector } from '@/lib/dbconnector';
import { auth } from '@/auth';
import { GetEmbeddedDocumentContentSchema } from '@/schemas';
import mime from 'mime-types';
import { Buffer } from 'buffer';

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

    // decode content if necessary (only for certain MIME types, as stated in specification)
    let content: string | Buffer<ArrayBuffer> = document.rawContent;
    if (
      [
        'image/png',
        'image/jpeg',
        'image/gif',
        'application/pdf',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ].includes(mimeType) &&
      /^[A-Za-z0-9+/]+={0,2}$/.test(content)
    )
      content = Buffer.from(content, 'base64');

    // return document content
    return {
      fileName: document.fileName,
      content,
      mimeType,
    };
  } catch (error) {
    console.error(`Error in getEmbeddedDocumentContent: ${error}`);
    return { error: 'Interner Serverfehler' };
  }
};
