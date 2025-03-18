import { dbconnector } from '@/lib/dbconnector';

/**
 * Auxiliar function to get a generic auth object from the database by email
 * (adapted, consolidated and optimized version based on foundation from https://www.youtube.com/watch?v=1MTyCvS05V4)
 *
 * @param {string} objectType - The type of the auth object to search for (user, emailVerificationToken or passwordResetToken)
 * @param {string} email - The email address to search the auth object for
 * @returns {Promise<any|null>} - The searched auth object or null if not found
 */
export const getAuthObjectByEmail = async (
  objectType: 'user' | 'emailVerificationToken' | 'passwordResetToken',
  email: string,
) => {
  try {
    switch (objectType) {
      case 'user':
        return await dbconnector.user.findUnique({ where: { email } });
      case 'emailVerificationToken':
        return await dbconnector.emailVerificationToken.findFirst({ where: { email } });
      case 'passwordResetToken':
        return await dbconnector.passwordResetToken.findFirst({ where: { email } });
    }
  } catch {
    return null;
  }
};

/**
 * Auxiliar function to get a generic auth object from the database by key (id or token)
 * (adapted, consolidated and optimized version based on foundation from https://www.youtube.com/watch?v=1MTyCvS05V4)
 *
 * @param {string} objectType - The type of the auth object to search for (user, emailVerificationToken or passwordResetToken)
 * @param {string} key - The key (id (for user) or token (for other) to search the auth object for
 * @returns {Promise<any|null>} - The searched auth object or null if not found
 */
export const getAuthObjectByKey = async (
  objectType: 'user' | 'emailVerificationToken' | 'passwordResetToken',
  key: string,
) => {
  try {
    switch (objectType) {
      case 'user':
        return await dbconnector.user.findUnique({ where: { id: key } });
      case 'emailVerificationToken':
        return await dbconnector.emailVerificationToken.findFirst({ where: { token: key } });
      case 'passwordResetToken':
        return await dbconnector.passwordResetToken.findFirst({ where: { token: key } });
    }
  } catch {
    return null;
  }
};
