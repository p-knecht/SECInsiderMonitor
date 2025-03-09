'use client';

import { useEffect, useState } from 'react';
import { getFilingCounts } from '@/actions/main/dashboard/get-dashboard-stats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { FormtypeBadge } from '@/components/data-table/formtype-badge';

export const FilingSummary = () => {
  const [stats, setStats] = useState<{ [key: string]: { [key: string]: number } }>({});
  const [loading, setLoading] = useState(true);
  const timeFrames = ['lastDay', 'lastWeek', 'lastMonth', 'lastYear', 'total'];

  // available time frames in days
  const timeFrameDays: { [key: string]: number } = {
    lastDay: 1,
    lastWeek: 7,
    lastMonth: 30,
    lastYear: 365,
  };

  useEffect(() => {
    async function fetchStats() {
      const data = await getFilingCounts();
      if (!data || !Array.isArray(data)) {
        setLoading(false);
        return;
      }

      const tableStats: { [key: string]: { [key: string]: number } } = {};

      // prepare stats for each form type
      data.forEach((stat) => {
        tableStats[stat._id] = timeFrames.reduce(
          (acc, timeFrame) => ({ ...acc, [timeFrame]: stat[timeFrame] ?? 0 }),
          {},
        );
      });

      // calculate total stats
      tableStats['all'] = timeFrames.reduce(
        (acc, timeFrame) => ({
          ...acc,
          [timeFrame]: data.reduce((sum, stat) => sum + (stat[timeFrame] ?? 0), 0),
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
    if (formType !== 'all') query['filter[formType]'] = formType;
    if (timeFrame !== 'total') {
      const date = new Date();
      date.setDate(date.getDate() - timeFrameDays[timeFrame]);
      query['filter[periodOfReport][from]'] = date.toISOString().split('T')[0];
    }
    return { pathname: '/filings', query };
  };

  return (
    <Card className="shadow-md h-full">
      <CardHeader>
        <CardTitle>Anzahl Einreichungen pro Typ und Berichtszeitpunkt</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center items-center flex-grow min-h-[300px]">
        {loading ? (
          <Skeleton className="w-full h-full max-w-6xl" />
        ) : (
          <div className="overflow-auto w-full h-full">
            <table className="w-full h-full border-collapse border border-blue-600 text-sm max-w-6xl">
              <thead>
                <tr className="bg-gray-200 text-gray-600">
                  <th className="border p-2"></th>
                  <th className="border p-2 text-center">Letzter Tag</th>
                  <th className="border p-2 text-center">Letzte Woche</th>
                  <th className="border p-2 text-center">Letzter Monat</th>
                  <th className="border p-2 text-center">Letztes Jahr</th>
                  <th className="border p-2 text-center">Gesamt</th>
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
      </CardContent>
    </Card>
  );
};
