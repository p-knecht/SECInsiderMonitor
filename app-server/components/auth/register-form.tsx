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

import { RegisterFormSchema } from '@/schemas';
import { FormError } from '@/components/form-error';
import { FormSuccess } from '@/components/form-success';
import { register } from '@/actions/auth/register';
import PasswordStrengthBar from 'react-password-strength-bar';

/**
 * Renders a register form to allow users to create a new account.
 *
 * @returns {JSX.Element} - The rendered register form component
 */
export const RegisterForm = () => {
  const [errorMessage, setErrorMessage] = useState<string | undefined>('');
  const [successMessage, setSuccessMessage] = useState<string | undefined>('');
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof RegisterFormSchema>>({
    resolver: zodResolver(RegisterFormSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });
  const password = form.watch('password'); // watch the password field to display the password strength bar

  /**
   * Sends a request to the server to register a new user with the given email and password.
   *
   * @param {z.infer<typeof RegisterFormSchema>} data - The data to be submitted to the server
   * @returns {void}
   */
  const onSubmit = (data: z.infer<typeof RegisterFormSchema>) => {
    // reset form state
    setErrorMessage('');
    setSuccessMessage('');

    // start transition to prevent multiple form submissions or changing the inputs while waiting for response
    startTransition(() => {
      // send register request
      register(data).then((data) => {
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
          Registrieren
        </Button>
        <FormError message={errorMessage} />
        <FormSuccess message={successMessage} />
      </form>
    </Form>
  );
};
