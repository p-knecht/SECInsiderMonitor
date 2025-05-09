import { RoleGate } from '@/components/role-gate';
import { AppMainContent } from '@/components/main/app-maincontent';
import { UserRole } from '@prisma/client';
import { DataTable } from '@/components/main/data-table/data-table';
import { columns, UserColumn } from './columns';
import { dbconnector } from '@/lib/dbconnector';
import { buildFilter } from '@/lib/tablefilter';
import { FormError } from '@/components/form-error';
import { userTableParamatersSchema } from '@/schemas';
import { SessionProvider } from 'next-auth/react';
import { auth } from '@/auth';

/**
 * Defines the available search parameters for the user table.
 */
interface UsersPageSearchParams {
  page?: string;
  pageSize?: string;
  sort?: string;
  order?: string;
  [key: string]: string | string[] | undefined;
}

/**
 * Wraps the UserPageSearchParams in a Promise to allow for async loading of this page
 */
interface UsersPageProps {
  searchParams: Promise<UsersPageSearchParams>;
}

/**
 * Renders the main content of the user table page
 *
 * @param {UsersPageProps} { searchParams: searchParams } - The search parameters for the user table
 * @returns {JSX.Element} - The user table page layout containing an overview of all users.
 */
export default async function UsersPage({ searchParams: searchParams }: UsersPageProps) {
  // default values
  let totalCount = 0;
  let page = 1;
  let pageSize = 10;
  let users: UserColumn[] = [];
  let parsingError = '';

  // only process request if user is admin
  if ((await auth())?.user?.role == UserRole.admin) {
    // Parse search parameters to prevent malicious input
    const parsedParams = userTableParamatersSchema.safeParse(await searchParams);
    let validParams: UsersPageSearchParams = {};
    if (parsedParams.success) {
      validParams = parsedParams.data;
    } else {
      parsingError =
        'Ungültige Parameter wurden entfernt. Detaillierter Fehlerbeschrieb: ' +
        JSON.stringify(parsedParams.error.format(), null, 2);

      // only copy successfully parsed parameters to validParams
      validParams = Object.fromEntries(
        Object.entries(await searchParams).filter(
          ([key]) =>
            (parsedParams.error.format() as Record<string, any>)[key] === undefined &&
            key in userTableParamatersSchema.shape,
        ),
      );
    }

    // Handle pagination parameters
    if (validParams.page && !isNaN(parseInt(validParams.page, 10)))
      page = parseInt(validParams.page, 10);
    if (validParams.pageSize && !isNaN(parseInt(validParams.pageSize, 10)))
      pageSize = parseInt(validParams.pageSize, 10);

    // Handle sorting parameters
    const sortColumn = validParams.sort || 'createdAt'; // Default to sorting by createdAt
    const sortOrder = validParams.order || 'asc'; // Default to ascending order

    // Handle filtering parameters
    const filter = buildFilter(validParams, 'user', false);

    // Fetch count of all users that match the filter for pagination
    totalCount = await dbconnector.user.count({ where: filter });

    // if requested page is out of bounds, set it to the last page
    if (page > Math.ceil(totalCount / pageSize)) {
      page = Math.ceil(totalCount / pageSize);
    }

    // only fetch data if there are any users
    if (0 < totalCount) {
      users = await dbconnector.user.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          // Select only the fields that are needed as table columns (e.g. no password hash)
          id: true,
          email: true,
          emailVerified: true,
          createdAt: true,
          lastLogin: true,
          role: true,
        },
        where: filter,
        orderBy: {
          [sortColumn]: sortOrder, // only sort by one column to reduce complexity
        },
      });
    }
  }

  return (
    <AppMainContent
      pathComponents={[
        { title: 'Administration', path: undefined },
        { title: 'Benutzerverwaltung', path: '/admin/users' },
      ]}
    >
      <RoleGate roles={[UserRole.admin]}>
        <FormError message={parsingError} />
        <div className="flex justify-center">
          <SessionProvider>
            <DataTable
              columns={columns}
              data={users}
              totalCount={totalCount}
              currentPage={page}
              pageSize={pageSize}
            />
          </SessionProvider>
        </div>
      </RoleGate>
    </AppMainContent>
  );
}
