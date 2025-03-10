'use client';

import { OwnershipFiling } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormtypeBadge } from '@/components/data-table/formtype-badge';
import { CheckIcon, XIcon } from 'lucide-react';

export default function FilingContentGeneral({ filingData }: { filingData: OwnershipFiling }) {
  const items = [
    { label: 'Filing-ID:', value: filingData.filingId || 'N/A' },
    {
      label: 'Formtyp:',
      value: <FormtypeBadge formtype={filingData.formType} />,
    },
    {
      label: 'Einreichungsdatum:',
      value: filingData.dateFiled ? new Date(filingData.dateFiled).toLocaleDateString() : 'N/A',
    },
    {
      label: 'Bezugsdatum:',
      value: filingData.dateFiled ? new Date(filingData.dateAdded).toLocaleDateString() : 'N/A',
    },
    {
      label: 'Parsing erfolgreich:',
      value: filingData.formData ? (
        <span className="flex items-center gap-1">
          <CheckIcon className="w-5 h-5  text-green-600" /> Ja
        </span>
      ) : (
        <span className="flex items-center gap-1 ">
          <XIcon className="w-5 h-5 text-red-600" /> Nein
        </span>
      ),
    },
  ];

  return (
    <Card className="border shadow-sm h-full">
      <CardHeader className="px-5">
        <CardTitle className="font-semibold text-gray-800">Generelle Informationen</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {items.map(({ label, value }) => (
          <div key={label} className="flex items-center gap-2 text-sm">
            <span className="min-w-36 max-w-36 font-medium text-gray-400 break-words">{label}</span>
            <span className="text-gray-900 break-words">{value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
