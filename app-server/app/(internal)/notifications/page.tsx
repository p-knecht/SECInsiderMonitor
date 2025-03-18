'use client';

import { useEffect, useState, useTransition } from 'react';
import { CreateNotificationSubscriptionForm } from '@/components/main/notifications/create-notificationsubscription';
import { ShowNotificationSubscriptions } from '@/components/main/notifications/show-notificationsubscriptions';
import { getNotificationSubscriptions } from '@/actions/main/notifications/get-notification-subscriptions';
import { NotificationSubscription } from '@prisma/client';
import { AppMainContent } from '@/components/main/app-maincontent';

/**
 * Renders the main content of the notification subscription page.
 *
 * @returns {JSX.Element} - The notification subscription page layout containing a form to create new notification subscriptions and a list of existing subscriptions.
 */
export default function NotificationsPage() {
  const [subscriptions, setSubscriptions] = useState<NotificationSubscription[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPending, startTransition] = useTransition();

  /**
   * Fetches the notification subscriptions from the server and updates the state.
   *
   * @returns {void} - Fetches the notification subscriptions and updates the state.
   */
  const fetchSubscriptions = () => {
    setIsLoading(true);
    startTransition(() => {
      getNotificationSubscriptions().then((data) => {
        setSubscriptions(data);
        setIsLoading(false);
      });
    });
  };

  // start fetching the notification subscriptions when the page is loaded
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
