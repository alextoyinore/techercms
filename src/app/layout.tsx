
import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { TypographyProvider } from "@/components/TypographyProvider";
import { GlobalStyleProvider } from "@/components/GlobalStyleProvider";

export const metadata: Metadata = {
  title: "95News",
  keywords: "Breaking News, World News, Nigerian News, African News, Europe, Asia, North America, South America, US, Climate, Art, Culture, Music, Nigerian Music, Sports, Science, Tech, Innovation, Business, Markets, Photos, Video, Audio",
  description: "Breaking News, World News, Nigerian News, African News, Europe, Asia, North America, South America, US, Sport, Science, Tech, Innovation, Business, Markets, Video & Audio",
  verification: {
    google: "UzT4k0mumgBwXSPmkuK6ARyI-pYNWiVB5i3GQAQjLUQ",
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
