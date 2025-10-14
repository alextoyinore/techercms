import type {NextRequest} from 'next/server';
import {authMiddleware} from 'next-firebase-auth-edge';
import {authConfig} from './app/config';

const PUBLIC_PATHS = ['/', '/signup', '/api/login', '/api/logout'];

export async function middleware(request: NextRequest) {
  return authMiddleware(request, {
    loginPath: '/api/login',
    logoutPath: '/api/logout',
    apiKey: authConfig.apiKey,
    cookieName: authConfig.cookieName,
    cookieSignatureKeys: authConfig.cookieSignatureKeys,
    cookieSerializeOptions: authConfig.cookieSerializeOptions,
    serviceAccount: authConfig.serviceAccount,
    handleValidToken: async ({token, decodedToken}) => {
      if (PUBLIC_PATHS.includes(request.nextUrl.pathname)) {
        return;
      }

      console.log(
        'Successfully authenticated',
        decodedToken.email,
        'doing nothing'
      );
      return;
    },
    handleInvalidToken: async () => {
      console.log('Invalid token, redirecting to /');
    },
    handleError: async (error) => {
      console.error('Unhandled authentication error', {error});
    },
  });
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|api/public-route).*)'],
};
