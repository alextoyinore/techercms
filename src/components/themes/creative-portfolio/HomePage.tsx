
'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import { Loading } from '@/components/loading';
import { WidgetArea } from '@/components/widgets/WidgetArea';
import { ThemeLayout } from '../ThemeLayout';
import { Sheet, SheetTrigger, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { MenuIcon, Search } from 'lucide-react';
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

export const CreativeHeader: React.FC<{siteName?: string}> = ({ siteName }) => (
    <header className="py-6 px-6 sticky top-0 bg-background/90 backdrop-blur-md z-10">
        <div className="container mx-auto flex justify-between items-center">
            <Link href="/" className="text-3xl font-extrabold font-headline text-primary tracking-tighter">
                {siteName || ''}
            </Link>
             <div className="hidden md:flex items-center gap-4">
                <nav>
                    <Menu locationId="creative-portfolio-header" className="flex items-center gap-6 text-sm font-semibold" linkClassName="text-muted-foreground hover:text-primary transition-colors" />
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
                           <Menu locationId="creative-portfolio-header" className="flex flex-col space-y-4 text-lg" linkClassName="hover:text-primary transition-colors" />
                           <div className="mt-6 pt-6 border-t">
                                <SearchForm />
                           </div>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </div>
    </header>
);

export const CreativeFooter: React.FC<{siteName?: string}> = ({ siteName }) => (
    <footer className="py-12 px-6 border-t mt-16 bg-foreground text-background">
        <div className="container mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-2">
                <p className="font-bold font-headline text-primary text-lg">{siteName || ''}</p>
                <p className="text-sm text-background/60 mt-2">&copy; {new Date().getFullYear()} All Rights Reserved.</p>
                <div className="mt-4">
                     <Menu locationId="creative-portfolio-social" className="flex items-center gap-4" linkClassName="text-background/60 hover:text-white" />
                </div>
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
    <ThemeLayout HeaderComponent={hasContent ? CreativeHeader : undefined} FooterComponent={hasContent ? CreativeFooter : undefined} className="bg-background min-h-screen">
        <div className="text-center mb-16">
            <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto">Exploring the intersection of art, design, and technology.</p>
        </div>

        <div className="mb-16 space-y-8">
            <WidgetArea areaName="Homepage Content" />
        </div>

        {!hasContent && (
            <div className="text-center py-16">
                <p className="text-muted-foreground">No projects have been published yet. Stay tuned!</p>
            </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedPosts.map((post, index) => (
                <Link href={`/${post.slug}`} key={post.id}>
                    <div className="block relative aspect-square group overflow-hidden rounded-lg">
                         <Image 
                            src={post.featuredImageUrl || 'https://picsum.photos/seed/placeholder/600/600'} 
                            alt={post.title}
                            fill
                            className="object-cover w-full h-full transition-transform duration-500 ease-in-out group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors duration-300 flex items-end p-6">
                            <div className="text-white">
                                <h2 className="font-headline text-2xl font-bold">{post.title}</h2>
                                <p className="text-sm opacity-80">{post.excerpt}</p>
                            </div>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    </ThemeLayout>
  );
}
