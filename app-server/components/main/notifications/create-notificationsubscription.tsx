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
import { Button } from '@/components/ui/button';

import { NotificationSubscriptionSchema } from '@/schemas';
import { FormError } from '@/components/form-error';
import { FormSuccess } from '@/components/form-success';
import { createNotificationSubscription } from '@/actions/main/notifications/create-notification-subscription';
import { Input } from '@/components/ui/input';
import { CIKSelectorFormField } from '@/components/main/notifications/cikselector-formfield';
import { FormtypeBadge } from '@/components/data-table/formtype-badge';

const formTypes = ['3', '4', '5'] as const;

export const CreateNotificationSubscriptionForm = ({
  onSubscriptionCreated,
}: {
  onSubscriptionCreated: () => void;
}) => {
  const [errorMessage, setErrorMessage] = useState<string | undefined>('');
  const [successMessage, setSuccessMessage] = useState<string | undefined>('');
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof NotificationSubscriptionSchema>>({
    resolver: zodResolver(NotificationSubscriptionSchema),
    defaultValues: {
      description: '',
      issuerCiks: [],
      formTypes: [],
      reportingOwnerCiks: [],
    },
  });

  const onSubmit = (data: z.infer<typeof NotificationSubscriptionSchema>) => {
    // reset form state
    setErrorMessage('');
    setSuccessMessage('');

    startTransition(() => {
      // send notification creation request
      createNotificationSubscription(data).then((data) => {
        // handle response and update fields
        setErrorMessage(data.error);
        setSuccessMessage(data.success);
        // reset messages after 2.5 seconds
        setTimeout(() => {
          setErrorMessage('');
          setSuccessMessage('');
        }, 2500);
        if (data.success) {
          form.reset();
          onSubscriptionCreated();
        }
      });
    });
  };

  return (
    <Card className="xl:max-w-lg">
      <CardHeader>
        <CardTitle>Benachrichtigungen abonnieren</CardTitle>
        <CardDescription>
          <div className="pb-2">Hinweise zur Verwendung:</div>
          <ul className="list-disc pl-6 space-y-1 font-xs">
            <li>
              Die Werte innerhalb eines Feldes werden mit <strong>OR</strong> verknüpft.
            </li>
            <li>
              Verschiedene Felder werden mit <strong>AND</strong> verknüpft.
            </li>
            <li>
              Falls ein Feld leer bleibt, wird es nicht gefiltert (<strong>Wildcard</strong>).
            </li>
            <li>
              Issuer und Reporting Owner können entweder über den Suchdialog nach Namen gefunden
              werden (sofern die Entität bekannt ist) oder als CIK eingegeben werden.
            </li>
            <li>Mindestens ein Issuer oder Reporting Owner muss definiert werden werden.</li>
            <li>Pro Benutzer können maximal 10 Benachrichtigungsabonnements erstellt werden.</li>
            <li>
              Der Kommentar ist verpflichtend und dient der besseren Zuordnung sowie Dokumentation
              der abonnierten Benachrichtigungen.
            </li>
          </ul>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="issuerCiks"
              render={({ field }) => (
                <CIKSelectorFormField
                  field={{ ...field, value: field.value || [] }}
                  label="Gesuchte Issuer"
                />
              )}
            />
            <FormField
              control={form.control}
              name="formTypes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gesuchte Formtypen</FormLabel>
                  <div className="grid grid-cols-3 gap-2 justify-center text-center">
                    {formTypes.map((formType) => (
                      <FormControl key={formType} className="flex flex-col items-center">
                        <label className="flex flex-col items-center space-y-1">
                          <input
                            type="checkbox"
                            checked={field.value?.includes(formType)}
                            onChange={(e) => {
                              const newValue = e.target.checked
                                ? [...(field.value || []), formType]
                                : field.value?.filter((type) => type !== formType) || [];
                              field.onChange(newValue);
                            }}
                            disabled={isPending}
                            className="h-5 w-5"
                          />
                          <FormtypeBadge
                            key={formType}
                            formtype={formType}
                            tooltipLocation="bottom"
                          />
                        </label>
                      </FormControl>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reportingOwnerCiks"
              render={({ field }) => (
                <CIKSelectorFormField
                  field={{ ...field, value: field.value || [] }}
                  label="Gesuchte Reporting Owner"
                />
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kommentar</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isPending} className="input" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? 'Lädt...' : 'Benachrichtigungen abonnieren'}
            </Button>
            <FormError message={errorMessage} />
            <FormSuccess message={successMessage} />
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
