'use client';
import { useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp, doc, orderBy, limit } from 'firebase/firestore';
import { format } from 'date-fns';
import { Loading } from '@/components/loading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { WidgetArea } from '@/components/widgets/WidgetArea';
import { PageBuilderRenderer } from '@/components/page-builder-renderer';
import { PublicHeader, PublicFooter } from './HomePage';
import { ThemeLayout } from '../ThemeLayout';
import { PostAuthor } from '../PostAuthor';

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
    siteLogoUrl?: string;
    hideAllPageTitles?: boolean;
    homepagePageId?: string;
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
        return <div className="prose dark:prose-invert lg:prose-lg max-w-none text-xs text-muted-foreground"><p>Loading content...</p></div>
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
            <p className="text-xl text-muted-foreground mb-8">This page could not be found.</p>
            <Button asChild variant="default" size="lg">
                <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Return Home
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

  const siteTitle = settings?.siteName || 'Techer CMS';
  const pageTitle = `${item.title} - ${siteTitle}`;
  const metaDescription = (item as Post)?.metaDescription || (item as Post)?.excerpt || `Read more about ${item.title} on ${siteTitle}`;

  return (
    <>
      <Head>
          <title>{siteTitle} - {pageTitle}</title>
          <meta name="description" content={metaDescription} />
      </Head>
      <div className="bg-background text-foreground font-sans">
          <ThemeLayout HeaderComponent={() => <PublicHeader siteName={settings?.siteName} siteLogoUrl={settings?.siteLogoUrl} />} FooterComponent={() => <PublicFooter siteName={settings?.siteName} />} pageId={pageId}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:max-w-7xl mx-auto">
              <div className="lg:col-span-9">
                  <article className="max-w-none">

                    <div className="text-muted-foreground text-sm mb-5">
                        <span><Link href={`/archive/${format(new Date(), 'yyyy/MM/dd')}`} className="hover:underline">{format(new Date(), 'EEEE, d MMMM yyyy')}</Link></span>
                    </div>
                  
                  {isPost ? (
                    <>
                    <header className="mb-8 border-b pb-4">
                      {displayTitle && <h1 className="text-4xl font-black font-headline tracking-tight lg:text-6xl mb-4">{item.title}</h1>}
                      <div className="text-muted-foreground text-sm">
                          <span>Published <Link href={`/archive/${format(item.createdAt.toDate(), 'yyyy/MM/dd')}`} className="hover:underline">{item.createdAt ? format(item.createdAt.toDate(), 'PPpp') : ''}</Link></span>
                          <span className='mx-1'>by</span>
                          <PostAuthor authorId={item.authorId} />
                      </div>
                      <p className='text-muted-foreground text-base italics mt-3'>{item.excerpt}</p>
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
                        <div
                            className="prose dark:prose-invert lg:prose-lg max-w-none"
                            dangerouslySetInnerHTML={{ __html: item.content }}
                        />
                    </>
                       
                  ) : (
                      <PageContent page={item as Page} />
                  )}

                  {isPost && (item as Post).tagIds && (item as Post).tagIds!.length > 0 && (
                      <footer className="mt-12 pt-8 border-t">
                          <div className="flex flex-wrap gap-2">
                              {(item as Post).tagIds!.map(tag => (
                                  <Link key={tag} href={`/tag/${tag}`}>
                                      <Badge variant="secondary">{tag}</Badge>
                                  </Link>
                              ))}
                          </div>
                      </footer>
                  )}
                  </article>
              </div>
              <aside className="lg:col-span-3 space-y-8 lg:sticky lg:top-24 self-start">
                  <WidgetArea areaName="Sidebar" />
                  <WidgetArea areaName="Page Sidebar" isPageSpecific={!!pageId} pageId={pageId} />
              </aside>
          </div>
        </ThemeLayout>
      </div>
    </>
  );
}
