import NextAuth, { type DefaultSession } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { UserRole } from '@prisma/client';

import authConfig from '@/auth.config';
import { dbconnector } from '@/lib/dbconnector';
import { getUserById } from './data/user';

// add role attribute to the session object
declare module 'next-auth' {
  interface Session {
    user: {
      role?: UserRole;
    } & DefaultSession['user'];
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  callbacks: {
    async signIn({ user }) {
      // only allow users with a verified email to sign in
      if (!user.id) return false;
      if (!(await getUserById(user.id))?.emailVerified) return false;

      return true;
    },

    async session({ session, token }) {
      // if the user is logged in, set the user id in the session object
      if (token.sub && session.user) session.user.id = token.sub;

      // if the user is logged in and has a role, set the role in the session object
      if (token.role && session.user) session.user.role = token.role as UserRole;

      return session;
    },
    async jwt({ token }) {
      // skip if user is not logged in
      if (!token.sub) return token;

      // get the user by id
      const user = await getUserById(token.sub);

      // if no user is found, return the token as is
      if (!user) return token;

      // add the user role to the token and return it
      token.role = user.role;
      return token;
    },
  },
  adapter: PrismaAdapter(dbconnector),
  session: { strategy: 'jwt' },
  ...authConfig,
});
