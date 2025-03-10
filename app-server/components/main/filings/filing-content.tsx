'use client';

import { useEffect, useState } from 'react';
import { getFiling } from '@/actions/main/filings/get-filing';
import { Skeleton } from '@/components/ui/skeleton';
import ShowFilingContentTabGeneral from '@/components/main/filings/filing-content-general';
import ShowFilingContentTabEmbeddedDocuments from '@/components/main/filings/filing-content-embeddeddocuments';
import ShowFilingContentDetails from '@/components/main/filings/filing-content-details';

export default function FilingContent({
  filingId,
  type,
}: {
  filingId: string;
  type: 'page' | 'sheet';
}) {
  const [filingData, setFilingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFiling() {
      try {
        const data = await getFiling({ filingId });
        setFilingData(data);
      } catch (error) {
        console.error('Fehler beim Abrufen des Filings:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchFiling();
  }, [filingId]);

  return loading ? (
    <div className="space-y-4">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  ) : (
    <>
      <div className="flex flex-col lg:flex-row gap-3 w-full">
        <div className="flex-1">
          <ShowFilingContentTabGeneral filingData={filingData} />
        </div>
        <div className="flex-1">
          <ShowFilingContentTabEmbeddedDocuments filingData={filingData} />
        </div>
      </div>
      {filingData.formData ? <ShowFilingContentDetails filingData={filingData} type={type} /> : ''}
    </>
  );
}
