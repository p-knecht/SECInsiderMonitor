import { FilterIcon, XIcon } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useRef, useState } from 'react';

/**
 * The properties for the custom DataTableColumnHeaderFilterText component containing the column id to filter.
 */
interface DataTableColumnHeaderFilterTextProps {
  columnId: string;
}

/**
 * Renders a custom column header filter text component, containing a text input field to filter the column in a dropdown menu. Multiple filter values can be added and removed; the filter values are stored in the URL query parameters.
 *
 * @param {DataTableColumnHeaderFilterTextProps} {columnId} - The column header filter text properties to get the column id to filter.
 * @returns {JSX.Element} - The renderer DataTableColumnHeaderFilterText component.
 */
export const DataTableColumnHeaderFilterText = ({
  columnId,
}: DataTableColumnHeaderFilterTextProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [textFilter, setTextFilter] = useState('');
  const searchField = useRef<HTMLInputElement>(null);

  // get all unique filter values for this column
  const currentFilter = Array.from(new Set(searchParams.getAll(`filter[${columnId}]`)));

  /**
   * Removes a text filter entry from the URL query parameters.
   *
   * @param {string} value - The filter value to remove.
   * @returns {void}
   */
  const removeTextFilter = (value: string) => {
    const params = new URLSearchParams(window.location.search);
    // delete all filter entries for this column and re-add all except the one to remove
    params.delete(`filter[${columnId}]`);
    currentFilter
      .filter((item) => item !== value)
      .forEach((f) => params.append(`filter[${columnId}]`, f));
    router.push(`?${params.toString()}`); // update URL
    setTimeout(() => {
      searchField.current?.focus();
    }, 0);
  };

  /**
   * Adds a text filter entry to the URL query parameters.
   *
   * @param {string} value - The filter value to add.
   * @returns {void}
   */
  const addTextFilter = (value: string) => {
    const params = new URLSearchParams(window.location.search);
    // add new text filter entry
    if (!currentFilter.includes(value)) params.append(`filter[${columnId}]`, value);
    router.push(`?${params.toString()}`);
    setTimeout(() => {
      searchField.current?.focus();
    }, 0);
  };

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open)
          setTimeout(() => {
            searchField.current?.focus();
          }, 0);
      }}
    >
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
      <DropdownMenuContent className="w-64">
        <Input
          ref={searchField}
          type="text"
          placeholder="Suche..."
          value={textFilter}
          onChange={(e) => setTextFilter(e.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && textFilter.trim() !== '') {
              addTextFilter(textFilter.trim());
              setTextFilter('');
            }
          }}
          className="flex-grow bg-transparent border-none outline-none p-2"
        />
        {currentFilter.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="flex flex-wrap justify-center max-w-xs gap-1 mb-1">
              {currentFilter.map((filterValue) => (
                <Badge key={filterValue} className="flex items-center gap-1">
                  {filterValue}
                  <button onClick={() => removeTextFilter(filterValue)} className="ml-1">
                    <XIcon className="h-3 w-3 cursor-pointer" />
                  </button>
                </Badge>
              ))}
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
