'use client';

import { Suspense } from 'react';
import { AppMainContent } from '@/components/main/app-maincontent';
import { AnalysisLoadingScreen } from '@/components/main/analysis/loading-screen';
import { CompanyAnalysisContent } from '@/components/main/analysis/company-analysis-content';

/**
 * Renders the application frame/header and suspense wrapper for the company analysis page containing the analysis content.
 *
 * @returns {JSX.Element} - The layout for the company analysis page
 */
export default function CompanyAnalysisPage() {
  return (
    <AppMainContent pathComponents={[{ title: 'Unternehmensanalyse', path: '/company-analysis' }]}>
      <Suspense fallback={<AnalysisLoadingScreen isLoading={true} />}>
        <CompanyAnalysisContent />
      </Suspense>
    </AppMainContent>
  );
}
