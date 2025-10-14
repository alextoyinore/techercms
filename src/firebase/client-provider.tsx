'use client';

import { FirebaseProvider } from './provider';
import { initializeFirebase } from '.';

interface FirebaseClientProviderProps {
  children: React.ReactNode;
}

export function FirebaseClientProvider({
  children,
}: FirebaseClientProviderProps) {
  const { app, auth, firestore } = initializeFirebase();
  return (
    <FirebaseProvider 
        firebaseApp={app}
        auth={auth}
        firestore={firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
