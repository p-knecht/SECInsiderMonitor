import { dbconnector } from '@/lib/dbconnector';

export const getPasswordResetTokenByEmail = async (email: string) => {
  try {
    return await dbconnector.passwordResetToken.findFirst({ where: { email } });
  } catch {
    return null;
  }
};

export const getPasswordResetTokenByToken = async (token: string) => {
  try {
    return await dbconnector.passwordResetToken.findUnique({ where: { token } });
  } catch {
    return null;
  }
};
