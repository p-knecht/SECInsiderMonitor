'use client';

import { FormError } from '@/components/form-error';

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
