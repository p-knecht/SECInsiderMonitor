import { dbconnector } from '@/lib/dbconnector';

export const getUserByEmail = async (email: string) => {
  try {
    return await dbconnector.user.findUnique({ where: { email } });
  } catch {
    return null;
  }
};

export const getUserById = async (id: string) => {
  try {
    return await dbconnector.user.findUnique({ where: { id } });
  } catch {
    return null;
  }
};
