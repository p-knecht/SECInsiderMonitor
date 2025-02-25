import { AppMainContent } from '@/components/main/app-maincontent';

export default function companyAnalysisPage() {
  return (
    <AppMainContent pathComponents={[{ title: 'Unternehmensanalyse', path: '/company-analysis' }]}>
      Unternehmensanalyse
    </AppMainContent>
  );
}
