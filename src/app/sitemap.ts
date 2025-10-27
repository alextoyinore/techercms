
import { MetadataRoute } from 'next';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { firebaseConfig } from '@/firebase/config';

// Initialize Firebase Admin SDK if not already initialized
if (!getApps().length) {
  try {
    // This will use the GCLOUD_PROJECT environment variable on App Hosting
    initializeApp();
  } catch (e: any) {
    // Fallback for local development
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
