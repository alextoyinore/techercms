'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp, doc } from 'firebase/firestore';
import { format } from 'date-fns';
import { Loading } from '@/components/loading';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { WidgetArea } from '@/components/widgets/WidgetArea';
import { PageBuilderRenderer } from '@/components/page-builder-renderer';

type Post = {
  id: string;
  title: string;
  content: string;
  slug: string;
  authorId: string;
  createdAt: Timestamp;
};

type Page = {
  id: string;
  title: string;
  content: string;
  slug: string;
  authorId: string;
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
        <header className="py-8 px-6">
            <div className="container mx-auto max-w-3xl flex justify-between items-center">
                <Link href="/" className="text-2xl font-semibold font-headline text-foreground">
                    {siteName || 'A Minimalist Blog'}
                </Link>
                <nav>
                    <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                        Login
                    </Link>
                </nav>
            </div>
        </header>
    )
}

function PublicFooter() {
    return (
        <footer className="py-12 px-6 mt-16 border-t">
            <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                     <p className="font-semibold font-headline text-foreground">A Minimalist Blog</p>
                     <p className="text-xs text-muted-foreground mt-2">&copy; {new Date().getFullYear()} All rights reserved.</p>
                </div>
                <div className="space-y-4">
                    <WidgetArea areaName="Footer Column 1" />
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
  
  const isPost = item ? 'excerpt' in item : false;
  const pageId = !isPost && item ? item.id : undefined;
  
  // Determine if the title should be shown
  const isHomepage = !isPost && settings?.homepagePageId === item?.id;
  const pageShowTitle = !isPost && item ? (item as Page).showTitle : true;
  const displayTitle = !isHomepage && !settings?.hideAllPageTitles && pageShowTitle;

  if (isLoadingPosts || isLoadingPages || isLoadingSettings) {
    return <Loading />;
  }

  if (!item) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-6">
            <h1 className="text-5xl font-bold font-headline mb-4">404</h1>
            <p className="text-lg text-muted-foreground mb-8">This page seems to be empty.</p>
            <Button asChild variant="link">
                <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to home
                </Link>
            </Button>
        </div>
    );
  }

  return (
    <div className="bg-background">
      <WidgetArea areaName="Page Header" isPageSpecific={!!pageId} pageId={pageId} />
      <PublicHeader siteName={settings?.siteName}/>
      <main className="container mx-auto py-8 px-6 max-w-3xl">
        <article className="max-w-none">
          <header className="mb-12 text-center">
             <div className="text-sm text-muted-foreground">
                <span>Published on {item.createdAt ? format(item.createdAt.toDate(), 'MMMM d, yyyy') : ''}</span>
            </div>
            {displayTitle && <h1 className="text-5xl font-bold font-headline tracking-tight mt-2">{item.title}</h1>}
          </header>
          
          {isPost ? (
            <div
                className="prose dark:prose-invert lg:prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: item.content }}
            />
          ) : (
             <PageContent page={item as Page} />
          )}

        </article>
         <aside className="mt-12 space-y-8">
            <WidgetArea areaName="Page Sidebar" isPageSpecific={!!pageId} pageId={pageId}/>
        </aside>
      </main>
      <WidgetArea areaName="Page Footer" isPageSpecific={!!pageId} pageId={pageId}/>
      <PublicFooter />
    </div>
  );
}
