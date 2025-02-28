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

export const DeleteAccountForm = () => {
  const [errorMessage, setErrorMessage] = useState<string | undefined>('');
  const [successMessage, setSuccessMessage] = useState<string | undefined>('');
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof DeleteAccountSchema>>({
    resolver: zodResolver(DeleteAccountSchema),
    defaultValues: {
      password: '',
    },
  });

  const router = useRouter();

  const submitAccountDeletion = () => {
    setOpen(false);

    // validate form and submit if valid
    form.handleSubmit(onSubmit)();
  };
  const onSubmit = (data: z.infer<typeof DeleteAccountSchema>) => {
    // reset form state
    setErrorMessage('');
    setSuccessMessage('');

    startTransition(() => {
      // send password change request
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
