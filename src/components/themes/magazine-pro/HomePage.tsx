'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loading } from '@/components/loading';
import { WidgetArea } from '@/components/widgets/WidgetArea';
import { ThemeLayout } from '../ThemeLayout';
import { Menu } from '@/components/Menu';
import { Sheet, SheetTrigger, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { MenuIcon } from 'lucide-react';


export const MagazineProHeader: React.FC<{ siteName?: string }> = ({ siteName }) => (
    <header className="py-4 px-6 border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <div className="container mx-auto flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold font-headline text-primary">
                {siteName || 'My Awesome Site'}
            </Link>
            <nav className="hidden md:flex">
                <Menu locationId="magazine-pro-header" className="flex items-center gap-6 text-sm font-medium" linkClassName="hover:text-primary transition-colors" />
            </nav>
            <div className="md:hidden">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MenuIcon />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right">
                        <div className="py-6">
                           <Menu locationId="magazine-pro-header" className="flex flex-col space-y-4 text-lg" linkClassName="hover:text-primary transition-colors" />
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </div>
    </header>
);

export const MagazineProFooter: React.FC<{ siteName?: string }> = ({ siteName }) => (
     <footer className="py-12 px-6 border-t mt-12 bg-muted/20">
        <div className="container mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-2">
                <p className="font-bold font-headline text-primary text-lg">{siteName || 'My Awesome Site'}</p>
                <p className="text-sm text-muted-foreground mt-2">&copy; {new Date().getFullYear()} All Rights Reserved.</p>
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

  const isLoading = isLoadingPosts;

  if (isLoading) {
      return <Loading />;
  }

  return (
    <ThemeLayout HeaderComponent={MagazineProHeader} FooterComponent={MagazineProFooter}>
        <div className="text-center mb-12">
            <h1 className="text-4xl font-bold font-headline tracking-tight lg:text-5xl">Our Blog</h1>
            <p className="mt-4 text-lg text-muted-foreground">The latest news, updates, and stories.</p>
        </div>

        <div className="mb-12 space-y-8">
            <WidgetArea areaName="Homepage Content" />
        </div>

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
