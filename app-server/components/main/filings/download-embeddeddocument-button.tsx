'use client';

import { useState } from 'react';
import { getEmbeddedDocumentContent } from '@/actions/main/filings/get-embeddeddocument-content';
import { Button } from '@/components/ui/button';

export default function DownloadFileButton({
  filingId,
  sequence,
}: {
  filingId: string;
  sequence: number;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    setError(false);

    const timeout = setTimeout(() => {
      setLoading(false);
      setError(true);
    }, 5000);

    try {
      const result = await getEmbeddedDocumentContent({ filingId, sequence });
      clearTimeout(timeout);
      setLoading(false);

      if (!result || result.error) {
        setError(true);
        setTimeout(() => {
          setError(false);
        }, 2000);
        return;
      }

      const blob = new Blob([result.content ?? ''], { type: result.mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.fileName ?? 'Datei';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      clearTimeout(timeout);
      setLoading(false);
      setError(true);
      setTimeout(() => {
        setError(false);
      }, 2000);
    }
  };

  return (
    <div className="flex flex-col items-start ">
      <Button
        onClick={handleDownload}
        variant={error ? 'destructive' : 'outline'}
        disabled={loading || error}
        className="w-full"
      >
        {error ? 'Fehler' : loading ? 'Lädt...' : 'Download'}
      </Button>
    </div>
  );
}
