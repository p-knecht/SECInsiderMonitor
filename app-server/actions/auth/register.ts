'use server';

import * as z from 'zod';
import bcryptjs from 'bcryptjs';
import { dbconnector } from '@/lib/dbconnector';
import { RegisterFormSchema } from '@/schemas';
import { generateVerificationToken } from '@/lib/tokens';
import { sendTokenVerificationMail } from '@/lib/mailer';
import { UserRole } from '@prisma/client';

/**
 * Checks if registration is disabled
 *
 * @returns {Promise<boolean>} - A promise that resolves with a boolean indicating if registration is disabled
 */
export const isRegistrationDisabled = async (): Promise<boolean> => {
  // based on env var SERVER_DISABLE_REGISTRATION
  return process.env.SERVER_DISABLE_REGISTRATION?.trim().toLowerCase() === 'true';
};

/**
 * Registers a new user and sends a verification email
 *
 * @param {z.infer<typeof RegisterFormSchema>} data - The registration data of a new user to be processed
 * @returns {Promise<{ success: string } | { error: string }>} - A promise that resolves with a success message or an error message
 */
export const register = async (data: z.infer<typeof RegisterFormSchema>) => {
  // check if registration is disabled
  if (await isRegistrationDisabled()) {
    return { error: 'Registrierung ist deaktiviert.' };
  }

  // revalidate received (unsafe) values from client
  const validatedData = RegisterFormSchema.safeParse(data);
  if (!validatedData.success) {
    return { error: 'Ungültige Daten' };
  }

  // check if user already exists and fail if so
  const userExist: boolean =
    (await dbconnector.user.findUnique({
      where: {
        email: validatedData.data.email,
      },
    })) !== null;
  if (userExist) {
    return { error: 'Benutzer existiert bereits!' };
  }

  // check if this is the first user (used to determine if user should be admin by default)
  const firstUser = (await dbconnector.user.count()) === 0;

  // hash entered password
  const hashedPassword = await bcryptjs.hash(validatedData.data.password, 10);

  // create user in database
  await dbconnector.user.create({
    data: {
      email: validatedData.data.email,
      password: hashedPassword,
      role: firstUser ? UserRole.admin : UserRole.user, // first user has always admin role, otherwise user role
      lastLogin: null,
    },
  });

  // generate and send verification token to user
  const tokenObject = await generateVerificationToken(validatedData.data.email);
  sendTokenVerificationMail(
    validatedData.data.email,
    tokenObject,
    validatedData.data.requestTimeZone,
  );

  return { success: 'Verifikationsmail wurde versendet.' };
};
