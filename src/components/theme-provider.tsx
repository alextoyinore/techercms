
'use client';

import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import { themes as defaultThemes, type Theme, defaultTheme } from '@/lib/themes';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

type SiteSettings = {
  dashboardTheme?: string;
  fontSize?: number;
};

interface ThemeProviderState {
  theme: Theme;
  themes: Theme[];
  setTheme: (theme: Theme, temporary?: boolean) => void;
  addTheme: (theme: Theme) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
}

const ThemeProviderContext = createContext<ThemeProviderState>({
  theme: defaultTheme,
  themes: defaultThemes,
  setTheme: () => null,
  addTheme: () => null,
  fontSize: 14,
  setFontSize: () => null,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themes, setThemes] = useState<Theme[]>(defaultThemes);
  const [activeTheme, setActiveTheme] = useState<Theme>(defaultTheme);
  const [fontSize, setFontSizeState] = useState<number>(14);
  const [initialLoad, setInitialLoad] = useState(true);
  
  const firestore = useFirestore();

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'site_settings', 'config');
  }, [firestore]);

  const { data: settings } = useDoc<SiteSettings>(settingsRef);

  // Load themes from localStorage on initial mount
  useEffect(() => {
    try {
      const storedThemes = localStorage.getItem('themes');
      if (storedThemes) {
        setThemes(JSON.parse(storedThemes));
      }
    } catch (e) {
      console.error("Failed to parse themes from localStorage", e);
    }
  }, []);

  // Update themes in localStorage whenever they change
  useEffect(() => {
    if (!initialLoad) {
      localStorage.setItem('themes', JSON.stringify(themes));
    }
  }, [themes, initialLoad]);

  // Determine active theme and font size from DB or localStorage
  useEffect(() => {
    let themeNameToApply = defaultTheme.name;
    let sizeToApply = 14;

    if (settings) {
      themeNameToApply = settings.dashboardTheme || defaultTheme.name;
      sizeToApply = settings.fontSize || 14;
    } else {
      try {
        const storedThemeName = localStorage.getItem('theme');
        if (storedThemeName) {
          themeNameToApply = storedThemeName;
        }
        const storedFontSize = localStorage.getItem('fontSize');
        if (storedFontSize) {
          sizeToApply = Number(storedFontSize);
        }
      } catch (e) {
        console.error("Failed to parse settings from localStorage", e);
      }
    }
    
    const themeToApply = themes.find(t => t.name === themeNameToApply) || themes.find(t => t.name === defaultTheme.name) || defaultTheme;
    setActiveTheme(themeToApply);
    setFontSizeState(sizeToApply);

    if (initialLoad) {
      setInitialLoad(false);
    }

  }, [settings, themes, initialLoad]);


  const applyTheme = useCallback((themeToApply: Theme) => {
    const root = window.document.documentElement;
    Object.entries(themeToApply.colors).forEach(([key, value]) => {
      if (typeof value === 'object') {
        Object.entries(value).forEach(([subKey, subValue]) => {
          root.style.setProperty(`--sidebar-${subKey}`, subValue);
        });
      } else {
        root.style.setProperty(`--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`, value);
      }
    });
  }, []);


  useEffect(() => {
    applyTheme(activeTheme);
  }, [activeTheme, applyTheme]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.style.fontSize = `${fontSize}px`;
    if (!initialLoad) {
      localStorage.setItem('fontSize', String(fontSize));
    }
  }, [fontSize, initialLoad]);

  const addTheme = (newTheme: Theme) => {
    setThemes(currentThemes => {
        const newThemes = [...currentThemes.filter(t => t.name !== newTheme.name), newTheme];
        // localStorage is now handled by the useEffect for `themes`
        return newThemes;
    });
  };
  
  const setTheme = (newTheme: Theme, temporary = false) => {
    if (temporary) {
      applyTheme(newTheme);
      return;
    }
    setActiveTheme(newTheme);
    if (!initialLoad) {
        localStorage.setItem('theme', newTheme.name);
    }
  };

  const setFontSize = (size: number) => {
    setFontSizeState(size);
    if(firestore && settingsRef) {
        setDoc(settingsRef, { fontSize: size }, { merge: true });
    }
  }

  const value = {
    theme: activeTheme,
    themes,
    setTheme,
    addTheme,
    fontSize,
    setFontSize,
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
