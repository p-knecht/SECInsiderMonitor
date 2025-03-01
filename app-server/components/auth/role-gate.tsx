import { currentRole } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { FormError } from '../form-error';

interface RoleGateProps {
  children: React.ReactNode;
  roles: UserRole[];
}

export const RoleGate = async ({ children, roles }: RoleGateProps) => {
  const userRole = await currentRole();
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
