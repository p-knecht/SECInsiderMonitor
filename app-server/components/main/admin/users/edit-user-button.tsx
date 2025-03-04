'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { PencilIcon, CheckIcon, ExternalLinkIcon, ClipboardIcon } from 'lucide-react';
import Link from 'next/link';
import EditUserContent from './edit-user-content';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SessionProvider, useSession } from 'next-auth/react';
import { FormError } from '@/components/form-error';

export default function EditUserButton({
  userId,
  userEmail,
}: {
  userId: string;
  userEmail: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const directLink = `users/${userId}`;

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
          <PencilIcon className="h-4 w-4 text-gray-600" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <div className="flex flex-col gap-4 p-2">
          <SheetHeader>
            <div className="flex-1 min-w-0">
              <div>
                <SheetTitle>
                  <span className="pt-1 pr-3">Benutzer bearbeiten</span>{' '}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild className="">
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
                <p className="text-sm truncate text-gray-500">{userEmail}</p>
              </div>
            </div>
          </SheetHeader>
          {userId === useSession().data?.user.id ? (
            <FormError message="Der eigene Benutzer muss über den Menüpunkt 'Konto verwalten' bearbeitet werden." />
          ) : (
            <EditUserContent userId={userId} displayType="single" onClose={() => setOpen(false)} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
