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
import { CikBadge } from '@/components/main/cik-badge';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import ShowFilingButton from '../filings/show-filing-button';
import { CheckIcon, CircleHelpIcon, XIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * The properties for the TransactionTable component.
 */
interface TransactionTableProps {
  transactions: Transaction[];
  onDateClick: (date: Date | null) => void;
  activeDate: Date | null;
}

/**
 * The columns for the TransactionTable component containing the accessor key, header, and cell renderer for each column.
 */
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
    header: ({ column }) => (
      <div className="flex items-center justify-center m-1 gap-1">
        Trading Plan
        <div>
          <Tooltip>
            <TooltipTrigger asChild>
              <CircleHelpIcon className="w-4 h-4 text-gray-400 mt-0.5" />
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="m-1">
                Kennzeichnet Transaktionen, die im Rahmen eines sogenannten
                <strong> Trading Plans gemäss SEC Rule 10b5-1</strong> durchgeführt wurden.
              </p>
              <p className="m-1">
                Solche Pläne ermöglichen es Insidern, Wertpapiergeschäfte vorab festzulegen und sich
                dadurch gegen potenzielle Vorwürfe des Insiderhandels abzusichern.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    ),
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

/**
 * Renders a table with transactions for a company in the analysed time frame (matching to the stock chart).
 *
 * @param {TransactionTableProps} { transactions, onDateClick, activeDate } - The properties for the TransactionTable component containing an array of transactions, a callback function to handle date clicks, and the currently active date.
 * @returns {React.ReactNode} - The rendered TransactionTable component
 */
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
  const [tableHeight, setTableHeight] = useState<number | null>(null);

  // set the height of the table to the available space
  useEffect(() => {
    const element = tableContainerRef.current;
    if (!element) return;

    /**
     * Auxiliary function to update the max height of the table based on the available space.
     *
     * @return {void} - No return value
     */
    const updateMaxHeight = () => {
      setTableHeight(window.innerHeight - element.getBoundingClientRect().top - 40);
    };

    const observer = new ResizeObserver(updateMaxHeight);
    observer.observe(document.body); // observe the body for changes in size to update if max height if required

    window.addEventListener('resize', updateMaxHeight);
    updateMaxHeight(); // initial call to set the max height

    return () => {
      // cleanup function after unmounting
      observer.disconnect();
      window.removeEventListener('resize', updateMaxHeight);
    };
  }, []);

  // scroll to the active row when the active date changes
  useEffect(() => {
    if (!disableScroll && activeDate && tableContainerRef.current) {
      requestAnimationFrame(() => {
        const activeRow = rowRefs.current.get(activeDate.getTime()); // get the row with the active date
        if (activeRow) {
          activeRow.scrollIntoView({
            // scroll the active row into view
            behavior: 'smooth',
            block: 'center',
          });
        }
      });
    }
    setDisableScroll(false);
  }, [activeDate]);

  return (
    <TooltipProvider>
      <div
        ref={tableContainerRef}
        className="relative flex flex-col min-h-48 overflow-y-auto border"
        style={{ height: `${tableHeight ?? 192}px` }}
      >
        <Table className="text-center w-full">
          <TableHeader className="sticky top-0 bg-white shadow-md z-20">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-center p-2 bg-white whitespace-normal">
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
                        className="p-2 text-sm break-words whitespace-normal"
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
  );
}

export default TransactionTable;
