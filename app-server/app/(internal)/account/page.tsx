import { AppMainContent } from '@/components/main/app-maincontent';

export default function accountPage() {
  return (
    <AppMainContent pathComponents={[{ title: 'Konto verwalten', path: '/account' }]}>
      Konto verwalten
    </AppMainContent>
  );
}
