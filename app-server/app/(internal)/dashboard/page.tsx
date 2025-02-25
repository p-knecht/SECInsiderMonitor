import { AppMainContent } from '@/components/main/app-maincontent';

export default function dashboardPage() {
  return (
    <AppMainContent pathComponents={[{ title: 'Dashboard', path: '/dashboard' }]}>
      Dashboard
    </AppMainContent>
  );
}
