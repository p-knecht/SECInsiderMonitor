'use client';

import { AppMainContent } from '@/components/main/app-maincontent';
import { AnalysisFilter } from '@/components/main/analysis/analysis-filter';
import { CompanyAnalysisData, analyseCompany } from '@/actions/main/analysis/analyse-company';
import { parseAndHandleAnalysisQuery } from '@/lib/analysis';
import { AnalysisErrorMessage } from '@/components/main/analysis/error-message';
import { AnalysisLoadingScreen } from '@/components/main/analysis/loading-screen';
import StockChart from '@/components/main/analysis/stock-chart';
import TransactionTable from '@/components/main/analysis/transaction-table';
import { useState } from 'react';

export default function companyAnalysisPage() {
  const { data, errorMessage, isLoading } = parseAndHandleAnalysisQuery<CompanyAnalysisData>(
    analyseCompany,
    (params) => (params.depth ? "Suchparameter 'depth' darf nicht definiert sein" : null),
  );
  const [highlightedDate, setHighlightedDate] = useState<Date | null>(null);
  return (
    <AppMainContent pathComponents={[{ title: 'Unternehmensanalyse', path: '/company-analysis' }]}>
      <AnalysisFilter type="company" />
      <AnalysisErrorMessage errorMessage={errorMessage} />
      <AnalysisLoadingScreen isLoading={isLoading} />
      {data && (
        <>
          <div className="px-10 mx-auto text-center">
            <h2 className="text-lg font-semibold">
              Unternehmenstransaktionsanalyse für {data.queryCikInfo?.cikName}
              {data.queryCikInfo?.cikTicker ? ` (${data.queryCikInfo?.cikTicker})` : ''}
            </h2>
            <h3 className="text-md font-medium text-gray-500">
              Analysezeitraum: {data.queryParams?.from} - {data.queryParams?.to}
            </h3>
          </div>
          <StockChart
            data={data.taggedStockData || []}
            onDateClick={setHighlightedDate}
            activeDate={highlightedDate}
          />
          <TransactionTable
            transactions={data.transactions || []}
            onDateClick={setHighlightedDate}
            activeDate={highlightedDate}
          />
        </>
      )}
    </AppMainContent>
  );
}
