'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { PencilIcon, CheckIcon, ExternalLinkIcon, ClipboardIcon } from 'lucide-react';
import Link from 'next/link';
import EditUserContent from './edit-user-content';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSession } from 'next-auth/react';
import { FormError } from '@/components/form-error';

/**
 * Renders a button to open a sheet (modal) containing a form to edit a user's details.
 *
 * @param {string} userId - The user ID of the user to edit
 * @param {string} userEmail - The email address of the user to edit
 * @returns {JSX.Element} - The rendered EditUserButton component
 */
export default function EditUserButton({
  userId,
  userEmail,
}: {
  userId: string;
  userEmail: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // direct link to the user's edit page
  const directLink = `users/${userId}`;

  /**
   * Copies the direct link to the clipboard and sets the copied state to true for 2 seconds.
   *
   * @returns {Promise<void>} - A promise that resolves after the link has been copied
   */
  const handleCopy = async () => {
    try {
      // copy the direct link to the clipboard
      await navigator.clipboard.writeText(`https://${process.env.SERVER_FQDN}/admin/${directLink}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // reset copied state after 2 seconds
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
