import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';

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
      const returnTo = req.cookies.get('returnTo')?.value;

      // Redirect to stored returnTo URL (if valid), otherwise to DEFAULT_LOGGED_IN_URL
      const redirectUrl =
        returnTo && returnTo.startsWith('/')
          ? new URL(returnTo, url)
          : new URL(DEFAULT_LOGGED_IN_URL, url);

      const res = NextResponse.redirect(redirectUrl);
      res.cookies.set('returnTo', '', { maxAge: 0 }); // delete "consumed" returnTo cookie
      return res;
    } else {
      return; // do not redirect non-logged in users
    }
  }

  // redirect users to login page if not logged in and route is not public
  if (!isloggedIn && !publicRoutes.includes(url.pathname)) {
    const res = NextResponse.redirect(new URL('/auth/login', url));

    // save `returnTo` url as cookie
    res.cookies.set('returnTo', url.pathname, {
      httpOnly: true, // prevent scripts from reading and setting the cookie
      secure: process.env.NODE_ENV === 'production', // only send cookie over https (in production)
      sameSite: 'strict', // protect against CSRF attacks
      path: '/',
      maxAge: 60 * 5, // valid only for 5 minutes (should be enough to login)
    });

    return res;
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
