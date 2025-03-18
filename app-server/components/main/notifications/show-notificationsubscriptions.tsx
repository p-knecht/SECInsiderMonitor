'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FormError } from '@/components/form-error';
import { TrashIcon } from 'lucide-react';
import { deleteNotificationSubscription } from '@/actions/main/notifications/delete-notification-subscriptions';
import { NotificationSubscription } from '@prisma/client';
import { CikBadge } from '@/components/main/cik-badge';
import { FormtypeBadge } from '@/components/main/formtype-badge';

/**
 * Renders a card containing a table of the user's current notification subscriptions.
 *
 * @param {NotificationSubscription[], boolean, Function} {subscriptions, isLoading, refreshSubscriptions}  - The user's notification subscriptions, a boolean indicating if the subscriptions are currently being loaded, and a function to refresh the subscriptions after a change (e.g. deletion).
 * @returns {JSX.Element} - The component that displays the user's notification subscriptions.
 */
export const ShowNotificationSubscriptions = ({
  subscriptions,
  isLoading,
  refreshSubscriptions,
}: {
  subscriptions: NotificationSubscription[];
  isLoading: boolean;
  refreshSubscriptions: () => void;
}) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  /**
   * Handles the deletion of a notification subscription.
   *
   * @param {string} id - The ID of the subscription to delete.
   * @returns {Promise<void>} - A promise that resolves when the subscription has been deleted.
   */
  const handleDelete = async (id: string) => {
    startTransition(async () => {
      try {
        await deleteNotificationSubscription({ subscriptionId: id });
        refreshSubscriptions();
      } catch {
        setErrorMessage('Fehler beim Löschen der Benachrichtigung.');
        setTimeout(() => setErrorMessage(''), 2500);
      }
    });
  };

  return (
    <Card className="w-full xl:min-w-2xl">
      <CardHeader>
        <CardTitle>Meine abonnierten Benachrichtigungen</CardTitle>
      </CardHeader>
      <CardContent>
        {errorMessage && <FormError message={errorMessage} />}

        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : subscriptions.length === 0 ? (
          <p className="text-gray-500 text-sm pt-10 text-center">
            Keine abonnierten Benachrichtigungen gefunden.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">Issuer</TableHead>
                <TableHead className="text-center">Formtypen</TableHead>
                <TableHead className="text-center">Reporting Owner</TableHead>
                <TableHead className="text-center">Kommentar</TableHead>
                <TableHead className="text-center">Zuletzt ausgelöst</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((sub) => (
                <TableRow key={sub.id} className="text-center">
                  <TableCell>
                    <div className="flex flex-wrap gap-1 justify-center">
                      {sub.issuerCiks?.length ? (
                        sub.issuerCiks.map((cik) => (
                          <CikBadge key={cik} cik={cik} tooltipLocation="top" />
                        ))
                      ) : (
                        <span className="text-gray-500 italic">(beliebige)</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 justify-center">
                      {sub.formTypes?.length ? (
                        sub.formTypes.map((type) => <FormtypeBadge key={type} formtype={type} />)
                      ) : (
                        <span className="text-gray-500 italic">(beliebige)</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 justify-center">
                      {sub.reportingOwnerCiks?.length ? (
                        sub.reportingOwnerCiks.map((cik) => (
                          <CikBadge key={cik} cik={cik} tooltipLocation="top" />
                        ))
                      ) : (
                        <span className="text-gray-500 italic">(beliebige)</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="break-words whitespace-normal max-w-xs">
                    {sub.description}
                  </TableCell>
                  <TableCell>
                    {sub.lastTriggered ? (
                      new Date(sub.lastTriggered).toLocaleDateString()
                    ) : (
                      <span className="text-gray-500 italic">noch nie</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="destructive"
                      className="w-6 h-6"
                      disabled={isPending}
                      onClick={() => handleDelete(sub.id)}
                    >
                      <TrashIcon className="w-2 h-2" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
