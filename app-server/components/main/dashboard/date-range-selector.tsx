'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/**
 * Renders a select component for choosing the number of relevant days (7,30,90,180,365) for the dashboard statistic cards
 *
 * @param {number} value - The currently selected number of days.
 * @param {function} onChange - The function to call when the selected number of days changes.
 * @returns {JSX.Element} - The rendered DateRangeSelector component.
 */
export function DateRangeSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (days: number) => void;
}) {
  return (
    <Select value={value.toString()} onValueChange={(val) => onChange(parseInt(val, 10))}>
      <SelectTrigger className="w-[150px]">
        <SelectValue placeholder="Zeitraum wählen" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="7">Letzte 7 Tage</SelectItem>
        <SelectItem value="30">Letzte 30 Tage</SelectItem>
        <SelectItem value="90">Letzte 90 Tage</SelectItem>
        <SelectItem value="180">Letzte 180 Tage</SelectItem>
        <SelectItem value="365">Letzte 365 Tage</SelectItem>
      </SelectContent>
    </Select>
  );
}
