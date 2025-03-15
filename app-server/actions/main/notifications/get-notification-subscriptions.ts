'use server';

import { dbconnector } from '@/lib/dbconnector';
import { auth } from '@/auth';
import { NotificationSubscription } from '@prisma/client';

export async function getNotificationSubscriptions(): Promise<NotificationSubscription[]> {
  // get user session
  const session = await auth();
  if (!session?.user.id) {
    return []; // return empty array, if user is not logged in
  }

  // get and return subscriptions of this user
  return await dbconnector.notificationSubscription.findMany({
    where: { subscriber: session.user.id },
    orderBy: { createdAt: 'asc' },
  });
}
