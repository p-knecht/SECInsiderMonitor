'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { AnalysisSchema } from '@/schemas';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { SearchIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CikObject } from '@/data/cik';
import { searchCiks } from '@/actions/main/filings/search-ciks';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useRouter, useSearchParams } from 'next/navigation';

export function AnalysisFilter({ type }: { type: 'network' | 'company' }): React.ReactNode {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isOpen, setIsOpen] = useState(false);
  const [textFilter, setTextFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<CikObject[]>([]);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  const form = useForm<z.infer<typeof AnalysisSchema>>({
    resolver: zodResolver(AnalysisSchema),
    defaultValues: {
      cik: searchParams.get('cik') || '',
      depth: type == 'company' ? undefined : Number(searchParams.get('depth')) || 3,
      from:
        searchParams.get('from') ||
        new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0],
      to: searchParams.get('to') || new Date().toISOString().split('T')[0],
    },
  });

  const onSubmit = (data: z.infer<typeof AnalysisSchema>) => {
    const params = new URLSearchParams();

    params.set('cik', form.getValues('cik'));
    params.set('from', form.getValues('from'));
    params.set('to', form.getValues('to'));
    if (type == 'network') params.set('depth', form.getValues('depth')?.toString() ?? '');
    router.push(`?${params.toString()}`);
  };

  // start search on text filter change (after debounce)
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

  const performSearch = async (query: string) => {
    query = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').trim(); // escape regex special characters to prevent side effects
    setIsLoading(true);
    setSearchResults(await searchCiks({ searchString: query, limit: 10 }));
    setIsLoading(false);
  };

  // Highlight matching text in search results
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
    <div className="mb-3 text-sm w-fit mx-auto">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="p-3 pt-5 pb-1 shadow-sm border rounded-lg  items-center flex flex-col lg:flex-row gap-3"
        >
          <div className="flex flex-row gap-3">
            <div className="w-[150px] min-h-[82px]">
              <FormField
                control={form.control}
                name="from"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <div className="flex items-center">
                      <FormLabel>Suchbereich (Start)</FormLabel>
                    </div>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>
            <div className="w-[150px] min-h-[82px]">
              <FormField
                control={form.control}
                name="to"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <div className="flex items-center">
                      <FormLabel>Suchbereich (Ende)</FormLabel>
                    </div>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>
          </div>
          <div className="flex flex-row gap-3">
            <div className="w-[150px] min-h-[82px]">
              <FormField
                control={form.control}
                name="cik"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <div className="flex items-center">
                      <FormLabel>Gesuchte Entität (CIK)</FormLabel>
                    </div>
                    <div className="relative">
                      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                        <DropdownMenuTrigger asChild>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </DropdownMenuTrigger>
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-3 h-3" />
                        {isOpen && (
                          <DropdownMenuContent className="w-64">
                            <Input
                              type="text"
                              placeholder="Suche..."
                              value={textFilter}
                              onChange={(e) => setTextFilter(e.target.value)}
                              className="flex-grow bg-transparent border-none outline-none p-2"
                            />
                            <DropdownMenuSeparator />
                            {isLoading ? (
                              <div className="text-center text-gray-500 p-2 text-sm">
                                Suche läuft...
                              </div>
                            ) : searchResults.length > 0 ? (
                              <div className="max-h-40 overflow-auto">
                                {searchResults.map((result) => (
                                  <Tooltip key={result.cik}>
                                    <TooltipTrigger asChild>
                                      <div
                                        className="cursor-pointer p-1 hover:bg-gray-200 text-sm"
                                        onClick={() => {
                                          form.setValue('cik', result.cik);
                                          setTextFilter('');
                                          setSearchResults([]);
                                          setIsOpen(false);
                                        }}
                                      >
                                        {highlightMatch(
                                          result.cikTicker &&
                                            result.cikTicker.toLocaleLowerCase() !== 'none'
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
                        )}
                      </DropdownMenu>
                    </div>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>
            {type == 'network' ? (
              <div className="w-[150px] lg:w-[85px] min-h-[82px]">
                <FormField
                  control={form.control}
                  name="depth"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <div className="flex items-center">
                        <FormLabel>Suchtiefe</FormLabel>
                      </div>
                      <FormControl>
                        <Input {...field} type="number" min="1" max="5" />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
            ) : (
              <div className="items-center w-[150px] pt-5">
                <Button type="submit" variant="outline" className="w-full">
                  Analyse starten
                </Button>
              </div>
            )}
          </div>

          {type == 'network' && (
            <div className="text-right min-h-[40px]">
              <Button type="submit" variant="outline">
                Analyse starten
              </Button>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}
