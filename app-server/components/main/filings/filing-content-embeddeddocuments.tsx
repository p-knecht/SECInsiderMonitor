'use client';

import { OwnershipFiling } from '@prisma/client';
import DownloadFileButton from '@/components/main/filings/download-embeddeddocument-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function FilingContentEmbeddedDocuments({
  filingData,
}: {
  filingData: OwnershipFiling;
}) {
  return (
    <Card className="border shadow-sm h-full">
      <CardHeader className="px-5">
        <CardTitle className="font-semibold text-gray-800">Eingebettete Dokumente</CardTitle>
      </CardHeader>
      <CardContent className="max-h-[150px] overflow-y-auto px-5">
        {filingData.embeddedDocuments.length > 0 ? (
          <div className="space-y-1">
            {filingData.embeddedDocuments.map((doc: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 pr-1 border rounded-lg bg-gray-50 hover:bg-gray-100"
              >
                <div className="flex flex-col pr-2">
                  <span className="text-gray-900 text-sm break-words">{doc.fileName}</span>
                  <span className="text-gray-500 text-xs italic break-words">
                    Beschreibung: {doc.description || 'Keine'}
                  </span>
                  <span className="text-gray-500 text-xs italic">
                    Grösse: {(doc.size / 1024).toFixed(1)} KB
                  </span>
                </div>
                <DownloadFileButton filingId={filingData.filingId} sequence={doc.sequence} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">Keine eingebetteten Dokumente verfügbar.</p>
        )}
      </CardContent>
    </Card>
  );
}
