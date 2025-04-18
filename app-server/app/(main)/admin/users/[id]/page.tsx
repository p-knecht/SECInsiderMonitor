import { RoleGate } from '@/components/role-gate';
import { FormError } from '@/components/form-error';
import EditUserContent from '@/components/main/admin/users/edit-user-content';
import { AppMainContent } from '@/components/main/app-maincontent';
import { User, UserRole } from '@prisma/client';
import UserInfoCard from '@/components/main/admin/users/user-info-card';
import { auth } from '@/auth';
import { dbconnector } from '@/lib/dbconnector';

/**
 * Renders the main content of the user details page.
 *
 * @param {Promise<{ id: string }>} props.params - The user ID to display.
 * @returns {JSX.Element} - The user details page layout with user information and edit form.
 */
export default async function EditUserPage(props: { params: Promise<{ id: string }> }) {
  const userId = (await props.params).id;

  let user: User | null = null;
  const requestingUser = (await auth())?.user;

  // only query user if requesting user is admin; other users are blocked by <RoleGate>
  if (requestingUser?.role === UserRole.admin) {
    user = !/^[0-9a-fA-F]{24}$/.test(userId) // check if userId is a valid ObjectId (24 hex characters) to prevent Prisma error
      ? null
      : await dbconnector.user.findUnique({ where: { id: userId } });
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
          <div className="flex justify-center">
            <FormError message={`Kein gültiger Benutzer mit der ID ${userId} gefunden`} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <UserInfoCard user={user} />
            {!(requestingUser?.id === userId) ? (
              <EditUserContent userId={userId} displayType="multiple" />
            ) : (
              <FormError message="Der eigene Benutzer muss über den Menüpunkt 'Konto verwalten' bearbeitet werden." />
            )}
          </div>
        )}
      </RoleGate>
    </AppMainContent>
  );
}
