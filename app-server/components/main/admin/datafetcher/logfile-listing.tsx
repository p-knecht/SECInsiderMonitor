'use client';

import { useEffect, useState, useTransition } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { loadLogfile } from '@/actions/main/admin/datafetcher/load-logfile';
import { Logfile } from '@/app/(main)/admin/datafetcher/page';
import {
  AlertTriangleIcon,
  CalendarClockIcon,
  CircleCheckIcon,
  FileQuestionIcon,
  XCircleIcon,
} from 'lucide-react';
import { getServerTimezone } from '@/actions/main/get-server-tz';

/**
 * Renders a component which shows a list of available logfiles and their states (error, warn, ok) in an accordion menu. When a logfile is clicked, the content of the logfile is (lazy) loaded and displayed.
 * @param {Logfile[]} { logfiles } - contains an array of logfiles available to display
 * @returns {JSX.Element} - The rendered LogfileList component
 */
export default function LogfileList({ logfiles }: { logfiles: Logfile[] }) {
  const [logContents, setLogContents] = useState<{ [key: string]: string }>({}); // store log file content as soon as it is loaded
  const [serverTimezone, setServerTimezone] = useState<string | null>(null); // store server timezone
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({}); // store loading state of log files
  const [isPending, startTransition] = useTransition();

  // get server timezone and add it to the state
  useEffect(() => {
    getServerTimezone().then((tz) => {
      setServerTimezone(tz);
    });
  }, []);

  /**
   * Checks if the logfile is already loaded or currently loading. If not, the logfile content is loaded from the server and stored in the state. (lazy load logfiles --> only load log file content when user clicks on the file)
   *
   * @param {string} logfile - The logfile to be loaded
   * @returns {void}
   */
  function handleLoadLog(logfile: string) {
    if (logContents[logfile] || loading[logfile]) return; // file already loaded or loading
    setLoading((prev) => ({ ...prev, [logfile]: true }));

    startTransition(async () => {
      const content = await loadLogfile(logfile); // load log file content from server
      setLogContents((prev) => ({ ...prev, [logfile]: content }));
      setLoading((prev) => ({ ...prev, [logfile]: false }));
    });
  }

  return (
    <>
      <div className="flex justify-end items-center text-sm text-muted-foreground mb-2">
        <span className="flex items-center gap-1">
          <CalendarClockIcon className="h-4 w-4" />
          Die Zeitangaben in den Log-Dateien entsprechen der Server-Zeitzone{' '}
          {serverTimezone ? `(${serverTimezone})` : ''}
        </span>
      </div>
      <Accordion type="multiple" className="w-full">
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
    </>
  );
}
