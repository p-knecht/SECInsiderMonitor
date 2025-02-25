import { AppMainContent } from '@/components/main/app-maincontent';

export default function filingsPage() {
  return (
    <AppMainContent pathComponents={[{ title: 'Einreichungen', path: '/filings' }]}>
      Einreichungen
    </AppMainContent>
  );
}
