export interface Theme {
  name: string;
  colors: {
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
  };
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
    name: 'Corporate Blue',
    colors: {
        background: '210 40% 98%',
        foreground: '215 28% 17%',
        card: '0 0% 100%',
        cardForeground: '215 28% 17%',
        popover: '0 0% 100%',
        popoverForeground: '215 28% 17%',
        primary: '221 83% 53%',
        primaryForeground: '0 0% 100%',
        secondary: '210 40% 96.1%',
        secondaryForeground: '215 28% 17%',
        muted: '210 40% 96.1%',
        mutedForeground: '215.4 16.3% 46.9%',
        accent: '210 40% 94%',
        accentForeground: '215 28% 17%',
        destructive: '0 84.2% 60.2%',
        destructiveForeground: '0 0% 98%',
        border: '214.3 31.8% 91.4%',
        input: '214.3 31.8% 91.4%',
        ring: '221 83% 53%',
        sidebar: {
            background: '222 47% 11%',
            foreground: '210 40% 98%',
            primary: '221 83% 63%',
            primaryForeground: '222 47% 11%',
            accent: '217 33% 25%',
            accentForeground: '210 40% 98%',
            border: '217 33% 18%',
            ring: '221 83% 63%',
        },
    },
  },
  {
    name: 'Forest Green',
    colors: {
        background: '120 20% 98%',
        foreground: '120 25% 15%',
        card: '0 0% 100%',
        cardForeground: '120 25% 15%',
        popover: '0 0% 100%',
        popoverForeground: '120 25% 15%',
        primary: '130 60% 40%',
        primaryForeground: '0 0% 100%',
        secondary: '120 15% 92%',
        secondaryForeground: '120 25% 15%',
        muted: '120 15% 92%',
        mutedForeground: '120 10% 45%',
        accent: '130 50% 60%',
        accentForeground: '0 0% 100%',
        destructive: '0 84.2% 60.2%',
        destructiveForeground: '0 0% 98%',
        border: '120 15% 88%',
        input: '120 15% 88%',
        ring: '130 60% 40%',
        sidebar: {
            background: '120 30% 18%',
            foreground: '120 10% 85%',
            primary: '130 60% 55%',
            primaryForeground: '0 0% 100%',
            accent: '120 25% 28%',
            accentForeground: '0 0% 100%',
            border: '120 25% 23%',
            ring: '130 60% 55%',
        },
    },
  },
  {
    name: 'Sunset Orange',
    colors: {
        background: '30 100% 98%',
        foreground: '25 50% 20%',
        card: '0 0% 100%',
        cardForeground: '25 50% 20%',
        popover: '0 0% 100%',
        popoverForeground: '25 50% 20%',
        primary: '24 95% 53%',
        primaryForeground: '0 0% 100%',
        secondary: '30 80% 92%',
        secondaryForeground: '25 50% 20%',
        muted: '30 80% 92%',
        mutedForeground: '25 30% 45%',
        accent: '30 90% 60%',
        accentForeground: '0 0% 100%',
        destructive: '0 84.2% 60.2%',
        destructiveForeground: '0 0% 98%',
        border: '30 80% 88%',
        input: '30 80% 88%',
        ring: '24 95% 53%',
        sidebar: {
            background: '20 40% 15%',
            foreground: '30 50% 85%',
            primary: '24 95% 65%',
            primaryForeground: '0 0% 100%',
            accent: '20 35% 25%',
            accentForeground: '0 0% 100%',
            border: '20 35% 20%',
            ring: '24 95% 65%',
        },
    },
  },
  {
    name: 'Oceanic Teal',
    colors: {
      background: '180 30% 97%',
      foreground: '180 35% 15%',
      card: '0 0% 100%',
      cardForeground: '180 35% 15%',
      popover: '0 0% 100%',
      popoverForeground: '180 35% 15%',
      primary: '175 75% 38%',
      primaryForeground: '0 0% 100%',
      secondary: '180 25% 91%',
      secondaryForeground: '180 35% 15%',
      muted: '180 25% 91%',
      mutedForeground: '180 15% 45%',
      accent: '175 65% 55%',
      accentForeground: '0 0% 100%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '0 0% 98%',
      border: '180 25% 86%',
      input: '180 25% 86%',
      ring: '175 75% 38%',
      sidebar: {
        background: '180 40% 12%',
        foreground: '180 15% 88%',
        primary: '175 75% 50%',
        primaryForeground: '0 0% 100%',
        accent: '180 35% 22%',
        accentForeground: '0 0% 100%',
        border: '180 35% 18%',
        ring: '175 75% 50%',
      },
    },
  },
  {
    name: 'Rose Gold',
    colors: {
      background: '30 50% 98%',
      foreground: '25 40% 20%',
      card: '0 0% 100%',
      cardForeground: '25 40% 20%',
      popover: '0 0% 100%',
      popoverForeground: '25 40% 20%',
      primary: '340 65% 55%',
      primaryForeground: '0 0% 100%',
      secondary: '30 30% 92%',
      secondaryForeground: '25 40% 20%',
      muted: '30 30% 92%',
      mutedForeground: '25 20% 45%',
      accent: '340 55% 70%',
      accentForeground: '0 0% 100%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '0 0% 98%',
      border: '30 30% 88%',
      input: '30 30% 88%',
      ring: '340 65% 55%',
      sidebar: {
        background: '340 20% 18%',
        foreground: '30 30% 90%',
        primary: '340 65% 65%',
        primaryForeground: '0 0% 100%',
        accent: '340 15% 28%',
        accentForeground: '0 0% 100%',
        border: '340 15% 23%',
        ring: '340 65% 65%',
      },
    },
  },
];
