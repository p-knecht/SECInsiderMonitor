'use server';

import * as z from 'zod';
import { dbconnector } from '@/lib/dbconnector';
import { auth } from '@/auth';
import { DeleteUserSchema } from '@/schemas';
import { User, UserRole } from '@prisma/client';
import { getAuthObjectByKey } from '@/data/auth-object';

/**
 * Deletes a user account from the database (only admins are allowed to delete accounts of other users)
 *
 * @param {z.infer<typeof DeleteUserSchema>} data - Data to delete a user account containing the user id
 * @returns {Promise<{ success: string } | { error: string }>} - A promise that resolves to an object with an error message or a success message
 */
export const deleteUser = async (data: z.infer<typeof DeleteUserSchema>) => {
  // revalidate received (unsafe) values from client
  const validatedData = DeleteUserSchema.safeParse(data);
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

  // check if user is trying to delete own account
  if (session.user.id === validatedData.data.userId) {
    return { error: 'Der eigene Account kann nicht über diese Funktion gelöscht werden' };
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

  // delete user from database
  await dbconnector.user.delete({ where: { id: user.id } });

  // delete notification subscriptions of user
  await dbconnector.notificationSubscription.deleteMany({ where: { subscriber: user.id } });

  return { success: 'Das Benutzerkonto wurde gelöscht' };
};
