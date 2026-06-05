import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // List of public paths that do not require authentication
  const isPublicPath =
    pathname === '/' ||
    pathname.startsWith('/kursus') ||
    pathname.startsWith('/tryout') ||
    pathname.startsWith('/tentang') ||
    pathname.startsWith('/cara-belajar') ||
    pathname.startsWith('/hubungi') ||
    pathname.startsWith('/syarat-ketentuan') ||
    pathname.startsWith('/kebijakan-privasi') ||
    pathname.startsWith('/sign-in') ||
    pathname.startsWith('/sign-up') ||
    pathname.startsWith('/api/webhooks/clerk');

  if (isPublicPath) {
    return NextResponse.next();
  }

  // Placeholder logic for protected routes (will be wrapped with Clerk/Database checks later)
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files (images, fonts, pdf, etc.)
    '/((?!_next|[^?]*\\.(?:html|css|js(?!on)|jpe?g|webp|png|gif|svg|ico|woff2?|txt|csv|xlsx|pdf)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
