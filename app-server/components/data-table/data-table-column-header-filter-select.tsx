import { FilterIcon } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';

interface DataTableColumnHeaderFilterSelectProps {
  columnId: string;
  selectData: { value: string; label: React.ReactNode }[];
}

export const DataTableColumnHeaderFilterSelect = ({
  columnId,
  selectData,
}: DataTableColumnHeaderFilterSelectProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // get all unique filter values for this column
  const currentFilter = Array.from(new Set(searchParams.getAll(`filter[${columnId}]`)));

  // update checkbox filters
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
    router.push(`?${params.toString()}`);
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
