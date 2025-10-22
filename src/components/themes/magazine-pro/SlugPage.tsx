
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
import { ThemeLayout } from '../ThemeLayout';
import { Menu } from '@/components/Menu';
import { Sheet, SheetTrigger, SheetContent } from '@/components/ui/sheet';
import { SearchForm } from '../SearchForm';
import { MagazineProHeader, MagazineProFooter } from './HomePage';
import { PostAuthor } from '../PostAuthor';
import { ShareButtons } from '../ShareButtons';
import { RelatedPosts } from '../RelatedPosts';

type Post = {
  excerpt: string;
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
  categoryIds?: string[];
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
        return <div className="prose dark:prose-invert lg:prose-lg max-w-none mx-auto"><p>Loading content...</p></div>
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
            className="prose dark:prose-invert lg:prose-lg max-w-none mx-auto lg:leading-relaxed"
            dangerouslySetInnerHTML={{ __html: page.content }}
        />
    );
}

// Accept an optional preloadedItem prop
export default function SlugPage({ preloadedItem }: { preloadedItem?: Page | Post }) {
  const params = useParams();
  // If no preloadedItem is provided (e.g., navigating directly), use the slug from URL
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
    // Prioritize preloadedItem if it exists
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

  const siteTitle = settings?.siteName || 'Techer CMS';
  const pageTitle = `${item.title} - ${siteTitle}`;
  const metaDescription = (item as Post)?.metaDescription || (item as any)?.excerpt || `Read more about ${item.title} on ${siteTitle}`;


  return (
    <>
    <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={metaDescription} />
    </Head>
    <ThemeLayout HeaderComponent={MagazineProHeader} FooterComponent={MagazineProFooter} pageId={pageId}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:max-w-7xl mx-auto">
              <div className="lg:col-span-9">
                  <article className="max-w-none">
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
                            className="prose dark:prose-invert lg:prose-lg max-w-none lg:leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: item.content }}
                        />
                        
                        <ShareButtons title={item.title} postId={item.id}/>

                        <RelatedPosts currentPost={item} />
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
    </>
  );
}
