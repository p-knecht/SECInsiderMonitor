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
import { PasswordInput } from '@/components/ui/password-input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

import { LoginFormSchema } from '@/schemas';
import { FormError } from '@/components/form-error';
import { FormSuccess } from '@/components/form-success';
import { login } from '@/actions/auth/login';

/**
 * Renders a login form to authenticate users with their email and password.
 *
 * @returns {JSX.Element} - The rendered login form component
 */
export const LoginForm = () => {
  const [errorMessage, setErrorMessage] = useState<string | undefined>('');
  const [successMessage, setSuccessMessage] = useState<string | undefined>('');
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof LoginFormSchema>>({
    resolver: zodResolver(LoginFormSchema),
    defaultValues: {
      email: '',
      password: '',
      requestTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });

  /**
   * Sends a request to the server to authenticate the user with the given email and password.
   *
   * @param {z.infer<typeof LoginFormSchema>} data - The data to be submitted to the server
   * @returns {void}
   */
  const onSubmit = (data: z.infer<typeof LoginFormSchema>) => {
    // reset form state
    setErrorMessage('');
    setSuccessMessage('');

    // start transition to prevent multiple form submissions or changing the inputs while waiting for response
    startTransition(() => {
      // send login request
      login(data).then((data) => {
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
          <FormField
            control={form.control}
            name="password"
            render={({ field, fieldState }) => (
              <FormItem>
                <div className="flex items-center">
                  <FormLabel>Passwort</FormLabel>
                  <Button
                    variant="link"
                    asChild
                    className="ml-auto text-xs hover:underline"
                    tabIndex={-1}
                  >
                    <Link href="/auth/forgot-password">Passwort vergessen?</Link>
                  </Button>
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
          Anmelden
        </Button>
        <FormError message={errorMessage} />
        <FormSuccess message={successMessage} />
      </form>
    </Form>
  );
};
