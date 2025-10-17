'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp, doc, orderBy, limit } from 'firebase/firestore';
import { format } from 'date-fns';
import { Loading } from '@/components/loading';
import { WidgetArea } from '@/components/widgets/WidgetArea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronRight, MenuIcon } from 'lucide-react';
import { Sheet, SheetTrigger, SheetContent } from '@/components/ui/sheet';
import { Menu } from '@/components/Menu';
import { SearchForm } from '../SearchForm';

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

export function PublicHeader({ siteName }: { siteName?: string }) {
    return (
        <header className="py-4 px-4 sticky top-0 bg-primary text-primary-foreground z-20 shadow-lg">
            <div className="container mx-auto flex justify-between items-center">
                <Link href="/" className="text-3xl font-black font-headline tracking-tighter uppercase">
                    {siteName || ''}
                </Link>
                <div className="hidden md:flex items-center gap-4">
                    <nav>
                         <Menu locationId="sports-header" className="flex items-center gap-6 text-sm font-semibold uppercase" linkClassName="hover:underline" />
                    </nav>
                    <SearchForm />
                </div>
                 <div className="md:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="hover:bg-white/20">
                                <MenuIcon />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="bg-primary text-primary-foreground border-l-0">
                            <div className="py-6">
                               <Menu locationId="sports-header" className="flex flex-col space-y-4 text-lg" linkClassName="hover:underline" />
                                <div className="mt-6 border-t border-white/20 pt-6">
                                    <Link href="/login" className="text-lg font-semibold uppercase hover:underline">
                                        Login
                                    </Link>
                                    <div className="mt-4">
                                        <SearchForm />
                                    </div>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
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

function PostCard({ post, className, titleSize = 'text-xl' }: { post: Post, className?: string, titleSize?: string }) {
    return (
        <div className={cn("group flex flex-col", className)}>
             {post.featuredImageUrl && (
                <Link href={`/${post.slug}`}>
                    <div className="relative aspect-video w-full overflow-hidden bg-muted">
                        <Image
                            src={post.featuredImageUrl}
                            alt={post.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    </div>
                </Link>
            )}
            <div className="py-3 flex-grow flex flex-col">
                <h3 className={cn("font-extrabold font-headline leading-tight group-hover:underline", titleSize)}>
                    <Link href={`/${post.slug}`}>{post.title}</Link>
                </h3>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2 flex-grow">{post.excerpt}</p>
                <Link href={`/archive/${format(post.createdAt.toDate(), 'yyyy/MM')}`}>
                    <time className="text-xs text-muted-foreground/80 mt-2 block hover:underline">
                        {format(post.createdAt.toDate(), 'MMM d, yyyy')}
                    </time>
                </Link>
            </div>
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
  const [heroPost, secondPost, ...otherPosts] = sortedPosts;
  const topStories = otherPosts.slice(0, 4);

  if (isLoadingPosts || isLoadingSettings) {
    return <Loading />;
  }

  return (
    <div className="bg-background text-foreground font-sans">
        {hasContent && <PublicHeader siteName={settings?.siteName} />}
        <main className="container mx-auto py-6 px-4">
            {!hasContent ? (
                <div className="text-center py-24">
                    <p className="text-muted-foreground mt-4">The latest scores and stories are on the way. Check back soon.</p>
                </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    {heroPost && (
                        <div className="group relative">
                             {heroPost.featuredImageUrl && (
                                <Link href={`/${heroPost.slug}`}>
                                    <div className="relative aspect-video w-full overflow-hidden bg-muted">
                                        <Image
                                            src={heroPost.featuredImageUrl}
                                            alt={heroPost.title}
                                            fill
                                            className="object-cover"
                                            priority
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent"/>
                                    </div>
                                </Link>
                            )}
                            <div className="absolute bottom-0 p-6">
                                <h1 className="font-black font-headline text-3xl md:text-5xl leading-tight text-white shadow-2xl group-hover:underline">
                                    <Link href={`/${heroPost.slug}`}>{heroPost.title}</Link>
                                </h1>
                            </div>
                        </div>
                    )}
                </div>
                <aside className="lg:col-span-1 space-y-4">
                    {secondPost && <PostCard post={secondPost} />}
                    <div className="grid grid-cols-2 gap-x-4">
                      {topStories.slice(0, 2).map(p => <PostCard key={p.id} post={p} titleSize="text-base" />)}
                    </div>
                </aside>
                <div className="lg:col-span-3 mt-6">
                    <WidgetArea areaName="Homepage Content" />
                </div>
              </div>
            )}
        </main>
        {hasContent && <PublicFooter siteName={settings?.siteName} />}
    </div>
  );
}
