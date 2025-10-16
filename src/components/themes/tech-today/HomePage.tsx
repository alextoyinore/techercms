'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp, doc } from 'firebase/firestore';
import { format } from 'date-fns';
import { Loading } from '@/components/loading';
import { WidgetArea } from '@/components/widgets/WidgetArea';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
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
        <header className="py-4 px-6 sticky top-0 bg-gray-900/80 backdrop-blur-sm z-20 border-b border-gray-700">
            <div className="container mx-auto flex justify-between items-center">
                <Link href="/" className="text-xl font-bold font-headline text-cyan-400 tracking-tighter">
                    {siteName || 'Tech Today'}
                </Link>
                <nav>
                    <Link href="/login" className="text-sm font-medium text-gray-400 hover:text-cyan-300">
                        Admin Login
                    </Link>
                </nav>
            </div>
        </header>
    )
}

function PublicFooter() {
    return (
        <footer className="py-12 px-6 border-t border-gray-800 mt-16 bg-gray-900">
            <div className="container mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-8 text-gray-400">
                <div className="lg:col-span-2">
                    <p className="font-bold font-headline text-cyan-400 text-lg">Tech Today</p>
                    <p className="text-sm text-gray-500 mt-2">&copy; {new Date().getFullYear()} All Rights Reserved.</p>
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
    return [...posts].sort((a, b) => (b.createdAt?.toDate() ?? 0) > (a.createdAt?.toDate() ?? 0) ? 1 : -1)
  }, [posts]);
  
  const [heroPost, ...otherPosts] = sortedPosts;

  const isLoading = isLoadingPosts || isLoadingSettings;

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="bg-gray-900 text-gray-200 min-h-screen">
        <PublicHeader siteName={settings?.siteName} />
        <main className="container mx-auto py-8 px-4">
            
            {!posts || posts.length === 0 ? (
                <div className="text-center py-24">
                    <h2 className="text-3xl font-bold font-headline text-cyan-400">System Ready</h2>
                    <p className="text-gray-400 mt-4">No articles have been deployed yet. Awaiting new data...</p>
                </div>
            ) : (
                <>
                    {heroPost && (
                        <div className="grid md:grid-cols-2 gap-8 items-center mb-16">
                            <div className="order-2 md:order-1">
                                <Badge variant="outline" className="mb-4 border-cyan-400/50 text-cyan-400">Latest Report</Badge>
                                <h1 className="text-4xl lg:text-5xl font-extrabold font-headline leading-tight mb-4">
                                    <Link href={`/${heroPost.slug}`} className="hover:text-cyan-400 transition-colors">{heroPost.title}</Link>
                                </h1>
                                <p className="text-lg text-gray-400 mb-6">{heroPost.excerpt}</p>
                                <Button asChild size="lg" className="bg-cyan-500 text-gray-900 hover:bg-cyan-400">
                                    <Link href={`/${heroPost.slug}`}>
                                        Read Full Analysis <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                            <div className="order-1 md:order-2">
                                 <Link href={`/${heroPost.slug}`} className="block group">
                                    <div className="relative aspect-video rounded-lg overflow-hidden shadow-lg shadow-cyan-500/10">
                                        <Image 
                                            src={heroPost.featuredImageUrl || 'https://picsum.photos/seed/tech-hero/800/450'} 
                                            alt={heroPost.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                            priority
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                                    </div>
                                </Link>
                            </div>
                        </div>
                    )}
                    
                    <div className="space-y-8 mb-16">
                        <WidgetArea areaName="Homepage Content" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {otherPosts.map(post => (
                           <div key={post.id} className="bg-gray-800/50 rounded-lg overflow-hidden flex flex-col group border border-gray-700/50 hover:border-cyan-400/50 transition-colors">
                                <Link href={`/${post.slug}`} className="block">
                                    <div className="relative aspect-video">
                                        <Image
                                            src={post.featuredImageUrl || 'https://picsum.photos/seed/tech-post/600/338'}
                                            alt={post.title}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                </Link>
                                <div className="p-6 flex-grow flex flex-col">
                                    <h3 className="font-bold font-headline text-xl leading-tight">
                                        <Link href={`/${post.slug}`} className="group-hover:text-cyan-400 transition-colors">{post.title}</Link>
                                    </h3>
                                    <p className="text-sm text-gray-400 mt-2 flex-grow line-clamp-3">{post.excerpt}</p>
                                    <time className="text-xs text-gray-500 mt-4 block">
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
