
'use client';
import { useMemo } from 'react';
import Head from 'next/head';
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
import { Sheet, SheetTrigger, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Menu } from '@/components/Menu';
import { SearchForm } from '../SearchForm';
import { ShareButtons } from '../ShareButtons';
import { RelatedPosts } from '../RelatedPosts';

type Post = {
  id: string;
  title: string;
  content: string;
  slug: string;
  authorId: string;
  featuredImageUrl: string;
  createdAt: Timestamp;
  tagIds?: string[];
  metaDescription?: string;
  excerpt?: string;
  categoryIds?: string[];
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
        <header className="py-4 px-6 sticky top-0 bg-gray-900/80 backdrop-blur-sm z-20 border-b border-gray-700">
            <div className="container mx-auto flex justify-between items-center">
                <Link href="/" className="text-xl font-bold font-headline text-cyan-400 tracking-tighter">
                    {siteName || 'Tech Today'}
                </Link>
                <div className="hidden md:flex items-center gap-4">
                    <nav>
                        <Menu locationId="tech-today-header" className="flex items-center gap-6 text-sm font-medium" linkClassName="text-gray-400 hover:text-cyan-300 transition-colors" />
                    </nav>
                    <SearchForm />
                 </div>
                 <div className="md:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MenuIcon className="text-cyan-400"/>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="bg-gray-900 text-gray-200 border-l-gray-800">
                            <SheetTitle className="sr-only">Main Menu</SheetTitle>
                            <div className="py-6">
                               <Menu locationId="tech-today-header" className="flex flex-col space-y-4 text-lg" linkClassName="hover:text-cyan-300 transition-colors" />
                                <div className="mt-6 border-t border-gray-700 pt-6">
                                     <SearchForm />
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    )
}

function PublicFooter() {
    return (
        <footer className="py-12 px-6 border-t border-gray-800 mt-16 bg-gray-900">
            <div className="container mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-8 text-gray-400">
                <div className="lg:col-span-2">
                    <p className="font-bold font-headline text-cyan-400 text-lg">Tech Today</p>
                    <p className="text-sm text-gray-500 mt-2">&copy; {new Date().getFullYear()} All Rights Reserved.</p>
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
        return <div className="prose prose-invert lg:prose-lg max-w-none"><p>Loading content...</p></div>
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
            className="prose prose-invert lg:prose-lg max-w-none"
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
        <div className="bg-gray-900 text-gray-200 flex flex-col items-center justify-center min-h-screen text-center p-6">
            <h1 className="text-6xl font-bold font-headline mb-4 text-cyan-400">404</h1>
            <p className="text-xl text-gray-400 mb-8">The data stream you're looking for couldn't be found.</p>
            <Button asChild variant="outline" size="lg">
                <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Return to Mainframe
                </Link>
            </Button>
        </div>
    );
  }
  
  const isPost = 'excerpt' in item;
  const pageId = !isPost ? item.id : undefined;

  // Determine if the title should be shown
  const isHomepage = !isPost && settings?.homepagePageId === item.id;
  const pageShowTitle = !isPost ? (item as Page).showTitle : true;
  const displayTitle = !isHomepage && !settings?.hideAllPageTitles && pageShowTitle;

  const siteTitle = settings?.siteName || 'Techer CMS';
  const pageTitle = `${item.title} - ${siteTitle}`;
  const metaDescription = (item as Post)?.metaDescription || (item as Post)?.excerpt || `Read more about ${item.title} on ${siteTitle}`;

  return (
    <>
      <Head>
          <title>{pageTitle}</title>
          <meta name="description" content={metaDescription} />
      </Head>
      <div className="bg-gray-900 text-gray-200">
        <WidgetArea areaName="Page Header" isPageSpecific={!!pageId} pageId={pageId} />
        <PublicHeader siteName={settings?.siteName}/>
        <main className="container mx-auto py-8 px-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
              <div className="lg:col-span-3">
                  <article className="max-w-none">
                  <header className="mb-8">
                      {displayTitle && <h1 className="text-4xl font-extrabold font-headline tracking-tight lg:text-6xl mb-4 text-cyan-300">{item.title}</h1>}
                      <div className="text-gray-400 text-sm">
                          <Link href={`/archive/${format(item.createdAt.toDate(), 'yyyy/MM')}`} className="hover:underline">
                              <span>Published on {item.createdAt ? format(item.createdAt.toDate(), 'PP') : ''}</span>
                          </Link>
                      </div>
                  </header>
                  
                  {item.featuredImageUrl && (
                      <div className="relative aspect-video w-full mb-8 rounded-lg overflow-hidden shadow-lg shadow-cyan-500/10">
                      <Image
                          src={item.featuredImageUrl}
                          alt={item.title}
                          fill
                          className="object-cover"
                      />
                      </div>
                  )}
                  
                  {isPost ? (
                      <>
                      <div
                          className="prose prose-invert lg:prose-lg max-w-none"
                          dangerouslySetInnerHTML={{ __html: item.content }}
                      />
                      <ShareButtons title={item.title} />
                      <RelatedPosts currentPost={item as Post} />
                      </>
                  ) : (
                      <PageContent page={item as Page} />
                  )}

                  {isPost && (item as Post).tagIds && (item as Post).tagIds!.length > 0 && (
                      <footer className="mt-12">
                          <div className="flex flex-wrap gap-2">
                              {(item as Post).tagIds!.map(tag => (
                                  <Link key={tag} href={`/tag/${tag}`}>
                                      <Badge variant="outline" className="border-cyan-400/50 text-cyan-400 hover:bg-cyan-400/10">{tag}</Badge>
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
        <WidgetArea areaName="Page Footer" isPageSpecific={!!pageId} pageId={pageId} />
        <PublicFooter />
      </div>
    </>
  );
}
