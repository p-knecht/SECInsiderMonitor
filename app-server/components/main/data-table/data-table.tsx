'use client';

import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePathname, useRouter } from 'next/navigation';

/**
 * The properties for the custom DataTable component (supporting server-side pagination).
 */
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
}

/**
 * Renders a custom data table component with support server-side pagination and required ui components for navigation and changing page size.
 *
 * @param {DataTableProps<TData, TValue>} {columns, data, totalCount, currentPage, pageSize} - The data table properties defining table content and pagination.
 * @returns {JSX.Element} - The renderer DataTable component.
 */
export function DataTable<TData, TValue>({
  columns,
  data,
  totalCount,
  currentPage,
  pageSize,
}: DataTableProps<TData, TValue>) {
  const router = useRouter();
  const pathname = usePathname();

  const totalPages = Math.ceil(totalCount / pageSize);

  const table = useReactTable({
    data,
    columns,
    manualPagination: true,
    pageCount: totalPages,
    getCoreRowModel: getCoreRowModel(),
  });

  /**
   * Handles the page change event to navigate to the new page.
   *
   * @param {number} newPage - The new page number to navigate to.
   * @returns {void}
   */
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set('page', newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  /**
   * Handles the page size change event to set the new page size and navigate to the first page.
   *
   * @param {string} newPageSize - The new page size to set.
   * @returns {void}
   */
  const handlePageSizeChange = (newPageSize: string) => {
    const params = new URLSearchParams(window.location.search);
    params.set('pageSize', newPageSize);
    params.set('page', '1'); // Jump to first page when changing page size
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="w-full">
      <div className="overflow-auto rounded-md border">
        <Table className="w-full table-auto">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-center">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Keine Einträge vorhanden.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-between m-2">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Einträge pro Seite</p>
          <Select
            value={`${pageSize}`}
            onValueChange={(value) => {
              handlePageSizeChange(value);
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 25, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="h-8 w-8 p-0 m-0.5"
            onClick={() => handlePageChange(1)}
            disabled={currentPage <= 1}
          >
            <ChevronsLeft />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0 m-0.5"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft />
          </Button>
          <span className="text-sm font-medium m-2">
            Seite {currentPage} von {totalPages}
          </span>
          <Button
            variant="outline"
            className="h-8 w-8 p-0 m-0.5"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            <ChevronRight />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0 m-0.5"
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage >= totalPages}
          >
            <ChevronsRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
