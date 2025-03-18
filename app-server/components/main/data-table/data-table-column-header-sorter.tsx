import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

/**
 * The properties for the custom DataTableColumnHeaderSorter component containing the column id to sort.
 */
interface DataTableColumnHeaderSorterProps {
  columnId: string;
}

/**
 * Renders a custom data table column header sorter component with basic sorting options (asc, desc, none).
 *
 * @param {DataTableColumnHeaderSorterProps} {columnId} - The data table column header sorter properties to get column id to sort.
 * @returns {JSX.Element} - The renderer DataTableColumnHeaderSorter component.
 */
export const DataTableColumnHeaderSorter = ({ columnId }: DataTableColumnHeaderSorterProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // get current sort and order from url params
  const currentSort = searchParams.get('sort') || '';
  const currentOrder = searchParams.get('order') || 'asc';

  /**
   * Handles the sorting of the column by setting the sort and order url params accordingly.
   *
   * @param {'asc' | 'desc' | ''} direction - The direction to sort the column by.
   * @returns {void}
   */
  const applyColumnSorting = (direction: 'asc' | 'desc' | '') => {
    const params = new URLSearchParams(window.location.search);
    if (direction === '') {
      // remove sort and order params if direction is empty
      params.delete('sort');
      params.delete('order');
    } else {
      params.set('sort', columnId);
      params.set('order', direction);
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
          {currentSort === columnId ? (
            currentOrder === 'desc' ? (
              <ArrowDownIcon />
            ) : (
              <ArrowUpIcon />
            )
          ) : (
            <ChevronsUpDownIcon className="text-muted-foreground/25" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => applyColumnSorting('asc')}>
          <ArrowUpIcon className="text-muted-foreground/70" />
          Aufsteigend
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => applyColumnSorting('desc')}>
          <ArrowDownIcon className="text-muted-foreground/70" />
          Absteigend
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => applyColumnSorting('')}>
          <ChevronsUpDownIcon className="text-muted-foreground/70" />
          Sortierung entfernen
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
