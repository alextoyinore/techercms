'use server';
import {cookies} from 'next/headers';
import {getTokens} from 'next-firebase-auth-edge';
import {authConfig} from './config';

export async function sessionLogin(idToken: string) {
  const tokens = await getTokens(idToken, authConfig);
  cookies().set(tokens.cookieName, tokens.cookie, tokens.cookieOptions);
}

export async function sessionLogout() {
  cookies().delete(authConfig.cookieName);
}
