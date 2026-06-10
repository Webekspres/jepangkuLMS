import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { AUTH_ROUTES } from '@/lib/auth/constants';
import { getClerkSignInUrl, getClerkSignUpUrl } from '@/lib/auth/clerk-urls';

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/admin(.*)']);

function isAuthEntryPath(pathname: string): boolean {
  return (
    pathname === AUTH_ROUTES.signIn ||
    pathname.startsWith(`${AUTH_ROUTES.signIn}/`) ||
    pathname === AUTH_ROUTES.signUp ||
    pathname.startsWith(`${AUTH_ROUTES.signUp}/`)
  );
}

function redirectToAppSignIn(request: Request): NextResponse {
  const signInUrl = new URL(getClerkSignInUrl());
  const returnPath = new URL(request.url).pathname + new URL(request.url).search;
  signInUrl.searchParams.set('redirect_url', returnPath);
  return NextResponse.redirect(signInUrl);
}

export default clerkMiddleware(
  async (auth, request) => {
    const { userId } = await auth();
    const { pathname } = request.nextUrl;

    if (userId && pathname === '/') {
      return NextResponse.redirect(new URL(AUTH_ROUTES.dashboard, request.url));
    }

    if (userId && isAuthEntryPath(pathname)) {
      return NextResponse.redirect(new URL(AUTH_ROUTES.dashboard, request.url));
    }

    if (isProtectedRoute(request) && !userId) {
      return redirectToAppSignIn(request);
    }

    if (isProtectedRoute(request)) {
      await auth.protect({ unauthenticatedUrl: getClerkSignInUrl() });
    }
  },
  {
    signInUrl: getClerkSignInUrl(),
    signUpUrl: getClerkSignUpUrl(),
  },
);

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/(.*)',
  ],
};
