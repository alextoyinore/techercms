'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';


const websiteThemes = [
    {
      name: 'Magazine Pro',
      description: 'A classic, content-focused theme perfect for blogs and news sites.',
      imageHintId: 'theme-1'
    },
    {
      name: 'Minimalist Blog',
      description: 'A clean and simple theme for writers who want their content to shine.',
      imageHintId: 'theme-2'
    },
    {
      name: 'Creative Portfolio',
      description: 'A visually-driven theme to showcase your creative work and projects.',
      imageHintId: 'theme-3'
    },
];

type SiteSettings = {
  activeTheme?: string;
};

export default function ThemesPage() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const [isActivating, setIsActivating] = useState<string | null>(null);

    const settingsRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'site_settings', 'config');
    }, [firestore]);
    
    const { data: settings, isLoading: isLoadingSettings } = useDoc<SiteSettings>(settingsRef);
    const [activeTheme, setActiveTheme] = useState<string | undefined>(undefined);
    
    useEffect(() => {
        if (settings) {
            setActiveTheme(settings.activeTheme);
        }
    }, [settings]);

    const handleActivateTheme = async (themeName: string) => {
        if (!firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not connect to the database.' });
            return;
        }
        setIsActivating(themeName);
        try {
            await setDoc(doc(firestore, 'site_settings', 'config'), { activeTheme: themeName }, { merge: true });
            setActiveTheme(themeName);
            toast({ title: 'Theme Activated!', description: `"${themeName}" is now your active website theme.` });
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
        description="Choose a theme to change the look and feel of your public-facing website."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {websiteThemes.map((theme) => {
            const image = PlaceHolderImages.find(img => img.id === theme.imageHintId) || PlaceHolderImages[0];
            const isActive = theme.name === activeTheme;
            const isProcessing = isActivating === theme.name;

            return (
                <Card key={theme.name} className="flex flex-col">
                    <CardHeader>
                        <div className="relative aspect-video w-full">
                             <Image
                                src={image.imageUrl}
                                alt={theme.name}
                                fill
                                className="rounded-md object-cover"
                            />
                            {isActive && (
                                <div className='absolute inset-0 bg-black/50 flex items-center justify-center rounded-md'>
                                    <CheckCircle className="h-10 w-10 text-white" />
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <CardTitle className="font-headline">{theme.name}</CardTitle>
                        <CardDescription className="mt-2">{theme.description}</CardDescription>
                    </CardContent>
                    <div className="p-4 pt-0">
                        <Button
                            className="w-full"
                            onClick={() => handleActivateTheme(theme.name)}
                            disabled={isActive || !!isActivating}
                        >
                            {isProcessing ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Activating...</>
                            ) : isActive ? (
                                'Active'
                            ) : (
                                'Activate'
                            )}
                        </Button>
                    </div>
                </Card>
            )
        })}
      </div>
    </div>
  );
}
