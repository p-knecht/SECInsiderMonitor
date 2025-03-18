'use server';

import * as z from 'zod';
import { dbconnector } from '@/lib/dbconnector';
import { auth } from '@/auth';
import { NotificationSubscriptionSchema } from '@/schemas';

/**
 * Creates a notification subscription based on the input data.
 *
 * @param {z.infer<typeof NotificationSubscriptionSchema>} data - input data to create a notification subscription containing description
 * @returns {Promise<{ success: string } | { error: string }>} - a promise that resolves with a success message or an error message
 */
export async function createNotificationSubscription(
  data: z.infer<typeof NotificationSubscriptionSchema>,
) {
  // revalidate received (unsafe) values from client
  const validatedData = NotificationSubscriptionSchema.safeParse(data);
  if (!validatedData.success) return { error: 'Ungültige Daten' };

  // get user session
  const session = await auth();
  if (!session?.user.id) return { error: 'Ungültige Sitzung' };

  // check if user has reached the maximum number of subscriptions
  const MAX_SUBSCRIPTIONS = 10;
  const subscriptionCount = await dbconnector.notificationSubscription.count({
    where: { subscriber: session.user.id },
  });
  if (subscriptionCount >= MAX_SUBSCRIPTIONS) {
    // return error if user has reached the maximum number of subscriptions
    return { error: `Maximale Anzahl an Abonnements (${MAX_SUBSCRIPTIONS}) erreicht` };
  }

  // add subscription to database
  await dbconnector.notificationSubscription.create({
    data: {
      subscriber: session.user.id,
      ...validatedData.data,
    },
  });

  return { success: 'Benachrichtigungen wurde abonniert' };
}
