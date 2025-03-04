'use client';

import { useState, useTransition } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { loadLogfile } from '@/actions/main/admin/datafetcher/load-logfile';
import { Logfile } from '@/app/(internal)/admin/datafetcher/page';
import { AlertTriangleIcon, CircleCheckIcon, FileQuestionIcon, XCircleIcon } from 'lucide-react';

export default function LogfileList({ logfiles }: { logfiles: Logfile[] }) {
  const [logContents, setLogContents] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [isPending, startTransition] = useTransition();

  // lazy load logfiles --> only load when user clicks on the file
  function handleLoadLog(logfile: string) {
    if (logContents[logfile] || loading[logfile]) return; // file already loaded or loading
    setLoading((prev) => ({ ...prev, [logfile]: true }));

    startTransition(async () => {
      const content = await loadLogfile(logfile);
      setLogContents((prev) => ({ ...prev, [logfile]: content }));
      setLoading((prev) => ({ ...prev, [logfile]: false }));
    });
  }

  return (
    <Accordion type="single" className="w-full">
      {logfiles.map((logfile) => (
        <AccordionItem key={logfile.filename} value={logfile.filename}>
          <AccordionTrigger onClick={() => handleLoadLog(logfile.filename)}>
            <div className="flex items-center gap-2">
              {logfile.state === 'error' ? (
                <XCircleIcon className="text-red-600 h-5 w-5" />
              ) : logfile.state === 'warn' ? (
                <AlertTriangleIcon className="text-yellow-500 h-5 w-5" />
              ) : logfile.state === 'ok' ? (
                <CircleCheckIcon className="text-green-600 h-5 w-5" />
              ) : (
                <FileQuestionIcon className="text-gray-500 h-5 w-5" />
              )}
              {logfile.filename}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent>
                {loading[logfile.filename] || isPending ? (
                  <p className="text-gray-500">Lade Logfile...</p>
                ) : (
                  <pre className="whitespace-pre-wrap text-sm bg-gray-100 p-2 rounded-md overflow-auto max-h-96">
                    {logContents[logfile.filename]?.split('\n').map((line, index) => {
                      let color = 'text-gray-900';
                      if (line.includes('[INFO]')) color = 'text-green-600 ';
                      if (line.includes('[WARN]')) color = 'text-yellow-600';
                      if (line.includes('[ERROR]')) color = 'text-red-600';
                      if (line.includes('[FATAL]')) color = 'text-red-600';
                      return (
                        <p key={index} className={color}>
                          {line}
                        </p>
                      );
                    }) || 'Kein Inhalt verfügbar.'}
                  </pre>
                )}
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
