'use client';
import {Tokens} from 'next-firebase-auth-edge';
import {createContext, useContext} from 'react';

const AuthContext = createContext<{initialTokens: Tokens | null}>({
  initialTokens: null,
});

export function AuthProvider({
  initialTokens,
  children,
}: {
  initialTokens: Tokens | null;
  children: React.ReactNode;
}) {
  return (
    <AuthContext.Provider
      value={{
        initialTokens,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};
