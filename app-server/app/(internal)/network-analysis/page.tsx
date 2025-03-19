'use client';

import { Suspense } from 'react';
import { AppMainContent } from '@/components/main/app-maincontent';
import { AnalysisLoadingScreen } from '@/components/main/analysis/loading-screen';
import { NetworkAnalysisContent } from '@/components/main/analysis/network-analysis-content';

/**
 * Renders the application frame/header and suspense wrapper for the network analysis page containing the analysis content.
 *
 * @returns {JSX.Element} - The layout for the network analysis page
 */
export default function NetworkAnalysisPage() {
  return (
    <AppMainContent pathComponents={[{ title: 'Netzwerkanalyse', path: '/network-analysis' }]}>
      <Suspense fallback={<AnalysisLoadingScreen isLoading={true} />}>
        <NetworkAnalysisContent />
      </Suspense>
    </AppMainContent>
  );
}
