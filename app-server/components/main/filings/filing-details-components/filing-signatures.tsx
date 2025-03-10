'use client';

import { OwnershipFiling } from '@prisma/client';

export default function FilingSignatures({ filingData }: { filingData: OwnershipFiling }) {
  if (!filingData.formData?.ownerSignature || filingData.formData?.ownerSignature.length === 0) {
    return (
      <div className="flex items-center justify-center">
        <p className="text-gray-500 text-center">Keine Unterschriften vorhanden.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap justify-center gap-3">
      {filingData.formData.ownerSignature.map((signature, index) => (
        <div
          key={index}
          className="p-3 border rounded-md bg-gray-50 shadow-sm flex flex-col items-center "
        >
          <p className="text-sm text-gray-800 text-center">{signature.signatureName.trim()}</p>
          <p className="text-sm text-gray-500 italic text-center">
            {new Date(signature.signatureDate).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  );
}
