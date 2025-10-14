'use server';
import {cookies} from 'next/headers';
import {getTokens} from 'next-firebase-auth-edge/lib/next/tokens';
import {authConfig} from './config';

export async function sessionLogin(idToken: string) {
  const tokens = await getTokens(cookies(), {
    ...authConfig,
    idToken,
  });

  if (!tokens) {
    throw new Error('Unable to generate tokens');
  }

  cookies().set(tokens.cookieName, tokens.cookie, tokens.cookieOptions);
}

export async function sessionLogout() {
  cookies().delete(authConfig.cookieName);
}
