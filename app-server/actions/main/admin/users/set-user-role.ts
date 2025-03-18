'use server';

import * as z from 'zod';
import { dbconnector } from '@/lib/dbconnector';
import { auth } from '@/auth';
import { SetUserRoleSchema } from '@/schemas';
import { User, UserRole } from '@prisma/client';
import { getAuthObjectByKey } from '@/data/auth-object';
/**
 * Set a new role for a user (only admins are allowed to change user roles)
 *
 * @param {z.infer<typeof SetUserRoleSchema>} data - Data to set a new role for a user containing the user id and the new role
 * @returns { Promise<{ success: string } | { error: string }> } - A promise that resolves to an object with an error message or a success message
 */
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
  const requestingUser = (await getAuthObjectByKey('user', session.user.id)) as User;
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
  const user = (await getAuthObjectByKey('user', validatedData.data.userId)) as User;
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
