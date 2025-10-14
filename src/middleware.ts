import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware is now empty as we are handling auth on the client-side.
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|favicon.ico).*)'],
};
