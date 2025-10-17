'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp, doc } from 'firebase/firestore';
import { format } from 'date-fns';
import { Loading } from '@/components/loading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MenuIcon } from 'lucide-react';
import { WidgetArea } from '@/components/widgets/WidgetArea';
import { PageBuilderRenderer } from '@/components/page-builder-renderer';
import { Sheet, SheetTrigger, SheetContent } from '@/components/ui/sheet';
import { Menu } from '@/components/Menu';
import { SearchForm } from '../SearchForm';

type Post = {
  id: string;
  title: string;
  content: string;
  slug: string;
  authorId: string;
  featuredImageUrl: string;
  createdAt: Timestamp;
  tagIds?: string[];
};

type Page = {
  id: string;
  title: string;
  content: string;
  slug: string;
  authorId: string;
  featuredImageUrl: string;
  createdAt: Timestamp;
  builderEnabled?: boolean;
  showTitle?: boolean;
};

type SiteSettings = {
    siteName?: string;
    hideAllPageTitles?: boolean;
    homepagePageId?: string;
}

function PublicHeader({ siteName }: { siteName?: string }) {
    return (
        <header className="py-4 px-4 sticky top-0 bg-primary text-primary-foreground z-20 shadow-lg">
            <div className="container mx-auto flex justify-between items-center">
                <Link href="/" className="text-3xl font-black font-headline tracking-tighter uppercase">
                    {siteName || 'ESPN'}
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

function PublicFooter({ siteName }: { siteName?: string }) {
    return (
        <footer className="py-12 px-6 border-t mt-16 bg-card">
            <div className="container mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-2">
                    <p className="font-bold font-headline text-primary text-lg">© {new Date().getFullYear()} {siteName || 'Sports Now'}</p>
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

function PageContent({ page }: { page: Page }) {
    const firestore = useFirestore();

    if (page.builderEnabled) {
        return <PageBuilderRenderer pageId={page.id} />;
    }

    const contentAreaQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'widget_areas'), where('pageId', '==', page.id), where('name', '==', 'Page Content'));
    }, [firestore, page.id]);

    const { data: contentAreas, isLoading: isLoadingAreas } = useCollection(contentAreaQuery);
    const contentAreaId = useMemo(() => contentAreas?.[0]?.id, [contentAreas]);

    const contentWidgetsQuery = useMemoFirebase(() => {
        if (!firestore || !contentAreaId) return null;
        return query(collection(firestore, 'widget_instances'), where('widgetAreaId', '==', contentAreaId));
    }, [firestore, contentAreaId]);

    const { data: contentWidgets, isLoading: isLoadingWidgets } = useCollection(contentWidgetsQuery);
    
    if (isLoadingAreas || isLoadingWidgets) {
        return <div className="prose dark:prose-invert lg:prose-lg max-w-none"><p>Loading content...</p></div>
    }

    if (contentWidgets && contentWidgets.length > 0) {
        return (
            <div className="space-y-6">
                <WidgetArea areaName="Page Content" isPageSpecific={true} pageId={page.id} />
            </div>
        );
    }
    
    return (
        <div
            className="prose dark:prose-invert lg:prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: page.content }}
        />
    );
}

export default function SlugPage({ preloadedItem }: { preloadedItem?: Page | Post }) {
  const params = useParams();
  const slug = preloadedItem ? (preloadedItem as any).slug : params.slug as string;
  const firestore = useFirestore();

  const postsQuery = useMemoFirebase(() => {
    if (!firestore || !slug || preloadedItem) return null;
    return query(collection(firestore, 'posts'), where('slug', '==', slug), where('status', '==', 'published'));
  }, [firestore, slug, preloadedItem]);

  const pagesQuery = useMemoFirebase(() => {
    if (!firestore || !slug || preloadedItem) return null;
    return query(collection(firestore, 'pages'), where('slug', '==', slug), where('status', '==', 'published'));
  }, [firestore, slug, preloadedItem]);
  
  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'site_settings', 'config');
  }, [firestore]);

  const { data: posts, isLoading: isLoadingPosts } = useCollection<Post>(postsQuery);
  const { data: pages, isLoading: isLoadingPages } = useCollection<Page>(pagesQuery);
  const { data: settings, isLoading: isLoadingSettings } = useDoc<SiteSettings>(settingsRef);

  const item = useMemo(() => {
    if(preloadedItem) return preloadedItem;
    if (posts && posts.length > 0) return posts[0];
    if (pages && pages.length > 0) return pages[0];
    return null;
  }, [preloadedItem, posts, pages]);

  if (isLoadingPosts || isLoadingPages || isLoadingSettings) {
    return <Loading />;
  }

  if (!item) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-6">
            <h1 className="text-6xl font-bold font-headline mb-4">404</h1>
            <p className="text-xl text-muted-foreground mb-8">This page is offsides.</p>
            <Button asChild variant="default" size="lg">
                <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to the Field
                </Link>
            </Button>
        </div>
    );
  }
  
  const isPost = 'tagIds' in item;
  const pageId = !isPost ? item.id : undefined;

  // Determine if the title should be shown
  const isHomepage = !isPost && settings?.homepagePageId === item.id;
  const pageShowTitle = !isPost ? (item as Page).showTitle : true;
  const displayTitle = !isHomepage && !settings?.hideAllPageTitles && pageShowTitle;

  return (
    <div className="bg-background text-foreground font-sans">
      <WidgetArea areaName="Page Header" isPageSpecific={!!pageId} pageId={pageId} />
      <PublicHeader siteName={settings?.siteName}/>
      <main className="container mx-auto py-8 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
                <article className="max-w-none">
                    <header className="mb-8">
                        {displayTitle && <h1 className="text-4xl font-black font-headline tracking-tight lg:text-6xl mb-4 uppercase">{item.title}</h1>}
                        <div className="text-muted-foreground text-sm font-semibold">
                            <Link href={`/archive/${format(item.createdAt.toDate(), 'yyyy/MM')}`} className="hover:underline">
                                <span>{item.createdAt ? format(item.createdAt.toDate(), 'PPpp') : ''}</span>
                            </Link>
                        </div>
                    </header>
                    
                    {item.featuredImageUrl && (
                        <div className="relative aspect-video w-full mb-8">
                        <Image
                            src={item.featuredImageUrl}
                            alt={item.title}
                            fill
                            className="object-cover"
                        />
                        </div>
                    )}
                    
                     {isPost ? (
                         <div
                            className="prose dark:prose-invert lg:prose-lg max-w-none"
                            dangerouslySetInnerHTML={{ __html: item.content }}
                        />
                    ) : (
                        <PageContent page={item as Page} />
                    )}

                    {isPost && (item as Post).tagIds && (item as Post).tagIds!.length > 0 && (
                        <footer className="mt-12 pt-8 border-t">
                            <div className="flex flex-wrap gap-2">
                                {(item as Post).tagIds!.map(tag => (
                                    <Link key={tag} href={`/tag/${tag}`}>
                                        <Badge variant="default">{tag}</Badge>
                                    </Link>
                                ))}
                            </div>
                        </footer>
                    )}
                </article>
            </div>
            <aside className="lg:col-span-4 space-y-8 lg:sticky lg:top-24 self-start">
                <WidgetArea areaName="Sidebar" />
                <WidgetArea areaName="Page Sidebar" isPageSpecific={!!pageId} pageId={pageId} />
            </aside>
        </div>
      </main>
      <WidgetArea areaName="Page Footer" isPageSpecific={!!pageId} pageId={pageId} />
      <PublicFooter siteName={settings?.siteName} />
    </div>
  );
}
