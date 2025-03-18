import { FilterIcon } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';

/**
 * The properties for the custom DataTableColumnHeaderFilterSelect component containing the column id and data available for selection.
 */
interface DataTableColumnHeaderFilterSelectProps {
  columnId: string;
  selectData: { value: string; label: React.ReactNode }[];
}

/**
 * Renders a custom column header filter select component, containing a dropdown menu with checkboxes to filter the column. Multiple filter values can be (un-)checked; the filter values are stored in the URL query parameters.
 *
 * @param {DataTableColumnHeaderFilterSelectProps} {columnId, selectData} - The column header filter select properties to get the column id and select data.
 * @returns {JSX.Element} - The renderer DataTableColumnHeaderFilterSelect component.
 */
export const DataTableColumnHeaderFilterSelect = ({
  columnId,
  selectData,
}: DataTableColumnHeaderFilterSelectProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // get all unique filter values for this column
  const currentFilter = Array.from(new Set(searchParams.getAll(`filter[${columnId}]`)));

  /**
   * Updates the checkbox filters in the URL query parameters.
   *
   * @param {string} value - The filter value to add or remove.
   * @param {boolean} checked - The new state of the checkbox.
   * @returns {void}
   */
  const updateCheckboxFilters = (value: string, checked: boolean) => {
    const params = new URLSearchParams(window.location.search);
    if (checked) {
      if (!currentFilter.includes(value)) params.append(`filter[${columnId}]`, value);
    } else {
      // delete all filter entries for this column and re-add all except the one to remove
      params.delete(`filter[${columnId}]`);
      currentFilter
        .filter((item) => item !== value)
        .forEach((f) => params.append(`filter[${columnId}]`, f));
    }
    router.push(`?${params.toString()}`); // update URL
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-5 w-5 flex justify-center items-center data-[state=open]:bg-accent"
        >
          {currentFilter.length > 0 ? (
            <FilterIcon />
          ) : (
            <FilterIcon className="text-muted-foreground/25" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {selectData?.map(({ value, label }) => (
          <label
            key={value}
            htmlFor={`checkbox-${value}`}
            className="flex items-center gap-3 p-2 cursor-pointer hover:bg-gray-100 rounded"
          >
            <Checkbox
              id={`checkbox-${value}`}
              className="cursor-pointer"
              checked={currentFilter.includes(value)}
              onCheckedChange={(checked: boolean) => updateCheckboxFilters(value, checked)}
            />
            {label}
          </label>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
