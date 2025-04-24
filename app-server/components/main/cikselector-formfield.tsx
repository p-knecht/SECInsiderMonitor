import { SearchIcon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useState, useEffect, useRef } from 'react';
import { searchCiks } from '@/actions/main/filings/search-ciks';
import { CikObject } from '@/data/cik';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CikBadge } from '@/components/main/cik-badge';
import { FormControl, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { highlightMatch } from '@/components/component-utils';

/**
 * Renders a custom form field type for selecting one or multiple CIKs with live search to support the user.
 *
 * @param {{value: string[] | string, onChange: (value: string[] | string) => void}} field - The form field object containing the value and onChange function.
 * @param {string} label - The label for the form field.
 * @param {boolean} - Whether the form field is disabled. Defaults to false.
 * @param {'knownIssuerCik' | 'knownReportingOwnerCik' | 'knownCik' | 'anyCik'} The type of CIK to limit the search to. Defaults to 'anyCik'.
 * @returns {React.ReactNode} - The rendered CIK selector form field.
 */
export const CIKSelectorFormField = ({
  field,
  label,
  disabled = false,
  limitType = 'anyCik',
}: {
  field: {
    value: string[] | string;
    onChange: (value: string[] | string) => void;
  };
  label: string;
  disabled?: boolean;
  limitType?: 'knownIssuerCik' | 'knownReportingOwnerCik' | 'knownCik' | 'anyCik';
}) => {
  const [textFilter, setTextFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<CikObject[]>([]);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const selectedCiks = Array.isArray(field.value)
    ? (field.value ?? [])
    : field.value
      ? [field.value]
      : [];
  const [open, setOpen] = useState(false);
  const searchField = useRef<HTMLInputElement>(null);

  // start search on cik filter change (after debounce)
  useEffect(() => {
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
    query = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').trim();
    setIsLoading(true);

    // build query type based on limitType to make sure we only search for the correct type of CIK if relevant
    let queryType: 'issuer' | 'reportingOwner' | undefined = undefined;
    if (limitType === 'knownIssuerCik') queryType = 'issuer';
    if (limitType === 'knownReportingOwnerCik') queryType = 'reportingOwner';

    setSearchResults(await searchCiks({ searchString: query, limit: 10, limitType: queryType }));
    setIsLoading(false);
  };

  /**
   * Adds a CIK to the selected CIK(s) and resets the search results and text filter.
   *
   * @param {string} value - The CIK to add to the selected CIK(s).
   * @returns {void} - No return value.
   */
  const addCik = (value: string) => {
    if (value.match(/^\d{10}$/)) {
      setTextFilter('');
      setSearchResults([]);
      if (Array.isArray(field.value)) {
        if (!selectedCiks.includes(value)) {
          field.onChange([...selectedCiks, value]);
        }
      } else {
        field.onChange(value);
      }
      setTimeout(() => {
        (document.activeElement as HTMLElement)?.blur();
        setOpen(false);
      }, 0);
    }
  };

  return (
    <FormItem>
      <FormLabel>{label}</FormLabel>
      <FormControl
        onClick={() => {
          if (Array.isArray(field.value) || (!Array.isArray(field.value) && !field.value)) {
            setOpen(true);
            setTimeout(() => {
              searchField.current?.focus();
            }, 0);
          }
        }}
      >
        <div className="flex flex-wrap gap-1 w-full border p-2 rounded-md">
          {selectedCiks.map((cik) => (
            <CikBadge key={cik} cik={cik} tooltipLocation="top">
              <button
                onClick={() =>
                  field.onChange(
                    Array.isArray(field.value) ? selectedCiks.filter((value) => cik !== value) : '',
                  )
                }
                className="ml-1"
              >
                <XIcon className="h-3 w-3 cursor-pointer" />
              </button>
            </CikBadge>
          ))}
          <DropdownMenu
            open={open}
            onOpenChange={(open) => {
              setOpen(open);
              if (open) {
                setTimeout(() => {
                  searchField.current?.focus();
                }, 0);
              }
            }}
          >
            <DropdownMenuTrigger asChild>
              {(Array.isArray(field.value) || (!Array.isArray(field.value) && !field.value)) && (
                <Button variant="ghost" className="h-5 w-5" disabled={disabled}>
                  <SearchIcon />
                </Button>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64">
              <Input
                ref={searchField}
                type="text"
                value={textFilter}
                onChange={(e) => setTextFilter(e.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && textFilter.trim() !== '' && limitType == 'anyCik')
                    addCik(textFilter.trim());
                }}
                className="p-2"
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
                          onClick={() => addCik(result.cik)}
                        >
                          {highlightMatch(
                            textFilter,
                            result.cikTicker &&
                              result.cikTicker.toLowerCase() !== 'none' &&
                              result.cikTicker.toLowerCase() !== 'n/a'
                              ? `${result.cikTicker} (${result.cikName})`
                              : `${result.cikName}`,
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        CIK: {highlightMatch(textFilter, result.cik)}
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              ) : textFilter.trim() !== '' ? (
                <div className="text-center text-gray-500 p-2 text-sm">
                  Keine Ergebnisse gefunden.
                </div>
              ) : (
                <div className="text-center text-gray-500 p-2 text-sm">
                  Tippen, um Vorschläge zu sehen…
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </FormControl>
      <FormMessage />
    </FormItem>
  );
};
