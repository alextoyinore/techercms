'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Upload, CheckCircle, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

type SiteSettings = {
  activeTheme: string;
};

const frontendThemes = [
    { name: 'Magazine Pro', description: 'A classic, content-focused layout.' },
    { name: 'Minimalist Blog', description: 'A clean, simple, and elegant design.' },
    { name: 'Creative Portfolio', description: 'A vibrant, visual-first theme.' },
];

export default function ThemesPage() {
  const themeImages = PlaceHolderImages.filter(img =>
    img.id.startsWith('theme-')
  );
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isActivating, setIsActivating] = useState<string | null>(null);

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'site_settings', 'config');
  }, [firestore]);

  const { data: settings, isLoading } = useDoc<SiteSettings>(settingsRef);
  
  const activeThemeName = settings?.activeTheme || 'Magazine Pro';

  const handleActivateTheme = async (themeName: string) => {
    if (!firestore) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not connect to the database.' });
        return;
    }
    setIsActivating(themeName);
    try {
        await setDoc(doc(firestore, 'site_settings', 'config'), { activeTheme: themeName }, { merge: true });
        toast({ title: 'Theme Activated', description: `"${themeName}" is now your active website theme.` });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message || 'Could not activate theme.' });
    } finally {
        setIsActivating(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Website Themes"
        description="Customize the look and feel of your public-facing website."
      >
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Upload Theme
        </Button>
      </PageHeader>

      {isLoading && <p>Loading theme settings...</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {frontendThemes.map((theme, index) => {
          const image = themeImages[index % themeImages.length];
          const isActive = theme.name === activeThemeName;
          const isProcessing = isActivating === theme.name;

          return (
            <Card
              key={theme.name}
              className={`overflow-hidden group ${
                isActive ? 'border-primary ring-2 ring-primary' : ''
              }`}
            >
              <CardHeader className='p-0'>
                <Image
                  alt={theme.name}
                  className="aspect-video w-full object-cover"
                  data-ai-hint={image.imageHint}
                  height={400}
                  src={image.imageUrl}
                  width={600}
                />
              </CardHeader>
              <CardContent className="p-4">
                <CardTitle className="font-headline text-xl">
                  {theme.name}
                </CardTitle>
                <CardDescription className='mt-1'>
                    {theme.description}
                </CardDescription>
                {isActive && (
                  <p className="text-primary font-semibold flex items-center gap-2 mt-2 text-sm">
                    <CheckCircle className="h-4 w-4" />
                    Active Theme
                  </p>
                )}
              </CardContent>
              <CardFooter className="gap-2 p-4 pt-0">
                <Button
                  onClick={() => handleActivateTheme(theme.name)}
                  disabled={isActive || !!isActivating}
                  className="w-full"
                >
                  {isProcessing ? (
                     <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Activating...</>
                  ) : isActive ? 'Activated' : 'Activate'}
                </Button>
                <Button variant="outline" className="w-full" disabled={!!isActivating}>
                  Customize
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
