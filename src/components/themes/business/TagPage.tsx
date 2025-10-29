
'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp, doc } from 'firebase/firestore';
import { format } from 'date-fns';
import { Loading } from '@/components/loading';
import { ThemeLayout } from '../ThemeLayout';
import { PublicHeader, PublicFooter } from './HomePage';
import { WidgetArea } from '@/components/widgets/WidgetArea';

type Post = {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  featuredImageUrl: string;
  tagIds: string[];
  createdAt: Timestamp;
};

type SiteSettings = {
    siteName?: string;
    siteLogoUrl?: string;
}

function PostCard({ post }: { post: Post }) {
    return (
        <div className="flex flex-col sm:flex-row gap-4 border-b pb-4">
            {post.featuredImageUrl && (
                <Link href={`/${post.slug}`} className="block sm:w-1/4 shrink-0">
                    <div className="relative aspect-video w-full overflow-hidden">
                        <Image
                            src={post.featuredImageUrl}
                            alt={post.title}
                            fill
                            className="object-cover"
                        />
                    </div>
                </Link>
            )}
            <div>
                <h3 className="font-semibold text-xl leading-tight">
                    <Link href={`/${post.slug}`} className="hover:underline">{post.title}</Link>
                </h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{post.excerpt}</p>
                 <Link href={`/archive/${format(post.createdAt.toDate(), 'yyyy/MM')}`}>
                    <time className="text-xs text-muted-foreground/70 mt-1 block hover:underline">
                        {format(post.createdAt.toDate(), 'PP')}
                    </time>
                </Link>
            </div>
        </div>
    );
}

export default function TagPage() {
  const firestore = useFirestore();
  const params = useParams();
  const slug = params.slug as string;
  const decodedSlug = decodeURIComponent(slug);


  const postsQuery = useMemoFirebase(() => {
    if (!firestore || !decodedSlug) return null;
    return query(
      collection(firestore, 'posts'),
      where('status', '==', 'published'),
      where('tagIds', 'array-contains', decodedSlug)
    );
  }, [firestore, decodedSlug]);

  const { data: posts, isLoading: isLoadingPosts } = useCollection<Post>(postsQuery);

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'site_settings', 'config');
  }, [firestore]);
  const { data: settings, isLoading: isLoadingSettings } = useDoc<SiteSettings>(settingsRef);

  const sortedPosts = useMemo(() => {
    if (!posts) return [];
    return [...posts].sort((a, b) => (b.createdAt?.toDate() ?? 0) > (a.createdAt?.toDate() ?? 0) ? 1 : -1);
  }, [posts]);

  if (isLoadingPosts || isLoadingSettings) {
    return <Loading />;
  }

  return (
    <ThemeLayout 
        HeaderComponent={() => <PublicHeader siteName={settings?.siteName} siteLogoUrl={settings?.siteLogoUrl} />} 
        FooterComponent={() => <PublicFooter siteName={settings?.siteName} />} 
        className="bg-background text-foreground font-sans"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:max-w-7xl mx-auto">
        <div className="lg:col-span-9">
          <div className="mb-8 pb-4 border-b">
              <h1 className="text-3xl font-black font-headline tracking-tight lg:text-4xl">{decodedSlug}</h1>
          </div>

          {!isLoadingPosts && (!sortedPosts || sortedPosts.length === 0) && (
              <div className="text-center py-16">
                  <p className="text-muted-foreground">No posts found with this tag.</p>
              </div>
          )}

          <div className="space-y-6">
              {sortedPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
              ))}
          </div>
        </div>
        <aside className="lg:col-span-3 space-y-8 lg:sticky lg:top-24 self-start">
            <WidgetArea areaName="Sidebar" />
        </aside>
      </div>
    </ThemeLayout>
  );
}
