'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp, doc } from 'firebase/firestore';
import { format } from 'date-fns';
import { Loading } from '@/components/loading';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

type Post = {
  id: string;
  title: string;
  content: string;
  slug: string;
  createdAt: Timestamp;
};

type Page = {
  id: string;
  title: string;
  content: string;
  slug: string;
  createdAt: Timestamp;
};

type SiteSettings = {
  siteName?: string;
}

function PublicHeader({ siteName }: { siteName?: string }) {
    return (
        <header className="py-8 px-6">
            <div className="container mx-auto max-w-3xl flex justify-between items-center">
                <Link href="/" className="text-2xl font-semibold font-headline text-foreground">
                    {siteName || 'A Minimalist Blog'}
                </Link>
                <nav>
                    <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                        Login
                    </Link>
                </nav>
            </div>
        </header>
    )
}

function PublicFooter() {
    return (
        <footer className="py-8 px-6 mt-16">
            <div className="container mx-auto max-w-3xl text-center text-muted-foreground text-xs">
                <p>&copy; {new Date().getFullYear()} A Minimalist Blog. All rights reserved.</p>
            </div>
        </footer>
    )
}

export default function SlugPage() {
  const params = useParams();
  const slug = params.slug as string;
  const firestore = useFirestore();

  const postsQuery = useMemoFirebase(() => {
    if (!firestore || !slug) return null;
    return query(collection(firestore, 'posts'), where('slug', '==', slug), where('status', '==', 'published'));
  }, [firestore, slug]);

  const pagesQuery = useMemoFirebase(() => {
    if (!firestore || !slug) return null;
    return query(collection(firestore, 'pages'), where('slug', '==', slug), where('status', '==', 'published'));
  }, [firestore, slug]);
  
  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'site_settings', 'config');
  }, [firestore]);

  const { data: posts, isLoading: isLoadingPosts } = useCollection<Post>(postsQuery);
  const { data: pages, isLoading: isLoadingPages } = useCollection<Page>(pagesQuery);
  const { data: settings, isLoading: isLoadingSettings } = useDoc<SiteSettings>(settingsRef);

  const item = useMemo(() => {
    if (posts && posts.length > 0) return posts[0];
    if (pages && pages.length > 0) return pages[0];
    return null;
  }, [posts, pages]);

  if (isLoadingPosts || isLoadingPages || isLoadingSettings) {
    return <Loading />;
  }

  if (!item) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-6">
            <h1 className="text-5xl font-bold font-headline mb-4">404</h1>
            <p className="text-lg text-muted-foreground mb-8">This page seems to be empty.</p>
            <Button asChild variant="link">
                <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to home
                </Link>
            </Button>
        </div>
    );
  }

  return (
    <div className="bg-background">
      <PublicHeader siteName={settings?.siteName}/>
      <main className="container mx-auto py-8 px-6 max-w-3xl">
        <article>
          <header className="mb-12 text-center">
             <time className="text-sm text-muted-foreground">
              Published on {item.createdAt ? format(item.createdAt.toDate(), 'MMMM d, yyyy') : ''}
            </time>
            <h1 className="text-5xl font-bold font-headline tracking-tight mt-2">{item.title}</h1>
          </header>
          
          <div
            className="prose dark:prose-invert lg:prose-lg max-w-none mx-auto"
            dangerouslySetInnerHTML={{ __html: item.content }}
          />

        </article>
      </main>
      <PublicFooter />
    </div>
  );
}

    