'use server';

import * as z from 'zod';
import bcryptjs from 'bcryptjs';
import { dbconnector } from '@/lib/dbconnector';
import { ResetPasswordSchema } from '@/schemas';
import { PasswordResetToken, User } from '@prisma/client';
import { getAuthObjectByEmail, getAuthObjectByKey } from '@/data/auth-object';

/**
 * Resets the password of a user using a password reset token
 *
 * @param {z.infer<typeof ResetPasswordSchema>} data - The data object containing the new password and the reset token
 * @returns {Promise<{error: string}> | {success: string}} - A promise that resolves to an object with an error message or a success message
 */
export const resetPassword = async (data: z.infer<typeof ResetPasswordSchema>) => {
  // revalidate received (unsafe) values from client
  const validatedData = ResetPasswordSchema.safeParse(data);
  if (!validatedData.success) {
    return { error: 'Ungültige Daten' };
  }

  // check if token exists
  const tokenObject = (await getAuthObjectByKey(
    'passwordResetToken',
    validatedData.data.token,
  )) as PasswordResetToken;
  if (!tokenObject) return { error: 'Passwort-Reset-Token existiert nicht' };

  // check if token is expired
  if (tokenObject.expires < new Date()) {
    await dbconnector.passwordResetToken.delete({ where: { id: tokenObject.id } });
    return { error: 'Passwort-Reset-Token ist abgelaufen' };
  }

  // check if user exists
  const user = (await getAuthObjectByEmail('user', tokenObject.email)) as User;
  if (!user) {
    await dbconnector.passwordResetToken.delete({ where: { id: tokenObject.id } });
    return { error: 'Verknüpfter Benutzer existiert nicht' };
  }

  // hash entered password
  const hashedPassword = await bcryptjs.hash(validatedData.data.password, 10);

  // update user password and remove token
  await dbconnector.user.update({ where: { id: user.id }, data: { password: hashedPassword } });
  await dbconnector.passwordResetToken.delete({ where: { id: tokenObject.id } });

  return { success: 'Passwort wurde geändert' };
};
