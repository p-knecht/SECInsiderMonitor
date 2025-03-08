'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { CikObject } from '@/data/cik';
import { CikBadge } from '@/components/data-table/cik-badge';
import { FormtypeBadge } from '@/components/data-table/formtype-badge';

export interface OwnershipFilingColumn {
  // not using OwnershipFiling from prisma/client as only a subset of fields is needed
  filingId: string;
  formType: string;
  periodOfReport?: Date;
  issuer: CikObject;
  reportingOwner: CikObject[];
  dateFiled?: Date;
}

export const columns: ColumnDef<OwnershipFilingColumn>[] = [
  {
    accessorKey: 'filingId',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Filing-ID" filterType="text" />
    ),
  },
  {
    accessorKey: 'formType',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Form Type"
        filterType="select"
        selectData={['3', '4', '5'].map((value) => ({
          value,
          label: <FormtypeBadge formtype={value} />,
        }))}
      />
    ),
    cell: ({ row }) => {
      return <FormtypeBadge formtype={row.original.formType as string} />;
    },
  },
  {
    accessorKey: 'periodOfReport',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Period of Report" filterType="date" />
    ),
    cell: ({ row }) => (
      <>{row.original.periodOfReport ? row.original.periodOfReport.toLocaleDateString() : 'N/A'}</>
    ),
  },
  {
    accessorKey: 'issuer',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Issuer" filterType="cik" />
    ),
    cell: ({ row }) => <CikBadge {...row.original.issuer} />,
  },
  {
    accessorKey: 'reportingOwner',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Reporting Owners" filterType="cik" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex flex-col justify-center items-center gap-2">
          {row.original.reportingOwner.length > 0 ? (
            row.original.reportingOwner.map((owner, index) => <CikBadge key={index} {...owner} />)
          ) : (
            <span className="text-gray-500">Keine Reporting Owners</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'dateFiled',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date filed" filterType="date" />
    ),
    cell: ({ row }) => (
      <>{row.original.dateFiled ? row.original.dateFiled.toLocaleDateString() : 'N/A'}</>
    ),
  },
];
