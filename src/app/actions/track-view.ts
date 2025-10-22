'use server';

import { getFirestore } from 'firebase-admin/firestore';
import { headers } from 'next/headers';
import { initializeApp, getApps } from 'firebase-admin/app';
import { firebaseConfig } from '@/firebase/config';

// Initialize Firebase Admin SDK if not already initialized
if (!getApps().length) {
  initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

const db = getFirestore();

export async function trackView(postId: string) {
  if (!postId) {
    return { error: 'Post ID is required' };
  }

  // Get user's IP address from headers
  const forwarded = headers().get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(/, /)[0] : headers().get('x-real-ip');

  if (!ip) {
    // Cannot track view without an IP
    return { error: 'Could not determine IP address' };
  }

  try {
    const viewRef = db.collection('posts').doc(postId).collection('views').doc(ip);
    const viewDoc = await viewRef.get();

    if (!viewDoc.exists) {
      await viewRef.set({
        timestamp: new Date(),
      });
    }
    return { success: true };
  } catch (error: any) {
    console.error('Error tracking view:', error);
    return { error: 'Failed to track view' };
  }
}
