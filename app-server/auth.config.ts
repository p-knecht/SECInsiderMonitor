import type { NextAuthConfig } from 'next-auth';
import bcryptjs from 'bcryptjs';
import Credentials from 'next-auth/providers/credentials';

import { LoginFormSchema } from '@/schemas';
import { dbconnector } from '@/lib/dbconnector';
import { getAuthObjectByEmail } from '@/data/auth-object';
import { User } from '@prisma/client';

/**
 * The configuration object for the NextAuth provider.
 */
export default {
  providers: [
    Credentials({
      /**
       * Authorizes a user based on the provided credentials. If the user is authorized, the user object is returned otherwise null.
       * (adapted and optimized version based on foundation from https://authjs.dev/getting-started/authentication/credentials and https://www.youtube.com/watch?v=1MTyCvS05V4)
       *
       * @param {object} credentials - The credentials object containing the email and password.
       * @returns {User | null} - The user object if the user is authorized, otherwise null.
       */
      async authorize(credentials) {
        // validate and parse the passed credentials
        const validatedData = LoginFormSchema.safeParse(credentials);

        // fail if the passed credentials are not valid
        if (!validatedData.success) return null;

        // get the user object from the database
        const user = (await getAuthObjectByEmail('user', validatedData.data.email)) as User;

        // fail if the user does not exist or the password is not set in database
        if (!user || !user.password) return null;

        // pass if the provided password is correct for the user
        if (await bcryptjs.compare(validatedData.data.password, user.password)) {
          // update last login date
          await dbconnector.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
          });
          return user;
        }

        // fail otherwise
        return null;
      },
    }),
  ],
} satisfies NextAuthConfig;
