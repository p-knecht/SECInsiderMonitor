import { TaggedStockData } from '@/actions/main/analysis/analyse-company';
import { FormError } from '@/components/form-error';
import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
  DotProps,
  CartesianGrid,
} from 'recharts';

/**
 * Definitions for the different types of insider transaction types that can be displayed on the stock chart.
 */
const transactionTypeDefinitions = {
  A: {
    text: 'Erworben (Acquired)',
    color: '#22c55e',
    inactiveColor: '#bbf7d0',
  },
  D: {
    text: 'Veräussert (Disposed)',
    color: '#ef4444',
    inactiveColor: '#fecaca',
  },
  B: {
    text: 'Erworben (Acquired) und Veräussert (Disposed)',
    color: '#f9b938',
    inactiveColor: '#fde68a',
  },
  O: {
    text: 'Andere Transaktionsart',
    color: '#bbbbbb',
    inactiveColor: '#e5e7eb',
  },
};

/**
 * The properties for the StockChart component containing an array of stock data and a callback function to handle date clicks, as well as the currently active date.
 */
interface StockChartProps {
  data: TaggedStockData[];
  onDateClick: (date: Date | null) => void;
  activeDate: Date | null;
}

/**
 * Renders a stock chart tooltip component with information about the stock data at the hovered date.
 *
 * @param {TooltipProps<number, string>} { active, payload } - The properties for the ChartTooltip component containing the active state and the payload (taken from rechart library)
 * @returns {JSX.Element | null} - The rendered ChartTooltip component
 */
const ChartTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload as TaggedStockData;
    return (
      <div className="bg-white p-3 rounded-lg shadow-md border text-sm min-w-[150px]">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-gray-500 w-28 ">Datum:</span>
          <span className="font-semibold text-gray-800 w-48">{data.date.toLocaleDateString()}</span>
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-gray-500 w-28">Schlusspreis:</span>
          <span className="font-semibold text-gray-800 w-48">
            {data.closePrice !== undefined && data.closePrice != 0
              ? `USD ${data.closePrice.toFixed(2)}`
              : 'N/A'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-gray-500 w-28">Insider-Transaktionsarten an diesem Tag:</span>
          <span className="font-semibold text-gray-800  w-48 flex items-center gap-1">
            {data.transactionType == undefined ? (
              'Keine'
            ) : (
              <>
                <span
                  className="text-2xl"
                  style={{ color: transactionTypeDefinitions[data.transactionType].color }}
                >
                  ⬤
                </span>
                {transactionTypeDefinitions[data.transactionType].text}
              </>
            )}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

/**
 * Renders a custom chart dot component for the stock chart with information about the stock data at the hovered date.
 *
 * @params {number} cx - The x coordinate of the dot
 * @params {number} cy - The y coordinate of the dot
 * @params {TaggedStockData} payload - The payload containing the stock data
 * @params {() => void} onClick - The callback function to handle the click event
 * @params {Date | null} activeDate - The currently active date
 * @returns {JSX.Element | null} - The rendered custom ChartDot component
 */
const ChartDot = ({
  cx,
  cy,
  payload,
  onClick,
  activeDate,
}: DotProps & { payload?: TaggedStockData; onClick: () => void; activeDate: Date | null }) => {
  if (!cx || !cy || !payload || payload.transactionType == undefined) return null; // show no dot if no data is available

  const isActive = payload.date.getTime() === activeDate?.getTime(); // check if this dot is the active date dot

  // set color based on transaction type and active state
  const color = isActive
    ? transactionTypeDefinitions[payload.transactionType].color
    : transactionTypeDefinitions[payload.transactionType].inactiveColor;

  return (
    <circle
      cx={cx}
      cy={cy}
      r={isActive ? 6 : 5}
      stroke={color}
      fill={color}
      className="cursor-pointer transition-all duration-200"
      onClick={onClick}
    />
  );
};

/**
 * Renders a stock chart component with a line chart showing the stock data and insider transaction types (using a custom dot component).
 * @param {StockChartProps} { data, onDateClick, activeDate } - The properties for the StockChart component containing an array of stock data and a callback function to handle date clicks, as well as the currently active date.
 * @returns {React.ReactNode} - The rendered StockChart component
 */
export function StockChart({ data, onDateClick, activeDate }: StockChartProps): React.ReactNode {
  // check if stock data was fetched (non zero values in array)
  const missingStockData = data.length === 0 || data.every((d) => d.closePrice === 0);

  return (
    <div className="relative">
      {missingStockData && (
        <div className="absolute top-5 right-5 px-3 py-1 w-1/3">
          <FormError
            message="
              Für das ausgewählte Unternehmen wurden im angegebenen Zeitraum keine Kursdaten bei Yahoo Finance gefunden. Dies könnte daran liegen, dass der SEC-Ticker oder Unternehmensname nicht eindeutig zugeordnet werden konnte oder für den gewählten Zeitraum keine Kursdaten vorliegen."
          />
        </div>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} onClick={() => onDateClick(null)}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tickFormatter={(date) => (date ? date.toLocaleDateString() : '')}
            minTickGap={7}
          />
          {!missingStockData && <YAxis domain={['auto', 'auto']} />}
          <Tooltip content={<ChartTooltip />} />
          <Line
            type="monotone"
            dataKey="closePrice"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={(props) => {
              const { key, ...rest } = props;
              return (
                <ChartDot
                  key={key}
                  {...rest}
                  onClick={(e: React.MouseEvent<SVGCircleElement, MouseEvent>) => {
                    e.stopPropagation();
                    onDateClick(props.payload?.date);
                  }}
                  activeDate={activeDate}
                />
              );
            }}
            activeDot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default StockChart;
