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
import { useState, useEffect } from 'react';
import { searchCiks } from '@/actions/main/filings/search-ciks';
import { CikObject } from '@/data/cik';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CikBadge } from '@/components/main/cik-badge';

/**
 * The properties for the custom DataTableColumnHeaderFilterCik component containing the column id to filter.
 */
interface DataTableColumnHeaderFilterCikProps {
  columnId: string;
}

/**
 * Renders a custom column header filter cik component, containing a text input field to filter the column in a dropdown menu, allowing contextual live-search for available CIKs and issuer/reporting owner names. Multiple filter values can be added and removed; the filter values are stored in the URL query parameters.
 *
 * @param {DataTableColumnHeaderFilterCikProps} {columnId} - The column header filter cik properties to get the column id to filter.
 * @returns {JSX.Element} - The renderer DataTableColumnHeaderFilterCik component.
 */
export const DataTableColumnHeaderFilterCik = ({
  columnId,
}: DataTableColumnHeaderFilterCikProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [textFilter, setTextFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<CikObject[]>([]);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  // get all unique filter values for this column
  const currentFilter = Array.from(new Set(searchParams.getAll(`filter[${columnId}]`)));
  const filterBadges = currentFilter.map((filterValue) => {
    if (filterValue.match(/^\d{10}$/)) {
      return (
        <CikBadge key={filterValue} cik={filterValue}>
          <button onClick={() => removeCikFilter(filterValue)} className="ml-1">
            <XIcon className="h-3 w-3 cursor-pointer" />
          </button>
        </CikBadge>
      );
    } else {
      return (
        <Badge key={filterValue} className="flex items-center gap-1">
          {filterValue}
          <button onClick={() => removeCikFilter(filterValue)} className="ml-1">
            <XIcon className="h-3 w-3 cursor-pointer" />
          </button>
        </Badge>
      );
    }
  });

  // start search on cik filter change (after debounce)
  useEffect(() => {
    setIsLoading(true);
    if (typingTimeout) clearTimeout(typingTimeout); // clear previous timeout on every keypress if exists
    if (textFilter.trim() !== '') {
      const timeout = setTimeout(() => performSearch(textFilter), 500); // wait for user to stop typing before searching (debounce queries)
      setTypingTimeout(timeout);
    } else {
      setSearchResults([]);
      setIsLoading(false);
    }
  }, [textFilter]);

  /**
   * Executes a search request on the backend to get CIKs and issuer/reporting owner names matching the query and adds them to the search results state.
   *
   * @param {string} query - The search query to perform.
   * @returns {Promise<void>} - a promise resolving when the search results are fetched and set to state.
   */
  const performSearch = async (query: string) => {
    query = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').trim(); // escape regex special characters to prevent side effects
    setIsLoading(true);
    setSearchResults(await searchCiks({ searchString: query, limit: 10 }));
    setIsLoading(false);
  };

  /**
   * Removes a cik filter entry from the URL query parameters.
   *
   * @param {string} value - The filter value to remove.
   * @returns {void}
   */
  const removeCikFilter = (value: string) => {
    const params = new URLSearchParams(window.location.search);
    params.delete(`filter[${columnId}]`);
    currentFilter
      .filter((item) => item !== value)
      .forEach((f) => params.append(`filter[${columnId}]`, f));
    router.push(`?${params.toString()}`);
  };

  /**
   * Adds a cik filter entry to the URL query parameters.
   *
   * @param {string} value - The filter value to add.
   * @returns {void}
   */
  const addCikFilter = (value: string) => {
    const params = new URLSearchParams(window.location.search);
    if (!currentFilter.includes(value)) params.append(`filter[${columnId}]`, value);
    router.push(`?${params.toString()}`);
  };

  /**
   * Highlights the matched text in the search results (to allow user to see what part of the result matched the query).
   *
   * @param {string} text - The text to highlight.
   * @returns {JSX.Element[]} - The text with highlighted matches.
   */
  const highlightMatch = (text: string) => {
    if (!textFilter) return text;
    const escapedQuery = textFilter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // escape regex special characters to prevent side effects
    const regex = new RegExp(`(${escapedQuery.trim()})`, 'gi');
    return text.split(regex).map((part, index) =>
      regex.test(part) ? (
        <span className="font-bold" key={index}>
          {part}
        </span>
      ) : (
        part
      ),
    );
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
      <DropdownMenuContent className="min-w-64">
        <Input
          type="text"
          placeholder="Suche..."
          value={textFilter}
          onChange={(e) => setTextFilter(e.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && textFilter.trim() !== '') {
              addCikFilter(textFilter.trim());
              setTextFilter('');
            }
          }}
          className="flex-grow bg-transparent border-none outline-none p-2"
        />
        <DropdownMenuSeparator />
        {isLoading ? (
          <div className="text-center text-gray-500 p-2 text-sm">Suche läuft...</div>
        ) : searchResults.length > 0 ? (
          <div className="max-h-40 overflow-auto">
            {searchResults.map((result) => (
              <Tooltip key={result.cik}>
                <TooltipTrigger asChild>
                  <div
                    className="cursor-pointer p-1 hover:bg-gray-200 text-sm"
                    onClick={() => {
                      addCikFilter(result.cik);
                      setTextFilter('');
                      setSearchResults([]);
                    }}
                  >
                    {highlightMatch(
                      result.cikTicker && result.cikTicker.toLocaleLowerCase() !== 'none'
                        ? `${result.cikTicker} (${result.cikName})`
                        : `${result.cikName}`,
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">CIK: {highlightMatch(result.cik)}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        ) : textFilter.trim() !== '' ? (
          <div className="text-center text-gray-500 p-2 text-sm">Keine Ergebnisse gefunden.</div>
        ) : (
          <div className="text-center text-gray-500 p-2 text-sm">
            Tippen, um Vorschläge zu sehen…
          </div>
        )}
        {currentFilter.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="flex flex-wrap justify-center gap-1 mb-1">{filterBadges}</div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
