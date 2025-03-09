'use client';

import { useEffect, useState } from 'react';
import { getTopIssuer } from '@/actions/main/dashboard/get-dashboard-stats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, YAxis } from 'recharts';
import { calculateCikBadgeStyle } from '@/components/data-table/cik-badge';
import { useRouter } from 'next/navigation';

export const TopIssuers = () => {
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchStats() {
      const data = await getTopIssuer();
      if (data && Array.isArray(data)) {
        setStats(data);
      }
      setLoading(false);
    }
    fetchStats();
  }, []);

  // handle click on chart to navigate to filings page
  const handleChartClick = (event: any) => {
    if (event && event.activePayload?.[0]?.payload) {
      const { cik } = event.activePayload[0].payload;
      const pastDate = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]; // 30 days ago

      router.push(`/filings?filter[issuer]=${cik}&filter[periodOfReport][from]=${pastDate}`);
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Top 10 Issuer des letzten Monats</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center">
            <Skeleton className="h-50 w-full" />
          </div>
        ) : stats.length === 0 ? (
          <div className="text-center text-gray-500">Keine Daten verfügbar</div>
        ) : (
          <div className="overflow-x-auto">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                layout="vertical"
                data={stats.map(({ _id, issuerName, count }) => {
                  // enhance brightness of color by 10% (to make colors less dark --> better matching with the other dashboard contents)
                  const backgroundColor = calculateCikBadgeStyle(_id).backgroundColor.replace(
                    /hsl\((\d+), (\d+)%, (\d+)%\)/,
                    (match, h, s, l) => `hsl(${h}, ${s}%, ${Math.min(parseInt(l) + 10, 90)}%)`,
                  );
                  return {
                    cik: _id,
                    name: issuerName.replace('&amp;', '&'),
                    count,
                    color: backgroundColor,
                  };
                })}
                margin={{ left: 20, right: 20 }}
                onClick={handleChartClick}
              >
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={200}
                  tick={{ fontSize: 12 }}
                  interval={0}
                />
                <Tooltip
                  formatter={(value, name, props) => [`${value} Einreichungen`, props.payload.cik]}
                />
                <Bar
                  dataKey="count"
                  barSize={25}
                  fillOpacity={1}
                  shape={({ x = 0, y = 0, width = 0, height = 0, payload }: any) => (
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      fill={payload?.color}
                      rx={3}
                      ry={3}
                    />
                  )}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
