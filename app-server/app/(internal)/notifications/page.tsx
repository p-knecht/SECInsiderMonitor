import { AppMainContent } from '@/components/main/app-maincontent';

export default function notificationsPage() {
  return (
    <AppMainContent pathComponents={[{ title: 'Benachrichtigungen', path: '/notifications' }]}>
      Benachrichtigungen
    </AppMainContent>
  );
}
