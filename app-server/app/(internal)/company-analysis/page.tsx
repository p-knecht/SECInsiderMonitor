'use client';

import { AppMainContent } from '@/components/main/app-maincontent';
import { AnalysisFilter } from '@/components/main/analysis/analysis-filter';
import { FormError } from '@/components/form-error';
import { useEffect, useState } from 'react';
import { PulseLoader } from 'react-spinners';
import { useSearchParams } from 'next/navigation';
import { AnalysisSchema } from '@/schemas';

export default function companyAnalysisPage() {
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | undefined>('');
  const [isLoading, setIsLoading] = useState<Boolean>(false);
  const [data, setData] = useState<object>();

  useEffect(() => {
    // reset page content (to prevent showing stale data)
    setErrorMessage('');
    setData(undefined);
    if (searchParams.size === 0) return; // no searchParams present, no need to load data

    const verifiedSearchParams = AnalysisSchema.safeParse(
      Object.fromEntries(searchParams.entries()),
    );

    // check result of searchParams verification
    if (!verifiedSearchParams.success) {
      setErrorMessage(
        `Ungültige Suchparameter. Detailierte Fehlerbeschreibung: ${verifiedSearchParams.error.message}`,
      );
    } else if (verifiedSearchParams.data.depth) {
      setErrorMessage("Suchparameter 'depth' darf nicht definiert sein");
    } else {
      // if basic query verification is successful, start loading data (-> more complex verification is done on server side)
      setIsLoading(true);

      // Simulierte Datenabfrage (ersetze durch deine API-Logik)
      setTimeout(() => {
        setIsLoading(false);
        setData({});
      }, 2000);
    }
  }, [searchParams]);

  return (
    <AppMainContent pathComponents={[{ title: 'Unternehmensanalyse', path: '/company-analysis' }]}>
      <AnalysisFilter type="company" />
      {errorMessage && (
        <div className="px-20 py-10 mx-auto">
          <FormError message={errorMessage} />
        </div>
      )}
      {isLoading && (
        <div className="flex flex-col items-center justify-center flex-grow py-5 text-gray-700">
          <h2 className="text-xl font-semibold mb-10">Daten werden geladen...</h2>
          <PulseLoader color="#999" size={20} />
          <h3 className="text-md text-gray-600 mt-10 text-center max-w-lg">
            Basierend auf der Abfragedefinition kann dies eine Weile dauern. <br /> Bitte warten...
          </h3>
        </div>
      )}
      {data && (
        <div className="px-20 py-10 mx-auto">
          <p>Hier könnte die Graph-Visualisierung erscheinen...</p>
        </div>
      )}
    </AppMainContent>
  );
}
