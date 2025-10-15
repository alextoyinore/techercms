'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { themes, Theme, defaultTheme } from '@/lib/themes';

interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeProviderContext = createContext<ThemeProviderState>({
  theme: defaultTheme,
  setTheme: () => null,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);

  useEffect(() => {
    const storedThemeName = localStorage.getItem('theme');
    const storedTheme = themes.find(t => t.name === storedThemeName) || defaultTheme;
    setThemeState(storedTheme);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.style.setProperty('--background', theme.colors.background);
    root.style.setProperty('--foreground', theme.colors.foreground);
    root.style.setProperty('--card', theme.colors.card);
    root.style.setProperty('--card-foreground', theme.colors.cardForeground);
    root.style.setProperty('--popover', theme.colors.popover);
    root.style.setProperty('--popover-foreground', theme.colors.popoverForeground);
    root.style.setProperty('--primary', theme.colors.primary);
    root.style.setProperty('--primary-foreground', theme.colors.primaryForeground);
    root.style.setProperty('--secondary', theme.colors.secondary);
    root.style.setProperty('--secondary-foreground', theme.colors.secondaryForeground);
    root.style.setProperty('--muted', theme.colors.muted);
    root.style.setProperty('--muted-foreground', theme.colors.mutedForeground);
    root.style.setProperty('--accent', theme.colors.accent);
    root.style.setProperty('--accent-foreground', theme.colors.accentForeground);
    root.style.setProperty('--destructive', theme.colors.destructive);
    root.style.setProperty('--destructive-foreground', theme.colors.destructiveForeground);
    root.style.setProperty('--border', theme.colors.border);
    root.style.setProperty('--input', theme.colors.input);
    root.style.setProperty('--ring', theme.colors.ring);
    root.style.setProperty('--sidebar-background', theme.colors.sidebar.background);
    root.style.setProperty('--sidebar-foreground', theme.colors.sidebar.foreground);
    root.style.setProperty('--sidebar-primary', theme.colors.sidebar.primary);
    root.style.setProperty('--sidebar-primary-foreground', theme.colors.sidebar.primaryForeground);
    root.style.setProperty('--sidebar-accent', theme.colors.sidebar.accent);
    root.style.setProperty('--sidebar-accent-foreground', theme.colors.sidebar.accentForeground);
    root.style.setProperty('--sidebar-border', theme.colors.sidebar.border);
    root.style.setProperty('--sidebar-ring', theme.colors.sidebar.ring);

    localStorage.setItem('theme', theme.name);
  }, [theme]);

  const value = {
    theme,
    setTheme: setThemeState,
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
