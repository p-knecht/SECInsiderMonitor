'use server';

import * as z from 'zod';
import { dbconnector } from '@/lib/dbconnector';
import { auth } from '@/auth';
import { DeleteNotificationSubscriptionSchema } from '@/schemas';

export async function deleteNotificationSubscription(
  data: z.infer<typeof DeleteNotificationSubscriptionSchema>,
) {
  // revalidate received (unsafe) values from client
  const validatedData = DeleteNotificationSubscriptionSchema.safeParse(data);
  if (!validatedData.success) return { error: 'Ungültige Daten' };

  // get user session
  const session = await auth();
  if (!session?.user.id) return { error: 'Ungültige Sitzung' };

  // prepare query
  const subscriptionQuery = {
    where: {
      subscriber: session.user.id,
      id: validatedData.data.subscriptionId,
    },
  };

  // check if subscription exists
  const subscription = dbconnector.notificationSubscription.findFirst(subscriptionQuery);
  if (!subscription)
    return { error: 'Benachrichtigungsabonnement konnte in der Datenbank nicht gefunden werden' };

  // delete subscription
  await dbconnector.notificationSubscription.delete(subscriptionQuery);
  return { success: 'Benachrichtigungsabonnement wurde gelöscht' };
}
