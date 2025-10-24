
'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp, doc, orderBy, limit, startAfter, getDocs, QueryDocumentSnapshot } from 'firebase/firestore';
import { format } from 'date-fns';
import { Loading } from '@/components/loading';
import { ThemeLayout } from '../ThemeLayout';
import { PublicHeader, PublicFooter } from './HomePage';
import { WidgetArea } from '@/components/widgets/WidgetArea';
import { Button } from '@/components/ui/button';

type Post = {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  featuredImageUrl: string;
  categoryIds: string[];
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

export default function NewsPage() {
    const firestore = useFirestore();
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
    const [hasMore, setHasMore] = useState(true);

    const settingsRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'site_settings', 'config');
    }, [firestore]);
    const { data: settings, isLoading: isLoadingSettings } = useDoc<SiteSettings>(settingsRef);
    
    const postsPerPage = 10;

    const fetchPosts = async (lastVisibleDoc: QueryDocumentSnapshot | null = null) => {
        if (!firestore) return;

        let q = query(
            collection(firestore, 'posts'),
            where('status', '==', 'published'),
            orderBy('createdAt', 'desc'),
            limit(postsPerPage)
        );

        if (lastVisibleDoc) {
            q = query(q, startAfter(lastVisibleDoc));
        }
        
        const snapshot = await getDocs(q);
        const newPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
        
        setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
        setHasMore(newPosts.length === postsPerPage);

        return newPosts;
    }

    useEffect(() => {
        const loadInitialPosts = async () => {
            setIsLoading(true);
            const initialPosts = await fetchPosts();
            if (initialPosts) {
                setPosts(initialPosts);
            }
            setIsLoading(false);
        };
        loadInitialPosts();
    }, [firestore]);


    const handleLoadMore = async () => {
        if (!hasMore || isLoadingMore) return;
        setIsLoadingMore(true);
        const morePosts = await fetchPosts(lastDoc);
        if (morePosts) {
            setPosts(prev => [...prev, ...morePosts]);
        }
        setIsLoadingMore(false);
    }
    

  if (isLoading) {
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
              <h1 className="text-3xl font-black font-headline tracking-tight lg:text-4xl">News</h1>
          </div>

          {isLoading && posts.length === 0 && (
             <div className="text-center py-16">
                <p className="text-muted-foreground">Loading posts...</p>
            </div>
          )}

          {!isLoading && posts.length === 0 && (
              <div className="text-center py-16">
                  <p className="text-muted-foreground">No posts have been published yet.</p>
              </div>
          )}

          <div className="space-y-6">
              {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
              ))}
          </div>
          {hasMore && (
            <div className="mt-8 text-center">
                <Button onClick={handleLoadMore} disabled={isLoadingMore}>
                    {isLoadingMore ? 'Loading...' : 'Load More'}
                </Button>
            </div>
          )}
        </div>
        <aside className="lg:col-span-3 space-y-8 lg:sticky lg:top-24 self-start">
            <WidgetArea areaName="Sidebar" />
        </aside>
      </div>
    </ThemeLayout>
  );
}
