'use client';
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
import { useRouter, useSearchParams } from 'next/navigation';
import { CIKSelectorFormField } from '@/components/main/cikselector-formfield';

/**
 * Renders a div containing a generic form to allow users to filter the analysis results (used for network and company analysis).
 *
 * @param {string} type - The type of analysis to provide a filter for (network or company)
 * @returns {React.ReactNode} - The rendered AnalysisFilter component
 */
export function AnalysisFilter({ type }: { type: 'network' | 'company' }): React.ReactNode {
  const router = useRouter();
  const searchParams = useSearchParams();

  const form = useForm<z.infer<typeof AnalysisSchema>>({
    resolver: zodResolver(AnalysisSchema),
    defaultValues: {
      cik: searchParams.get('cik') || '', // use CIK from URL if available
      depth: type == 'company' ? undefined : Number(searchParams.get('depth')) || 3, // use depth from URL if available or set it to 3
      from:
        searchParams.get('from') ||
        new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0], // use from date from URL if available or set it to one year ago
      to: searchParams.get('to') || new Date().toISOString().split('T')[0], // use to date from URL if available or set it to today
    },
  });

  /**
   * Sends a request to the server to do a analysis query based on the form data.
   *
   * @param {z.infer<typeof AnalysisSchema>} data - The data to be submitted to the server
   * @returns {void}
   */
  const onSubmit = (data: z.infer<typeof AnalysisSchema>) => {
    const params = new URLSearchParams();

    params.set('cik', form.getValues('cik'));
    params.set('from', form.getValues('from'));
    params.set('to', form.getValues('to'));
    if (type == 'network') params.set('depth', form.getValues('depth')?.toString() ?? ''); // depth is only added for network analysis - not needed for company analysis
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="text-sm w-fit mx-auto">
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
          <div className="flex flex-row gap-3 items-center">
            <div className="min-w-[150px] min-h-[82px]">
              <FormField
                control={form.control}
                name="cik"
                render={({ field }) => (
                  <CIKSelectorFormField
                    field={{ ...field, value: field.value }}
                    label="Gesuchte Entität"
                    limitType={type == 'company' ? 'knownIssuerCik' : 'knownCik'}
                  />
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
                        <Input {...field} type="number" min="1" max="10" />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
            ) : (
              <div className="items-center w-[150px]">
                <Button type="submit" variant="outline" className="w-full">
                  Analyse starten
                </Button>
              </div>
            )}
          </div>

          {type == 'network' && (
            <div className="text-right min-h-[40px]">
              <Button type="submit" variant="outline" className="w-full">
                Analyse starten
              </Button>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}
