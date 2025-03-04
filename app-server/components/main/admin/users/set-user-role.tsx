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
import { Button } from '@/components/ui/button';

import { SetUserRoleSchema } from '@/schemas';
import { FormError } from '@/components/form-error';
import { FormSuccess } from '@/components/form-success';
import { setUserRole } from '@/actions/main/admin/users/set-user-role';
import { UserRole } from '@prisma/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRouter } from 'next/navigation';

export const SetUserRoleForm = ({ userId }: { userId: string }) => {
  const [errorMessage, setErrorMessage] = useState<string | undefined>('');
  const [successMessage, setSuccessMessage] = useState<string | undefined>('');
  const [isPending, startTransition] = useTransition();

  const router = useRouter();

  const form = useForm<z.infer<typeof SetUserRoleSchema>>({
    resolver: zodResolver(SetUserRoleSchema),
    defaultValues: {
      userId: userId,
      role: undefined,
    },
  });

  const onSubmit = (data: z.infer<typeof SetUserRoleSchema>) => {
    // reset form state
    setErrorMessage('');
    setSuccessMessage('');

    startTransition(() => {
      // send role change request
      setUserRole(data).then((data) => {
        // handle response and update fields
        setErrorMessage(data.error);
        setSuccessMessage(data.success);
        if (data.success) {
          router.refresh();
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
            name="role"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center">
                  <FormLabel>Benutzerrolle</FormLabel>
                </div>
                <FormControl>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Neue Rolle auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(UserRole).map((userRole) => (
                        <SelectItem key={userRole} value={userRole}>
                          {userRole.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" disabled={isPending} className="w-full">
          Rolle ändern
        </Button>
        <FormError message={errorMessage} />
        <FormSuccess message={successMessage} />
      </form>
    </Form>
  );
};
