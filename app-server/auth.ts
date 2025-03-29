import NextAuth, { type DefaultSession } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { UserRole } from '@prisma/client';
import authConfig from '@/auth.config';
import { dbconnector } from '@/lib/dbconnector';

/**
 * Extends the default session object to include the user role.
 * (derived from https://www.youtube.com/watch?v=1MTyCvS05V4)
 */
declare module 'next-auth' {
  interface Session {
    user: {
      role?: UserRole;
    } & DefaultSession['user'];
  }
}

/**
 * The NextAuth configuration object containing custom callbacks and the Prisma adapter.
 * (adapted and optimized version based on foundation from https://next-auth.js.org/configuration/options, https://next-auth.js.org/configuration/callbacks and https://www.youtube.com/watch?v=1MTyCvS05V4)
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  callbacks: {
    /**
     * Custom sign in function that checks if the user exists and is verified. (note: credentials are not checked here, as they are checked in the authorize function of the credentials provider)
     *
     * @param {object} user - The user object trying to sign in
     * @returns {boolean} - True if the user is allowed to signed in, otherwise false.
     */
    async signIn({ user }) {
      if (!user.id) return false; // fail if user id is not set
      if (!(await dbconnector.user.findUnique({ where: { id: user.id } }))?.emailVerified)
        return false; // fail if account does not exist or was not verified
      return true;
    },

    /**
     * Custom session function that sets the user id and role in the session object for easier access of these information.
     *
     * @param {object} session - The session object to be modified
     * @param {object} token - The token object containing the user id and role information
     * @returns {object} - The modified session object
     */
    async session({ session, token }) {
      // if the user is logged in, set the user id in the session object
      if (token.sub && session.user) session.user.id = token.sub;

      // if the user is logged in and has a role, set the role in the session object
      if (token.role && session.user) session.user.role = token.role as UserRole;

      return session;
    },

    /**
     * Custom JWT function that adds the user role to the token for easier access of this information (note: this is safe as JWT tokens are signed and cannot be tampered, and these information are not confidential to client).
     *
     * @param {object} token - The token object to be modified
     * @returns {object} - The modified token object
     */
    async jwt({ token }) {
      // skip if user is not logged in
      if (!token.sub) return token;

      // get the user by id
      const user = await dbconnector.user.findUnique({
        where: { id: token.sub },
      });

      // if no user is found, return the token as is
      if (!user) return token;

      // add the user role to the token and return it
      token.role = user.role;
      return token;
    },
  },
  adapter: PrismaAdapter(dbconnector),
  ...authConfig,
});
