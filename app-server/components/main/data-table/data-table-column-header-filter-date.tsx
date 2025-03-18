import { FilterIcon } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';
import { FormError } from '@/components/form-error';

/**
 * The properties for the custom DataTableColumnHeaderFilterDate component containing the column id to filter.
 */
interface DataTableColumnHeaderFilterDateProps {
  columnId: string;
}

/**
 * Renders a custom column header filter date component, containing two date input fields to filter the column in a dropdown menu. The choosen filter values are stored in the URL query parameters.
 *
 * @param {DataTableColumnHeaderFilterDateProps} {columnId} - The column header filter date properties to get the column id to filter.
 * @returns {JSX.Element} - The renderer DataTableColumnHeaderFilterDate component.
 */
export const DataTableColumnHeaderFilterDate = ({
  columnId,
}: DataTableColumnHeaderFilterDateProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [fromFilter, setFromFilter] = useState<string>(
    searchParams.get(`filter[${columnId}][from]`) || '',
  );
  const [toFilter, setToFilter] = useState<string>(
    searchParams.get(`filter[${columnId}][to]`) || '',
  );
  const [error, setError] = useState('');

  /**
   * Updates the date filter in the URL query parameters.
   *
   * @param {'from' | 'to'} type - defines wether the date to apply is the from or to date
   * @param {string} date - the date to apply as filter
   * @returns {void|boolean} - returns false if the date is invalid
   */
  const applyDateFilter = (type: 'from' | 'to', date: string) => {
    setError('');
    const params = new URLSearchParams(window.location.search);
    if (type === 'from') {
      // check if from date is before to date
      if (toFilter && date && date > toFilter) {
        setError('Das "Von"-Datum darf nicht nach dem "Bis"-Datum liegen.');
        return false;
      }
      // remove previous from date filter and set new one
      params.delete(`filter[${columnId}][from]`);
      setFromFilter(date);
      if (date) params.set(`filter[${columnId}][from]`, date);
    }
    if (type === 'to') {
      // check if to date is after from date
      if (fromFilter && date && date < fromFilter) {
        setError('Das "Von"-Datum darf nicht nach dem "Bis"-Datum liegen.');
        return false;
      }
      // remove previous to date filter and set new one
      params.delete(`filter[${columnId}][to]`);
      setToFilter(date);
      if (date) params.set(`filter[${columnId}][to]`, date);
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-5 w-5 flex justify-center items-center data-[state=open]:bg-accent"
        >
          {fromFilter != '' || toFilter != '' ? (
            <FilterIcon />
          ) : (
            <FilterIcon className="text-muted-foreground/25" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <div className="flex flex-col gap-2 p-2 w-64">
          <label className="text-sm font-semibold">Von:</label>
          <input
            type="date"
            className="border rounded p-2"
            value={fromFilter || ''}
            onChange={(e) => applyDateFilter('from', e.target.value)}
          />
          <label className="text-sm font-semibold">Bis:</label>
          <input
            type="date"
            className="border rounded p-2"
            value={toFilter || ''}
            onChange={(e) => applyDateFilter('to', e.target.value)}
          />
          <FormError message={error} />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
