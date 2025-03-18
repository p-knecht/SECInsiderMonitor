import { CircleAlertIcon } from 'lucide-react';

/**
 * Props for the FormError component containing the error message to display.
 */
interface FormErrorProps {
  message?: string;
}

/**
 * Renders an error box component to display an error message.
 *
 * @param {FormErrorProps} { message } - The props used by the FormError component containing the error message
 * @returns {JSX.Element} - The rendered FormError component showing the error message
 */
export const FormError = ({ message }: FormErrorProps) => {
  if (!message) return null;
  return (
    <div className="bg-destructive/15 p-3 rounded-md flex items-center gap-x-2 text-sm text-destructive">
      <CircleAlertIcon className="h-4 w-4 flex-shrink-0" />
      <p className="flex-1">{message}</p>
    </div>
  );
};
