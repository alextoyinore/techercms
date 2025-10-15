'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { themes as defaultThemes, type Theme, defaultTheme } from '@/lib/themes';

interface ThemeProviderState {
  theme: Theme;
  themes: Theme[];
  setTheme: (theme: Theme) => void;
  addTheme: (theme: Theme) => void;
}

const ThemeProviderContext = createContext<ThemeProviderState>({
  theme: defaultTheme,
  themes: defaultThemes,
  setTheme: () => null,
  addTheme: () => null,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themes, setThemes] = useState<Theme[]>(defaultThemes);
  const [theme, setThemeState] = useState<Theme>(defaultTheme);

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
    localStorage.setItem('theme', theme.name);
  }, [theme, applyTheme]);

  const addTheme = (newTheme: Theme) => {
    setThemes(currentThemes => {
        const newThemes = [...currentThemes.filter(t => t.name !== newTheme.name), newTheme];
        localStorage.setItem('themes', JSON.stringify(newThemes));
        return newThemes;
    });
  };
  
  const setTheme = (newTheme: Theme) => {
      setThemeState(newTheme);
  };

  const value = {
    theme,
    themes,
    setTheme,
    addTheme,
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
