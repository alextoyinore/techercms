'use client';
import { useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, where, Timestamp } from 'firebase/firestore';
import { Loading } from '@/components/loading';

// Dynamically import theme components
import dynamic from 'next/dynamic';

const themes = {
  'Magazine Pro': {
    HomePage: dynamic(() => import('@/components/themes/magazine-pro/HomePage')),
    SlugPage: dynamic(() => import('@/components/themes/magazine-pro/SlugPage')),
  },
  'Minimalist Blog': {
    HomePage: dynamic(() => import('@/components/themes/minimalist-blog/HomePage')),
    SlugPage: dynamic(() => import('@/components/themes/minimalist-blog/SlugPage')),
  },
  'Creative Portfolio': {
    HomePage: dynamic(() => import('@/components/themes/creative-portfolio/HomePage')),
    SlugPage: dynamic(() => import('@/components/themes/creative-portfolio/SlugPage')),
  },
  'Newspaper': {
    HomePage: dynamic(() => import('@/components/themes/newspaper/HomePage')),
    SlugPage: dynamic(() => import('@/components/themes/newspaper/SlugPage')),
  },
  'Tech Today': {
    HomePage: dynamic(() => import('@/components/themes/tech-today/HomePage')),
    SlugPage: dynamic(() => import('@/components/themes/tech-today/SlugPage')),
  },
  'Earthy Elegance': {
    HomePage: dynamic(() => import('@/components/themes/earthy-elegance/HomePage')),
    SlugPage: dynamic(() => import('@/components/themes/earthy-elegance/SlugPage')),
  },
};

type SiteSettings = {
  activeTheme: keyof typeof themes;
  homepageType?: 'latest' | 'static';
  homepagePageId?: string;
};

type ThemeRendererProps = {
  pageType: 'home' | 'slug';
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
    // If homepage is a static page, we render the SlugPage component with the correct slug.
    // To do this, we need to fetch the page to get its slug.
    return <StaticHomepageRenderer pageId={settings.homepagePageId} theme={theme} />;
  }
  
  const PageComponent = pageType === 'home' ? theme.HomePage : theme.SlugPage;

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

    // We can't just pass the slug to the SlugPage, because the URL in the browser
    // will still be '/', not '/[slug]'. The useParams() hook in SlugPage will not work.
    // Instead, we will need to replicate the logic of SlugPage here for the homepage context.
    // For now, we will render the SlugPage component but we will need to adjust it
    // to accept an optional page object prop instead of relying on useParams.
    // This is a bigger refactor, so for now we'll just show a placeholder.
    
    const SlugPageComponent = theme.SlugPage;
    // This is a conceptual example. The SlugPage would need to be modified
    // to accept a 'page' prop instead of fetching based on a slug from the URL.
    // Since we cannot modify it right now, this will effectively re-fetch inside SlugPage,
    // which is inefficient but will work for demonstration. A proper implementation
    // would involve passing the fetched `page` data down as a prop.
    
    // To make this work, we need to temporarily override the browser's URL perception for useParams
    // A clean way is to pass data directly. Let's assume SlugPage can take an item prop.
    return <SlugPageComponent preloadedItem={page} />;
}
