
'use server';

import { getFirestore, Timestamp } from 'firebase-admin/firestore';
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

// A view from the same IP will be counted again after this many hours.
const VIEW_COOLDOWN_HOURS = 24;

export async function trackView(postId: string) {
  if (!postId) {
    return { error: 'Post ID is required' };
  }

  const forwardedFor = headers().get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : headers().get('x-real-ip');

  if (!ip) {
    return { error: 'Could not determine IP address.' };
  }

  try {
    const sanitizedIp = ip.replace(/\//g, '_');
    const viewRef = db.collection('posts').doc(postId).collection('views').doc(sanitizedIp);
    const viewDoc = await viewRef.get();

    const now = Timestamp.now();
    
    if (viewDoc.exists) {
        const lastViewTimestamp = viewDoc.data()?.timestamp as Timestamp;
        const hoursSinceLastView = (now.seconds - lastViewTimestamp.seconds) / 3600;

        // If the last view was within the cooldown period, do nothing.
        if (hoursSinceLastView < VIEW_COOLDOWN_HOURS) {
            return { success: true, message: 'View already counted recently.' };
        }
    }
    
    // If doc doesn't exist OR it's past the cooldown, set/update the timestamp.
    // This counts as a new view.
    await viewRef.set({
        timestamp: now,
    });
    
    return { success: true, message: 'View tracked.' };

  } catch (error: any) {
    console.error('Error tracking view:', error);
    return { error: 'Failed to track view due to a server error.' };
  }
}
