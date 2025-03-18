import { UserRole } from '@prisma/client';
import { FormError } from '@/components/form-error';
import { auth } from '@/auth';

/**
 *  Props used by the RoleGate component to restrict access to certain pages based on the user's role.
 */
interface RoleGateProps {
  children: React.ReactNode;
  roles: UserRole[]; // List of roles that are allowed to access the page
}

/**
 * Renders a role gate component to restrict access to certain pages based on the user's role.
 *
 * @param {RoleGateProps} props - The props used by the RoleGate component containing the children and roles
 * @returns {JSX.Element} - The rendered RoleGate component showing the children if the user has the required role or an error message if not
 */
export const RoleGate = async ({ children, roles }: RoleGateProps) => {
  const userRole = (await auth())?.user?.role;
  if (userRole === undefined || !roles.includes(userRole)) {
    return (
      <div className="flex justify-center items-center ">
        <FormError message="Keine Berechtigung für den Zugriff auf diese Seite" />
      </div>
    );
  } else {
    return <>{children}</>;
  }
};
