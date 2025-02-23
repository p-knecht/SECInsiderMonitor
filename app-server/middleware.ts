import NextAuth from 'next-auth';

import authConfig from '@/auth.config';
import { publicRoutes, authRoutes, apiAuthPrefix, DEFAULT_LOGGED_IN_URL } from '@/routes';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const url = req.nextUrl;
  const isloggedIn = !!req.auth;

  // do not enforce auth for api auth prefix (as this is required for auth.js)
  if (url.pathname.startsWith(apiAuthPrefix)) return;

  // check if current route is an authentication route (and redirect to default logged in url if already logged in)
  if (authRoutes.includes(url.pathname)) {
    if (isloggedIn) {
      return Response.redirect(new URL(DEFAULT_LOGGED_IN_URL, url)); // redirect logged in users to DEFAULT_LOGGED_IN_URL
    } else {
      return; // do not redirect non-logged in users
    }
  }

  // redirect users to login page if not logged in and route is not public
  if (!isloggedIn && !publicRoutes.includes(url.pathname)) {
    return Response.redirect(new URL('/auth/login', url));
  }

  // allow every other route by defaults
});

export const config = {
  // matcher pattern used from https://clerk.com/docs/references/nextjs/clerk-middleware#usage
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
