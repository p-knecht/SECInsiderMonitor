'use server';

import * as z from 'zod';
import { dbconnector } from '@/lib/dbconnector';
import { auth } from '@/auth';
import { SetUserRoleSchema } from '@/schemas';
import { getUserById } from '@/data/user';
import { UserRole } from '@prisma/client';

export const setUserRole = async (data: z.infer<typeof SetUserRoleSchema>) => {
  // revalidate received (unsafe) values from client
  const validatedData = SetUserRoleSchema.safeParse(data);
  if (!validatedData.success) {
    return { error: 'Ungültige Daten' };
  }

  // get user session
  const session = await auth();
  if (!session?.user.id) {
    return { error: 'Ungültige Sitzung' };
  }

  // get requesting user object
  const requestingUser = await getUserById(session.user.id);
  if (!requestingUser) {
    return { error: 'Anfragender Benutzer existiert nicht' };
  }

  // check if user is trying to change own role
  if (session.user.id === validatedData.data.userId) {
    return { error: 'Die eigene Rolle kann nicht über diese Funktion geändert werden' };
  }

  // check if user has permission to change role (only admins are allowed)
  if (requestingUser?.role != UserRole.admin) {
    return { error: 'Der anfragende Benutzer hat keine Berechtigung für diese Aktion' };
  }

  // get user by id
  const user = await getUserById(validatedData.data.userId);
  if (!user) {
    return { error: 'Benutzer existiert nicht' };
  }

  // update password in database
  await dbconnector.user.update({
    where: { id: user.id },
    data: { role: validatedData.data.role },
  });

  return { success: 'Die Rolle wurde geändert' };
};
