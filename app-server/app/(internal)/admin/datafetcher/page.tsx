import { RoleGate } from '@/components/auth/role-gate';
import { AppMainContent } from '@/components/main/app-maincontent';
import { UserRole } from '@prisma/client';

export default function datafetcherPage() {
  return (
    <AppMainContent
      pathComponents={[
        { title: 'Administration', path: undefined },
        { title: 'Datenbezug', path: '/admin/datafetcher' },
      ]}
    >
      <RoleGate roles={[UserRole.admin]}>Datenbezug</RoleGate>
    </AppMainContent>
  );
}
