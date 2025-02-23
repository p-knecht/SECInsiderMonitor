'use server';

import { dbconnector } from '@/lib/dbconnector';
import { getUserByEmail } from '@/data/user';
import { getEmailVerificationTokenByToken } from '@/data/emailVerificationToken';
import { z } from 'zod';

export const verifyToken = async (token: string) => {
  // revalidate received (unsafe) values from client
  const validatedData = z.string().uuid().safeParse(token);
  if (!validatedData.success) {
    return { error: 'Ungültige Daten' };
  }

  const tokenObject = await getEmailVerificationTokenByToken(validatedData.data);

  // check if token exists
  if (!tokenObject) return { error: 'Verifizierungscode ist ungültig' };

  // check if token is expired
  if (tokenObject.expires < new Date()) {
    await dbconnector.emailVerificationToken.delete({ where: { id: tokenObject.id } });
    return { error: 'Verifizierungscode ist abgelaufen' };
  }

  const user = await getUserByEmail(tokenObject.email);

  // check if user exists
  if (!user) {
    await dbconnector.emailVerificationToken.delete({ where: { id: tokenObject.id } });
    return { error: 'Verknüpfter Benutzer existiert nicht' };
  }

  // update user verification status and remove token
  await dbconnector.user.update({ where: { id: user.id }, data: { emailVerified: new Date() } });
  await dbconnector.emailVerificationToken.delete({ where: { id: tokenObject.id } });

  return { success: 'Konto wurde erfolgreich verifiziert' };
};
