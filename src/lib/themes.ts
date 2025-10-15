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
  {
    name: 'Forest Green',
    colors: {
      background: '35 40% 96%',
      foreground: '95 25% 15%',
      card: '35 40% 100%',
      cardForeground: '95 25% 15%',
      popover: '35 40% 100%',
      popoverForeground: '95 25% 15%',
      primary: '90 45% 35%',
      primaryForeground: '90 30% 96%',
      secondary: '40 20% 90%',
      secondaryForeground: '95 25% 15%',
      muted: '40 20% 90%',
      mutedForeground: '95 15% 45%',
      accent: '30 50% 45%',
      accentForeground: '30 30% 98%',
      destructive: '0 70% 50%',
      destructiveForeground: '0 0% 100%',
      border: '40 20% 85%',
      input: '40 20% 85%',
      ring: '90 45% 35%',
      sidebar: {
        background: '95 30% 18%',
        foreground: '90 20% 85%',
        primary: '90 50% 55%',
        primaryForeground: '95 25% 15%',
        accent: '95 25% 28%',
        accentForeground: '90 20% 95%',
        border: '95 25% 25%',
        ring: '90 50% 55%',
      },
    },
  },
  {
    name: 'Sunset Orange',
    colors: {
      background: '25 100% 97%',
      foreground: '20 50% 20%',
      card: '25 100% 100%',
      cardForeground: '20 50% 20%',
      popover: '25 100% 100%',
      popoverForeground: '20 50% 20%',
      primary: '24 95% 50%',
      primaryForeground: '0 0% 100%',
      secondary: '30 80% 92%',
      secondaryForeground: '20 50% 20%',
      muted: '30 80% 92%',
      mutedForeground: '20 30% 45%',
      accent: '280 60% 45%',
      accentForeground: '0 0% 100%',
      destructive: '0 80% 55%',
      destructiveForeground: '0 0% 100%',
      border: '30 80% 88%',
      input: '30 80% 88%',
      ring: '24 95% 50%',
      sidebar: {
        background: '20 40% 15%',
        foreground: '25 60% 85%',
        primary: '24 90% 60%',
        primaryForeground: '20 50% 10%',
        accent: '20 35% 25%',
        accentForeground: '25 60% 95%',
        border: '20 35% 22%',
        ring: '24 90% 60%',
      },
    },
  },
  {
    name: 'Oceanic Teal',
    colors: {
      background: '180 60% 98%',
      foreground: '190 40% 15%',
      card: '180 60% 100%',
      cardForeground: '190 40% 15%',
      popover: '180 60% 100%',
      popoverForeground: '190 40% 15%',
      primary: '185 80% 35%',
      primaryForeground: '0 0% 100%',
      secondary: '180 40% 93%',
      secondaryForeground: '190 40% 15%',
      muted: '180 40% 93%',
      mutedForeground: '190 20% 45%',
      accent: '210 70% 50%',
      accentForeground: '0 0% 100%',
      destructive: '0 75% 55%',
      destructiveForeground: '0 0% 100%',
      border: '180 40% 88%',
      input: '180 40% 88%',
      ring: '185 80% 35%',
      sidebar: {
        background: '195 50% 15%',
        foreground: '180 30% 85%',
        primary: '185 70% 55%',
        primaryForeground: '0 0% 100%',
        accent: '195 40% 25%',
        accentForeground: '180 30% 95%',
        border: '195 40% 22%',
        ring: '185 70% 55%',
      },
    },
  },
  {
    name: 'Rose Gold',
    colors: {
      background: '350 100% 98%',
      foreground: '340 30% 20%',
      card: '350 100% 100%',
      cardForeground: '340 30% 20%',
      popover: '350 100% 100%',
      popoverForeground: '340 30% 20%',
      primary: '345 70% 55%',
      primaryForeground: '0 0% 100%',
      secondary: '350 60% 94%',
      secondaryForeground: '340 30% 20%',
      muted: '350 60% 94%',
      mutedForeground: '340 15% 45%',
      accent: '30 40% 50%',
      accentForeground: '0 0% 100%',
      destructive: '0 80% 60%',
      destructiveForeground: '0 0% 100%',
      border: '350 60% 90%',
      input: '350 60% 90%',
      ring: '345 70% 55%',
      sidebar: {
        background: '340 20% 18%',
        foreground: '350 40% 85%',
        primary: '345 70% 65%',
        primaryForeground: '0 0% 100%',
        accent: '340 15% 28%',
        accentForeground: '350 40% 95%',
        border: '340 15% 25%',
        ring: '345 70% 65%',
      },
    },
  },
];
