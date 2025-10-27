
'use client';

import { useEffect } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { useFirebase, useAuth, setDocumentNonBlocking } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { doc } from 'firebase/firestore';

export function PushNotificationManager() {
  const { firebaseApp, firestore } = useFirebase();
  const auth = useAuth();
  const user = auth?.currentUser;
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && firebaseApp) {
      const messaging = getMessaging(firebaseApp);

      // Handle foreground messages
      onMessage(messaging, (payload) => {
        console.log('Foreground message received.', payload);
        toast({
          title: payload.notification?.title,
          description: payload.notification?.body,
        });
      });

      const requestPermission = async () => {
        if (!user) return;

        try {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            console.log('Notification permission granted.');
            
            const currentToken = await getToken(messaging, {
              vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
            });

            if (currentToken) {
              console.log('FCM Token:', currentToken);
              // Save the token to Firestore for this user
              const tokenRef = doc(firestore, `users/${user.uid}/fcmTokens`, currentToken);
              setDocumentNonBlocking(tokenRef, { token: currentToken, createdAt: new Date() }, {});
            } else {
              console.log('No registration token available. Request permission to generate one.');
            }
          } else {
            console.log('Unable to get permission to notify.');
          }
        } catch (error) {
          console.error('An error occurred while retrieving token. ', error);
        }
      };

      requestPermission();
    }
  }, [firebaseApp, user, firestore, toast]);

  // This component doesn't render anything
  return null;
}
