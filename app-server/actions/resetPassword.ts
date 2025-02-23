'use server';

import * as z from 'zod';
import bcryptjs from 'bcryptjs';
import { dbconnector } from '@/lib/dbconnector';

import { ResetPasswordSchema } from '@/schemas';
import { getPasswordResetTokenByToken } from '@/data/passwordResetToken';
import { getUserByEmail } from '@/data/user';

export const resetPassword = async (data: z.infer<typeof ResetPasswordSchema>) => {
  // revalidate received (unsafe) values from client
  const validatedData = ResetPasswordSchema.safeParse(data);
  if (!validatedData.success) {
    return { error: 'Ungültige Daten' };
  }

  // hash password
  const hashedPassword = await bcryptjs.hash(validatedData.data.password, 10);

  const tokenObject = await getPasswordResetTokenByToken(validatedData.data.token);

  // check if token exists
  if (!tokenObject) return { error: 'Passwort-Reset-Token existiert nicht' };

  // check if token is expired
  if (tokenObject.expires < new Date()) {
    await dbconnector.passwordResetToken.delete({ where: { id: tokenObject.id } });
    return { error: 'Passwort-Reset-Token ist abgelaufen' };
  }

  const user = await getUserByEmail(tokenObject.email);

  // check if user exists
  if (!user) {
    await dbconnector.passwordResetToken.delete({ where: { id: tokenObject.id } });
    return { error: 'Verknüpfter Benutzer existiert nicht' };
  }

  // update user password and remove token
  await dbconnector.user.update({ where: { id: user.id }, data: { password: hashedPassword } });
  await dbconnector.passwordResetToken.delete({ where: { id: tokenObject.id } });

  return { success: 'Passwort wurde geändert' };
};
