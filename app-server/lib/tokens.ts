import { getEmailVerificationTokenByEmail } from '@/data/email-verification-token';
import { getPasswordResetTokenByEmail } from '@/data/password-reset-token';
import { v4 as uuidv4 } from 'uuid';
import { dbconnector } from '@/lib/dbconnector';

export const generatePasswordResetToken = async (email: string) => {
  // Check if there is already a token for this email and remove it (as there should be only one valid token per email at a time)
  const existingToken = await getPasswordResetTokenByEmail(email);
  if (existingToken)
    await dbconnector.passwordResetToken.delete({ where: { id: existingToken.id } });

  // add new token to database
  const newTokenObject = await dbconnector.passwordResetToken.create({
    data: {
      email,
      token: uuidv4(), // Generate token
      expires: new Date(new Date().getTime() + 1000 * 60 * 15), // Token expires in 15 minutes
    },
  });

  return newTokenObject;
};

export const generateVerificationToken = async (email: string) => {
  // Check if there is already a token for this email and remove it (as there should be only one valid token per email at a time)
  const existingToken = await getEmailVerificationTokenByEmail(email);
  if (existingToken)
    await dbconnector.emailVerificationToken.delete({ where: { id: existingToken.id } });

  // add new token to database
  const newTokenObject = await dbconnector.emailVerificationToken.create({
    data: {
      email,
      token: uuidv4(), // Generate token
      expires: new Date(new Date().getTime() + 1000 * 60 * 60 * 24), // Token expires in 24 hours
    },
  });

  return newTokenObject;
};
