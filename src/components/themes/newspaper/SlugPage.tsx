
'use client';
import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp, doc, orderBy, limit } from 'firebase/firestore';
import { format } from 'date-fns';
import { Loading } from '@/components/loading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MenuIcon } from 'lucide-react';
import { WidgetArea } from '@/components/widgets/WidgetArea';
import { PageBuilderRenderer } from '@/components/page-builder-renderer';
import { ThemeLayout } from '../ThemeLayout';
import { Sheet, SheetTrigger, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Menu } from '@/components/Menu';
import { Separator } from '@/components/ui/separator';
import { SearchForm } from '../SearchForm';

type Post = {
  id: string;
  title: string;
  content: string;
  slug: string;
  authorId: string;
  featuredImageUrl: string;
  status: 'draft' | 'published' | 'archived';
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
  status: 'draft' | 'published';
  createdAt: Timestamp;
  builderEnabled?: boolean;
  showTitle?: boolean;
};

type Category = {
    id: string;
    name: string;
    slug: string;
}

type SiteSettings = {
    siteName?: string;
    hideAllPageTitles?: boolean;
    homepagePageId?: string;
}

const NewspaperHeader: React.FC<{ siteName?: string }> = ({ siteName }) => {
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
                        {siteName || 'The Daily Chronicle'}
                    </Link>
                    <div className="text-sm hidden sm:flex items-center gap-2">
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
                                   <Menu locationId="newspaper-main-nav" className="flex flex-col space-y-4 text-lg" linkClassName="hover:text-primary transition-colors" />
                                    <Separator className="my-4" />
                                    <SearchForm />
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
                <nav className="hidden sm:flex justify-center items-center gap-6 py-3 text-sm font-semibold uppercase tracking-wider">
                    <Menu locationId="newspaper-main-nav" className="flex justify-center items-center gap-6 text-sm font-semibold uppercase tracking-wider" linkClassName="hover:text-primary transition-colors" />
                </nav>
            </div>
        </header>
    )
};

const NewspaperFooter: React.FC = () => (
    <footer className="py-12 px-6 border-t mt-12 bg-muted/20">
        <div className="container mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-2">
                <p className="font-bold font-headline text-primary text-lg">The Daily Chronicle</p>
                <p className="text-sm text-muted-foreground mt-2">© {new Date().getFullYear()} All Rights Reserved.</p>
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
        return <div className="prose lg:prose-lg max-w-none"><p>Loading content...</p></div>
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
            className="prose lg:prose-lg max-w-none"
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

  const item: (Post | Page) | null = useMemo(() => {
    if (preloadedItem) return preloadedItem;
    if (isLoadingPosts || isLoadingPages) return null;
    if (posts && posts.length > 0) return posts[0];
    if (pages && pages.length > 0) return pages[0];
    return null;
  }, [preloadedItem, posts, pages, isLoadingPosts, isLoadingPages]);

  if (isLoadingPosts || isLoadingPages || isLoadingSettings) {
    return <Loading />;
  }

  if (!item) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center">
            <h1 className="text-4xl font-bold mb-4">404 - Not Found</h1>
            <p className="text-muted-foreground mb-8">The page or post you're looking for doesn't exist.</p>
            <Button asChild variant="outline">
                <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Homepage
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
    <ThemeLayout HeaderComponent={NewspaperHeader} FooterComponent={NewspaperFooter} pageId={pageId} className="bg-background">
        <main className="container mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                <div className="lg:col-span-3">
                    <article className="max-w-none">
                        <header className="mb-8 border-b pb-8">
                            {displayTitle && <h1 className="text-5xl font-black font-headline tracking-tight lg:text-7xl mb-4">{item.title}</h1>}
                            <div className="text-muted-foreground text-sm">
                                <Link href={`/archive/${format(item.createdAt.toDate(), 'yyyy/MM')}`} className="hover:underline">
                                    <span>Published on {item.createdAt ? format(item.createdAt.toDate(), 'PPpp') : ''}</span>
                                </Link>
                            </div>
                        </header>
                        
                        {item.featuredImageUrl && (
                            <div className="relative aspect-video w-full mb-8 rounded-md overflow-hidden shadow-lg">
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
                                className="prose lg:prose-lg max-w-none"
                                dangerouslySetInnerHTML={{ __html: item.content }}
                            />
                        ) : (
                            <PageContent page={item as Page} />
                        )}

                        {isPost && (item as Post).tagIds && (item as Post).tagIds!.length > 0 && (
                            <footer className="mt-12 pt-8 border-t">
                                <h3 className="font-semibold mb-2">Tags</h3>
                                <div className="flex flex-wrap gap-2">
                                    {(item as Post).tagIds!.map(tag => (
                                        <Link key={tag} href={`/tag/${tag}`}>
                                            <Badge variant="secondary" className="hover:bg-primary/10">{tag}</Badge>
                                        </Link>
                                    ))}
                                </div>
                            </footer>
                        )}
                    </article>
                </div>
                <aside className="lg:col-span-1 space-y-8">
                    <WidgetArea areaName="Sidebar" />
                    <WidgetArea areaName="Page Sidebar" isPageSpecific={!!pageId} pageId={pageId} />
                </aside>
            </div>
        </main>
    </ThemeLayout>
  );
}
