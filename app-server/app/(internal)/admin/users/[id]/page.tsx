import { RoleGate } from '@/components/auth/role-gate';
import { FormError } from '@/components/form-error';
import EditUserContent from '@/components/main/admin/users/edit-user-content';
import { AppMainContent } from '@/components/main/app-maincontent';
import { getUserById } from '@/data/user';
import { currentUser } from '@/lib/auth';
import { User, UserRole } from '@prisma/client';
import UserInfoCard from '@/components/main/admin/users/user-info-card';

export default async function EditUserPage(props: { params: Promise<{ id: string }> }) {
  const userId = (await props.params).id;

  let user: User | null = null;
  const requestingUser = await currentUser();

  if (requestingUser?.role === UserRole.admin) {
    user = await getUserById(userId);
  }

  return (
    <AppMainContent
      pathComponents={[
        { title: 'Administration', path: undefined },
        { title: 'Benutzerverwaltung', path: '/admin/users' },
        { title: 'Benutzer bearbeiten', path: `/admin/users/${userId}` },
      ]}
    >
      <RoleGate roles={['admin']}>
        <h2 className="text-2xl font-semibold mb-4">Benutzer bearbeiten</h2>

        {user === null ? (
          <FormError message="Benutzer nicht gefunden" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <UserInfoCard user={user} />
            {!(requestingUser?.id === userId) ? (
              <EditUserContent userId={userId} displayType="single" />
            ) : (
              <FormError message="Der eigene Benutzer muss über den Menüpunkt 'Konto verwalten' bearbeitet werden." />
            )}
          </div>
        )}
      </RoleGate>
    </AppMainContent>
  );
}
