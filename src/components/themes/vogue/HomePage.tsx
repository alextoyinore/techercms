'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp, doc, orderBy, limit } from 'firebase/firestore';
import { format } from 'date-fns';
import { Loading } from '@/components/loading';
import { WidgetArea } from '@/components/widgets/WidgetArea';
import { Separator } from '@/components/ui/separator';

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
        <header className="py-6 px-4 sticky top-0 bg-background/90 backdrop-blur-md z-20 border-b">
            <div className="container mx-auto flex justify-between items-center">
                 <div className="flex-1">
                    {/* Placeholder */}
                </div>
                <Link href="/" className="text-5xl font-black font-headline tracking-[0.2em] uppercase text-center flex-1">
                    {siteName || 'VOGUE'}
                </Link>
                <nav className="flex-1 text-right">
                    <Link href="/login" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground">
                        Login
                    </Link>
                </nav>
            </div>
        </header>
    )
}

function PublicFooter() {
    return (
        <footer className="py-12 px-6 border-t mt-16 bg-background">
            <div className="container mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-4 text-center">
                    <p className="font-bold font-headline text-lg">© {new Date().getFullYear()} {siteName || 'VOGUE'}</p>
                </div>
                 <div className="lg:col-span-2 space-y-4">
                    <WidgetArea areaName="Footer Column 1" />
                </div>
                <div className="lg:col-span-2 space-y-4">
                    <WidgetArea areaName="Footer Column 2" />
                </div>
            </div>
        </footer>
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
  
  const [mainPost, secondPost, thirdPost, ...otherPosts] = posts || [];
  const latestPosts = otherPosts.slice(0, 4);

  const isLoading = isLoadingPosts || isLoadingSettings;

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="bg-background text-foreground font-serif">
        <PublicHeader siteName={settings?.siteName} />
        <main className="container mx-auto py-8 px-4">
            {!posts || posts.length === 0 ? (
                 <div className="text-center py-24">
                    <h2 className="text-3xl font-bold font-headline">The Runway is Clear</h2>
                    <p className="text-muted-foreground mt-4">New looks and stories are coming soon. Stay fashionable.</p>
                </div>
            ) : (
                <div className="space-y-16">
                    {mainPost && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                            <div className="relative aspect-[3/4] bg-muted">
                                <Image src={mainPost.featuredImageUrl} alt={mainPost.title} fill className="object-cover" priority />
                            </div>
                            <div className="text-center">
                                <h1 className="text-5xl lg:text-7xl font-bold font-headline leading-none">
                                    <Link href={`/${mainPost.slug}`} className="hover:underline">{mainPost.title}</Link>
                                </h1>
                                <p className="text-lg text-muted-foreground mt-4">{mainPost.excerpt}</p>
                            </div>
                        </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {secondPost && (
                             <div className="group">
                                <div className="relative aspect-square bg-muted mb-3">
                                    <Image src={secondPost.featuredImageUrl} alt={secondPost.title} fill className="object-cover"/>
                                </div>
                                <h2 className="text-3xl font-bold font-headline leading-tight group-hover:underline">
                                    <Link href={`/${secondPost.slug}`}>{secondPost.title}</Link>
                                </h2>
                                <p className="text-muted-foreground mt-1">{secondPost.excerpt}</p>
                             </div>
                        )}
                         {thirdPost && (
                             <div className="group">
                                <div className="relative aspect-square bg-muted mb-3">
                                    <Image src={thirdPost.featuredImageUrl} alt={thirdPost.title} fill className="object-cover"/>
                                </div>
                                <h2 className="text-3xl font-bold font-headline leading-tight group-hover:underline">
                                    <Link href={`/${thirdPost.slug}`}>{thirdPost.title}</Link>
                                </h2>
                                <p className="text-muted-foreground mt-1">{thirdPost.excerpt}</p>
                             </div>
                        )}
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <h3 className="text-center font-bold font-headline text-2xl uppercase tracking-widest">The Latest</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                             {latestPosts.map(post => (
                                <div key={post.id} className="group">
                                    <div className="relative aspect-[3/4] bg-muted mb-3">
                                        <Image src={post.featuredImageUrl} alt={post.title} fill className="object-cover"/>
                                    </div>
                                    <h4 className="font-semibold text-lg leading-tight group-hover:underline">
                                        <Link href={`/${post.slug}`}>{post.title}</Link>
                                    </h4>
                                </div>
                             ))}
                        </div>
                    </div>

                    <div className="mt-12">
                        <WidgetArea areaName="Homepage Content" />
                    </div>
                </div>
            )}
        </main>
        <PublicFooter />
    </div>
  );
}
