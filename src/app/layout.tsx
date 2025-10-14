import type { Metadata } from "next";
import { Open_Sans, Roboto_Slab } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./auth-provider";
import { cookies } from "next/headers";
import { authConfig } from "./config";
import {getTokens} from 'next-firebase-auth-edge/lib/next/tokens';
import { FirebaseClientProvider } from "@/firebase/client-provider";

const openSans = Open_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-open-sans",
});

const robotoSlab = Roboto_Slab({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto-slab",
});

export const metadata: Metadata = {
  title: "Techer CMS",
  description: "A modern, customizable Content Management System.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const tokens = await getTokens(cookies(), authConfig);

  return (
    <html lang="en" className={`${openSans.variable} ${robotoSlab.variable}`}>
      <body className="font-body antialiased">
        <AuthProvider initialTokens={tokens}>
          <FirebaseClientProvider>
            {children}
          </FirebaseClientProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
