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

interface DataTableColumnHeaderSorterProps {
  columnId: string;
}

export const DataTableColumnHeaderSorter = ({ columnId }: DataTableColumnHeaderSorterProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // get current sort and order from url params
  const currentSort = searchParams.get('sort') || '';
  const currentOrder = searchParams.get('order') || 'asc';

  // function to handle sorting
  const applyColumnSorting = (direction: 'asc' | 'desc' | '') => {
    const params = new URLSearchParams(window.location.search);
    if (direction === '') {
      params.delete('sort');
      params.delete('order');
    } else {
      params.set('sort', columnId);
      params.set('order', direction);
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
