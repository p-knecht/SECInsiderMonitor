'use client';

import { useEffect, useState, useTransition } from 'react';
import { CreateNotificationSubscriptionForm } from '@/components/main/notifications/create-notificationsubscription';
import { ShowNotificationSubscriptions } from '@/components/main/notifications/show-notificationsubscriptions';
import { getNotificationSubscriptions } from '@/actions/main/notifications/get-notification-subscriptions';
import { NotificationSubscription } from '@prisma/client';
import { AppMainContent } from '@/components/main/app-maincontent';

export default function NotificationsPage() {
  const [subscriptions, setSubscriptions] = useState<NotificationSubscription[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPending, startTransition] = useTransition();

  // Funktion zum Laden der Abonnements
  const fetchSubscriptions = () => {
    setIsLoading(true);
    startTransition(() => {
      getNotificationSubscriptions().then((data) => {
        setSubscriptions(data);
        setIsLoading(false);
      });
    });
  };

  // Beim Laden der Seite einmalig ausführen
  useEffect(() => {
    fetchSubscriptions();
  }, []);

  return (
    <AppMainContent pathComponents={[{ title: 'Benachrichtigungen', path: '/notifications' }]}>
      <div className="flex flex-col xl:flex-row gap-8 justify-center items-start">
        <CreateNotificationSubscriptionForm onSubscriptionCreated={fetchSubscriptions} />
        <ShowNotificationSubscriptions
          subscriptions={subscriptions}
          isLoading={isLoading}
          refreshSubscriptions={fetchSubscriptions}
        />
      </div>
    </AppMainContent>
  );
}
