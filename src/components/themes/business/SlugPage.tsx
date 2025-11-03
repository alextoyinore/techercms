'use client';
import { useMemo, useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, usePathname } from 'next/navigation';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp, doc, orderBy, limit } from 'firebase/firestore';
import { format } from 'date-fns';
import { Loading } from '@/components/loading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Eye, Clock } from 'lucide-react';
import { WidgetArea } from '@/components/widgets/WidgetArea';
import { PageBuilderRenderer } from '@/components/page-builder-renderer';
import { PublicHeader, PublicFooter } from './HomePage';
import { ThemeLayout } from '../ThemeLayout';
import { PostAuthor } from '../PostAuthor';
import { ShareButtons } from '../ShareButtons';
import { RelatedPosts } from '../RelatedPosts';
import { CommentsSection } from '@/components/comments/CommentsSection';
import { trackView } from '@/app/actions/track-view';
import { calculateReadTime } from '@/lib/utils';
import { TextToSpeechPlayer } from '@/components/TextToSpeechPlayer';
import { ReadingProgress } from '@/components/ReadingProgress';
import parse, { domToReact, HTMLReactParserOptions, Element } from 'html-react-parser';
import { RelatedPostCard } from '../RelatedPostCard';
import { BreakingNewsIndicator } from '@/components/BreakingNewsIndicator';
import { ChartWidget } from '@/components/widgets/ChartWidget';
import { v4 as uuidv4 } from 'uuid';

type Post = {
  id: string;
  title: string;
  content: string;
  slug: string;
  authorId: string;
  featuredImageUrl: string;
  featuredImageCaption?: string;
  createdAt: Timestamp;
  isBreaking?: boolean;
  tagIds?: string[];
  metaDescription?: string;
  focusKeyword?: string;
  excerpt?: string;
  categoryIds?: string[];
  audioUrl?: string;
};

type Page = {
  id: string;
  title: string;
  content: string;
  slug: string;
  authorId: string;
  featuredImageUrl: string;
  featuredImageCaption?: string;
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

const parserOptions: HTMLReactParserOptions = {
    replace: (domNode) => {
        if (domNode instanceof Element && domNode.attribs) {
            if (domNode.attribs['data-type'] === 'related-post') {
                const postId = domNode.attribs['data-id'];
                if (postId) {
                    return <RelatedPostCard postId={postId} />;
                }
            }
            if (domNode.attribs['data-type'] === 'chart-widget') {
                const chartId = domNode.attribs['data-chart-id'];
                const chartName = domNode.attribs['data-chart-name'];
                if (chartId) {
                    return <ChartWidget chartId={chartId} title={chartName} />;
                }
            }
            if (domNode.tagName === 'figure') {
                const img = domNode.children.find(child => (child as Element).tagName === 'img');
                const figcaption = domNode.children.find(child => (child as Element).tagName === 'figcaption');
                
                if (img) {
                    return (
                        <figure className="my-6">
                            {domToReact([img])}
                            {figcaption && (
                                <figcaption className="text-center text-sm text-muted-foreground mt-2">
                                    {domToReact(figcaption.children)}
                                </figcaption>
                            )}
                        </figure>
                    );
                }
            }
        }
    },
};

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
    
    // if (isLoadingAreas || isLoadingWidgets) {
    //     return <div className="prose dark:prose-invert lg:prose-lg max-w-none text-sm text-muted-foreground"><p>Loading content...</p></div>
    // }

    if (contentWidgets && contentWidgets.length > 0) {
        return (
            <div className="space-y-6">
                <WidgetArea areaName="Page Content" isPageSpecific={true} pageId={page.id} />
            </div>
        );
    }
    
    return (
        <div className="prose dark:prose-invert lg:prose-lg max-w-none lg:leading-relaxed">
            {parse(page.content, parserOptions)}
        </div>
    );
}

export default function SlugPage({ preloadedItem }: { preloadedItem?: Page | Post }) {
  const params = useParams();
  const pathname = usePathname();
  const slug = preloadedItem ? (preloadedItem as any).slug : params.slug as string;
  const firestore = useFirestore();
  const articleRef = useRef<HTMLElement>(null);
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
        setCurrentUrl(window.location.href);
    }
  }, [pathname]);

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

  const isPost = item ? 'tagIds' in item : false;

  const viewsQuery = useMemoFirebase(() => {
    if (!firestore || !isPost || !item) return null;
    return collection(firestore, `posts/${item.id}/views`);
  }, [firestore, isPost, item]);

  const { data: views } = useCollection(viewsQuery);

  useEffect(() => {
    if (isPost && item?.id) {
        let sessionId = localStorage.getItem('user_session_id');
        if (!sessionId) {
            sessionId = uuidv4();
            localStorage.setItem('user_session_id', sessionId);
        }
        trackView(item.id, sessionId);
    }
  }, [isPost, item?.id]);

  const readTime = isPost ? calculateReadTime(item.content) : null;

  const isLoading = isLoadingPosts || isLoadingPages || isLoadingSettings;

  if (isLoading) {
    return <Loading />;
  }

  if (!item) {
    return null;
  }
  
  const pageId = !isPost ? item.id : undefined;

  // Determine if the title should be shown
  const isHomepage = !isPost && settings?.homepagePageId === item.id;
  const pageShowTitle = !isPost ? (item as Page).showTitle : true;
  // ONLY show title in header for static pages that aren't the homepage
  const displayTitleInHeader = !isPost && !isHomepage && !settings?.hideAllPageTitles && pageShowTitle;

  const siteTitle = settings?.siteName || 'Techer CMS';
  const pageTitle = `${item.title} | ${siteTitle}`;
  const metaDescription = (item as Post)?.metaDescription || (item as Post)?.excerpt || settings?.siteDescription || '';
  const ogImage = item.featuredImageUrl || settings?.siteLogoUrl || '';

  return (
    <>
      <Head>
          <title>{pageTitle}</title>
          <meta name="description" content={metaDescription} />
          <meta property="og:title" content={item.title} />
          <meta property="og:description" content={metaDescription} />
          <meta property="og:image" content={ogImage} />
          <meta property="og:url" content={currentUrl} />
          <meta property="og:type" content={isPost ? 'article' : 'website'} />
          <meta property="og:site_name" content={siteTitle} />
          <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <div className="bg-background text-foreground font-sans">
          {isPost && <ReadingProgress targetRef={articleRef} />}
          <ThemeLayout HeaderComponent={() => <PublicHeader siteName={settings?.siteName} siteLogoUrl={settings?.siteLogoUrl} pageTitle={displayTitleInHeader ? item.title : undefined} />} FooterComponent={() => <PublicFooter siteName={settings?.siteName} />} pageId={pageId}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:max-w-7xl mx-auto">
              <div className="lg:col-span-9">
                  <article className="max-w-none" ref={articleRef}>
                  
                  {isPost ? (
                    <>
                    <header className="mb-8 border-b pb-4">
                      <h1 className="text-4xl font-black font-headline tracking-tight lg:text-6xl mb-4 flex items-center gap-4">{(item as Post).isBreaking && <BreakingNewsIndicator />} {item.title}</h1>
                      <div className="text-muted-foreground text-sm flex items-center gap-4 flex-wrap">
                          <div>
                            <span>Published <Link href={`/archive/${format(item.createdAt.toDate(), 'yyyy/MM/dd')}`} className="hover:underline">{item.createdAt ? format(item.createdAt.toDate(), 'PPpp') : ''}</Link></span>
                            <span className='mx-1'>by</span>
                            <Link href={`/author/${item.authorId}`} className="hover:underline">
                              <PostAuthor authorId={item.authorId} />
                            </Link>
                          </div>
                           {views && (
                            <div className="flex items-center gap-1">
                                <Eye className="h-4 w-4" />
                                <span>{views.length} views</span>
                            </div>
                          )}
                          {readTime && (
                             <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{readTime}</span>
                            </div>
                          )}
                      </div>
                      <p className='text-muted-foreground text-base italics mt-3'>{item.excerpt}</p>
                  </header>
                  
                  <TextToSpeechPlayer audioUrl={(item as Post).audioUrl} />

                  {item.featuredImageUrl && (
                      <figure className="relative aspect-video w-full mb-8">
                      <Image
                          src={item.featuredImageUrl}
                          alt={item.title}
                          fill
                          className="object-cover"
                      />
                      {(item as Post).featuredImageCaption && <figcaption className="text-center text-xs text-muted-foreground mt-2">{(item as Post).featuredImageCaption}</figcaption>}
                      </figure>
                  )}
                        <div className="prose dark:prose-invert lg:prose-lg max-w-none lg:leading-relaxed">
                            {parse(item.content, parserOptions)}
                        </div>

                        <ShareButtons title={item.title} postId={item.id}/>

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

                        <CommentsSection postId={item.id} />
                        <RelatedPosts currentPost={item} />
                    </>
                       
                  ) : (
                      <PageContent page={item as Page} />
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
