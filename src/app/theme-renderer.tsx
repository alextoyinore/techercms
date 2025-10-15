'use client';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
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
};

type SiteSettings = {
  activeTheme: keyof typeof themes;
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

  const PageComponent = pageType === 'home' ? theme.HomePage : theme.SlugPage;

  return <PageComponent />;
}
