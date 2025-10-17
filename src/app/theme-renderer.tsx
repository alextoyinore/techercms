'use client';
import { useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, where, Timestamp } from 'firebase/firestore';
import { Loading } from '@/components/loading';

// Dynamically import theme components
import dynamic from 'next/dynamic';

const themes: Record<string, Record<string, any>> = {
  'Magazine Pro': {
    HomePage: dynamic(() => import('@/components/themes/magazine-pro/HomePage')),
    SlugPage: dynamic(() => import('@/components/themes/magazine-pro/SlugPage')),
    CategoryPage: dynamic(() => import('@/components/themes/magazine-pro/CategoryPage')),
    TagPage: dynamic(() => import('@/components/themes/magazine-pro/TagPage')),
    AuthorPage: dynamic(() => import('@/components/themes/magazine-pro/AuthorPage')),
    SearchPage: dynamic(() => import('@/components/themes/magazine-pro/SearchPage')),
  },
  'Minimalist Blog': {
    HomePage: dynamic(() => import('@/components/themes/minimalist-blog/HomePage')),
    SlugPage: dynamic(() => import('@/components/themes/minimalist-blog/SlugPage')),
    CategoryPage: dynamic(() => import('@/components/themes/minimalist-blog/CategoryPage')),
    TagPage: dynamic(() => import('@/components/themes/minimalist-blog/TagPage')),
    AuthorPage: dynamic(() => import('@/components/themes/minimalist-blog/AuthorPage')),
    SearchPage: dynamic(() => import('@/components/themes/minimalist-blog/SearchPage')),
  },
  'Creative Portfolio': {
    HomePage: dynamic(() => import('@/components/themes/creative-portfolio/HomePage')),
    SlugPage: dynamic(() => import('@/components/themes/creative-portfolio/SlugPage')),
    CategoryPage: dynamic(() => import('@/components/themes/creative-portfolio/CategoryPage')),
    TagPage: dynamic(() => import('@/components/themes/creative-portfolio/TagPage')),
    AuthorPage: dynamic(() => import('@/components/themes/creative-portfolio/AuthorPage')),
    SearchPage: dynamic(() => import('@/components/themes/creative-portfolio/SearchPage')),
  },
  'Newspaper': {
    HomePage: dynamic(() => import('@/components/themes/newspaper/HomePage')),
    SlugPage: dynamic(() => import('@/components/themes/newspaper/SlugPage')),
    CategoryPage: dynamic(() => import('@/components/themes/newspaper/CategoryPage')),
    TagPage: dynamic(() => import('@/components/themes/newspaper/TagPage')),
    AuthorPage: dynamic(() => import('@/components/themes/newspaper/AuthorPage')),
    SearchPage: dynamic(() => import('@/components/themes/newspaper/SearchPage')),
  },
  'Tech Today': {
    HomePage: dynamic(() => import('@/components/themes/tech-today/HomePage')),
    SlugPage: dynamic(() => import('@/components/themes/tech-today/SlugPage')),
    CategoryPage: dynamic(() => import('@/components/themes/tech-today/CategoryPage')),
    TagPage: dynamic(() => import('@/components/themes/tech-today/TagPage')),
    AuthorPage: dynamic(() => import('@/components/themes/tech-today/AuthorPage')),
    SearchPage: dynamic(() => import('@/components/themes/tech-today/SearchPage')),
  },
  'Earthy Elegance': {
    HomePage: dynamic(() => import('@/components/themes/earthy-elegance/HomePage')),
    SlugPage: dynamic(() => import('@/components/themes/earthy-elegance/SlugPage')),
    CategoryPage: dynamic(() => import('@/components/themes/earthy-elegance/CategoryPage')),
    TagPage: dynamic(() => import('@/components/themes/earthy-elegance/TagPage')),
    AuthorPage: dynamic(() => import('@/components/themes/earthy-elegance/AuthorPage')),
    SearchPage: dynamic(() => import('@/components/themes/earthy-elegance/SearchPage')),
  },
  'Business': {
    HomePage: dynamic(() => import('@/components/themes/business/HomePage')),
    SlugPage: dynamic(() => import('@/components/themes/business/SlugPage')),
    CategoryPage: dynamic(() => import('@/components/themes/business/CategoryPage')),
    TagPage: dynamic(() => import('@/components/themes/business/TagPage')),
    AuthorPage: dynamic(() => import('@/components/themes/business/AuthorPage')),
    SearchPage: dynamic(() => import('@/components/themes/business/SearchPage')),
  },
  'Sports': {
    HomePage: dynamic(() => import('@/components/themes/sports/HomePage')),
    SlugPage: dynamic(() => import('@/components/themes/sports/SlugPage')),
    CategoryPage: dynamic(() => import('@/components/themes/sports/CategoryPage')),
    TagPage: dynamic(() => import('@/components/themes/sports/TagPage')),
    AuthorPage: dynamic(() => import('@/components/themes/sports/AuthorPage')),
    SearchPage: dynamic(() => import('@/components/themes/sports/SearchPage')),
  },
  'NewsPro': {
    HomePage: dynamic(() => import('@/components/themes/newspro/HomePage')),
    SlugPage: dynamic(() => import('@/components/themes/newspro/SlugPage')),
    CategoryPage: dynamic(() => import('@/components/themes/newspro/CategoryPage')),
    TagPage: dynamic(() => import('@/components/themes/newspro/TagPage')),
    AuthorPage: dynamic(() => import('@/components/themes/newspro/AuthorPage')),
    SearchPage: dynamic(() => import('@/components/themes/newspro/SearchPage')),
  },
  'Vogue': {
    HomePage: dynamic(() => import('@/components/themes/vogue/HomePage')),
    SlugPage: dynamic(() => import('@/components/themes/vogue/SlugPage')),
    CategoryPage: dynamic(() => import('@/components/themes/vogue/CategoryPage')),
    TagPage: dynamic(() => import('@/components/themes/vogue/TagPage')),
    AuthorPage: dynamic(() => import('@/components/themes/vogue/AuthorPage')),
    SearchPage: dynamic(() => import('@/components/themes/vogue/SearchPage')),
  },
};

type SiteSettings = {
  activeTheme: keyof typeof themes;
  homepageType?: 'latest' | 'static';
  homepagePageId?: string;
};

type ThemeRendererProps = {
  pageType: 'home' | 'slug' | 'category' | 'tag' | 'author' | 'search';
};

export function ThemeRenderer({ pageType }: ThemeRendererProps) {
  const firestore = useFirestore();

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'site_settings', 'config');
  }, [firestore]);

  const { data: settings, isLoading } = useDoc<SiteSettings>(settingsRef);

  if (isLoading) {
    return <Loading />;
  }

  const activeThemeName = settings?.activeTheme || 'Magazine Pro';
  const theme = themes[activeThemeName] || themes['Magazine Pro'];

  if (pageType === 'home' && settings?.homepageType === 'static' && settings.homepagePageId) {
    return <StaticHomepageRenderer pageId={settings.homepagePageId} theme={theme} />;
  }
  
  let PageComponent;
  switch (pageType) {
    case 'home':
      PageComponent = theme.HomePage;
      break;
    case 'slug':
      PageComponent = theme.SlugPage;
      break;
    case 'category':
      PageComponent = theme.CategoryPage;
      break;
    case 'tag':
      PageComponent = theme.TagPage;
      break;
    case 'author':
      PageComponent = theme.AuthorPage;
      break;
    case 'search':
      PageComponent = theme.SearchPage;
      break;
    default:
      PageComponent = theme.HomePage;
  }

  return <PageComponent />;
}


function StaticHomepageRenderer({ pageId, theme }: { pageId: string, theme: any}) {
    const firestore = useFirestore();

    const pageRef = useMemoFirebase(() => {
        if(!firestore) return null;
        return doc(firestore, 'pages', pageId);
    }, [firestore, pageId]);
    
    const { data: page, isLoading } = useDoc(pageRef);

    if (isLoading) {
        return <Loading />;
    }
    
    if (!page) {
        // Fallback to default homepage if the selected static page is not found
        const HomePageComponent = theme.HomePage;
        return <HomePageComponent />
    }
    
    const SlugPageComponent = theme.SlugPage;
    return <SlugPageComponent preloadedItem={page} />;
}
