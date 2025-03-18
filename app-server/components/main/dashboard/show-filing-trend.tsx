'use client';

import { useEffect, useState } from 'react';
import { getFilingTrend } from '@/actions/main/dashboard/get-dashboard-stats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { useRouter } from 'next/navigation';

/**
 * Renders a card with a bar chart showing the filing trend of the last 30 days (per filing type).
 *
 * @returns {JSX.Element} - The renderer FilingTrend component.
 */
export const FilingTrend = () => {
  const [trendData, setTrendData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    /**
     * Sends a request to the server to get the filing trend data for the last 30 days.
     *
     * @returns {Promise<void>} - The promise which resolves when the data is fetched.
     */
    async function fetchTrend() {
      setLoading(true);
      const data = await getFilingTrend();

      // if no data is available, stop loading
      if (!data || !Array.isArray(data)) {
        setLoading(false);
        return;
      }

      // generate list of last 30 days as base for chart data
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      // group and add received data by date and form type
      const groupedData: { [date: string]: { [formType: string]: number } } = {};
      last30Days.forEach((date) => (groupedData[date] = { 'Form 3': 0, 'Form 4': 0, 'Form 5': 0 }));
      data.forEach(({ _id, count }) => {
        const formattedDate = new Date(_id.date?.$date || _id.date).toISOString().split('T')[0];
        const formType = `Form ${_id.formType}`;
        if (groupedData[formattedDate]) {
          groupedData[formattedDate][formType] = count;
        }
      });

      // prepare chart data
      const chartData = last30Days.map((date) => ({
        date,
        'Form 3': groupedData[date]['Form 3'],
        'Form 4': groupedData[date]['Form 4'],
        'Form 5': groupedData[date]['Form 5'],
      }));

      setTrendData(chartData);
      setLoading(false);
    }

    fetchTrend();
  }, []);

  /**
   * Auxiliary function to handle click events on the chart and redirect to the filings page.
   *
   * @param {event} event - The event object containing the clicked label
   * @returns {void}
   */
  const handleChartClick = (event: any) => {
    if (event && event.activeLabel) {
      const date = event.activeLabel;
      router.push(
        `/filings?filter[periodOfReport][from]=${date}&filter[periodOfReport][to]=${date}`,
      );
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Entwicklung der Einreichungen pro Typ im letzten Monat</CardTitle>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-[400px] w-full">
            <Skeleton className="h-[80%] w-[95%] rounded-lg" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart layout="horizontal" data={trendData} onClick={handleChartClick}>
                <XAxis
                  dataKey="date"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 12 }}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <CartesianGrid strokeDasharray="3 3" opacity={0.75} />
                <Tooltip cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }} />
                <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: 5 }} />
                <Bar
                  dataKey="Form 3"
                  fill="#FDD835"
                  stackId="a"
                  radius={[3, 3, 0, 0]}
                  barSize={30}
                />
                <Bar
                  dataKey="Form 4"
                  fill="#A5D6A7"
                  stackId="a"
                  radius={[3, 3, 0, 0]}
                  barSize={30}
                />
                <Bar
                  dataKey="Form 5"
                  fill="#90CAF9"
                  stackId="a"
                  radius={[3, 3, 0, 0]}
                  barSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
