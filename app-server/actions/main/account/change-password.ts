'use server';

import * as z from 'zod';
import bcryptjs from 'bcryptjs';
import { dbconnector } from '@/lib/dbconnector';
import { auth } from '@/auth';
import { ChangePasswordSchema } from '@/schemas';
import { getUserById } from '@/data/user';

export const changePassword = async (data: z.infer<typeof ChangePasswordSchema>) => {
  // revalidate received (unsafe) values from client
  const validatedData = ChangePasswordSchema.safeParse(data);
  if (!validatedData.success) {
    return { error: 'Ungültige Daten' };
  }

  // get user session
  const session = await auth();
  if (!session?.user.id) {
    return { error: 'Ungültige Sitzung' };
  }

  // get user by id
  const user = await getUserById(session.user.id);
  if (!user) {
    return { error: 'Benutzer existiert nicht' };
  }

  // check if old password was entered correctly
  if (!user.password || !(await bcryptjs.compare(validatedData.data.oldPassword, user.password)))
    return { error: 'Aktuelles Passwort ist falsch' };

  // update password in database
  const hashedPassword = await bcryptjs.hash(validatedData.data.newPassword, 10);
  await dbconnector.user.update({ where: { id: user.id }, data: { password: hashedPassword } });

  return { success: 'Passwort wurde geändert' };
};
