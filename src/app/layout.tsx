
import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { TypographyProvider } from "@/components/TypographyProvider";
import { GlobalStyleProvider } from "@/components/GlobalStyleProvider";

// This metadata object is for static metadata.
// Dynamic metadata for individual pages will be handled in those pages.
export const metadata: Metadata = {
  title: "95News",
  keywords: "Breaking News, World News, Nigerian News, African News, Europe, Asia, North America, South America, US, Climate, Art, Culture, Music, Nigerian Music, Sports, Science, Tech, Innovation, Business, Markets, Photos, Video, Audio",
  description: "Breaking News, World News, Nigerian News, African News, Europe, Asia, North America, South America, US, Sport, Science, Tech, Innovation, Business, Markets, Video & Audio",
  verification: {
    google: "UzT4k0mumgBwXSPmkuK6ARyI-pYNWiVB5i3GQAQjLUQ",
  },
  openGraph: {
    title: '95News',
    description: 'Breaking News, World News, Nigerian News, African News, Europe, Asia, North America, South America, US, Climate, Art, Culture, Music, Nigerian Music, Sports, Science, Tech, Innovation, Business, Markets, Photos, Video, Audio',
    url: 'https://www.95news.com.ng',
    siteName: '95News',
    images: [
      {
        url: 'https://www.95news.com.ng/og-image.png', // IMPORTANT: Create this image in your public folder
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '95News',
    description: 'Breaking News, World News, Nigerian News, African News, Europe, Asia, North America, South America, US, Climate, Art, Culture, Music, Nigerian Music, Sports, Science, Tech, Innovation, Business, Markets, Photos, Video, Audio',
    images: ['https://www.95news.com.ng/og-image.png'], // IMPORTANT: Create this image in your public folder
  },
};


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
      </head>
      <body>
        <FirebaseClientProvider>
          <ThemeProvider>
            <TypographyProvider>
              <GlobalStyleProvider>
                {children}
              </GlobalStyleProvider>
            </TypographyProvider>
          </ThemeProvider>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
