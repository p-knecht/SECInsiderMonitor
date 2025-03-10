'use client';

import { OwnershipFiling } from '@prisma/client';

export default function FilingFootnotes({ filingData }: { filingData: OwnershipFiling }) {
  if (!filingData.formData?.footnotes || filingData.formData.footnotes.footnote.length === 0) {
    return (
      <div className="flex items-center justify-center">
        <p className="text-gray-500 text-center">Keine Fussnoten vorhanden.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {filingData.formData.footnotes.footnote.map((footnote) => (
        <li key={footnote.id} className="p-4 border rounded-md bg-gray-50 shadow-sm">
          <span className="text-blue-600 font-bold">[{footnote.id}]</span>
          <span className="text-gray-700 ml-2">{footnote.text}</span>
        </li>
      ))}
    </ul>
  );
}
