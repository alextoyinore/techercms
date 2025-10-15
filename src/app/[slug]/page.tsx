'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, notFound } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp, DocumentData } from 'firebase/firestore';
import { format } from 'date-fns';
import { Loading } from '@/components/loading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

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

function PublicHeader() {
    return (
        <header className="py-4 px-6 border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
            <div className="container mx-auto flex justify-between items-center">
                <Link href="/" className="text-2xl font-bold font-headline text-primary">
                    My Awesome Site
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
        <footer className="py-6 px-6 border-t mt-12">
            <div className="container mx-auto text-center text-muted-foreground text-sm">
                <p>&copy; {new Date().getFullYear()} My Awesome Site. All Rights Reserved.</p>
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

  const { data: posts, isLoading: isLoadingPosts } = useCollection<Post>(postsQuery);
  const { data: pages, isLoading: isLoadingPages } = useCollection<Page>(pagesQuery);

  const item: (Post | Page) | null = useMemo(() => {
    if (isLoadingPosts || isLoadingPages) return null;
    if (posts && posts.length > 0) return posts[0];
    if (pages && pages.length > 0) return pages[0];
    return null;
  }, [posts, pages, isLoadingPosts, isLoadingPages]);

  if (isLoadingPosts || isLoadingPages) {
    return <Loading />;
  }

  if (!item) {
    // This will be caught by the notFound() call in a real app,
    // but for now, it shows a user-friendly message.
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

  return (
    <div className="bg-background">
      <PublicHeader />
      <main className="container mx-auto py-8 px-6 max-w-4xl">
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
      </main>
      <PublicFooter />
    </div>
  );
}
