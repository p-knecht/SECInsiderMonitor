'use client';

import { useEffect, useState } from 'react';
import { getFilingCounts, getDateFiledRange } from '@/actions/main/dashboard/get-dashboard-stats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { FormtypeBadge } from '@/components/main/formtype-badge';

/**
 * Renders a card containing a table showing the number of filings for each form type and given time frames.
 *
 * @returns {JSX.Element} - The rendered FilingSummary component.
 */
export const FilingSummary = () => {
  const [stats, setStats] = useState<{ [key: string]: { [key: string]: number } }>({});
  const [dateFiledRange, setDateFiledRange] = useState<{ earliest: Date; latest: Date } | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  // definition of time frames and their corresponding days
  const timeFrames = ['1d', '7d', '30d', '365d', 'total'];

  useEffect(() => {
    /**
     * Sends a request to the server to get the filing counts for each form type and time frame.
     *
     * @returns {Promise<void>} - The promise which resolves when the data is fetched.
     */
    async function fetchStats() {
      const [counts, range] = await Promise.all([getFilingCounts(), getDateFiledRange()]);

      // if a date range is available, set it and display it in the card
      if (range && range.earliest && range.latest) {
        setDateFiledRange(range);
      }

      // if no data is available, stop loading
      if (!counts || !Array.isArray(counts)) {
        setLoading(false);
        return;
      }

      const tableStats: { [key: string]: { [key: string]: number } } = {};

      // prepare stats for each form type
      counts.forEach((stat) => {
        tableStats[stat._id] = timeFrames.reduce(
          (acc, timeFrame) => ({ ...acc, [timeFrame]: stat[timeFrame] ?? 0 }),
          {},
        );
      });

      // calculate total stats for all form types
      tableStats['all'] = timeFrames.reduce(
        (acc, timeFrame) => ({
          ...acc,
          [timeFrame]: counts.reduce((sum, stat) => sum + (stat[timeFrame] ?? 0), 0),
        }),
        {},
      );

      setStats(tableStats);
      setLoading(false);
    }
    fetchStats();
  }, []);

  // generate link to filter filings by form type and time frame
  const getFilterLink = (formType: string, timeFrame: string) => {
    const query: { [key: string]: string } = {};
    if (formType !== 'all') query['filter[formType]'] = formType; // filter by form type
    if (timeFrame !== 'total') {
      // filter by time frame
      const date = new Date();
      date.setDate(date.getDate() - parseInt(timeFrame.match(/\d+/)?.[0] || '0', 10));
      query['filter[periodOfReport][from]'] = date.toISOString().split('T')[0];
    }
    return { pathname: '/filings', query };
  };

  return (
    <Card className="shadow-md h-full">
      <CardHeader>
        <div>
          <CardTitle>Anzahl bezogener Einreichungen pro Typ und Zeitraum</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Basierend auf dem Berichtszeitpunkt (Period of Report)
          </p>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col justify-center items-center flex-grow min-h-[250px]">
        {loading ? (
          <Skeleton className="w-full h-full max-w-6xl" />
        ) : (
          <div className="overflow-auto w-full h-full">
            <table className="w-full h-full border-collapse border border-blue-600 text-sm">
              <thead>
                <tr className="bg-gray-200 text-gray-600">
                  <th className="border p-1"></th>
                  <th className="border p-1 text-center font-normal">Letzter Tag</th>
                  <th className="border p-1 text-center font-normal">Letzte 7 Tage</th>
                  <th className="border p-1 text-center font-normal">Letzte 30 Tage</th>
                  <th className="border p-1 text-center font-normal">Letzte 365 Tage</th>
                  <th className="border p-1 text-center font-normal">Gesamthaft</th>
                </tr>
              </thead>
              <tbody>
                {['3', '4', '5'].map((formType) => (
                  <tr key={formType} className="border">
                    <td className="border p-1 text-center">
                      <FormtypeBadge formtype={formType} />
                    </td>
                    {timeFrames.map((timeFrame) => (
                      <td key={timeFrame} className="border p-2 text-center">
                        <Link
                          href={getFilterLink(formType, timeFrame)}
                          className="text-blue-600 hover:underline"
                        >
                          {stats[formType]?.[timeFrame] ?? 0}
                        </Link>
                      </td>
                    ))}
                  </tr>
                ))}
                <tr key="all" className="border font-semibold">
                  <td className="border p-2 text-center">Alle</td>
                  {timeFrames.map((timeFrame) => (
                    <td key={timeFrame} className="border p-2 text-center">
                      <Link
                        href={getFilterLink('all', timeFrame)}
                        className="text-blue-600 hover:underline"
                      >
                        {stats['all']?.[timeFrame] ?? 0}
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
        {dateFiledRange && (
          <p className="mt-4 text-sm text-muted-foreground text-center">
            Die Datenbank der SIM-Anwendung umfasst{' '}
            {stats['all']?.['total'] && (
              <span className="font-semibold">{stats['all']?.['total']} </span>
            )}
            Einreichungen, die bei der SEC zwischen dem{' '}
            <span className="font-semibold">{dateFiledRange.earliest.toLocaleDateString()}</span>{' '}
            und dem{' '}
            <span className=" font-semibold">{dateFiledRange.latest.toLocaleDateString()}</span>{' '}
            eingereicht wurden.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
