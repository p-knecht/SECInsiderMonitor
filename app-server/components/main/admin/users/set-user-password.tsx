'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import PasswordStrengthBar from 'react-password-strength-bar';
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
import { PasswordInput } from '@/components/ui/password-input';
import { Button } from '@/components/ui/button';
import { SetUserPasswordSchema } from '@/schemas';
import { FormError } from '@/components/form-error';
import { FormSuccess } from '@/components/form-success';
import { setUserPassword } from '@/actions/main/admin/users/set-user-password';
import { useRouter } from 'next/navigation';

/**
 * Renders a form to allow admin users to set a user's password.
 *
 * @param {string} userId - The user ID of the user to set the password for
 * @returns {JSX.Element} - The rendered SetUserPasswordForm component
 */
export const SetUserPasswordForm = ({ userId }: { userId: string }) => {
  const [errorMessage, setErrorMessage] = useState<string | undefined>('');
  const [successMessage, setSuccessMessage] = useState<string | undefined>('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<z.infer<typeof SetUserPasswordSchema>>({
    resolver: zodResolver(SetUserPasswordSchema),
    defaultValues: {
      userId: userId,
      password: '',
      confirmPassword: '',
    },
  });

  const password = form.watch('password'); // watch the password field to display the password strength bar

  /**
   * Sends a request to the server to set the user's password to the given password.
   *
   * @param {z.infer<typeof SetUserPasswordSchema>} data - The data to be submitted to the server
   * @returns {void}
   */
  const onSubmit = (data: z.infer<typeof SetUserPasswordSchema>) => {
    // reset form state
    setErrorMessage('');
    setSuccessMessage('');

    // start transition to prevent multiple form submissions or changing the inputs while waiting for response
    startTransition(() => {
      // send set password request
      setUserPassword(data).then((data) => {
        // handle response and update fields
        setErrorMessage(data.error);
        setSuccessMessage(data.success);
        if (data.success) {
          router.refresh(); // refresh the page to show the updated user details ('Aktualisiert am' field)
        }
      });
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-2">
        <div className="space-y-2">
          <FormField
            control={form.control}
            name="password"
            render={({ field, fieldState }) => (
              <FormItem>
                <div className="flex items-center">
                  <FormLabel>Neues Passwort</FormLabel>
                </div>
                <FormControl>
                  <PasswordInput {...field} disabled={isPending} />
                </FormControl>
                <FormMessage className="text-xs" />
                <PasswordStrengthBar
                  password={password}
                  minLength={8}
                  scoreWords={['sehr schwach', 'schwach', 'in Ordnung', 'stark', 'sehr stark']}
                  shortScoreWord="zu kurz"
                />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center">
                  <FormLabel>Neues Passwort wiederholen</FormLabel>
                </div>
                <FormControl>
                  <PasswordInput {...field} disabled={isPending} />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" disabled={isPending} className="w-full">
          Passwort setzen
        </Button>
        <FormError message={errorMessage} />
        <FormSuccess message={successMessage} />
      </form>
    </Form>
  );
};
