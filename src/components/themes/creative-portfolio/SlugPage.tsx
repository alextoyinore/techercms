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
  id:string;
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
        <header className="py-6 px-6 sticky top-0 bg-background/90 backdrop-blur-md z-10">
            <div className="container mx-auto flex justify-between items-center">
                <Link href="/" className="text-3xl font-extrabold font-headline text-primary tracking-tighter">
                     {siteName || 'Portfolio'}
                </Link>
                <nav>
                    <Link href="/login" className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">
                        Admin Login
                    </Link>
                </nav>
            </div>
        </header>
    )
}

function PublicFooter() {
    return (
        <footer className="py-12 px-6 border-t mt-16 bg-foreground text-background">
            <div className="container mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-2">
                    <p className="font-bold font-headline text-primary text-lg">A Creative Portfolio</p>
                    <p className="text-sm text-background/60 mt-2">&copy; {new Date().getFullYear()} All Rights Reserved.</p>
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

export default function SlugPage({ preloadedItem }: { preloadedItem?: Page | Post }) {
  const params = useParams();
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

  const item = useMemo(() => {
    if(preloadedItem) return preloadedItem;
    if (posts && posts.length > 0) return posts[0];
    if (pages && pages.length > 0) return pages[0];
    return null;
  }, [preloadedItem, posts, pages]);

  if (isLoadingPosts || isLoadingPages || isLoadingSettings) {
    return <Loading />;
  }

  if (!item) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-6">
            <h1 className="text-6xl font-bold font-headline mb-4">404</h1>
            <p className="text-xl text-muted-foreground mb-8">The content you're looking for seems to be lost in space.</p>
            <Button asChild variant="default" size="lg">
                <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Return to Home Base
                </Link>
            </Button>
        </div>
    );
  }
  
  const isPost = 'excerpt' in item;
  const pageId = !isPost ? item.id : undefined;

  return (
    <div className="bg-background">
      <WidgetArea areaName="Page Header" isPageSpecific={!!pageId} pageId={pageId} />
      <PublicHeader siteName={settings?.siteName}/>
      <main className="container mx-auto py-8 px-6">
        <article className="max-w-4xl mx-auto">
          {item.featuredImageUrl && (
            <div className="relative aspect-video w-full mb-8 rounded-lg overflow-hidden shadow-2xl">
              <Image
                src={item.featuredImageUrl}
                alt={item.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}
          <header className="mb-8 text-center">
            <h1 className="text-5xl font-extrabold font-headline tracking-tighter lg:text-7xl mb-4">{item.title}</h1>
            <time className="text-muted-foreground text-sm uppercase tracking-widest">
              {item.createdAt ? format(item.createdAt.toDate(), 'MMMM dd, yyyy') : ''}
            </time>
          </header>
          
          <div
            className="prose dark:prose-invert lg:prose-xl max-w-none mx-auto"
            dangerouslySetInnerHTML={{ __html: item.content }}
          />

          {isPost && (item as Post).tagIds && (item as Post).tagIds!.length > 0 && (
            <footer className="mt-12 text-center">
                <div className="flex flex-wrap gap-2 justify-center">
                    {(item as Post).tagIds!.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-sm px-4 py-1">{tag}</Badge>
                    ))}
                </div>
            </footer>
          )}
        </article>
      </main>
      <WidgetArea areaName="Page Footer" isPageSpecific={!!pageId} pageId={pageId} />
      <PublicFooter />
    </div>
  );
}
