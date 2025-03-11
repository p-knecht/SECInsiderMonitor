'use client';

import { AppMainContent } from '@/components/main/app-maincontent';
import { AnalysisFilter } from '@/components/main/analysis/analysis-filter';
import { FormError } from '@/components/form-error';
import { useEffect, useState } from 'react';
import {
  doNetworkAnalysis,
  NetworkAnalysisData,
} from '@/actions/main/network-analysis/do-network-analysis';
import { PulseLoader } from 'react-spinners';
import { useSearchParams } from 'next/navigation';
import { AnalysisSchema } from '@/schemas';
import NetworkGraph from '@/components/main/analysis/network-graph';

export default function NetworkAnalysisPage() {
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | undefined>('');
  const [isLoading, setIsLoading] = useState<Boolean>(false);

  const [data, setData] = useState<NetworkAnalysisData | undefined>();

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
    } else if (!verifiedSearchParams.data.depth) {
      setErrorMessage("Suchparameter 'depth' fehlt");
    } else {
      // if basic query verification is successful, start loading data (-> more complex verification is done on server side)
      setIsLoading(true);
      async function fetchData() {
        try {
          const data = await doNetworkAnalysis(verifiedSearchParams.data!);
          if (data.error) setErrorMessage(data.error);
          else setData(data);
        } catch (error) {
          setErrorMessage(`Fehler beim Abrufen der Daten: ${error}`);
        } finally {
          setIsLoading(false);
        }
      }
      fetchData();
    }
  }, [searchParams]);
  return (
    <AppMainContent pathComponents={[{ title: 'Netzwerkanalyse', path: '/network-analysis' }]}>
      <AnalysisFilter type="network" />
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
        <>
          <div className="px-10 mx-auto text-center">
            <h2 className="text-lg font-semibold">
              Netzwerkanalyse für {data.queryCikInfo?.cikName}
              {data.queryCikInfo?.cikTicker ? ` (${data.queryCikInfo?.cikTicker})` : ''}
            </h2>
            <h3 className="text-md font-medium text-gray-500">
              Analysezeitraum: {data.queryParams?.from} - {data.queryParams?.to}, Suchtiefe:{' '}
              {data.queryParams?.depth}
            </h3>
          </div>
          <NetworkGraph data={data} />
        </>
      )}
    </AppMainContent>
  );
}
