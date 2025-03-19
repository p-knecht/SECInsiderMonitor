'use client';

import { AnalysisFilter } from '@/components/main/analysis/analysis-filter';
import NetworkGraph from '@/components/main/analysis/network-graph';
import { analyseNetwork, NetworkAnalysisData } from '@/actions/main/analysis/analyse-network';
import { parseAndHandleAnalysisQuery } from '@/lib/analysis';
import { AnalysisErrorMessage } from '@/components/main/analysis/error-message';
import { AnalysisLoadingScreen } from '@/components/main/analysis/loading-screen';

/**
 * Renders content the network analysis. Contains the network graph and the analysis filter.
 *
 * @returns {JSX.Element} - The network analysis content
 */
export function NetworkAnalysisContent() {
  const { data, errorMessage, isLoading } = parseAndHandleAnalysisQuery<NetworkAnalysisData>(
    analyseNetwork,
    (params) => (!params.depth ? "Suchparameter 'depth' fehlt" : null),
  );

  return (
    <>
      <AnalysisFilter type="network" />
      <AnalysisErrorMessage errorMessage={errorMessage} />
      <AnalysisLoadingScreen isLoading={isLoading} />
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
    </>
  );
}
