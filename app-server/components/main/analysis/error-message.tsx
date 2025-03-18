'use client';

import { FormError } from '@/components/form-error';

/**
 * Renders an error message if one is provided. Uses the FormError component to display the error message, but with additional styling for analysis pages.
 *
 * @param {string} errorMessage - The error message to display
 * @returns {React.ReactNode} - The rendered error message component
 */
export function AnalysisErrorMessage({
  errorMessage,
}: {
  errorMessage: string | undefined;
}): React.ReactNode {
  if (!errorMessage) return null;
  else
    return (
      <div className="px-20 py-10 mx-auto">
        <FormError message={errorMessage} />
      </div>
    );
}
