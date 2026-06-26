import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse, type NextRequest } from 'next/server';
import { AUTH_ROUTES, CORE_JWT_COOKIE } from '@/lib/auth/constants';
import { canAccessLmsAdminPanel } from '@/lib/auth/lms-roles';
import { userHasLmsAdminAccess } from '@/lib/auth/resolve-lms-admin';
import { getClerkSignInUrl, getClerkSignUpUrl } from '@/lib/auth/clerk-urls';
import { getRolesFromClaims, parseJwtPayload } from '@/lib/core/jwt-claims';
import { verifyCoreJwtToken } from '@/lib/core/verify-jwt';

import { inMemoryRateLimiter } from '@/lib/rate-limit/in-memory';

const RATE_LIMIT_RULES = {
  PUBLIC_API: { limit: 200, windowMs: 60000, keyPrefix: 'rl:pub-api:' },
  AUTH_API: { limit: 50, windowMs: 60000, keyPrefix: 'rl:auth-api:' },
  SERVER_ACTIONS: { limit: 100, windowMs: 60000, keyPrefix: 'rl:action:' },
  GENERAL_API: { limit: 300, windowMs: 60000, keyPrefix: 'rl:gen-api:' },
  GENERAL_PAGE: { limit: 300, windowMs: 60000, keyPrefix: 'rl:page:' }
};

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
    const { pathname } = request.nextUrl;
    const isWebhook = pathname.startsWith('/api/webhooks/clerk');
    const isStatic = pathname.startsWith('/_next') || pathname.includes('.');
    if (!isWebhook && !isStatic) {
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || request.headers.get('x-real-ip') || '127.0.0.1';
      let rule = RATE_LIMIT_RULES.GENERAL_PAGE;
      let isApi = false;

      if (pathname.startsWith('/api/v1/public')) {
        rule = RATE_LIMIT_RULES.PUBLIC_API;
        isApi = true;
      } else if (pathname.startsWith('/api/auth/core-token')) {
        rule = RATE_LIMIT_RULES.AUTH_API;
        isApi = true;
      } else if (request.method === 'POST' && (request.headers.has('next-action') || request.headers.has('Next-Action'))) {
        rule = RATE_LIMIT_RULES.SERVER_ACTIONS;
        isApi = true;
      } else if (pathname.startsWith('/api/')) {
        rule = RATE_LIMIT_RULES.GENERAL_API;
        isApi = true;
      }

      const rlKey = `${rule.keyPrefix}${ip}`;
      const rlResult = await inMemoryRateLimiter.limit(rlKey, rule.limit, rule.windowMs);

      if (!rlResult.success) {
        const headers = {
          'Content-Type': isApi ? 'application/json' : 'text/html',
          'X-RateLimit-Limit': String(rule.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(rlResult.reset),
          'Retry-After': String(Math.ceil((rlResult.reset - Date.now()) / 1000)),
        };

        if (isApi) {
          return new NextResponse(
            JSON.stringify({
              error: 'Too Many Requests',
              message: 'Rate limit exceeded. Please try again later.',
            }),
            { status: 429, headers }
          );
        } else {
          return new NextResponse(
            `<html>
              <head><title>Too Many Requests</title></head>
              <body style="font-family: sans-serif; text-align: center; padding: 50px;">
                <h1>Too Many Requests</h1>
                <p>Rate limit exceeded. Please try again later.</p>
              </body>
            </html>`,
            { status: 429, headers }
          );
        }
      }
    }

    const { userId } = await auth();

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
