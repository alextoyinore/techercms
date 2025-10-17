'use client';

import { useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

type SiteSettings = {
  pageWidth?: 'full' | 'centered';
  contentWidth?: number;
  mediumContentWidth?: number;
};

export function GlobalStyleProvider({ children }: { children: React.ReactNode }) {
  const firestore = useFirestore();

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'site_settings', 'config');
  }, [firestore]);

  const { data: settings } = useDoc<SiteSettings>(settingsRef);

  useEffect(() => {
    const styleId = 'global-layout-styles';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
    }
    
    let css = '';
    if (settings?.pageWidth === 'centered') {
        const largeWidth = settings.contentWidth || 80;
        const mediumWidth = settings.mediumContentWidth || 90;
        css = `
            .container {
                max-width: 95%;
                margin-left: auto;
                margin-right: auto;
            }
            @media (min-width: 768px) {
                .container {
                    max-width: ${mediumWidth}%;
                }
            }
            @media (min-width: 1600px) {
                .container {
                    max-width: ${largeWidth}%;
                }
            }
        `;
    } else {
         css = `
            .container {
                max-width: 100%;
                margin-left: 0;
                margin-right: 0;
            }
        `;
    }
    styleElement.innerHTML = css;
    
    return () => {
        // Clean up the style element when the component unmounts or settings change
        const el = document.getElementById(styleId);
        if (el) {
            // el.remove(); // Optional: depending on desired behavior on navigation
        }
    };

  }, [settings]);

  return <>{children}</>;
}
