'use client';

import { useEffect, useState } from 'react';
import { getFiling } from '@/actions/main/filings/get-filing';
import { Skeleton } from '@/components/ui/skeleton';
import ShowFilingContentTabGeneral from '@/components/main/filings/filing-content-general';
import ShowFilingContentTabEmbeddedDocuments from '@/components/main/filings/filing-content-embeddeddocuments';
import ShowFilingContentDetails from '@/components/main/filings/filing-content-details';
import { FormError } from '@/components/form-error';

/**
 * Renders a component showing the information about a filing wrapping several sub components (general, embedded documents, details)
 *
 * @param {string} filingId - The id of the filing to show
 * @param {string} type - The type of embedding this component (page or sheet)
 * @returns {JSX.Element} - The rendered FilingContent component
 */
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
    /**
     * Fetches the filing data from the API and sets it to the state
     *
     * @returns {Promise<void>} - The promise that resolves when the filing data is fetched
     */
    async function fetchFiling() {
      try {
        const data = await getFiling({ filingId });
        console.log('Filing data:', data);
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
  ) : !filingData ? (
    <div className="flex justify-center">
      <FormError message={`Keine gültige Einreichung mit der ID ${filingId} gefunden`} />
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
