import { v4 as uuidv4 } from 'uuid';
import { dbconnector } from '@/lib/dbconnector';
import { getAuthObjectByEmail } from '@/data/auth-object';
import { EmailVerificationToken, PasswordResetToken } from '@prisma/client';

/**
 * Generates a password reset token for the given email address and adds it to database. If there is already a token for this email, it will be removed.
 * (adapted version based on foundation from https://www.youtube.com/watch?v=1MTyCvS05V4)
 *
 * @param {string} email - The email address for which the token should be generated
 * @returns {Promise<PasswordResetToken>} - The generated token object
 */
export const generatePasswordResetToken = async (email: string) => {
  // Check if there is already a token for this email and remove it (as there should be only one valid token per email at a time)
  const existingToken = (await getAuthObjectByEmail(
    'passwordResetToken',
    email,
  )) as PasswordResetToken;
  if (existingToken)
    await dbconnector.passwordResetToken.delete({ where: { id: existingToken.id } });

  // add new token to database
  const newTokenObject = await dbconnector.passwordResetToken.create({
    data: {
      email,
      token: uuidv4(), // Generate token
      expires: new Date(new Date().getTime() + 1000 * 60 * 15), // Password reset token expires in 15 minutes for security purposes
    },
  });

  return newTokenObject;
};

/**
 * Generates an email verification token for the given email address and adds it to database. If there is already a token for this email, it will be removed.
 * (adapted version based on foundation from https://www.youtube.com/watch?v=1MTyCvS05V4)
 *
 * @param {string} email - The email address for which the token should be generated
 * @returns {Promise<EmailVerificationToken>} - The generated token object
 */
export const generateVerificationToken = async (email: string) => {
  // Check if there is already a token for this email and remove it (as there should be only one valid token per email at a time)
  const existingToken = (await getAuthObjectByEmail(
    'emailVerificationToken',
    email,
  )) as EmailVerificationToken;
  if (existingToken)
    await dbconnector.emailVerificationToken.delete({ where: { id: existingToken.id } });

  // add new token to database
  const newTokenObject = await dbconnector.emailVerificationToken.create({
    data: {
      email,
      token: uuidv4(), // Generate token
      expires: new Date(new Date().getTime() + 1000 * 60 * 60 * 24), // Verification token expires in 24 hours for security purposes
    },
  });

  return newTokenObject;
};
