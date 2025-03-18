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
import { ResetPasswordSchema } from '@/schemas';
import { useSearchParams } from 'next/navigation';
import { FormError } from '@/components/form-error';
import { FormSuccess } from '@/components/form-success';
import { resetPassword } from '@/actions/auth/reset-password';

/**
 * Renders a reset password form to allow users to reset their password using a password reset token.
 *
 * @returns {JSX.Element} - The rendered reset password form component
 */
export const ResetPasswordForm = () => {
  const [errorMessage, setErrorMessage] = useState<string | undefined>('');
  const [successMessage, setSuccessMessage] = useState<string | undefined>('');
  const [isPending, startTransition] = useTransition();

  const passwordResetToken: string = useSearchParams().get('token') || ''; // get password reset token from URL query parameter

  // skip rendering if token has invalid format (not an UUID)
  if (!z.string().uuid().safeParse(passwordResetToken).success)
    return <FormError message="Passwort-Reset-Token ist ungültig" />;

  const form = useForm<z.infer<typeof ResetPasswordSchema>>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      token: passwordResetToken,
      password: '',
      confirmPassword: '',
    },
  });

  const password = form.watch('password'); // watch the password field to display the password strength bar

  /**
   * Sends a request to the server to reset the user's password with the given password reset token and new password.
   *
   * @param {z.infer<typeof ResetPasswordSchema>} data - The data to be submitted to the server
   * @returns {void}
   */
  const onSubmit = (data: z.infer<typeof ResetPasswordSchema>) => {
    // reset form state
    setErrorMessage('');
    setSuccessMessage('');

    // start transition to prevent multiple form submissions or changing the inputs while waiting for response
    startTransition(() => {
      // send password reset request
      resetPassword(data).then((data) => {
        // handle response and update fields
        setErrorMessage(data.error);
        setSuccessMessage(data.success);
      });
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field, fieldState }) => (
              <FormItem>
                <div className="flex items-center">
                  <FormLabel>Passwort</FormLabel>
                </div>
                <FormControl>
                  <PasswordInput {...field} disabled={isPending || !!successMessage} />
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
                  <FormLabel>Passwort wiederholen</FormLabel>
                </div>
                <FormControl>
                  <PasswordInput {...field} disabled={isPending || !!successMessage} />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" disabled={isPending || !!successMessage} className="w-full">
          Neues Passwort speichern
        </Button>
        <FormError message={errorMessage} />
        <FormSuccess message={successMessage} />
      </form>
    </Form>
  );
};
