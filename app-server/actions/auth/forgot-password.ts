'use server';
import * as z from 'zod';

import { ForgotPasswordSchema } from '@/schemas';
import { getUserByEmail } from '@/data/user';
import { generatePasswordResetToken } from '@/lib/tokens';
import { sendPasswordResetMail } from '@/lib/mailer';

export const requestPasswortResetMail = async (data: z.infer<typeof ForgotPasswordSchema>) => {
  // revalidate received (unsafe) values from client
  const validatedData = ForgotPasswordSchema.safeParse(data);
  if (!validatedData.success) {
    return { error: 'Ungültige Daten' };
  }

  const user = await getUserByEmail(validatedData.data.email);
  if (!user) {
    // note: we don't want to expose if a user exists or not so we just return success even if the user does not exist
    return { success: 'Passwort-Reset-Link wurde versendet (falls Benutzer existiert)' };
  }

  // generate and send verification token
  const tokenObject = await generatePasswordResetToken(validatedData.data.email);
  sendPasswordResetMail(validatedData.data.email, tokenObject);

  return { success: 'Passwort-Reset-Link wurde versendet (falls Benutzer existiert)' };
};
