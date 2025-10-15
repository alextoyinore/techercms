'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp, doc } from 'firebase/firestore';
import { format } from 'date-fns';
import { Loading } from '@/components/loading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { WidgetArea } from '@/components/widgets/WidgetArea';

type Post = {
  id: string;
  title: string;
  content: string;
  slug: string;
  featuredImageUrl: string;
  status: 'draft' | 'published' | 'archived';
  createdAt: Timestamp;
  tagIds?: string[];
};

type Page = {
  id: string;
  title: string;
  content: string;
  slug: string;
  featuredImageUrl: string;
  status: 'draft' | 'published';
  createdAt: Timestamp;
};

type SiteSettings = {
    siteName?: string;
}

function PublicHeader({ siteName }: { siteName?: string }) {
    return (
        <header className="py-4 px-6 border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
            <div className="container mx-auto flex justify-between items-center">
                <Link href="/" className="text-2xl font-bold font-headline text-primary">
                     {siteName || 'My Awesome Site'}
                </Link>
                <nav>
                    <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-primary">
                        Admin Login
                    </Link>
                </nav>
            </div>
        </header>
    )
}

function PublicFooter() {
    return (
        <footer className="py-12 px-6 border-t mt-12 bg-muted/20">
            <div className="container mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-2">
                    <p className="font-bold font-headline text-primary text-lg">My Awesome Site</p>
                    <p className="text-sm text-muted-foreground mt-2">© {new Date().getFullYear()} All Rights Reserved.</p>
                </div>
                 <div className="space-y-4">
                    <WidgetArea areaName="Footer Column 1" />
                </div>
                <div className="space-y-4">
                    <WidgetArea areaName="Footer Column 2" />
                </div>
            </div>
        </footer>
    )
}

// Accept an optional preloadedItem prop
export default function SlugPage({ preloadedItem }: { preloadedItem?: Page | Post }) {
  const params = useParams();
  // If no preloadedItem is provided (e.g., navigating directly), use the slug from URL
  const slug = preloadedItem ? (preloadedItem as any).slug : params.slug as string;
  const firestore = useFirestore();

  const postsQuery = useMemoFirebase(() => {
    if (!firestore || !slug || preloadedItem) return null;
    return query(collection(firestore, 'posts'), where('slug', '==', slug), where('status', '==', 'published'));
  }, [firestore, slug, preloadedItem]);

  const pagesQuery = useMemoFirebase(() => {
    if (!firestore || !slug || preloadedItem) return null;
    return query(collection(firestore, 'pages'), where('slug', '==', slug), where('status', '==', 'published'));
  }, [firestore, slug, preloadedItem]);

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'site_settings', 'config');
  }, [firestore]);

  const { data: posts, isLoading: isLoadingPosts } = useCollection<Post>(postsQuery);
  const { data: pages, isLoading: isLoadingPages } = useCollection<Page>(pagesQuery);
  const { data: settings, isLoading: isLoadingSettings } = useDoc<SiteSettings>(settingsRef);

  const item: (Post | Page) | null = useMemo(() => {
    // Prioritize preloadedItem if it exists
    if (preloadedItem) return preloadedItem;
    if (isLoadingPosts || isLoadingPages) return null;
    if (posts && posts.length > 0) return posts[0];
    if (pages && pages.length > 0) return pages[0];
    return null;
  }, [preloadedItem, posts, pages, isLoadingPosts, isLoadingPages]);

  if (isLoadingPosts || isLoadingPages || isLoadingSettings) {
    return <Loading />;
  }

  if (!item) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center">
            <h1 className="text-4xl font-bold mb-4">404 - Not Found</h1>
            <p className="text-muted-foreground mb-8">The page or post you're looking for doesn't exist.</p>
            <Button asChild variant="outline">
                <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Homepage
                </Link>
            </Button>
        </div>
    );
  }
  
  const isPost = 'tagIds' in item;
  const pageId = !isPost ? item.id : undefined;

  return (
    <div className="bg-background">
      <WidgetArea areaName="Page Header" isPageSpecific={!!pageId} pageId={pageId}/>
      <PublicHeader siteName={settings?.siteName}/>
      <main className="container mx-auto py-8 px-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            <div className="lg:col-span-3">
                <article>
                <header className="mb-8">
                    <h1 className="text-4xl font-extrabold font-headline tracking-tight lg:text-5xl mb-4">{item.title}</h1>
                    <time className="text-muted-foreground text-sm">
                    Published on {item.createdAt ? format(item.createdAt.toDate(), 'PP') : ''}
                    </time>
                </header>
                
                {item.featuredImageUrl && (
                    <div className="relative aspect-video w-full mb-8 rounded-lg overflow-hidden shadow-lg">
                    <Image
                        src={item.featuredImageUrl}
                        alt={item.title}
                        fill
                        className="object-cover"
                    />
                    </div>
                )}
                
                <div
                    className="prose dark:prose-invert lg:prose-lg max-w-none mx-auto"
                    dangerouslySetInnerHTML={{ __html: item.content }}
                />

                {isPost && item.tagIds && item.tagIds.length > 0 && (
                    <footer className="mt-12">
                        <div className="flex flex-wrap gap-2">
                            {item.tagIds.map(tag => (
                                <Badge key={tag} variant="secondary">{tag}</Badge>
                            ))}
                        </div>
                    </footer>
                )}
                </article>
            </div>
            <aside className="lg:col-span-1 space-y-8">
                <WidgetArea areaName="Sidebar" />
                <WidgetArea areaName="Page Sidebar" isPageSpecific={!!pageId} pageId={pageId} />
            </aside>
        </div>
      </main>
      <WidgetArea areaName="Page Footer" isPageSpecific={!!pageId} pageId={pageId} />
      <PublicFooter />
    </div>
  );
}
