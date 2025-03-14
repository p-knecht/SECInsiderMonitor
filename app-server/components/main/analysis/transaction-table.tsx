import React, { useEffect, useRef, useState } from 'react';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Transaction } from '@/actions/main/analysis/analyse-company';
import { buildFieldContent } from '../filings/filing-details-components/filing-table-content';
import { CikBadge } from '@/components/data-table/cik-badge';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import ShowFilingButton from '../filings/show-filing-button';
import { CheckIcon, XIcon } from 'lucide-react';

interface TransactionTableProps {
  transactions: Transaction[];
  onDateClick: (date: Date | null) => void;
  activeDate: Date | null;
}

const columns: ColumnDef<Transaction>[] = [
  {
    accessorKey: 'transactionDate',
    header: 'Date',
    cell: ({ row }) =>
      buildFieldContent(row.original.transactionDate, row.original.footnotes, null, true),
  },
  {
    accessorKey: 'transactionType',
    header: 'Instrument Type',
    cell: ({ row }) => (
      <Badge
        className={`text-black ${
          row.original.transactionType === 'Non-Derivative' ? 'bg-orange-300' : 'bg-lime-300'
        }`}
      >
        {row.original.transactionType}
      </Badge>
    ),
  },
  {
    accessorKey: 'aff10b5One',
    header: 'Trading Plan',
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        {row.original.aff10b5One ? (
          <CheckIcon className="w-5 h-5 text-green-600" />
        ) : (
          <XIcon className="w-5 h-5 text-red-600" />
        )}
      </div>
    ),
  },
  {
    accessorKey: 'securityTitle',
    header: 'Security Title',
    cell: ({ row }) =>
      buildFieldContent(row.original.securityTitle, row.original.footnotes, null, true),
  },
  {
    accessorKey: 'underlyingSecurity',
    header: 'Underlying Security',
    cell: ({ row }) => {
      if (row.original.transactionType === 'Non-Derivative') return 'N/A';
      return buildFieldContent(
        row.original.underlyingSecurity,
        row.original.footnotes,
        'underlyingSecurity',
        true,
      );
    },
  },
  {
    accessorKey: 'owner',
    header: 'Reporting Owner',
    cell: ({ row }) => (
      <div className="flex flex-col justify-center items-center gap-2">
        {row.original.reportingOwner.length > 0 ? (
          row.original.reportingOwner.map((owner, index) => <CikBadge key={index} {...owner} />)
        ) : (
          <span className="text-gray-500">Keine Reporting Owners</span>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'coding',
    header: 'Coding',
    cell: ({ row }) =>
      buildFieldContent(
        row.original.transactionCoding,
        row.original.footnotes,
        'transactionCoding',
        true,
      ),
  },
  {
    accessorKey: 'amounts',
    header: 'Amounts',
    cell: ({ row }) =>
      buildFieldContent(
        row.original.transactionAmounts,
        row.original.footnotes,
        'transactionAmounts',
        true,
      ),
  },
  {
    accessorKey: 'ownership',
    header: 'Ownership',
    cell: ({ row }) =>
      buildFieldContent(
        row.original.ownershipNature,
        row.original.footnotes,
        'ownershipNature',
        true,
      ),
  },
  {
    id: 'actions',
    cell: ({ row }) => <ShowFilingButton filingId={row.original.filingId} />,
  },
];

export function TransactionTable({
  transactions,
  onDateClick,
  activeDate,
}: TransactionTableProps): React.ReactNode {
  const table = useReactTable({
    data: transactions,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Map<number, HTMLTableRowElement>>(new Map());
  const [disableScroll, setDisableScroll] = useState(false);

  useEffect(() => {
    if (!disableScroll && activeDate && tableContainerRef.current) {
      requestAnimationFrame(() => {
        const activeRow = rowRefs.current.get(activeDate.getTime());
        if (activeRow) {
          activeRow.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }
      });
    }
    setDisableScroll(false);
  }, [activeDate]);

  return (
    <div className="p-4 border rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">Transaction History</h2>
      <TooltipProvider>
        <div ref={tableContainerRef} className="relative flex flex-col h-96 overflow-y-auto border">
          <Table className="text-center w-full">
            <TableHeader className="sticky top-0 bg-white shadow-md z-20">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="text-center p-2 bg-white whitespace-nowrap"
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => {
                  const transactionTime = row.original.transactionDate.value.getTime();
                  const isActiveRow = activeDate && transactionTime === activeDate.getTime();

                  return (
                    <TableRow
                      key={row.id}
                      ref={(el) => {
                        if (el && !rowRefs.current.has(transactionTime)) {
                          rowRefs.current.set(transactionTime, el); // set the row ref to the first row with this date
                        }
                      }}
                      className={`cursor-pointer transition-colors ${
                        isActiveRow ? 'bg-amber-50 hover:bg-amber-100' : ''
                      }`} // active rows should be highlighted
                      onClick={() => {
                        setDisableScroll(true); // disable scroll when clicking on a row (auto scrolling should only happen by clicks on the chart)
                        onDateClick(
                          isActiveRow ? null : new Date(row.original.transactionDate.value), // if the row is already active, deactivate it otherwise activate it
                        );
                      }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className="p-2 text-sm break-words whitespace-nowrap"
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="p-4 text-gray-500">
                    Keine Transaktionen als Issuer für das ausgewählte Unternehmen gefunden.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </TooltipProvider>
    </div>
  );
}

export default TransactionTable;
