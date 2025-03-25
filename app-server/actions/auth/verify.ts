'use server';

import { dbconnector } from '@/lib/dbconnector';
import { z } from 'zod';
/**
 * Verifies the email of a user using a provided verification token
 *
 * @param {string} token - The registration token to verify email
 * @returns {Promise<{error: string}> | {success: string}} - A promise that resolves to an object with an error message or a success message
 */
export const verifyToken = async (token: string) => {
  // revalidate received (unsafe) values from client
  const validatedData = z.string().uuid().safeParse(token);
  if (!validatedData.success) {
    return { error: 'Ungültige Daten' };
  }

  // check if token exists

  const tokenObject = await dbconnector.emailVerificationToken.findFirst({
    where: { token: validatedData.data },
  });
  if (!tokenObject) return { error: 'Verifizierungscode ist ungültig' };

  // check if token is expired
  if (tokenObject.expires < new Date()) {
    await dbconnector.emailVerificationToken.delete({ where: { id: tokenObject.id } });
    return { error: 'Verifizierungscode ist abgelaufen' };
  }

  // check if user exists
  const user = await dbconnector.user.findUnique({
    where: { email: tokenObject.email },
  });
  if (!user) {
    await dbconnector.emailVerificationToken.delete({ where: { id: tokenObject.id } });
    return { error: 'Verknüpfter Benutzer existiert nicht' };
  }

  // update user verification status and remove token
  await dbconnector.user.update({ where: { id: user.id }, data: { emailVerified: true } });
  await dbconnector.emailVerificationToken.delete({ where: { id: tokenObject.id } });

  return { success: 'Konto wurde erfolgreich verifiziert' };
};
