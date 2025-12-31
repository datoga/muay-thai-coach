import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale } from './i18n/config';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

export default function proxy(request: NextRequest) {
  // Skip proxy for API routes and static files
  const { pathname } = request.nextUrl;
  
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/audio') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Add pathname header for i18n
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response = intlMiddleware(request as any);
  response.headers.set('x-pathname', pathname);
  
  return response;
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};

