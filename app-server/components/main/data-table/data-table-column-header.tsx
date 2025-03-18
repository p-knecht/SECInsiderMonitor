import { Column } from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { DataTableColumnHeaderSorter } from '@/components/main/data-table/data-table-column-header-sorter';
import { DataTableColumnHeaderFilterText } from '@/components/main/data-table/data-table-column-header-filter-text';
import { DataTableColumnHeaderFilterSelect } from '@/components/main/data-table/data-table-column-header-filter-select';
import { DataTableColumnHeaderFilterDate } from '@/components/main/data-table/data-table-column-header-filter-date';
import { DataTableColumnHeaderFilterCik } from '@/components/main/data-table/data-table-column-header-filter-cik';

/**
 * The properties used for data table column header component containing the column definition and title.
 */
interface DataTableColumnHeaderProps<TData, TValue> extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
  filterType?: 'text' | 'select' | 'date' | 'cik';
  selectData?: { value: string; label: React.ReactNode }[];
}

/**
 * Renders a custom data table column header component, containing sorter component and warping column specific filter components.
 *
 * @param {DataTableColumnHeaderProps<TData, TValue>} {column, title, filterType, selectData, className} - The data table column header properties to get filter type and information needed in type specific components
 * @returns {JSX.Element} - The renderer DataTableColumnHeader component.
 */
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
