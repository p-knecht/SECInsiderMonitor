'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/main/data-table/data-table-column-header';
import { CikObject } from '@/data/cik';
import { CikBadge } from '@/components/main/cik-badge';
import { FormtypeBadge } from '@/components/main/formtype-badge';
import ShowFilingButton from '@/components/main/filings/show-filing-button';

/**
 * Defines the data for the filing table columns.
 */
export interface OwnershipFilingColumn {
  // not using OwnershipFiling from prisma/client as only a subset of fields is needed
  filingId: string;
  formType: string;
  periodOfReport?: Date;
  issuer: CikObject;
  reportingOwner: CikObject[];
  dateFiled?: Date;
}

/**
 * Defines the column keys, headers and cell contents for the filing table.
 */
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
      <DataTableColumnHeader
        column={column}
        title="Issuer"
        filterType="cik"
        infoText={
          <div className="m-1">
            <div className="font-bold mb-2 text-md">
              Darstellung der Issuer-Informationen in den Badges:
            </div>
            <div className="mb-2">
              Falls für den Issuer ein <code className="font-semibold">SEC Trading Symbol</code>{' '}
              <br /> bzw. <code className="font-semibold">SEC Ticker</code> definiert ist:
              <br /> → <code>Issuer Trading Symbol (Issuer Name)</code>
            </div>
            <div className="mb-2">
              Andernfalls:
              <br /> → <code>Issuer Name</code>
            </div>
            <div>
              (Der <code>Issuer CIK</code> wird jeweils als Tooltip angezeigt.)
            </div>
          </div>
        }
      />
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
  {
    id: 'actions',
    cell: ({ row }) => <ShowFilingButton filingId={row.original.filingId} />,
  },
];
