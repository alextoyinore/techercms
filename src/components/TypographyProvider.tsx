'use client';

import { useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { fontList } from '@/lib/fonts';
import { Inter, Poppins } from 'next/font/google';

type SiteSettings = {
  bodyFont?: string;
  headlineFont?: string;
  baseFontSize?: number;
};

// Dynamically load font functions from next/font/google
const fontLoaders: { [key: string]: Function | undefined } = {};
fontList.forEach(font => {
    try {
        fontLoaders[font.name] = require(`next/font/google`)[font.loader];
    } catch (e) {
        console.error(`Could not load font loader for ${font.name}`, e);
        fontLoaders[font.name] = undefined;
    }
});

const defaultBodyFontLoader = Inter({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-body',
});

const defaultHeadlineFontLoader = Poppins({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-headline',
    weight: '700'
});


export function TypographyProvider({ children }: { children: React.ReactNode }) {
  const firestore = useFirestore();

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'site_settings', 'config');
  }, [firestore]);

  const { data: settings } = useDoc<SiteSettings>(settingsRef);

  const bodyFontName = settings?.bodyFont || 'Inter';
  const headlineFontName = settings?.headlineFont || 'Poppins';
  const baseFontSize = settings?.baseFontSize || 16;
  
  const bodyFontConfig = fontList.find(f => f.name === bodyFontName) || fontList.find(f => f.name === 'Inter')!;
  const headlineFontConfig = fontList.find(f => f.name === headlineFontName) || fontList.find(f => f.name === 'Poppins')!;

  const bodyFontLoader = fontLoaders[bodyFontConfig.name];
  const headlineFontLoader = fontLoaders[headlineFontConfig.name];

  const bodyFont = (bodyFontLoader && typeof bodyFontLoader === 'function') ? bodyFontLoader({
      subsets: ['latin'],
      display: 'swap',
      variable: '--font-body',
      weight: bodyFontConfig.weights,
  }) : defaultBodyFontLoader;

  const headlineFont = (headlineFontLoader && typeof headlineFontLoader === 'function') ? headlineFontLoader({
      subsets: ['latin'],
      display: 'swap',
      variable: '--font-headline',
      weight: headlineFontConfig.weights,
  }) : defaultHeadlineFontLoader;

  useEffect(() => {
    document.documentElement.style.setProperty('--base-font-size', `${baseFontSize}px`);
  }, [baseFontSize]);

  return (
    <div className={`${bodyFont.variable} ${headlineFont.variable} font-body`} style={{ fontSize: 'var(--base-font-size)' }}>
        {children}
    </div>
  );
}
