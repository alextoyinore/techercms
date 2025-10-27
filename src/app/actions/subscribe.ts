
'use server';

import { z } from 'zod';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { firebaseConfig } from '@/firebase/config';

if (!getApps().length) {
  initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

const db = getFirestore();

const subscribeSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
});

export type SubscribeState = {
  message?: string;
  isSuccess?: boolean;
  errors?: {
    email?: string[];
  };
};

export async function subscribe(
  prevState: SubscribeState,
  formData: FormData
): Promise<SubscribeState> {
  const parsed = subscribeSchema.safeParse({
    email: formData.get('email'),
  });

  if (!parsed.success) {
    return {
      message: 'Invalid email address.',
      errors: parsed.error.flatten().fieldErrors,
    };
  }
  
  const { email } = parsed.data;

  try {
    const subscriptionsRef = db.collection('subscriptions');
    const existingSubQuery = await subscriptionsRef.where('email', '==', email).limit(1).get();

    if (!existingSubQuery.empty) {
        return { message: "You're already subscribed. Thank you!", isSuccess: true };
    }

    await subscriptionsRef.add({
      email,
      createdAt: Timestamp.now(),
    });

    return { message: 'Thank you for subscribing!', isSuccess: true };
  } catch (error) {
    console.error('Subscription error:', error);
    return { message: 'An unexpected error occurred. Please try again later.' };
  }
}
