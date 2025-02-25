import { AppMainContent } from '@/components/main/app-maincontent';

export default function datafetcherPage() {
  return (
    <AppMainContent pathComponents={[{ title: 'Datenbezug', path: '/admin/datafetcher' }]}>
      Datenbezug
    </AppMainContent>
  );
}
