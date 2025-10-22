
'use client';
import { useMemo, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, Timestamp, doc } from 'firebase/firestore';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loading } from '@/components/loading';
import { WidgetArea } from '@/components/widgets/WidgetArea';
import { ThemeLayout } from '../ThemeLayout';
import { Menu } from '@/components/Menu';
import { Sheet, SheetTrigger, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { MenuIcon } from 'lucide-react';
import { SearchForm } from '../SearchForm';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { PublicAuthNav } from '../PublicAuthNav';


export const MagazineProHeader: React.FC<{ siteName?: string }> = ({ siteName }) => {
    const [currentDate, setCurrentDate] = useState('');

    useEffect(() => {
        setCurrentDate(format(new Date(), 'eeee, MMMM d, yyyy'));
    }, []);

    return (
    <header className="sticky top-0 bg-background/80 backdrop-blur-sm z-10 border-b">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
             <Link href="/" className="text-2xl font-bold font-headline text-primary">
                {siteName || ''}
            </Link>
            <div className="hidden md:flex items-center gap-4">
                <nav>
                    <Menu locationId="magazine-pro-header" className="flex items-center gap-6 text-sm font-medium" linkClassName="text-muted-foreground hover:text-primary transition-colors" />
                </nav>
                <PublicAuthNav />
                <SearchForm />
            </div>
            <div className="md:hidden">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MenuIcon />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="bg-background text-foreground flex flex-col p-0">
                        <SheetTitle className="sr-only">Main Menu</SheetTitle>
                        <div className="p-6">
                            <SearchForm />
                        </div>
                        <ScrollArea className="flex-1 px-6">
                           <Menu locationId="magazine-pro-header" className="flex flex-col space-y-2 text-xl font-headline" linkClassName="hover:text-primary transition-colors" />
                        </ScrollArea>
                        <div className="p-6 mt-auto border-t border-gray-200">
                           <PublicAuthNav orientation="vertical" linkClassName="text-foreground hover:text-primary" />
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </div>
        <div className="border-t">
            <ScrollArea className="container mx-auto px-6 w-full whitespace-nowrap">
                <Menu locationId="magazine-pro-subheader" className="flex items-center gap-6 text-sm" linkClassName="text-foreground hover:text-primary py-2 inline-block" />
                <ScrollBar orientation="horizontal" className="invisible md:visible" />
            </ScrollArea>
        </div>
    </header>
)};

export const MagazineProFooter: React.FC<{ siteName?: string, siteDescription?: string, companyName?: string }> = ({ siteName, siteDescription, companyName }) => (
     <footer className="py-12 px-6 border-t mt-12 bg-muted/20">
        <div className="container mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-2">
                <p className="font-bold font-headline text-primary text-lg">{siteName || ''}</p>
                {siteDescription && <p className="text-sm text-muted-foreground mt-2">{siteDescription}</p>}
                <p className="text-sm text-muted-foreground mt-2">&copy; {new Date().getFullYear()} {companyName || siteName} All Rights Reserved.</p>
                <Menu locationId="magazine-pro-footer" className="mt-4 flex flex-col space-y-2" linkClassName="text-sm text-muted-foreground hover:text-primary" />
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

type Post = {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  featuredImageUrl: string;
  status: 'draft' | 'published' | 'archived';
  createdAt: Timestamp;
};

export default function HomePage() {
  const firestore = useFirestore();

  const postsCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'posts'),
      where('status', '==', 'published')
    );
  }, [firestore]);

  const { data: posts, isLoading: isLoadingPosts } = useCollection<Post>(postsCollection);
  
  const sortedPosts = useMemo(() => {
    if (!posts) return [];
    return [...posts].sort((a, b) => {
      const dateA = a.createdAt?.toDate() ?? new Date(0);
      const dateB = b.createdAt?.toDate() ?? new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
  }, [posts]);
  
  const hasContent = sortedPosts.length > 0;

  if (isLoadingPosts) {
      return <Loading />;
  }

  return (
    <ThemeLayout HeaderComponent={hasContent ? MagazineProHeader : undefined} FooterComponent={hasContent ? MagazineProFooter : undefined}>
        {hasContent && (
            <div className="text-center mb-12">
                <p className="mt-4 text-lg text-muted-foreground">The latest news, updates, and stories.</p>
            </div>
        )}

        <div className="mb-12 space-y-8">
            <WidgetArea areaName="Homepage Content" />
        </div>

        {!isLoadingPosts && !hasContent && (
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
                        <Link href={`/archive/${format(post.createdAt.toDate(), 'yyyy/MM')}`}>
                            <span className="hover:underline">{post.createdAt ? format(post.createdAt.toDate(), 'PP') : 'N/A'}</span>
                        </Link>
                    </div>
                </Card>
            ))}
        </div>
    </ThemeLayout>
  );
}
