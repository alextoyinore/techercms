import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PATHS = ['/dashboard'];

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('__session');
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PATHS.some(path => pathname.startsWith(path));

  if (!sessionCookie && isProtected) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  if (sessionCookie && (pathname === '/' || pathname.startsWith('/signup'))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|favicon.ico).*)'],
};
