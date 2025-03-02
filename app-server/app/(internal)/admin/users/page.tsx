import { RoleGate } from '@/components/auth/role-gate';
import { AppMainContent } from '@/components/main/app-maincontent';
import { UserRole } from '@prisma/client';
import { DataTable } from '@/components/data-table/data-table';
import { columns, UserColumn } from './columns';
import { dbconnector } from '@/lib/dbconnector';
import { buildUserTableFilter } from '@/lib/tablefilter';
import { currentRole } from '@/lib/auth';

interface UsersPageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    sort?: string;
    order?: string;
    [key: string]: string | string[] | undefined;
  }>;
}

export default async function UsersPage({ searchParams: searchParams }: UsersPageProps) {
  // default values
  let totalCount = 0;
  let page = 1;
  let pageSize = 10;
  let users: UserColumn[] = [];

  // only process request if user is admin
  if ((await currentRole()) == UserRole.admin) {
    const retrievedSearchParams = await searchParams;
    // Handle pagination parameters
    if (retrievedSearchParams?.page && !isNaN(parseInt(retrievedSearchParams.page, 10)))
      page = parseInt(retrievedSearchParams.page, 10);
    if (retrievedSearchParams?.pageSize && !isNaN(parseInt(retrievedSearchParams.pageSize, 10)))
      pageSize = parseInt(retrievedSearchParams.pageSize, 10);

    // Handle sorting parameters
    const sortColumn = retrievedSearchParams?.sort || 'createdAt'; // Default to sorting by createdAt
    const sortOrder = retrievedSearchParams?.order || 'asc'; // Default to ascending order

    // Handle filtering parameters
    const filter = buildUserTableFilter(retrievedSearchParams);

    totalCount = await dbconnector.user.count({ where: filter });

    // if page is out of bounds, set it to the last page
    if (page > Math.ceil(totalCount / pageSize)) {
      page = Math.ceil(totalCount / pageSize);
    }

    // only fetch data if there are any users
    if (0 < totalCount) {
      users = await dbconnector.user.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          // Select only the fields that are needed as table columns
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
      console.log(users);
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
        <div className="flex justify-center">
          <DataTable
            columns={columns}
            data={users}
            totalCount={totalCount}
            currentPage={page}
            pageSize={pageSize}
          />
        </div>
      </RoleGate>
    </AppMainContent>
  );
}
