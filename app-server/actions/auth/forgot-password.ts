'use server';

import * as z from 'zod';
import { ForgotPasswordSchema } from '@/schemas';
import { generatePasswordResetToken } from '@/lib/tokens';
import { sendPasswordResetMail } from '@/lib/mailer';
import { dbconnector } from '@/lib/dbconnector';

/**
 *  Sends a password reset token to the user if the email address exists in the database
 *
 * @param {z.infer<typeof ForgotPasswordSchema>} data - data object containing the email address of the user
 * @returns {Promise<{error: string}> | {success: string}} - returns a promise that resolves to an object with an error message or a success message
 */
export const requestPasswortResetMail = async (data: z.infer<typeof ForgotPasswordSchema>) => {
  // revalidate received (unsafe) values from client
  const validatedData = ForgotPasswordSchema.safeParse(data);
  if (!validatedData.success) {
    return { error: 'Ungültige Daten' };
  }

  const user = await dbconnector.user.findUnique({
    where: { email: validatedData.data.email },
  });
  const successMessage = 'Passwort-Reset-Link wurde versendet (falls Benutzer existiert)';
  if (!user) {
    // note: we don't want to expose existence of a user so we just return success even if the user does not exist
    return { success: successMessage };
  } else {
    // generate and send verification token
    const tokenObject = await generatePasswordResetToken(validatedData.data.email);
    sendPasswordResetMail(
      validatedData.data.email,
      tokenObject,
      validatedData.data.requestTimeZone,
    );
    return { success: successMessage };
  }
};
