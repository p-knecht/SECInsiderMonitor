'use server';

import * as z from 'zod';
import bcryptjs from 'bcryptjs';
import { dbconnector } from '@/lib/dbconnector';
import { auth } from '@/auth';
import { DeleteAccountSchema } from '@/schemas';
import { getUserById } from '@/data/user';

export const deleteAccount = async (data: z.infer<typeof DeleteAccountSchema>) => {
  // revalidate received (unsafe) values from client
  const validatedData = DeleteAccountSchema.safeParse(data);
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

  // check if user is an admin and prevent deletion if it is the only admin
  if (user.role === 'admin') {
    if ((await dbconnector.user.count({ where: { role: 'admin' } })) === 1) {
      return {
        error: 'Konto kann nicht gelöscht werden, da es das letzte verbleibende Admin-Konto ist',
      };
    }
  }

  // check if old password was entered correctly
  if (!user.password || !(await bcryptjs.compare(validatedData.data.password, user.password)))
    return { error: 'Aktuelles Passwort ist falsch' };

  // delete user from database
  await dbconnector.user.delete({ where: { id: user.id } });

  return { success: 'Konto wurde gelöscht' };
};
