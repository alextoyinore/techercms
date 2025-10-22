
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
  categoryIds?: string[];
};

type Category = {
    id: string;
    name: string;
    slug: string;
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
        <header className="py-6 px-4 sticky top-0 bg-background/90 backdrop-blur-md z-20 border-b">
            <div className="container mx-auto flex justify-between items-center">
                 <div className="flex-1 hidden md:flex">
                     <Menu locationId="vogue-header" className="flex items-center gap-6 text-xs font-semibold tracking-wider" linkClassName="text-muted-foreground hover:text-primary transition-colors" />
                </div>
                <Link href="/" className="text-4xl md:text-5xl font-black font-headline tracking-[0.2em] text-center flex-1">
                     {siteLogoUrl ? (
                        isSvg ? (
                            <img src={siteLogoUrl} alt={siteName || 'Site Logo'} className="h-10 w-auto mx-auto" />
                        ) : (
                            <Image src={siteLogoUrl} alt={siteName || 'Site Logo'} width={180} height={40} className="object-contain h-10 w-auto mx-auto" />
                        )
                    ) : (
                        siteName || ''
                    )}
                </Link>
                <div className="flex-1 text-right flex justify-end items-center gap-4">
                    <div className="hidden md:block">
                        <PublicAuthNav />
                    </div>
                    <div className="hidden md:block">
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
                                   <Menu locationId="vogue-header" className="flex flex-col space-y-2 text-xl font-headline tracking-wider" linkClassName="hover:text-primary transition-colors" />
                                </ScrollArea>
                                <div className="p-6 mt-auto border-t border-gray-200">
                                     <PublicAuthNav orientation="vertical" linkClassName="text-foreground hover:text-primary" />
                                 </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>
             <div className="border-t mt-4">
                <ScrollArea className="container mx-auto px-4 w-full whitespace-nowrap">
                    <Menu locationId="vogue-subheader" className="flex justify-center items-center gap-6 text-xs font-semibold tracking-wider" linkClassName="text-foreground hover:text-primary py-2 inline-block" />
                    <ScrollBar orientation="horizontal" className="invisible md:visible" />
                </ScrollArea>
            </div>
        </header>
    )
}

export function PublicFooter({ siteName, siteDescription, companyName }: { siteName?: string, siteDescription?: string, companyName?: string }) {
    return (
        <footer className="py-12 px-6 border-t mt-16 bg-background">
            <div className="container mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-4 text-center">
                    <p className="font-bold font-headline text-lg">{siteName || ''}</p>
                    {siteDescription && <p className="text-sm text-muted-foreground mt-2">{siteDescription}</p>}
                    <p className="text-sm text-muted-foreground mt-2">&copy; {new Date().getFullYear()} {companyName || siteName} All Rights Reserved.</p>
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

const PostCategory: React.FC<{ categoryId: string }> = ({ categoryId }) => {
    const firestore = useFirestore();
    const categoryRef = useMemoFirebase(() => {
        if (!firestore || !categoryId) return null;
        return doc(firestore, 'categories', categoryId);
    }, [firestore, categoryId]);

    const { data: category } = useDoc<Category>(categoryRef);

    if (!category) return null;

    return (
        <Link href={`/category/${category.slug}`} className="text-xs font-semibold tracking-widest text-primary hover:underline">
            {category.name}
        </Link>
    );
};

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
  const [mainPost, secondPost, thirdPost, ...otherPosts] = sortedPosts;
  const latestPosts = otherPosts.slice(0, 4);

  if (isLoadingPosts || isLoadingSettings) {
    return <Loading />;
  }

  return (
    <div className="bg-background text-foreground font-serif">
        {hasContent && <PublicHeader siteName={settings?.siteName} siteLogoUrl={settings?.siteLogoUrl} />}
        <main className="container mx-auto py-8 px-4">
            {!hasContent ? (
                 <div className="text-center py-24">
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
                                {mainPost.categoryIds?.[0] && <PostCategory categoryId={mainPost.categoryIds[0]} />}
                                <h1 className="text-5xl lg:text-7xl font-bold font-headline leading-none mt-2">
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
                                {secondPost.categoryIds?.[0] && <PostCategory categoryId={secondPost.categoryIds[0]} />}
                                <h2 className="text-3xl font-bold font-headline leading-tight group-hover:underline mt-1">
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
                                {thirdPost.categoryIds?.[0] && <PostCategory categoryId={thirdPost.categoryIds[0]} />}
                                <h2 className="text-3xl font-bold font-headline leading-tight group-hover:underline mt-1">
                                    <Link href={`/${thirdPost.slug}`}>{thirdPost.title}</Link>
                                </h2>
                                <p className="text-muted-foreground mt-1">{thirdPost.excerpt}</p>
                             </div>
                        )}
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <h3 className="text-center font-bold font-headline text-2xl tracking-widest">The Latest</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                             {latestPosts.map(post => (
                                <div key={post.id} className="group">
                                    <div className="relative aspect-[3/4] bg-muted mb-3">
                                        <Image src={post.featuredImageUrl} alt={post.title} fill className="object-cover"/>
                                    </div>
                                    {post.categoryIds?.[0] && <PostCategory categoryId={post.categoryIds[0]} />}
                                    <h4 className="font-semibold text-lg leading-tight group-hover:underline mt-1">
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
        {hasContent && <PublicFooter siteName={settings?.siteName} siteDescription={settings?.siteDescription} companyName={settings?.companyName} />}
    </div>
  );
}
