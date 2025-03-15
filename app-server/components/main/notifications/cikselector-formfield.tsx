import { SearchIcon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { searchCiks } from '@/actions/main/filings/search-ciks';
import { CikObject } from '@/data/cik';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CikBadge } from '@/components/data-table/cik-badge';
import { FormControl, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

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

  useEffect(() => {
    if (typingTimeout) clearTimeout(typingTimeout);
    if (textFilter.trim() !== '') {
      const timeout = setTimeout(() => performSearch(textFilter), 500);
      setTypingTimeout(timeout);
    } else {
      setSearchResults([]);
      setIsLoading(false);
    }
  }, [textFilter]);

  const performSearch = async (query: string) => {
    query = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').trim();
    setIsLoading(true);

    let queryType: 'issuer' | 'reportingOwner' | undefined = undefined;
    if (limitType === 'knownIssuerCik') queryType = 'issuer';
    if (limitType === 'knownReportingOwnerCik') queryType = 'reportingOwner';

    setSearchResults(await searchCiks({ searchString: query, limit: 10, limitType: queryType }));
    setIsLoading(false);
  };

  const addCik = (value: string) => {
    if (value.match(/^\d{10}$/)) {
      setTextFilter('');
      setSearchResults([]);
      setOpen(false);
      if (Array.isArray(field.value)) {
        field.onChange([...selectedCiks, value]);
      } else {
        field.onChange(value);
      }
    }
  };

  const highlightMatch = (text: string) => {
    if (!textFilter) return text;
    const regex = new RegExp(`(${textFilter.trim()})`, 'gi');
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
    <FormItem>
      <FormLabel>{label}</FormLabel>
      <FormControl>
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
          <DropdownMenu open={open} onOpenChange={setOpen}>
            {(Array.isArray(field.value) || (!Array.isArray(field.value) && !field.value)) && (
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-5 w-5" disabled={disabled}>
                  <SearchIcon />
                </Button>
              </DropdownMenuTrigger>
            )}
            <DropdownMenuContent className="w-64">
              <Input
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
                            result.cikTicker && result.cikTicker.toLowerCase() !== 'none'
                              ? `${result.cikTicker} (${result.cikName})`
                              : `${result.cikName}`,
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        CIK: {highlightMatch(result.cik)}
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
