import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse, type NextRequest } from 'next/server';
import { AUTH_ROUTES, CORE_JWT_COOKIE } from '@/lib/auth/constants';
import { canAccessLmsAdminPanel } from '@/lib/auth/lms-roles';
import { userHasLmsAdminAccess } from '@/lib/auth/resolve-lms-admin';
import { getClerkSignInUrl, getClerkSignUpUrl } from '@/lib/auth/clerk-urls';
import { getRolesFromClaims, parseJwtPayload } from '@/lib/core/jwt-claims';
import { verifyCoreJwtToken } from '@/lib/core/verify-jwt';

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/admin(.*)']);
const isAdminRoute = createRouteMatcher(['/admin(.*)']);

function isAuthEntryPath(pathname: string): boolean {
  return (
    pathname === AUTH_ROUTES.signIn ||
    pathname.startsWith(`${AUTH_ROUTES.signIn}/`) ||
    pathname === AUTH_ROUTES.signUp ||
    pathname.startsWith(`${AUTH_ROUTES.signUp}/`)
  );
}

function redirectToAppSignIn(request: NextRequest): NextResponse {
  const signInUrl = new URL(getClerkSignInUrl());
  const returnPath = new URL(request.url).pathname + new URL(request.url).search;
  signInUrl.searchParams.set('redirect_url', returnPath);
  return NextResponse.redirect(signInUrl);
}

async function hasCoreAdminRole(request: NextRequest, userId: string | null): Promise<boolean> {
  if (canAccessLmsAdminPanel()) return true;

  const token = request.cookies.get(CORE_JWT_COOKIE)?.value;
  let coreRoles: string[] = [];
  if (token) {
    try {
      const payload = await verifyCoreJwtToken(token);
      const claims = parseJwtPayload(payload);
      if (claims) coreRoles = getRolesFromClaims(claims);
    } catch {
      // ignore — fall through to LMS DB role
    }
  }

  return userHasLmsAdminAccess(userId, coreRoles);
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

    if (isAdminRoute(request) && userId) {
      const isAdmin = await hasCoreAdminRole(request, userId);
      if (!isAdmin) {
        return NextResponse.redirect(new URL(AUTH_ROUTES.dashboard, request.url));
      }
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
