'use client';

import { useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

type SiteSettings = {
  pageWidth?: 'full' | 'centered';
  contentWidth?: number;
};

export function GlobalStyleProvider({ children }: { children: React.ReactNode }) {
  const firestore = useFirestore();

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'site_settings', 'config');
  }, [firestore]);

  const { data: settings } = useDoc<SiteSettings>(settingsRef);

  useEffect(() => {
    const root = document.documentElement;
    if (settings) {
        if (settings.pageWidth === 'centered') {
            const width = settings.contentWidth || 75;
            root.style.setProperty('--page-max-width', `${width}rem`);
            root.style.setProperty('--page-margin-x', 'auto');
        } else {
            root.style.setProperty('--page-max-width', '100%');
            root.style.setProperty('--page-margin-x', '0');
        }
    } else {
        // Default styles if settings are not loaded
        root.style.setProperty('--page-max-width', '100%');
        root.style.setProperty('--page-margin-x', '0');
    }
  }, [settings]);

  return <>{children}</>;
}
