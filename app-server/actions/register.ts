'use server';

import * as z from 'zod';
import bcryptjs from 'bcryptjs';
import { dbconnector } from '@/lib/dbconnector';

import { RegisterFormSchema } from '@/schemas';
import { generateVerificationToken } from '@/lib/tokens';
import { sendTokenVerificationMail } from '@/lib/mailer';

export const register = async (data: z.infer<typeof RegisterFormSchema>) => {
  // check if registration is disabled
  if (process.env.SERVER_DISABLE_REGISTRATION?.toLowerCase() === 'true') {
    return { error: 'Registrierung ist deaktiviert.' };
  }

  // revalidate received (unsafe) values from client
  const validatedData = RegisterFormSchema.safeParse(data);
  if (!validatedData.success) {
    return { error: 'Ungültige Daten' };
  }

  // hash password
  const hashedPassword = await bcryptjs.hash(validatedData.data.password, 10);

  // check if user already exists
  const userExist: boolean =
    (await dbconnector.user.findUnique({
      where: {
        email: validatedData.data.email,
      },
    })) !== null;
  if (userExist) {
    return { error: 'Benutzer existiert bereits!' };
  }

  // create user in database
  await dbconnector.user.create({
    data: {
      email: validatedData.data.email,
      password: hashedPassword,
    },
  });

  // generate and send verification token
  const tokenObject = await generateVerificationToken(validatedData.data.email);
  sendTokenVerificationMail(validatedData.data.email, tokenObject);

  return { success: 'Verifikationsmail wurde versendet.' };
};
