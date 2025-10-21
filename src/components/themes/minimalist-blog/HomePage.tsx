
'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { Loading } from '@/components/loading';
import { WidgetArea } from '@/components/widgets/WidgetArea';
import { ThemeLayout } from '../ThemeLayout';
import { Sheet, SheetTrigger, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { MenuIcon } from 'lucide-react';
import { Menu } from '@/components/Menu';
import { SearchForm } from '../SearchForm';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { PublicAuthNav } from '../PublicAuthNav';


export const MinimalistHeader: React.FC<{siteName?: string}> = ({ siteName }) => (
    <header className="py-8 px-6">
        <div className="container mx-auto max-w-3xl">
            <div className="flex justify-between items-center">
                <Link href="/" className="text-2xl font-semibold font-headline text-foreground">
                    {siteName || ''}
                </Link>
                <div className="md:hidden">
                     <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MenuIcon />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="bg-foreground text-background flex flex-col p-0">
                            <SheetTitle className="sr-only">Main Menu</SheetTitle>
                            <div className="p-6">
                                <SearchForm />
                            </div>
                            <ScrollArea className="flex-1 px-6">
                                <Menu locationId="minimalist-blog-header" className="flex flex-col space-y-2 text-xl font-headline" linkClassName="hover:text-primary transition-colors" />
                            </ScrollArea>
                            <div className="p-6 mt-auto border-t border-gray-700">
                                <PublicAuthNav orientation="vertical" linkClassName="text-muted-foreground hover:text-primary" />
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
             <nav className="hidden md:flex justify-center items-center gap-6 mt-6">
                <Menu locationId="minimalist-blog-header" className="flex items-center gap-6 text-sm" linkClassName="text-muted-foreground hover:text-foreground transition-colors"/>
                <PublicAuthNav />
            </nav>
            <div className="border-t mt-6 pt-2">
                <ScrollArea className="w-full whitespace-nowrap">
                    <Menu locationId="minimalist-blog-subheader" className="flex items-center gap-6 text-sm" linkClassName="text-foreground hover:text-primary py-2 inline-block" />
                    <ScrollBar orientation="horizontal" className="invisible md:visible" />
                </ScrollArea>
            </div>
            <div className="mt-6 flex justify-center">
                <SearchForm />
            </div>
        </div>
    </header>
);

export const MinimalistFooter: React.FC<{siteName?:string, siteDescription?: string, companyName?: string}> = ({siteName, siteDescription, companyName}) => (
    <footer className="py-12 px-6 mt-16 border-t">
        <div className="container mx-auto max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
                 <p className="font-semibold font-headline text-foreground">{siteName || ''}</p>
                 {siteDescription && <p className="text-sm text-muted-foreground mt-2">{siteDescription}</p>}
                 <p className="text-xs text-muted-foreground mt-2">&copy; {new Date().getFullYear()} {companyName || siteName} All rights reserved.</p>
            </div>
            <div className="space-y-4">
                <WidgetArea areaName="Footer Column 1" />
            </div>
        </div>
    </footer>
);

type Post = {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
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
    <ThemeLayout HeaderComponent={hasContent ? MinimalistHeader : undefined} FooterComponent={hasContent ? MinimalistFooter : undefined}>
        <div className="mb-12 space-y-8 max-w-3xl mx-auto">
            <WidgetArea areaName="Homepage Content" />
        </div>

        {!hasContent && (
            <div className="text-center py-16 max-w-3xl mx-auto">
                <p className="text-muted-foreground">No thoughts published yet. The silence is golden.</p>
            </div>
        )}

        <div className="space-y-12 max-w-3xl mx-auto">
            {sortedPosts.map((post) => (
                <article key={post.id}>
                    <header>
                         <Link href={`/archive/${format(post.createdAt.toDate(), 'yyyy/MM')}`}>
                            <time className="text-sm text-muted-foreground hover:underline">
                                {post.createdAt ? format(post.createdAt.toDate(), 'MMMM d, yyyy') : 'N/A'}
                            </time>
                        </Link>
                        <h2 className="text-3xl font-bold font-headline mt-1">
                            <Link href={`/${post.slug}`} className='hover:text-primary transition-colors'>{post.title}</Link>
                        </h2>
                    </header>
                    <div className="mt-4 text-foreground/80">
                        <p>{post.excerpt}</p>
                    </div>
                    <footer className='mt-4'>
                        <Link href={`/${post.slug}`} className='text-sm font-semibold text-primary hover:underline'>
                            Read more &rarr;
                        </Link>
                    </footer>
                </article>
            ))}
        </div>
    </ThemeLayout>
  );
}
