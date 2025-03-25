'use server';

import { auth } from '@/auth';

/**
 * Returns the server timezone
 *
 * @returns {string|null} - The server timezone or null if not available or user is not authenticated
 */
export async function getServerTimezone(): Promise<string | null> {
  const session = await auth();
  if (!session?.user.id) return null;

  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
