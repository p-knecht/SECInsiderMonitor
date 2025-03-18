'use client';

import { Badge } from '@/components/ui/badge';
import { UserRole } from '@prisma/client';
import { ColumnDef } from '@tanstack/react-table';
import { CircleCheckIcon, CircleXIcon } from 'lucide-react';
import { DataTableColumnHeader } from '@/components/main/data-table/data-table-column-header';
import EditUserButton from '@/components/main/admin/users/edit-user-button';

/**
 * Defines the data for the user table columns.
 */
export interface UserColumn {
  // not using user from prisma/client as only a subset of fields is needed
  createdAt: Date;
  email: string | null;
  emailVerified: Boolean | null;
  role: UserRole;
  lastLogin: Date | null;
  id: string;
}

/**
 * Defines the column keys, headers and cell contents for the user table.
 */
export const columns: ColumnDef<UserColumn>[] = [
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="E-Mail" filterType="text" />
    ),
  },
  {
    accessorKey: 'emailVerified',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Verifiziert"
        filterType="select"
        selectData={[
          {
            value: 'true',
            label: (
              <>
                <CircleCheckIcon className="text-emerald-600 h-5 w-5" /> Ja
              </>
            ),
          },
          {
            value: 'false',
            label: (
              <>
                <CircleXIcon className="text-red-600 h-5 w-5" /> Nein
              </>
            ),
          },
        ]}
      />
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">
        {row.original.emailVerified ? (
          <CircleCheckIcon className="text-emerald-600 h-5 w-5" />
        ) : (
          <CircleXIcon className="text-red-600 h-5 w-5" />
        )}
      </div>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Erstellt am" filterType="date" />
    ),
    cell: ({ row }) => <>{row.original.createdAt.toLocaleString().replace(',', ' um ')}</>,
  },
  {
    accessorKey: 'lastLogin',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Letztes Login am" filterType="date" />
    ),
    cell: ({ row }) => (
      <>
        {row.original.lastLogin === null
          ? 'noch nie'
          : row.original.lastLogin.toLocaleString().replace(',', ' um ')}
      </>
    ),
  },
  {
    accessorKey: 'role',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Benutzer-Rolle"
        filterType="select"
        selectData={[
          {
            value: 'admin',
            label: (
              <Badge variant="secondary" className="bg-red-200">
                ADMIN
              </Badge>
            ),
          },
          {
            value: 'user',
            label: (
              <Badge variant="secondary" className="bg-blue-200">
                USER
              </Badge>
            ),
          },
        ]}
      />
    ),
    cell: ({ row }) => (
      <Badge
        variant="secondary"
        className={row.original.role.toLowerCase() === 'admin' ? 'bg-red-200' : 'bg-blue-200'}
      >
        {row.original.role.toUpperCase()}
      </Badge>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => <EditUserButton userId={row.original.id} userEmail={row.original.email} />,
  },
];
