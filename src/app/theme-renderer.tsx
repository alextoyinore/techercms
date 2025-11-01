
'use client';
import { useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, where, Timestamp } from 'firebase/firestore';
import { Loading } from '@/components/loading';

// Dynamically import theme components
import dynamic from 'next/dynamic';
import { useMemo } from 'react';

const themes: Record<string, Record<string, any>> = {
  'Magazine Pro': {
    HomePage: dynamic(() => import('@/components/themes/magazine-pro/HomePage')),
    SlugPage: dynamic(() => import('@/components/themes/magazine-pro/SlugPage')),
    CategoryPage: dynamic(() => import('@/components/themes/magazine-pro/CategoryPage')),
    TagPage: dynamic(() => import('@/components/themes/magazine-pro/TagPage')),
    AuthorPage: dynamic(() => import('@/components/themes/magazine-pro/AuthorPage')),
    SearchPage: dynamic(() => import('@/components/themes/magazine-pro/SearchPage')),
    DatePage: dynamic(() => import('@/components/themes/magazine-pro/DatePage')),
    NewsPage: dynamic(() => import('@/components/themes/magazine-pro/CategoryPage')), // Fallback
  },
  'Business': {
    HomePage: dynamic(() => import('@/components/themes/business/HomePage')),
    SlugPage: dynamic(() => import('@/components/themes/business/SlugPage')),
    CategoryPage: dynamic(() => import('@/components/themes/business/CategoryPage')),
    TagPage: dynamic(() => import('@/components/themes/business/TagPage')),
    AuthorPage: dynamic(() => import('@/components/themes/business/AuthorPage')),
    SearchPage: dynamic(() => import('@/components/themes/business/SearchPage')),
    DatePage: dynamic(() => import('@/components/themes/business/DatePage')),
    NewsPage: dynamic(() => import('@/components/themes/business/NewsPage')),
  },
  'NewsPro': {
    HomePage: dynamic(() => import('@/components/themes/newspro/HomePage')),
    SlugPage: dynamic(() => import('@/components/themes/newspro/SlugPage')),
    CategoryPage: dynamic(() => import('@/components/themes/newspro/CategoryPage')),
    TagPage: dynamic(() => import('@/components/themes/newspro/TagPage')),
    AuthorPage: dynamic(() => import('@/components/themes/newspro/AuthorPage')),
    SearchPage: dynamic(() => import('@/components/themes/newspro/SearchPage')),
    DatePage: dynamic(() => import('@/components/themes/newspro/DatePage')),
    NewsPage: dynamic(() => import('@/components/themes/newspro/CategoryPage')), // Fallback
  },
};

type SiteSettings = {
  activeTheme?: string;
  homepageType?: 'latest' | 'static';
  homepagePageId?: string;
};

type CustomTheme = {
  id: string;
  name: string;
  baseTheme: keyof typeof themes;
};

type ThemeRendererProps = {
  pageType: 'home' | 'slug' | 'category' | 'tag' | 'author' | 'search' | 'date' | 'news';
};

function ActiveThemeResolver({ pageType, settings }: { pageType: ThemeRendererProps['pageType'], settings: SiteSettings }) {
  const firestore = useFirestore();

  const customThemesQuery = useMemoFirebase(() => {
    if (!firestore || !settings.activeTheme) return null;
    return query(collection(firestore, 'custom_themes'), where('name', '==', settings.activeTheme));
  }, [firestore, settings.activeTheme]);

  const { data: customThemes, isLoading: isLoadingCustomThemes } = useCollection<CustomTheme>(customThemesQuery);

  const activeThemeName = useMemo(() => {
    if (isLoadingCustomThemes) return null; // Wait until we know if it's a custom theme

    const customTheme = customThemes?.[0];
    if (customTheme) {
      return customTheme.baseTheme;
    }
    // It's a built-in theme or the default
    return settings.activeTheme && themes[settings.activeTheme] ? settings.activeTheme : 'Magazine Pro';
  }, [customThemes, isLoadingCustomThemes, settings.activeTheme]);


  if (activeThemeName === null) {
    return <Loading />;
  }

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
    case 'date':
      PageComponent = theme.DatePage;
      break;
    case 'news':
      PageComponent = theme.NewsPage;
      break;
    default:
      PageComponent = theme.HomePage;
  }

  return <PageComponent />;
}


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
  
  // This logic is now safe because we wait for `isLoading` above.
  if (pageType === 'home' && settings && settings.homepageType === 'static' && settings.homepagePageId) {
    // If it's a static homepage, we need to resolve the theme first.
    return <ActiveThemeResolver pageType={pageType} settings={settings} />;
  }

  const finalSettings = settings || { activeTheme: 'Magazine Pro' };

  return <ActiveThemeResolver pageType={pageType} settings={finalSettings} />;
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

    
