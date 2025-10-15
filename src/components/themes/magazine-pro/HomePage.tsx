'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp, doc } from 'firebase/firestore';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loading } from '@/components/loading';
import { WidgetArea } from '@/components/widgets/WidgetArea';

type Post = {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  featuredImageUrl: string;
  status: 'draft' | 'published' | 'archived';
  createdAt: Timestamp;
};

type SiteSettings = {
  siteName?: string;
}

function PublicHeader({ siteName }: { siteName?: string }) {
    return (
        <header className="py-4 px-6 border-b">
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


export default function HomePage() {
  const firestore = useFirestore();

  const postsCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'posts'),
      where('status', '==', 'published')
    );
  }, [firestore]);

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'site_settings', 'config');
  }, [firestore]);

  const { data: posts, isLoading: isLoadingPosts } = useCollection<Post>(postsCollection);
  const { data: settings, isLoading: isLoadingSettings } = useDoc<SiteSettings>(settingsRef);

  const sortedPosts = useMemo(() => {
    if (!posts) return [];
    return [...posts].sort((a, b) => {
      const dateA = a.createdAt?.toDate() ?? new Date(0);
      const dateB = b.createdAt?.toDate() ?? new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
  }, [posts]);

  const isLoading = isLoadingPosts || isLoadingSettings;

  return (
    <div className="bg-background min-h-screen">
        <PublicHeader siteName={settings?.siteName} />
        <main className="container mx-auto py-8 px-6">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold font-headline tracking-tight lg:text-5xl">Our Blog</h1>
                <p className="mt-4 text-lg text-muted-foreground">The latest news, updates, and stories.</p>
            </div>

            <div className="mb-12 space-y-8">
                <WidgetArea areaName="Homepage Content" />
            </div>

            {isLoading && <Loading />}

            {!isLoading && (!sortedPosts || sortedPosts.length === 0) && (
                <div className="text-center py-16">
                    <p className="text-muted-foreground">No posts have been published yet. Check back soon!</p>
                </div>
            )}

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {sortedPosts.map((post) => (
                    <Card key={post.id} className="flex flex-col overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
                         <Link href={`/${post.slug}`} className="block">
                            <div className="relative aspect-video">
                                <Image 
                                    src={post.featuredImageUrl || 'https://picsum.photos/seed/placeholder/600/400'} 
                                    alt={post.title}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        </Link>
                        <CardHeader>
                            <CardTitle className="font-headline text-xl leading-snug">
                                <Link href={`/${post.slug}`}>{post.title}</Link>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <p className="text-muted-foreground line-clamp-3">{post.excerpt}</p>
                        </CardContent>
                        <div className="p-4 pt-0 text-xs text-muted-foreground">
                            <span>{post.createdAt ? format(post.createdAt.toDate(), 'PP') : 'N/A'}</span>
                        </div>
                    </Card>
                ))}
            </div>
        </main>
        <PublicFooter />
    </div>
  );
}
