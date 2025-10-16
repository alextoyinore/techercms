'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  featuredImageUrl: string;
  createdAt: Timestamp;
};

type Page = {
  id: string;
  title: string;
  content: string;
  slug: string;
  featuredImageUrl: string;
  createdAt: Timestamp;
  builderEnabled?: boolean;
};

type SiteSettings = {
  siteName?: string;
}

function PublicHeader({ siteName }: { siteName?: string }) {
    return (
        <header className="py-6 px-6 sticky top-0 bg-emerald-50/80 backdrop-blur-md z-20">
            <div className="container mx-auto flex justify-between items-center">
                <Link href="/" className="text-2xl font-bold font-headline text-emerald-900">
                    {siteName || 'Earthy Elegance'}
                </Link>
                <nav>
                    <Link href="/login" className="text-sm font-medium text-emerald-800 hover:text-emerald-600">
                        Admin Login
                    </Link>
                </nav>
            </div>
        </header>
    )
}

function PublicFooter() {
    return (
        <footer className="py-12 px-6 border-t border-emerald-200 mt-16 bg-white">
            <div className="container mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-2">
                    <p className="font-bold font-headline text-emerald-900 text-lg">Earthy Elegance</p>
                    <p className="text-sm text-emerald-700/80 mt-2">&copy; {new Date().getFullYear()} All Rights Reserved.</p>
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
        return <div className="prose prose-lg prose-headings:font-headline prose-headings:text-emerald-900 prose-p:text-emerald-800/90 prose-a:text-emerald-600 max-w-none mx-auto"><p>Loading content...</p></div>
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
            className="prose prose-lg prose-headings:font-headline prose-headings:text-emerald-900 prose-p:text-emerald-800/90 prose-a:text-emerald-600 max-w-none mx-auto"
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
        <div className="bg-emerald-50 flex flex-col items-center justify-center min-h-screen text-center p-6">
            <h1 className="text-6xl font-bold font-headline mb-4 text-emerald-800">404</h1>
            <p className="text-xl text-emerald-700/80 mb-8">This page seems to have returned to nature.</p>
            <Button asChild variant="outline" size="lg" className="border-emerald-800 text-emerald-800 hover:bg-emerald-800 hover:text-white">
                <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Return Home
                </Link>
            </Button>
        </div>
    );
  }
  
  const isPost = 'excerpt' in item;
  const pageId = !isPost ? item.id : undefined;

  return (
    <div className="bg-emerald-50 text-emerald-900">
      <WidgetArea areaName="Page Header" isPageSpecific={!!pageId} pageId={pageId} />
      <PublicHeader siteName={settings?.siteName}/>
      <main className="container mx-auto py-8 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            <div className="lg:col-span-3">
                <article>
                <header className="mb-8">
                    <h1 className="text-4xl font-extrabold font-headline tracking-tight lg:text-6xl mb-4 text-emerald-900">{item.title}</h1>
                    <time className="text-emerald-700/80 text-sm">
                        Published on {item.createdAt ? format(item.createdAt.toDate(), 'PP') : ''}
                    </time>
                </header>
                
                {item.featuredImageUrl && (
                    <div className="relative aspect-video w-full mb-8 rounded-lg overflow-hidden shadow-lg">
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
                        className="prose prose-lg prose-headings:font-headline prose-headings:text-emerald-900 prose-p:text-emerald-800/90 prose-a:text-emerald-600 max-w-none mx-auto"
                        dangerouslySetInnerHTML={{ __html: item.content }}
                    />
                ) : (
                    <PageContent page={item as Page} />
                )}
                
                </article>
            </div>
            <aside className="lg:col-span-1 space-y-8">
                <WidgetArea areaName="Sidebar" />
                <WidgetArea areaName="Page Sidebar" isPageSpecific={!!pageId} pageId={pageId} />
            </aside>
        </div>
      </main>
      <WidgetArea areaName="Page Footer" isPageSpecific={!!pageId} pageId={pageId} />
      <PublicFooter />
    </div>
  );
}
