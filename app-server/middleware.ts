import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';

import authConfig from '@/auth.config';

const { auth } = NextAuth(authConfig);

// Routes that are related to authentication (when accessing these in logged in state, user are redirected to DEFAULT_LOGGED_IN_PAGE)
export const AUTH_ROUTES = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
];

// Prefix for API routes that are related to authentication (must not be protected by auth middleware to allow login/logout)
export const API_AUTH_PREFIX = '/api/auth';

// Routes that are public and do not require authentication to access
export const PUBLIC_ROUTES = ['/auth/verify'];

// defines the default page to redirect to after login (if no returnTo URL is stored)
export const DEFAULT_LOGGED_IN_PAGE = '/dashboard';

/**
 * The middleware function that enforces authentication for all routes except public routes, auth routes and API routes used for authentication.
 * (adapted and optimized version based on foundation from https://authjs.dev/getting-started/session-management/protecting and https://www.youtube.com/watch?v=1MTyCvS05V4)
 *
 * @param {object} req - The request object containing the nextUrl and auth object (if authenticated)
 * @returns {NextResponse|void} - The response object to redirect to login page or undefined if no redirect is needed
 */
export default auth((req) => {
  const url = req.nextUrl;
  const isloggedIn = !!req.auth;

  // do not enforce auth for api auth prefix (as this is required for auth.js)
  if (url.pathname.startsWith(API_AUTH_PREFIX)) return;

  // check if current route is an authentication route (and redirect to default logged in url if already logged in)
  if (AUTH_ROUTES.includes(url.pathname)) {
    if (isloggedIn) {
      const returnTo = req.cookies.get('returnTo')?.value;

      // Redirect to stored returnTo URL (if valid), otherwise to DEFAULT_LOGGED_IN_PAGE
      const redirectUrl =
        returnTo && returnTo.startsWith('/')
          ? new URL(returnTo, url)
          : new URL(DEFAULT_LOGGED_IN_PAGE, url);

      const res = NextResponse.redirect(redirectUrl);
      res.cookies.set('returnTo', '', { maxAge: 0 }); // delete "consumed" returnTo cookie
      return res;
    } else {
      return; // do not redirect non-logged in users
    }
  }

  // redirect users to login page if not logged in and route is not public
  if (!isloggedIn && !PUBLIC_ROUTES.includes(url.pathname)) {
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
