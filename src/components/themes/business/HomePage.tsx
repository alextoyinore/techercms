
'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp, doc, orderBy, limit } from 'firebase/firestore';
import { format } from 'date-fns';
import { Loading } from '@/components/loading';
import { WidgetArea } from '@/components/widgets/WidgetArea';
import { TrendingUp, ArrowRight, MenuIcon } from 'lucide-react';
import { Sheet, SheetTrigger, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from '@/components/Menu';
import { SearchForm } from '../SearchForm';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

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
  siteLogoUrl?: string;
}

export function PublicHeader({ siteName, siteLogoUrl }: { siteName?: string, siteLogoUrl?: string }) {
    return (
        <header className="py-3 px-4 sticky top-0 bg-background/95 backdrop-blur-sm z-20 border-b border-border">
            <div className="container mx-auto flex justify-between items-center">
                <Link href="/" className="text-2xl font-black font-headline text-primary tracking-tighter">
                    {siteLogoUrl ? (
                        <Image src={siteLogoUrl} alt={siteName || 'Site Logo'} width={120} height={40} className="object-contain h-10 w-auto" />
                    ) : (
                        siteName || ''
                    )}
                </Link>
                 <div className="hidden md:flex items-center gap-4">
                    <nav>
                        <Menu locationId="business-header" className="flex items-center gap-6 text-sm font-semibold uppercase" linkClassName="hover:text-primary transition-colors text-muted-foreground" />
                    </nav>
                    <SearchForm />
                </div>
                 <div className="md:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MenuIcon />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right">
                            <SheetTitle className="sr-only">Main Menu</SheetTitle>
                             <div className="py-6">
                               <Menu locationId="business-header" className="flex flex-col space-y-4 text-lg font-headline" linkClassName="hover:text-primary transition-colors" />
                                <div className="mt-6 pt-6 border-t">
                                    <SearchForm />
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
             <div className="border-t mt-3">
                <ScrollArea className="container mx-auto px-4 w-full whitespace-nowrap">
                    <Menu locationId="business-subheader" className="flex items-center gap-6 text-sm" linkClassName="text-muted-foreground hover:text-foreground py-2 inline-block" />
                    <ScrollBar orientation="horizontal" className="invisible md:visible" />
                </ScrollArea>
            </div>
        </header>
    )
}

export function PublicFooter({ siteName }: { siteName?: string }) {
    return (
        <footer className="py-12 px-6 border-t mt-16 bg-card">
            <div className="container mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-2">
                    <p className="font-bold font-headline text-primary text-lg">© {new Date().getFullYear()} {siteName || ''}</p>
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
    const date = post.createdAt.toDate();
    const dateLink = `/archive/${format(date, 'yyyy/MM/dd')}`;
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
            <Link href={dateLink}>
                <time className="text-xs text-muted-foreground/70 mt-1 block hover:underline">
                    {format(date, 'MMM d, yyyy')}
                </time>
            </Link>
        </div>
    )
}

export default function HomePage() {
  const firestore = useFirestore();

  const postsQuery = useMemoFirebase(() => {
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

  const { data: posts, isLoading: isLoadingPosts } = useCollection<Post>(postsQuery);
  const { data: settings, isLoading: isLoadingSettings } = useDoc<SiteSettings>(settingsRef);
  
  const sortedPosts = useMemo(() => {
    if (!posts) return [];
    return [...posts].sort((a, b) => (b.createdAt?.toDate() ?? 0) > (a.createdAt?.toDate() ?? 0) ? 1 : -1);
  }, [posts]);

  const hasContent = sortedPosts.length > 0;
  const [heroPost, ...otherPosts] = sortedPosts;
  const topStories = otherPosts.slice(0, 4);
  const latestStories = otherPosts.slice(4, 9);
  const moreStories = otherPosts.slice(9, 15);

  const isLoading = isLoadingPosts || isLoadingSettings;

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="bg-background text-foreground font-sans">
        {hasContent && <PublicHeader siteName={settings?.siteName} siteLogoUrl={settings?.siteLogoUrl} />}
        <main className="container mx-auto py-8 px-4">
            
            {!hasContent ? (
                <div className="text-center py-24">
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
                                   <Link href={`/archive/${format(post.createdAt.toDate(), 'yyyy/MM/dd')}`}>
                                        <time className="text-xs text-muted-foreground/70 mt-1 block hover:underline">
                                            {format(post.createdAt.toDate(), 'h:mm a')}
                                        </time>
                                   </Link>
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
        {hasContent && <PublicFooter siteName={settings?.siteName} />}
    </div>
  );
}
