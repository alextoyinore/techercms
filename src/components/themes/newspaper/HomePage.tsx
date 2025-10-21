
'use client';
import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp, doc, orderBy, limit } from 'firebase/firestore';
import { format } from 'date-fns';
import { Loading } from '@/components/loading';
import { WidgetArea } from '@/components/widgets/WidgetArea';
import { Separator } from '@/components/ui/separator';
import { ThemeLayout } from '../ThemeLayout';
import { Sheet, SheetTrigger, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { MenuIcon, Search } from 'lucide-react';
import { Menu } from '@/components/Menu';
import { SearchForm } from '../SearchForm';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { PublicAuthNav } from '../PublicAuthNav';

type Post = {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  featuredImageUrl: string;
  createdAt: Timestamp;
  categoryIds?: string[];
};

type Category = {
    id: string;
    name: string;
    slug: string;
}

type SiteSettings = {
  siteName?: string;
}

export const NewspaperHeader: React.FC<{ siteName?: string }> = ({ siteName }) => {
    const [currentDate, setCurrentDate] = useState('');

    useEffect(() => {
        setCurrentDate(format(new Date(), 'eeee, MMMM d, yyyy'));
    }, []);

    return (
        <header className="border-b-2 border-foreground sticky top-0 bg-background z-20">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center py-4 border-b">
                    <div className="text-sm font-medium hidden sm:block">
                       {currentDate}
                    </div>
                    <Link href="/" className="text-2xl sm:text-4xl font-black font-headline text-center flex-1">
                        {siteName || ''}
                    </Link>
                    <div className="hidden sm:flex items-center gap-2">
                        <PublicAuthNav />
                        <SearchForm />
                    </div>
                    <div className="sm:hidden">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon"><MenuIcon /></Button>
                            </SheetTrigger>
                             <SheetContent side="right">
                                <SheetTitle className="sr-only">Main Menu</SheetTitle>
                                <div className="py-6">
                                   <Menu locationId="newspaper-main-nav" className="flex flex-col space-y-4 text-lg font-headline" linkClassName="hover:text-primary transition-colors" />
                                    <Separator className="my-4" />
                                    <SearchForm />
                                     <Separator className="my-4" />
                                    <PublicAuthNav orientation="vertical" />
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
                <nav className="hidden sm:flex justify-center items-center gap-6 py-3 text-sm font-semibold tracking-wider">
                    <Menu locationId="newspaper-main-nav" className="flex justify-center items-center gap-6 text-sm font-semibold tracking-wider" linkClassName="hover:text-primary transition-colors" />
                </nav>
                 <div className="border-t">
                    <ScrollArea className="w-full whitespace-nowrap">
                        <Menu locationId="newspaper-subheader" className="flex items-center gap-6 text-sm" linkClassName="text-muted-foreground hover:text-foreground py-2 inline-block" />
                        <ScrollBar orientation="horizontal" className="invisible md:visible" />
                    </ScrollArea>
                </div>
            </div>
        </header>
    )
};

export const NewspaperFooter: React.FC<{siteName?: string}> = ({siteName}) => (
    <footer className="py-12 px-6 border-t mt-16 bg-muted/20">
        <div className="container mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-2">
                <p className="font-bold font-headline text-primary text-lg">{siteName || ''}</p>
                <p className="text-sm text-muted-foreground mt-2">&copy; {new Date().getFullYear()} All Rights Reserved.</p>
            </div>
             <div className="space-y-4">
                <WidgetArea areaName="Footer Column 1" />
            </div>
            <div className="space-y-4">
                <WidgetArea areaName="Footer Column 2" />
            </div>
        </div>
    </footer>
);

function PostCard({ post, className, imageClassName }: { post: Post, className?: string, imageClassName?: string }) {
    return (
        <div className={className}>
            <Link href={`/${post.slug}`} className="block overflow-hidden">
                <Image
                    src={post.featuredImageUrl || 'https://picsum.photos/seed/placeholder/600/400'}
                    alt={post.title}
                    width={600}
                    height={400}
                    className={`object-cover w-full hover:scale-105 transition-transform duration-300 ${imageClassName}`}
                />
            </Link>
            <div className="py-4">
                <h3 className="font-bold font-headline text-xl leading-tight">
                    <Link href={`/${post.slug}`} className="hover:underline">{post.title}</Link>
                </h3>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{post.excerpt}</p>
                <Link href={`/archive/${format(post.createdAt.toDate(), 'yyyy/MM')}`}>
                    <time className="text-xs text-muted-foreground/80 mt-2 block hover:underline">
                        {post.createdAt ? format(post.createdAt.toDate(), 'PP') : ''}
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

  const { data: posts, isLoading: isLoadingPosts } = useCollection<Post>(postsQuery);
  
  const sortedPosts = useMemo(() => {
    if (!posts) return [];
    return [...posts].sort((a, b) => (b.createdAt?.toDate() ?? 0) > (a.createdAt?.toDate() ?? 0) ? 1 : -1)
  }, [posts]);
  
  const hasContent = sortedPosts.length > 0;
  const [heroPost, ...otherPosts] = sortedPosts || [];
  const topPosts = otherPosts.slice(0, 2);
  const nextPosts = otherPosts.slice(2, 6);

  if (isLoadingPosts) {
    return <Loading />;
  }

  return (
    <ThemeLayout HeaderComponent={hasContent ? NewspaperHeader : undefined} FooterComponent={hasContent ? NewspaperFooter : undefined} className="bg-background min-h-screen">
       <main className="container mx-auto">
            {!hasContent ? (
                <div className="text-center py-24">
                    <p className="text-muted-foreground mt-4">Nothing has been published yet. Check back soon for the latest stories.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        {heroPost && (
                            <div className="border-b pb-8 mb-8">
                                <Link href={`/${heroPost.slug}`} className="block overflow-hidden">
                                    <Image
                                        src={heroPost.featuredImageUrl || 'https://picsum.photos/seed/hero/1200/800'}
                                        alt={heroPost.title}
                                        width={1200}
                                        height={800}
                                        className="object-cover w-full hover:scale-105 transition-transform duration-300"
                                        priority
                                    />
                                </Link>
                                <div className="py-4">
                                    <h1 className="font-black font-headline text-5xl leading-tight">
                                        <Link href={`/${heroPost.slug}`} className="hover:underline">{heroPost.title}</Link>
                                    </h1>
                                    <p className="text-lg text-muted-foreground mt-4">{heroPost.excerpt}</p>
                                    <Link href={`/archive/${format(heroPost.createdAt.toDate(), 'yyyy/MM')}`}>
                                        <time className="text-sm text-muted-foreground/80 mt-2 block hover:underline">
                                            {heroPost.createdAt ? format(heroPost.createdAt.toDate(), 'PPp') : ''}
                                        </time>
                                    </Link>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {topPosts.map(post => <PostCard key={post.id} post={post} />)}
                        </div>

                        <div className="mt-8 space-y-8">
                            <WidgetArea areaName="Homepage Content" />
                        </div>
                    </div>

                    {/* Sidebar */}
                    <aside className="lg:col-span-1 space-y-8">
                        <WidgetArea areaName="Sidebar" />
                    </aside>
                </div>
            )}
            {nextPosts.length > 0 && (
                <>
                    <Separator className="my-12" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
                        {nextPosts.map(post => <PostCard key={post.id} post={post} />)}
                    </div>
                </>
            )}
       </main>
    </ThemeLayout>
  );
}
