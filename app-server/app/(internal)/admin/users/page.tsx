import { RoleGate } from '@/components/auth/role-gate';
import { AppMainContent } from '@/components/main/app-maincontent';
import { UserRole } from '@prisma/client';

export default function usersPage() {
  return (
    <AppMainContent
      pathComponents={[
        { title: 'Administration', path: undefined },
        { title: 'Benutzerverwaltung', path: '/admin/users' },
      ]}
    >
      <RoleGate roles={[UserRole.admin]}>Benutzerverwaltung</RoleGate>
    </AppMainContent>
  );
}
