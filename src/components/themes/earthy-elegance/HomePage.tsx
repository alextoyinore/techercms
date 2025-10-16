'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp, doc, orderBy } from 'firebase/firestore';
import { format } from 'date-fns';
import { Loading } from '@/components/loading';
import { WidgetArea } from '@/components/widgets/WidgetArea';
import { Button } from '@/components/ui/button';

type Post = {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  featuredImageUrl: string;
  createdAt: Timestamp;
};

type SiteSettings = {
  siteName?: string;
}

function PublicHeader({ siteName }: { siteName?: string }) {
    return (
        <header className="py-6 px-6 sticky top-0 bg-emerald-50/80 backdrop-blur-md z-20">
            <div className="container mx-auto flex justify-between items-center">
                <Link href="/" className="text-2xl font-bold font-headline text-emerald-900">
                    {siteName || 'Earthy Elegance'}
                </Link>
                <nav>
                    <Link href="/login" className="text-sm font-medium text-emerald-800 hover:text-emerald-600">
                        Admin Login
                    </Link>
                </nav>
            </div>
        </header>
    )
}

function PublicFooter() {
    return (
        <footer className="py-12 px-6 border-t border-emerald-200 mt-16 bg-white">
            <div className="container mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-2">
                    <p className="font-bold font-headline text-emerald-900 text-lg">Earthy Elegance</p>
                    <p className="text-sm text-emerald-700/80 mt-2">&copy; {new Date().getFullYear()} All Rights Reserved.</p>
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
      where('status', '==', 'published'),
      orderBy('createdAt', 'desc')
    );
  }, [firestore]);

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'site_settings', 'config');
  }, [firestore]);

  const { data: posts, isLoading: isLoadingPosts } = useCollection<Post>(postsCollection);
  const { data: settings, isLoading: isLoadingSettings } = useDoc<SiteSettings>(settingsRef);
  
  const [heroPost, ...otherPosts] = posts || [];

  const isLoading = isLoadingPosts || isLoadingSettings;

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="bg-emerald-50 text-emerald-900 min-h-screen">
        <PublicHeader siteName={settings?.siteName} />
        <main className="container mx-auto py-8 px-4">
            
            {!posts || posts.length === 0 ? (
                <div className="text-center py-24">
                    <h2 className="text-3xl font-bold font-headline text-emerald-800">A quiet space.</h2>
                    <p className="text-emerald-700/80 mt-4">Content is being cultivated. Please return soon.</p>
                </div>
            ) : (
                <>
                    {heroPost && (
                        <div className="grid md:grid-cols-5 gap-8 items-center mb-16">
                            <div className="md:col-span-2">
                                <Link href={`/${heroPost.slug}`} className="block group">
                                    <div className="relative aspect-[3/4] rounded-lg overflow-hidden shadow-lg">
                                        <Image 
                                            src={heroPost.featuredImageUrl || 'https://picsum.photos/seed/earthy-hero/600/800'} 
                                            alt={heroPost.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                            priority
                                        />
                                    </div>
                                </Link>
                            </div>
                            <div className="md:col-span-3">
                                <h1 className="text-4xl lg:text-6xl font-bold font-headline leading-tight mb-4">
                                    <Link href={`/${heroPost.slug}`} className="hover:text-emerald-600 transition-colors">{heroPost.title}</Link>
                                </h1>
                                 <time className="text-sm text-emerald-700/80 mb-4 block">
                                    {heroPost.createdAt ? format(heroPost.createdAt.toDate(), 'MMMM d, yyyy') : ''}
                                </time>
                                <p className="text-lg text-emerald-800/90 mb-6">{heroPost.excerpt}</p>
                                <Button asChild size="lg" variant="outline" className="border-emerald-800 text-emerald-800 hover:bg-emerald-800 hover:text-white">
                                    <Link href={`/${heroPost.slug}`}>
                                        Continue Reading
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    )}
                    
                    <div className="space-y-8 mb-16">
                        <WidgetArea areaName="Homepage Content" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {otherPosts.map(post => (
                           <div key={post.id} className="bg-white/50 rounded-lg overflow-hidden flex flex-col group border border-emerald-200 hover:shadow-xl transition-shadow">
                                <Link href={`/${post.slug}`} className="block">
                                    <div className="relative aspect-video">
                                        <Image
                                            src={post.featuredImageUrl || 'https://picsum.photos/seed/earthy-post/600/400'}
                                            alt={post.title}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                </Link>
                                <div className="p-6 flex-grow flex flex-col">
                                    <h3 className="font-bold font-headline text-xl leading-tight text-emerald-900">
                                        <Link href={`/${post.slug}`} className="group-hover:text-emerald-600 transition-colors">{post.title}</Link>
                                    </h3>
                                    <p className="text-sm text-emerald-800/80 mt-2 flex-grow line-clamp-3">{post.excerpt}</p>
                                    <time className="text-xs text-emerald-600/70 mt-4 block">
                                        {post.createdAt ? format(post.createdAt.toDate(), 'PP') : ''}
                                    </time>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </main>
        <PublicFooter />
    </div>
  );
}
