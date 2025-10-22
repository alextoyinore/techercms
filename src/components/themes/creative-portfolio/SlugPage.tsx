
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
import { ArrowLeft } from 'lucide-react';
import { WidgetArea } from '@/components/widgets/WidgetArea';
import { PageBuilderRenderer } from '@/components/page-builder-renderer';
import { CreativeHeader, CreativeFooter } from './HomePage';
import { ShareButtons } from '../ShareButtons';
import { RelatedPosts } from '../RelatedPosts';

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
  metaDescription?: string;
  excerpt?: string;
  categoryIds?: string[];
};

type Page = {
  id:string;
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

type SiteSettings = {
  hideAllPageTitles?: boolean;
  homepagePageId?: string;
  siteName?: string;
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
        return <div className="prose dark:prose-invert lg:prose-xl max-w-none"><p>Loading content...</p></div>
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
            className="prose dark:prose-invert lg:prose-xl max-w-none lg:leading-relaxed"
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
            <p className="text-xl text-muted-foreground mb-8">The content you're looking for seems to be lost in space.</p>
            <Button asChild variant="default" size="lg">
                <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Return to Home Base
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
      <div className="bg-background">
        <CreativeHeader />
        <main className="container mx-auto px-6 py-8">
          <article className="max-w-none">
            {item.featuredImageUrl && (
              <div className="relative aspect-video w-full mb-8 rounded-lg overflow-hidden shadow-2xl">
                <Image
                  src={item.featuredImageUrl}
                  alt={item.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            )}
            <header className="mb-8 text-center">
              {displayTitle && <h1 className="text-5xl font-extrabold font-headline tracking-tighter lg:text-7xl mb-4">{item.title}</h1>}
              <div className="text-muted-foreground text-sm uppercase tracking-widest">
                  <Link href={`/archive/${format(item.createdAt.toDate(), 'yyyy/MM')}`}>
                      <span className='hover:underline'>{item.createdAt ? format(item.createdAt.toDate(), 'MMMM dd, yyyy') : ''}</span>
                  </Link>
              </div>
            </header>
            
            <div className="max-w-3xl mx-auto">
              {isPost ? (
                <>
                <div
                    className="prose dark:prose-invert lg:prose-xl max-w-none lg:leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: item.content }}
                />

                <ShareButtons title={item.title} postId={item.id}/>

                <RelatedPosts currentPost={item as Post} />
                </>
              ) : (
                  <PageContent page={item as Page} />
              )}

              {isPost && (item as Post).tagIds && (item as Post).tagIds!.length > 0 && (
                <footer className="mt-12 text-center">
                    <div className="flex flex-wrap gap-2 justify-center">
                        {(item as Post).tagIds!.map(tag => (
                            <Link key={tag} href={`/tag/${tag}`}>
                                <Badge variant="secondary" className="text-sm px-4 py-1">{tag}</Badge>
                            </Link>
                        ))}
                    </div>
                </footer>
              )}
            </div>
          </article>
          <aside className="mt-12 space-y-8 max-w-5xl mx-auto">
            <WidgetArea areaName="Page Sidebar" isPageSpecific={!!pageId} pageId={pageId}/>
          </aside>
        </main>
        <WidgetArea areaName="Page Footer" isPageSpecific={!!pageId} pageId={pageId} />
        <CreativeFooter />
      </div>
    </>
  );
}
