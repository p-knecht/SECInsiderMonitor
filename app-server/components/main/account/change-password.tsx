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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PasswordInput } from '@/components/ui/password-input';
import { Button } from '@/components/ui/button';

import { ChangePasswordSchema } from '@/schemas';
import { FormError } from '@/components/form-error';
import { FormSuccess } from '@/components/form-success';
import { changePassword } from '@/actions/main/account/change-password';

export const ChangePasswordForm = () => {
  const [errorMessage, setErrorMessage] = useState<string | undefined>('');
  const [successMessage, setSuccessMessage] = useState<string | undefined>('');
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof ChangePasswordSchema>>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const password = form.watch('newPassword');

  const onSubmit = (data: z.infer<typeof ChangePasswordSchema>) => {
    // reset form state
    setErrorMessage('');
    setSuccessMessage('');

    startTransition(() => {
      // send password change request
      changePassword(data).then((data) => {
        // handle response and update fields
        setErrorMessage(data.error);
        setSuccessMessage(data.success);
      });
    });
  };

  return (
    <Card className="flex-1 max-w-lg">
      <CardHeader>
        <CardTitle>Passwort ändern</CardTitle>
        <CardDescription>Ändere das Passwort deines SIM-Kontos</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              {' '}
              <FormField
                control={form.control}
                name="oldPassword"
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
              <FormField
                control={form.control}
                name="newPassword"
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
              Passwort ändern
            </Button>
            <FormError message={errorMessage} />
            <FormSuccess message={successMessage} />
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
