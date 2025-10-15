
'use client';

import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import { themes as defaultThemes, type Theme, defaultTheme } from '@/lib/themes';

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
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [fontSize, setFontSizeState] = useState<number>(14);

  useEffect(() => {
    try {
      const storedThemes = localStorage.getItem('themes');
      if (storedThemes) {
        setThemes(JSON.parse(storedThemes));
      }
    } catch (e) {
      console.error("Failed to parse themes from localStorage", e);
      setThemes(defaultThemes);
    }
  }, []);

  useEffect(() => {
    try {
      const storedThemeName = localStorage.getItem('theme');
      const activeTheme = themes.find(t => t.name === storedThemeName) || defaultTheme;
      setThemeState(activeTheme);
    } catch (e) {
      console.error("Failed to parse theme name from localStorage", e);
      setThemeState(defaultTheme);
    }
  }, [themes]);

  useEffect(() => {
    try {
        const storedFontSize = localStorage.getItem('fontSize');
        if (storedFontSize) {
            setFontSizeState(Number(storedFontSize));
        }
    } catch(e) {
        console.error("Failed to parse font size from localStorage", e);
        setFontSizeState(14);
    }
  }, []);

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
    applyTheme(theme);
  }, [theme, applyTheme]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.style.fontSize = `${fontSize}px`;
    localStorage.setItem('fontSize', String(fontSize));
  }, [fontSize]);

  const addTheme = (newTheme: Theme) => {
    setThemes(currentThemes => {
        const newThemes = [...currentThemes.filter(t => t.name !== newTheme.name), newTheme];
        localStorage.setItem('themes', JSON.stringify(newThemes));
        return newThemes;
    });
  };
  
  const setTheme = (newTheme: Theme, temporary = false) => {
    // If we are applying a temporary theme, don't save it to local storage.
    if (temporary) {
      applyTheme(newTheme);
      return;
    }
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme.name);
  };

  const setFontSize = (size: number) => {
    setFontSizeState(size);
  }

  const value = {
    theme,
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
