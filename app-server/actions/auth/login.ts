'use server';

import * as z from 'zod';

import { LoginFormSchema } from '@/schemas';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import { getUserByEmail } from '@/data/user';
import { generateVerificationToken } from '@/lib/tokens';
import { sendTokenVerificationMail } from '@/lib/mailer';

export const login = async (data: z.infer<typeof LoginFormSchema>) => {
  // revalidate received (unsafe) values from client
  const validatedData = LoginFormSchema.safeParse(data);
  if (!validatedData.success) {
    return { error: 'Ungültige Anmeldedaten' };
  }

  const existingUser = await getUserByEmail(validatedData.data.email);

  if (existingUser && !existingUser.emailVerified) {
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
