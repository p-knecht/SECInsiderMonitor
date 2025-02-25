import { dbconnector } from '@/lib/dbconnector';

export const getEmailVerificationTokenByEmail = async (email: string) => {
  try {
    return await dbconnector.emailVerificationToken.findFirst({ where: { email } });
  } catch {
    return null;
  }
};

export const getEmailVerificationTokenByToken = async (token: string) => {
  try {
    return await dbconnector.emailVerificationToken.findUnique({ where: { token } });
  } catch {
    return null;
  }
};
