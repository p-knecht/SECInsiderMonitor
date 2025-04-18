'use client';

import { useState } from 'react';
import { getEmbeddedDocumentContent } from '@/actions/main/filings/get-embeddeddocument-content';
import { Button } from '@/components/ui/button';
import { decode } from 'uuencode';

/**
 * Renders a download button component for a specific embedded document allowing the user to download the file.
 *
 * @param {string} filingId - The filing ID of the document
 * @param {number} sequence - The sequence number of the embedded document in the filing
 * @returns {JSX.Element} - The rendered DownloadFileButton component
 */
export default function DownloadFileButton({
  filingId,
  sequence,
}: {
  filingId: string;
  sequence: number;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  /**
   * Handles the download of the embedded document content -> fetches the content from backend convert it (if needed) and triggers the download.
   * If the download fails, this is indicated to the user by setting the error state (and removing it after 2 seconds).
   *
   * @returns {Promise<void>} - The promise of the download action
   */
  const handleDownload = async () => {
    setLoading(true);
    setError(false);

    // Set a timeout to indicate a error state if the download takes longer than 5 seconds
    const timeout = setTimeout(() => {
      setLoading(false);
      setError(true);
      setTimeout(() => {
        setError(false);
      }, 2000);
    }, 5000);

    try {
      // Fetch the embedded document content from the backend
      const result = await getEmbeddedDocumentContent({ filingId, sequence });
      clearTimeout(timeout); // Clear the timeout if the download was successful
      setLoading(false);

      // If the result is not successful, set the error state and remove it after 2 seconds
      if (!result || result.error) {
        setError(true);
        setTimeout(() => {
          setError(false);
        }, 2000);
        return;
      }

      // Check if content needs to be decoded (some content ist uuencoded as stated in SEC EDGAR documentation)
      if (
        result.content &&
        [
          'image/png',
          'image/jpeg',
          'image/gif',
          'application/pdf',
          'application/zip',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'application/vnd.ms-powerpoint',
        ].includes(result.mimeType || '')
      ) {
        // get uuencoded lines between begin and end markers
        const match = result.content.match(/begin [^\n]+\n([\s\S]*?)\nend/);

        // only decode if match was found otherwise return the content as is
        if (match && match.length > 1) {
          // some files have trimmed lines which need to be padded for decoding to work properly
          const uuencodedContent = match[1]
            .split('\n')
            .map((l) => {
              // get the length marker and calculate the padded length according to the uuencode algorithm
              const lengthMarker = l.charCodeAt(0); // first char is the length marker
              const paddedLength = Math.ceil(((lengthMarker - 32) * 4) / 3); // padded bytes must be a multiple of 3
              return l.padEnd(1 + paddedLength);
            })
            .join('\n');
          result.content = decode(uuencodedContent || '');
        }
      }

      // Create a blob from the content and trigger the download to the user
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
      // If an error occurs, set the error state and remove it after 2 seconds
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
