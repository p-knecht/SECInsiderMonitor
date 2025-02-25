import { AppMainContent } from '@/components/main/app-maincontent';

export default function usersPage() {
  return (
    <AppMainContent pathComponents={[{ title: 'Benutzerverwaltung', path: '/admin/users' }]}>
      Benutzerverwaltung
    </AppMainContent>
  );
}
