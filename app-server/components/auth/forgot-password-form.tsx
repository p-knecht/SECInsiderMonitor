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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import { ForgotPasswordSchema } from '@/schemas';
import { FormError } from '@/components/form-error';
import { FormSuccess } from '@/components/form-success';
import { requestPasswortResetMail } from '@/actions/auth/forgot-password';

/**
 * Renders a forgot password form to request a password reset token via email.
 *
 * @returns {JSX.Element} - The rendered forgot password form component
 */
export const ForgotPasswordForm = () => {
  const [errorMessage, setErrorMessage] = useState<string | undefined>('');
  const [successMessage, setSuccessMessage] = useState<string | undefined>('');
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof ForgotPasswordSchema>>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: { email: '' },
  });

  /**
   * Sends a request to the server to send a password reset mail to the given email address.
   *
   * @param {z.infer<typeof ForgotPasswordSchema>} data - The data to be submitted to the server
   * @returns {void}
   */
  const onSubmit = (data: z.infer<typeof ForgotPasswordSchema>) => {
    // reset form state
    setErrorMessage('');
    setSuccessMessage('');

    // start transition to prevent multiple form submissions or changing the inputs while waiting for response
    startTransition(() => {
      // send passwort reset mail request
      requestPasswortResetMail(data).then((data) => {
        // handle response and update fields
        setErrorMessage(data?.error);
        setSuccessMessage(data?.success);
      });
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>E-Mail Adresse</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    disabled={isPending || !!successMessage}
                    placeholder="user@example.com"
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" disabled={isPending || !!successMessage} className="w-full">
          Passwort-Reset-Link anfordern
        </Button>
        <FormError message={errorMessage} />
        <FormSuccess message={successMessage} />
      </form>
    </Form>
  );
};
