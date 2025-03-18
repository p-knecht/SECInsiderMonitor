'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { CheckIcon, ExternalLinkIcon, ClipboardIcon, ViewIcon } from 'lucide-react';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import ShowFilingContent from '@/components/main/filings/filing-content';

/**
 * Renders a button to open a sheet (modal) containing filing details
 *
 * @param {string} filingId - The id of the filing to show
 * @returns {JSX.Element} The ShowFilingButton component
 */
export default function ShowFilingButton({ filingId }: { filingId: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const directLink = `filings/${filingId}`;

  /**
   * Copies the direct link to the clipboard and sets the copied state to true for 2 seconds.
   *
   * @returns {Promise<void>} - The promise that resolves when the link is copied
   */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`https://${process.env.SERVER_FQDN}/admin/${directLink}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Fehler beim Kopieren', err);
    }
  };
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" className="cursor-pointer h-6 w-6 hover:bg-gray-200">
          <ViewIcon className="h-4 w-4 text-gray-600" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="!container overflow-y-auto">
        <div className="flex flex-col gap-4 p-2">
          <SheetHeader className="pb-0">
            <div className="flex-1 min-w-0">
              <div>
                <SheetTitle>
                  <span className="pt-1 pr-3">Einreichung anzeigen</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={directLink}>
                            <ExternalLinkIcon className="text-gray-600" />
                          </Link>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Direktlink öffnen</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={handleCopy} asChild>
                          <span>
                            {copied ? (
                              <CheckIcon className="text-gray-600" />
                            ) : (
                              <ClipboardIcon className="text-gray-600" />
                            )}
                          </span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{copied ? 'Kopiert!' : 'Direktlink kopieren'}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </SheetTitle>
              </div>
            </div>
          </SheetHeader>
          <ShowFilingContent filingId={filingId} type="sheet" />
        </div>
      </SheetContent>
    </Sheet>
  );
}
