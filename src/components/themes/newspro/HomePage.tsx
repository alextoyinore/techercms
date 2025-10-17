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
import { Sheet, SheetTrigger, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { MenuIcon } from 'lucide-react';
import { Menu } from '@/components/Menu';

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
        <header className="py-4 px-4 sticky top-0 bg-background/95 backdrop-blur-sm z-20 border-b-4 border-primary">
            <div className="container mx-auto flex justify-between items-center">
                <Link href="/" className="text-4xl font-black font-headline tracking-tighter">
                    {siteName || 'NewsPro'}
                </Link>
                <nav className="hidden md:flex">
                     <Menu locationId="newspro-header" className="flex items-center gap-6 text-sm font-semibold uppercase" linkClassName="text-muted-foreground hover:text-primary transition-colors" />
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
                               <Menu locationId="newspro-header" className="flex flex-col space-y-4 text-lg" linkClassName="hover:text-primary transition-colors" />
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
                    <p className="font-bold font-headline text-lg">© {new Date().getFullYear()} {siteName || 'NewsPro'}</p>
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

  const [mainStory, ...otherStories] = sortedPosts;
  const topStories = otherStories.slice(0, 2);
  const secondaryStories = otherStories.slice(2, 6);

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
                    <h2 className="text-3xl font-bold font-headline">The Presses are Silent</h2>
                    <p className="text-muted-foreground mt-4">Breaking news will appear here. Stay tuned.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
                    <div className="md:col-span-3 lg:col-span-3">
                       {mainStory && (
                           <div className="border-b pb-6 mb-6">
                               <h1 className="font-black font-headline text-5xl lg:text-7xl leading-tight mb-4 hover:underline">
                                   <Link href={`/${mainStory.slug}`}>{mainStory.title}</Link>
                               </h1>
                               <p className="text-xl text-muted-foreground mb-4">{mainStory.excerpt}</p>
                               {mainStory.featuredImageUrl && (
                                   <div className="relative aspect-[2/1] w-full bg-muted">
                                       <Image src={mainStory.featuredImageUrl} alt={mainStory.title} fill className="object-cover" priority/>
                                   </div>
                               )}
                           </div>
                       )}
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           {topStories.map(post => (
                               <div key={post.id} className="group">
                                   {post.featuredImageUrl && (
                                       <div className="relative aspect-video w-full bg-muted mb-2">
                                           <Image src={post.featuredImageUrl} alt={post.title} fill className="object-cover"/>
                                       </div>
                                   )}
                                   <h2 className="font-bold font-headline text-2xl leading-tight group-hover:underline">
                                       <Link href={`/${post.slug}`}>{post.title}</Link>
                                   </h2>
                                   <p className="text-muted-foreground mt-1 text-sm line-clamp-3">{post.excerpt}</p>
                               </div>
                           ))}
                       </div>
                    </div>
                     <aside className="md:col-span-3 lg:col-span-1 space-y-6">
                        <h3 className="font-bold text-xl border-b-2 border-primary pb-2">More Headlines</h3>
                         {secondaryStories.map(post => (
                            <div key={post.id} className="group border-b pb-4 last:border-0">
                                <h4 className="font-semibold text-lg leading-tight group-hover:underline">
                                    <Link href={`/${post.slug}`}>{post.title}</Link>
                                </h4>
                                <Link href={`/archive/${format(post.createdAt.toDate(), 'yyyy/MM')}`}>
                                    <time className="text-xs text-muted-foreground mt-1 block hover:underline">
                                        {format(post.createdAt.toDate(), 'MMM d')}
                                    </time>
                                </Link>
                            </div>
                         ))}
                        <WidgetArea areaName="Sidebar" />
                    </aside>
                </div>
            )}
             <div className="mt-12">
                <WidgetArea areaName="Homepage Content" />
            </div>
        </main>
        <PublicFooter siteName={settings?.siteName} />
    </div>
  );
}
