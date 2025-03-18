'use server';

import { signOut } from '@/auth';
import { redirect } from 'next/navigation';

/**
 *  Logs the user out and redirects them to the login page
 *
 * @returns {Promise<void>} - A promise that resolves when the user is logged out
 */
export const logout = async () => {
  // do not use the built-in client-side redirect option of signOut, as we want to redirect server-side to the login page
  await signOut({ redirect: false });
  redirect('/auth/login');
};
