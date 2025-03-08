import { Column } from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { DataTableColumnHeaderSorter } from '@/components/data-table/data-table-column-header-sorter';
import { DataTableColumnHeaderFilterText } from '@/components/data-table/data-table-column-header-filter-text';
import { DataTableColumnHeaderFilterSelect } from '@/components/data-table/data-table-column-header-filter-select';
import { DataTableColumnHeaderFilterDate } from '@/components/data-table/data-table-column-header-filter-date';
import { DataTableColumnHeaderFilterCik } from '@/components/data-table//data-table-column-header-filter-cik';

interface DataTableColumnHeaderProps<TData, TValue> extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
  filterType?: 'text' | 'select' | 'date' | 'cik';
  selectData?: { value: string; label: React.ReactNode }[];
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  filterType,
  selectData,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  return (
    <div className={cn('flex flex-col items-center', className)}>
      <span className="text-center font-semibold m-1">{title}</span>{' '}
      <div className="flex justify-center gap-x-1 mb-1">
        <DataTableColumnHeaderSorter columnId={column.id} />
        {filterType === 'text' && <DataTableColumnHeaderFilterText columnId={column.id} />}
        {filterType === 'select' && (
          <DataTableColumnHeaderFilterSelect columnId={column.id} selectData={selectData || []} />
        )}
        {filterType === 'cik' && <DataTableColumnHeaderFilterCik columnId={column.id} />}
        {filterType === 'date' && <DataTableColumnHeaderFilterDate columnId={column.id} />}
      </div>
    </div>
  );
}
