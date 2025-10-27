
import { MetadataRoute } from 'next';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { firebaseConfig } from '@/firebase/config';

// Initialize Firebase Admin SDK
// This configuration is now robust for Vercel deployments.
// It will try to use service account credentials from environment variables,
// falling back to a simpler projectId-based setup for local development.
if (!getApps().length) {
  try {
    // Vercel deployment: Use service account credentials from environment variables
    const serviceAccount = JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT_JSON as string
    );
    initializeApp({
      credential: cert(serviceAccount),
    });
  } catch (e) {
    // Local development: Fallback to using the project ID
    console.log('Falling back to local Firebase Admin SDK initialization.');
    initializeApp({
      projectId: firebaseConfig.projectId,
    });
  }
}

const db = getFirestore();

// Define a type for the documents we'll fetch
interface SitemapEntry {
  slug?: string;
  id?: string;
  updatedAt?: {
    toDate: () => Date;
  };
}

async function fetchCollection(collectionName: string): Promise<SitemapEntry[]> {
  const snapshot = await db.collection(collectionName).where('status', '==', 'published').get();
  if (snapshot.empty) {
    return [];
  }
  return snapshot.docs.map(doc => doc.data() as SitemapEntry);
}

async function fetchCollectionSimple(collectionName: string): Promise<SitemapEntry[]> {
    const snapshot = await db.collection(collectionName).get();
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map(doc => doc.data() as SitemapEntry);
}


export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.95news.com.ng';

  // Fetch all dynamic content
  const posts = await fetchCollection('posts');
  const pages = await fetchCollection('pages');
  const categories = await fetchCollectionSimple('categories');
  const tags = await fetchCollectionSimple('tags');

  const postUrls = posts.map(post => ({
    url: `${baseUrl}/${post.slug}`,
    lastModified: post.updatedAt?.toDate() || new Date(),
  }));

  const pageUrls = pages.map(page => ({
    url: `${baseUrl}/${page.slug}`,
    lastModified: page.updatedAt?.toDate() || new Date(),
  }));

  const categoryUrls = categories.map(category => ({
    url: `${baseUrl}/category/${category.slug}`,
    lastModified: new Date(), // Categories don't have timestamps
  }));

  const tagUrls = tags.map(tag => ({
    url: `${baseUrl}/tag/${tag.slug}`,
    lastModified: new Date(), // Tags don't have timestamps
  }));
  
  // Define static routes
  const staticRoutes = [
    { url: baseUrl, lastModified: new Date() },
    { url: `${baseUrl}/news`, lastModified: new Date() },
  ];

  return [
    ...staticRoutes,
    ...postUrls,
    ...pageUrls,
    ...categoryUrls,
    ...tagUrls,
  ];
}
