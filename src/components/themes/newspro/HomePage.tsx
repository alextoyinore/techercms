
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
import { Sheet, SheetTrigger, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { MenuIcon } from 'lucide-react';
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
};

type SiteSettings = {
  siteName?: string;
  siteLogoUrl?: string;
  siteDescription?: string;
  companyName?: string;
}

export function PublicHeader({ siteName, siteLogoUrl }: { siteName?: string, siteLogoUrl?: string }) {
    const isSvg = siteLogoUrl?.endsWith('.svg');
    return (
        <header className="sticky top-0 bg-background/95 backdrop-blur-sm z-20 border-b-4 border-primary">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                <Link href="/" className="text-4xl font-black font-headline tracking-tighter">
                     {siteLogoUrl ? (
                        isSvg ? (
                            <img src={siteLogoUrl} alt={siteName || 'Site Logo'} className="h-10 w-auto" />
                        ) : (
                            <Image src={siteLogoUrl} alt={siteName || 'Site Logo'} width={180} height={40} className="object-contain h-10 w-auto" />
                        )
                    ) : (
                        siteName || ''
                    )}
                </Link>
                <div className="hidden md:flex items-center gap-4">
                     <nav>
                         <Menu locationId="newspro-header" className="flex items-center gap-6 text-sm font-semibold uppercase" linkClassName="text-muted-foreground hover:text-primary transition-colors" />
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
                               <Menu locationId="newspro-header" className="flex flex-col space-y-2 text-xl font-headline" linkClassName="hover:text-primary transition-colors" />
                            </ScrollArea>
                             <div className="p-6 mt-auto border-t border-gray-200">
                                <PublicAuthNav orientation="vertical" linkClassName="text-foreground hover:text-primary" />
                             </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
            <div className="border-t">
                <ScrollArea className="container mx-auto px-4 w-full whitespace-nowrap">
                    <Menu locationId="newspro-subheader" className="flex items-center gap-6 text-sm" linkClassName="text-foreground hover:text-primary py-2 inline-block" />
                    <ScrollBar orientation="horizontal" className="invisible md:visible" />
                </ScrollArea>
            </div>
        </header>
    )
}

export function PublicFooter({ siteName, siteDescription, companyName }: { siteName?: string, siteDescription?: string, companyName?: string }) {
    return (
        <footer className="py-12 px-6 border-t mt-16 bg-card">
            <div className="container mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-2">
                    <p className="font-bold font-headline text-lg">{siteName || ''}</p>
                    {siteDescription && <p className="text-sm text-muted-foreground mt-2">{siteDescription}</p>}
                    <p className="text-sm text-muted-foreground mt-2">&copy; {new Date().getFullYear()} {companyName || siteName} All rights reserved.</p>
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

  const hasContent = sortedPosts.length > 0;
  const [mainStory, ...otherStories] = sortedPosts;
  const topStories = otherStories.slice(0, 2);
  const secondaryStories = otherStories.slice(2, 6);

  if (isLoadingPosts || isLoadingSettings) {
    return <Loading />;
  }

  return (
    <div className="bg-background text-foreground font-serif">
        {hasContent && <PublicHeader siteName={settings?.siteName} siteLogoUrl={settings?.siteLogoUrl} />}
        <main className="container mx-auto py-8 px-4">
            {!hasContent ? (
                 <div className="text-center py-24">
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
        {hasContent && <PublicFooter siteName={settings?.siteName} siteDescription={settings?.siteDescription} companyName={settings?.companyName} />}
    </div>
  );
}
