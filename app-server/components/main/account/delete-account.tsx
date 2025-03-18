'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PasswordInput } from '@/components/ui/password-input';
import { Button, buttonVariants } from '@/components/ui/button';
import { DeleteAccountSchema } from '@/schemas';
import { FormError } from '@/components/form-error';
import { FormSuccess } from '@/components/form-success';
import { deleteAccount } from '@/actions/main/account/delete-account';
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
import { useRouter } from 'next/navigation';

/**
 * Renders a card containing a form (inclusive alert dialog) to allow users to delete their own account (requires password confirmation).
 * @returns {JSX.Element} - The rendered DeleteAccountForm component
 */
export const DeleteAccountForm = () => {
  const [errorMessage, setErrorMessage] = useState<string | undefined>('');
  const [successMessage, setSuccessMessage] = useState<string | undefined>('');
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<z.infer<typeof DeleteAccountSchema>>({
    resolver: zodResolver(DeleteAccountSchema),
    defaultValues: {
      password: '',
    },
  });

  /**
   * Wrapper function to submit the account deletion form after the user confirmed the action in the alert dialog (and close the dialog).
   *
   * @returns {void}
   */
  const submitAccountDeletion = () => {
    setOpen(false); // close alert dialog after confirmation

    // validate form and submit if valid
    form.handleSubmit(onSubmit)();
  };

  /**
   * Sends a request to the server to delete the user's account with the given password.
   *
   * @param {z.infer<typeof DeleteAccountSchema>} data - The data to be submitted to the server
   * @returns {void}
   */
  const onSubmit = (data: z.infer<typeof DeleteAccountSchema>) => {
    // reset form state
    setErrorMessage('');
    setSuccessMessage('');

    // start transition to prevent multiple form submissions or changing the inputs while waiting for response
    startTransition(() => {
      // send account deletion request
      deleteAccount(data).then((data) => {
        // handle response and update fields
        setErrorMessage(data.error);
        setSuccessMessage(data.success);

        // logout if successful
        if (data.success) router.replace('/auth/logout');
      });
    });
  };

  return (
    <Card className="flex-1 max-w-lg">
      <CardHeader>
        <CardTitle>Konto löschen</CardTitle>
        <CardDescription>Lösche dein SIM-Konto</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-destructive/15 p-3 rounded-md  gap-x-2 text-sm text-destructive">
          <p className="font-bold">Achtung:</p>
          <p>Das SIM-Konto wird dadurch unwiderruflich gelöscht!</p>
        </div>
        <Form {...form}>
          <form
            onSubmit={(e) => {
              setOpen(true);
              e.preventDefault();
            }}
            className="space-y-6 mt-6"
          >
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <div className="flex items-center">
                      <FormLabel>Aktuelles Passwort</FormLabel>
                    </div>
                    <FormControl>
                      <PasswordInput {...field} disabled={isPending} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            <AlertDialog open={open} onOpenChange={setOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isPending} className="w-full">
                  Konto löschen
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Bist du dir absolut sicher?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Diese Aktion kann nicht rückgängig gemacht werden. Dein Konto wird dauerhaft
                    gelöscht und alle Daten entfernt.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={submitAccountDeletion}
                    className={buttonVariants({ variant: 'destructive' })}
                  >
                    Ja, Konto löschen
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <FormError message={errorMessage} />
            <FormSuccess message={successMessage} />
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
