import type { NextAuthConfig } from 'next-auth';
import bcryptjs from 'bcryptjs';
import Credentials from 'next-auth/providers/credentials';

import { LoginFormSchema } from '@/schemas';
import { getUserByEmail } from '@/data/user';
import { dbconnector } from '@/lib/dbconnector';

export const runtime = 'nodejs'; // disable edge runtime for this file (as not supported by bcryptjs)
export default {
  providers: [
    Credentials({
      async authorize(credentials) {
        // validate and parse the passed credentials
        const validatedData = LoginFormSchema.safeParse(credentials);

        // fail if the passed credentials are not valid
        if (!validatedData.success) return null;

        // get the user object from the database
        const user = await getUserByEmail(validatedData.data.email);

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
