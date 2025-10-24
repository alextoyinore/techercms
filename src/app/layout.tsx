
import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { TypographyProvider } from "@/components/TypographyProvider";
import { GlobalStyleProvider } from "@/components/GlobalStyleProvider";

export const metadata: Metadata = {
  title: "95news",
  description: "Up-to-date news and information for workers and professionals",
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
