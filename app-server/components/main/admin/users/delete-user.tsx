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

export const DeleteUserForm = ({ userId, onClose }: { userId: string; onClose?: () => void }) => {
  const [errorMessage, setErrorMessage] = useState<string | undefined>('');
  const [successMessage, setSuccessMessage] = useState<string | undefined>('');
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const router = useRouter();

  const submitDeletion = () => {
    setOpen(false);
    // reset form state
    setErrorMessage('');
    setSuccessMessage('');

    startTransition(() => {
      // send account deletion request
      deleteUser({ userId: userId }).then((data) => {
        // handle response and update fields
        setErrorMessage(data.error);
        setSuccessMessage(data.success);
        if (data.success) {
          setTimeout(() => {
            setOpen(false);
            if (onClose) {
              router.refresh();
              onClose();
            } else {
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
