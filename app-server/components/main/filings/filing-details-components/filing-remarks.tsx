'use client';

import { OwnershipFiling } from '@prisma/client';

/**
 * Renders a component that displays the remarks of the filing.
 *
 * @param {OwnershipFiling} filingData - The filing data to display the remarks for.
 * @returns {JSX.Element} - The component that displays the remarks of the filing.
 */
export default function FilingRemarks({ filingData }: { filingData: OwnershipFiling }) {
  if (!filingData.formData?.remarks) {
    return (
      <div className="flex items-center justify-center">
        <p className="text-gray-500 text-center">Keine Anmerkungen vorhanden.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-4 rounded-md border">
      <p className="text-gray-700 leading-relaxed">{filingData.formData.remarks}</p>
    </div>
  );
}
