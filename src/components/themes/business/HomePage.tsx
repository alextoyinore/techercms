'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp, doc, orderBy, limit } from 'firebase/firestore';
import { format } from 'date-fns';
import { Loading } from '@/components/loading';
import { WidgetArea } from '@/components/widgets/WidgetArea';
import { TrendingUp, ArrowRight } from 'lucide-react';

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
        <header className="py-3 px-4 sticky top-0 bg-background/95 backdrop-blur-sm z-20 border-b border-border">
            <div className="container mx-auto flex justify-between items-center">
                <Link href="/" className="text-2xl font-black font-headline text-primary tracking-tighter">
                    {siteName || 'Business Today'}
                </Link>
                <nav>
                    <Link href="/login" className="text-xs font-semibold uppercase text-muted-foreground hover:text-primary">
                        Login
                    </Link>
                </nav>
            </div>
        </header>
    )
}

function PublicFooter() {
    return (
        <footer className="py-12 px-6 border-t mt-16 bg-card">
            <div className="container mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-2">
                    <p className="font-bold font-headline text-primary text-lg">{new Date().getFullYear()} © {siteName || 'Business Today'}</p>
                    <p className="text-sm text-muted-foreground mt-2">All rights reserved.</p>
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

function PostCard({ post }: { post: Post }) {
    return (
        <div className="group">
             {post.featuredImageUrl && (
                <Link href={`/${post.slug}`}>
                    <div className="relative aspect-video w-full overflow-hidden mb-2">
                        <Image
                            src={post.featuredImageUrl}
                            alt={post.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    </div>
                </Link>
            )}
            <h3 className="font-semibold text-lg leading-tight group-hover:underline">
                <Link href={`/${post.slug}`}>{post.title}</Link>
            </h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{post.excerpt}</p>
            <time className="text-xs text-muted-foreground/70 mt-1 block">
                {format(post.createdAt.toDate(), 'MMM d, yyyy')}
            </time>
        </div>
    )
}

export default function HomePage() {
  const firestore = useFirestore();

  const postsQuery = useMemoFirebase(() => {
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

  const { data: posts, isLoading: isLoadingPosts } = useCollection<Post>(postsQuery);
  const { data: settings, isLoading: isLoadingSettings } = useDoc<SiteSettings>(settingsRef);
  
  const [heroPost, ...otherPosts] = posts || [];
  const topStories = otherPosts.slice(0, 4);
  const latestStories = otherPosts.slice(4, 9);
  const moreStories = otherPosts.slice(9, 15);

  const isLoading = isLoadingPosts || isLoadingSettings;

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="bg-background text-foreground font-sans">
        <PublicHeader siteName={settings?.siteName} />
        <main className="container mx-auto py-8 px-4">
            
            {!posts || posts.length === 0 ? (
                <div className="text-center py-24">
                    <h2 className="text-3xl font-bold font-headline">Market is Quiet</h2>
                    <p className="text-muted-foreground mt-4">No stories have been published yet. Check back for the latest financial news.</p>
                </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8">
                    {heroPost && (
                        <div className="pb-6 border-b">
                            <h1 className="font-black font-headline text-4xl lg:text-5xl leading-tight mb-4 hover:underline">
                                <Link href={`/${heroPost.slug}`}>{heroPost.title}</Link>
                            </h1>
                            <p className="text-lg text-muted-foreground mb-4">{heroPost.excerpt}</p>
                             {heroPost.featuredImageUrl && (
                                <Link href={`/${heroPost.slug}`}>
                                    <div className="relative aspect-video w-full overflow-hidden">
                                        <Image
                                            src={heroPost.featuredImageUrl}
                                            alt={heroPost.title}
                                            fill
                                            className="object-cover"
                                            priority
                                        />
                                    </div>
                                </Link>
                            )}
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mt-6">
                        {topStories.map(post => <PostCard key={post.id} post={post} />)}
                    </div>
                </div>
                <aside className="lg:col-span-4 space-y-8">
                  <div className="space-y-4">
                      <h2 className="font-bold text-lg border-b-2 border-primary pb-2">Latest</h2>
                      <ul className="space-y-3">
                          {latestStories.map(post => (
                              <li key={post.id} className="border-b pb-3 last:border-0">
                                  <h4 className="font-semibold hover:underline leading-tight">
                                      <Link href={`/${post.slug}`}>{post.title}</Link>
                                  </h4>
                                   <time className="text-xs text-muted-foreground/70 mt-1 block">
                                      {format(post.createdAt.toDate(), 'h:mm a')}
                                  </time>
                              </li>
                          ))}
                      </ul>
                  </div>
                  <WidgetArea areaName="Sidebar" />
                </aside>

                <div className="lg:col-span-12 mt-8 pt-8 border-t">
                  <h2 className="font-bold text-2xl border-b-2 border-primary pb-2 mb-6 flex items-center gap-2">
                    <TrendingUp />
                    Market Movers
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                    {moreStories.map(post => (
                       <div key={post.id} className="group">
                           <h4 className="font-semibold hover:underline leading-tight text-sm">
                               <Link href={`/${post.slug}`}>{post.title}</Link>
                           </h4>
                           <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{post.excerpt}</p>
                       </div>
                    ))}
                  </div>
                </div>
                <div className="lg:col-span-12 mt-8">
                  <WidgetArea areaName="Homepage Content" />
                </div>
              </div>
            )}
        </main>
        <PublicFooter />
    </div>
  );
}
