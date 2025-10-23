
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

  // Get user's IP address from headers.
  // 'x-forwarded-for' is the standard header for identifying the originating IP address of a client.
  const forwardedFor = headers().get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : headers().get('x-real-ip');

  if (!ip) {
    // Cannot track view without an IP. This might happen in local dev environments.
    return { error: 'Could not determine IP address.' };
  }

  try {
    // Use the IP address as the document ID to ensure uniqueness per post.
    // Firestore does not allow slashes in document IDs, so we replace them.
    const sanitizedIp = ip.replace(/\//g, '_');
    const viewRef = db.collection('posts').doc(postId).collection('views').doc(sanitizedIp);
    const viewDoc = await viewRef.get();

    // Only create a new view document if one for this IP doesn't already exist.
    if (!viewDoc.exists) {
      await viewRef.set({
        timestamp: new Date(),
      });
    }
    return { success: true };
  } catch (error: any) {
    console.error('Error tracking view:', error);
    return { error: 'Failed to track view due to a server error.' };
  }
}
