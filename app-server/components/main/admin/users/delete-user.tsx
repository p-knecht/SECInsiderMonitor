'use client';

import { useState, useTransition } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { FormError } from '@/components/form-error';
import { FormSuccess } from '@/components/form-success';
import { useRouter } from 'next/navigation';
import { deleteUser } from '@/actions/main/admin/users/delete-user';

/**
 * Renders a form to allow admin users to delete a user account.
 *
 * @param {string} userId - The user ID of the user to delete with this component
 * @param {() => void} onClose - The optional callback function to use to close the dialog
 * @returns {JSX.Element} - The rendered DeleteUserForm component
 */
export const DeleteUserForm = ({ userId, onClose }: { userId: string; onClose?: () => void }) => {
  const [errorMessage, setErrorMessage] = useState<string | undefined>('');
  const [successMessage, setSuccessMessage] = useState<string | undefined>('');
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  /**
   * Sends a request to the server to delete the user account with the given user ID.
   *
   * @returns {void}
   */
  const submitDeletion = () => {
    setOpen(false);
    // reset form state
    setErrorMessage('');
    setSuccessMessage('');

    // start transition to prevent multiple form submissions
    startTransition(() => {
      // send account deletion request
      deleteUser({ userId: userId }).then((data) => {
        // handle response and update fields
        setErrorMessage(data.error);
        setSuccessMessage(data.success);
        if (data.success) {
          // if successful, show the success message for 2 seconds, then refresh page contents and close the dialog
          setTimeout(() => {
            setOpen(false);
            if (onClose) {
              // if onClose is set assume that the dialog is part of a modal and should be closed + refresh the page
              router.refresh();
              onClose();
            } else {
              // otherwise redirect back to the user list
              router.push('/admin/users');
            }
          }, 2000);
        }
      });
    });
  };

  return (
    <div className="space-y-4 p-2">
      <div className="space-y-2">
        <div className="bg-destructive/15 p-3 rounded-md  gap-x-2 text-sm text-destructive">
          <p className="font-bold">Achtung:</p>
          <p>Das Benutzer-Konto wird dadurch unwiderruflich gelöscht!</p>
        </div>
      </div>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" disabled={isPending} className="w-full">
            Benutzerkonto löschen
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bist du dir absolut sicher?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Das Konto wird dauerhaft gelöscht
              und alle Daten entfernt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={submitDeletion}
              className={buttonVariants({ variant: 'destructive' })}
            >
              Ja, Konto löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <FormError message={errorMessage} />
      <FormSuccess message={successMessage} />
    </div>
  );
};
