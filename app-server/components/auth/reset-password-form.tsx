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

export const ResetPasswordForm = () => {
  const [errorMessage, setErrorMessage] = useState<string | undefined>('');
  const [successMessage, setSuccessMessage] = useState<string | undefined>('');

  const [isPending, startTransition] = useTransition();

  const passwordResetToken: string = useSearchParams().get('token') || '';

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

  const password = form.watch('password');

  const onSubmit = (data: z.infer<typeof ResetPasswordSchema>) => {
    // reset form state
    setErrorMessage('');
    setSuccessMessage('');

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
