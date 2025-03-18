import { CircleCheckIcon } from 'lucide-react';

/**
 * Props for the FormSuccess component containing the success message to display.
 */
interface FormSuccessProps {
  message?: string;
}

/**
 * Renders a success box component to display a success message.
 *
 * @param {FormSuccessProps} {message} - The props used by the FormSuccess component containing the success message
 * @returns {JSX.Element} - The rendered FormSuccess component showing the success message
 */
export const FormSuccess = ({ message }: FormSuccessProps) => {
  if (!message) return null;
  return (
    <div className="bg-emerald-500/15 p-3 rounded-md flex items-center gap-x-2 text-sm text-emerald-500">
      <CircleCheckIcon className="h-4 w-4" />
      <p>{message}</p>
    </div>
  );
};
