export interface ThemeColors {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
  sidebar: {
    background: string;
    foreground: string;
    primary: string;
    primaryForeground: string;
    accent: string;
    accentForeground: string;
    border: string;
    ring: string;
  };
}

export interface Theme {
  name: string;
  colors: ThemeColors;
}

export const defaultTheme: Theme = {
  name: 'Default',
  colors: {
    background: '0 0% 98%',
    foreground: '215 8% 20%',
    card: '0 0% 100%',
    cardForeground: '215 8% 20%',
    popover: '0 0% 100%',
    popoverForeground: '215 8% 20%',
    primary: '220 85% 38%',
    primaryForeground: '0 0% 100%',
    secondary: '0 0% 90%',
    secondaryForeground: '215 8% 20%',
    muted: '0 0% 90%',
    mutedForeground: '0 0% 45.1%',
    accent: '215 8% 37%',
    accentForeground: '0 0% 100%',
    destructive: '0 84.2% 60.2%',
    destructiveForeground: '0 0% 98%',
    border: '0 0% 85%',
    input: '0 0% 85%',
    ring: '220 85% 38%',
    sidebar: {
      background: '220 10% 12%',
      foreground: '210 20% 80%',
      primary: '220 90% 55%',
      primaryForeground: '0 0% 100%',
      accent: '215 8% 25%',
      accentForeground: '0 0% 100%',
      border: '215 8% 20%',
      ring: '220 90% 55%',
    },
  },
};

export const themes: Theme[] = [
  defaultTheme,
  {
    name: 'Midnight Dark',
    colors: {
      background: '215 15% 15%',
      foreground: '0 0% 98%',
      card: '215 15% 18%',
      cardForeground: '0 0% 98%',
      popover: '215 15% 11%',
      popoverForeground: '0 0% 98%',
      primary: '220 90% 55%',
      primaryForeground: '0 0% 100%',
      secondary: '215 15% 25%',
      secondaryForeground: '0 0% 98%',
      muted: '215 15% 25%',
      mutedForeground: '0 0% 63.9%',
      accent: '215 8% 45%',
      accentForeground: '0 0% 100%',
      destructive: '0 62.8% 30.6%',
      destructiveForeground: '0 0% 98%',
      border: '215 15% 25%',
      input: '215 15% 25%',
      ring: '220 90% 55%',
      sidebar: {
        background: '215 15% 11%',
        foreground: '210 20% 80%',
        primary: '220 90% 55%',
        primaryForeground: '0 0% 100%',
        accent: '215 8% 25%',
        accentForeground: '0 0% 100%',
        border: '215 8% 20%',
        ring: '220 90% 55%',
      },
    },
  },
  {
    name: 'Vibrant Creative',
    colors: {
        background: '270 90% 98%',
        foreground: '270 40% 10%',
        card: '270 90% 100%',
        cardForeground: '270 40% 10%',
        popover: '270 90% 100%',
        popoverForeground: '270 40% 10%',
        primary: '330 85% 55%',
        primaryForeground: '0 0% 100%',
        secondary: '270 60% 92%',
        secondaryForeground: '270 40% 10%',
        muted: '270 60% 92%',
        mutedForeground: '270 20% 45%',
        accent: '300 80% 50%',
        accentForeground: '0 0% 100%',
        destructive: '0 84.2% 60.2%',
        destructiveForeground: '0 0% 98%',
        border: '270 60% 88%',
        input: '270 60% 88%',
        ring: '330 85% 55%',
        sidebar: {
            background: '274 54% 20%',
            foreground: '270 50% 90%',
            primary: '330 85% 65%',
            primaryForeground: '0 0% 100%',
            accent: '274 50% 30%',
            accentForeground: '0 0% 100%',
            border: '274 50% 25%',
            ring: '330 85% 65%',
        },
    },
  },
];
