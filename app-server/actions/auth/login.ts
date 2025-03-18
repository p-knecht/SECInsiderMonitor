'use server';

import * as z from 'zod';
import { LoginFormSchema } from '@/schemas';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import { generateVerificationToken } from '@/lib/tokens';
import { sendTokenVerificationMail } from '@/lib/mailer';
import { getAuthObjectByEmail } from '@/data/auth-object';
import { User } from '@prisma/client';

/**
 * Attempts to sign in a user with the provided email and password
 *
 * @param {z.infer<typeof LoginFormSchema>} data - data object containing the email and password of the user
 * @returns {Promise<{error: string}> | {success: string}} - returns a promise that resolves to an object with an error message or a success message
 */
export const login = async (data: z.infer<typeof LoginFormSchema>) => {
  // revalidate received (unsafe) values from client
  const validatedData = LoginFormSchema.safeParse(data);
  if (!validatedData.success) {
    return { error: 'Ungültige Anmeldedaten' };
  }

  // check if user exists but is not verified
  const existingUser = (await getAuthObjectByEmail('user', validatedData.data.email)) as User;
  if (existingUser && !existingUser.emailVerified) {
    // send a new verification token to the user (as the old one might have been lost or expired)
    const token = await generateVerificationToken(validatedData.data.email);
    sendTokenVerificationMail(validatedData.data.email, token);
    return {
      error: 'Konto noch nicht verifiziert! Ein neuer Verifizierungscode wurde versendet...',
    };
  }

  try {
    // attempt to sign in with the provided credentials
    await signIn('credentials', {
      email: validatedData.data.email,
      password: validatedData.data.password,
    });
    return { success: 'Erfolgreich!' };
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === 'CredentialsSignin') return { error: 'Ungültige Anmeldedaten' };
      else return { error: 'Ein Fehler ist aufgetreten' };
    }
    throw error;
  }
};
