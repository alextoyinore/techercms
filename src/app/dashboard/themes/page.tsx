
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
import { CheckCircle, Loader2, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useTheme } from '@/components/theme-provider';
import { ThemeCustomizer } from '@/components/theme-customizer';
import { WebsiteThemeCustomizer } from '@/components/website-theme-customizer';
import { defaultTheme, type Theme } from '@/lib/themes';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

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
    {
      name: 'Newspaper',
      description: 'A traditional, information-dense theme for news organizations.',
      imageHintId: 'theme-9'
    },
    {
      name: 'Tech Today',
      description: 'A modern, sleek theme for tech blogs and review sites.',
      imageHintId: 'theme-10'
    },
    {
      name: 'Earthy Elegance',
      description: 'An organic, natural theme for lifestyle or wellness brands.',
      imageHintId: 'theme-11'
    },
];

type SiteSettings = {
  activeTheme?: string;
};

export default function ThemesPage() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const [isActivatingWebsiteTheme, setIsActivatingWebsiteTheme] = useState<string | null>(null);

    const { 
        theme: activeDashboardTheme, 
        setTheme: setActiveDashboardTheme, 
        fontSize, 
        setFontSize, 
        themes: availableDashboardThemes 
    } = useTheme();

    const [isActivatingDashboard, setIsActivatingDashboard] = useState<string | null>(null);

    const settingsRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'site_settings', 'config');
    }, [firestore]);
    
    const { data: settings, isLoading: isLoadingSettings } = useDoc<SiteSettings>(settingsRef);
    const [activeWebsiteTheme, setActiveWebsiteTheme] = useState<string | undefined>(undefined);
    
    useEffect(() => {
        if (settings) {
            setActiveWebsiteTheme(settings.activeTheme);
        }
    }, [settings]);

    const handleActivateWebsiteTheme = async (themeName: string) => {
        if (!firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not connect to the database.' });
            return;
        }
        setIsActivatingWebsiteTheme(themeName);
        try {
            await setDoc(doc(firestore, 'site_settings', 'config'), { activeTheme: themeName }, { merge: true });
            setActiveWebsiteTheme(themeName);
            toast({ title: 'Theme Activated!', description: `"${themeName}" is now your active website theme.` });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message || 'Could not activate theme.' });
        } finally {
            setIsActivatingWebsiteTheme(null);
        }
    }
    
    const handleActivateDashboardTheme = (themeName: string) => {
        const newTheme = availableDashboardThemes.find(t => t.name === themeName);
        if (newTheme) {
            setIsActivatingDashboard(themeName);
            setActiveDashboardTheme(newTheme);
            // We need to save this to the database to persist it
            if(firestore) {
                setDoc(doc(firestore, 'site_settings', 'config'), { dashboardTheme: themeName }, { merge: true });
            }
            toast({ title: 'Dashboard Theme Selected', description: `"${themeName}" is now active.` });
            setTimeout(() => setIsActivatingDashboard(null), 1000);
        }
    }

    const themeImages = PlaceHolderImages.filter(img => img.id.startsWith('theme-'));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Themes"
        description="Manage your website and dashboard themes."
      />
      <div className="grid gap-6">
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Website Themes</CardTitle>
                <CardDescription>Choose a theme to change the look and feel of your public-facing website.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {websiteThemes.map((theme) => {
                    const image = PlaceHolderImages.find(img => img.id === theme.imageHintId) || PlaceHolderImages[0];
                    const isActive = theme.name === activeWebsiteTheme;
                    const isProcessing = isActivatingWebsiteTheme === theme.name;

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
                            <div className="p-4 pt-0 flex gap-2">
                                <Button
                                    className="w-full"
                                    onClick={() => handleActivateWebsiteTheme(theme.name)}
                                    disabled={isActive || !!isActivatingWebsiteTheme}
                                >
                                    {isProcessing ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Activating...</>
                                    ) : isActive ? (
                                        'Active'
                                    ) : (
                                        'Activate'
                                    )}
                                </Button>
                                <WebsiteThemeCustomizer>
                                    <Button variant="outline"><Palette className='h-4 w-4' /></Button>
                                </WebsiteThemeCustomizer>
                            </div>
                        </Card>
                    )
                })}
                </div>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Dashboard Appearance</CardTitle>
                <CardDescription>
                    Customize your dashboard's look and feel.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
                <div className='grid gap-2'>
                    <Label>Dashboard Theme</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {availableDashboardThemes.map((theme, index) => {
                             const image = themeImages[index % themeImages.length];
                             const isActive = theme.name === activeDashboardTheme.name;
                             const isProcessing = isActivatingDashboard === theme.name;
                             return (
                                <div key={theme.name} className="group">
                                     <div className='relative'>
                                        <Image
                                            src={image.imageUrl}
                                            alt={theme.name}
                                            width={300}
                                            height={150}
                                            className={cn("rounded-md aspect-[2/1] object-cover border-2", isActive ? "border-primary" : "border-muted")}
                                        />
                                        {isActive && (
                                            <div className='absolute inset-0 bg-black/50 flex items-center justify-center rounded-md'>
                                                <CheckCircle className="h-8 w-8 text-white" />
                                            </div>
                                        )}
                                     </div>
                                    <div className='mt-2 space-y-2'>
                                        <p className='text-sm font-medium'>{theme.name}</p>
                                        <div className='flex items-center gap-2'>
                                            <Button size="sm" onClick={() => handleActivateDashboardTheme(theme.name)} disabled={!!isActivatingDashboard || isActive} className='flex-1'>
                                                {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Activating...</> : isActive ? 'Active' : 'Activate'}
                                            </Button>
                                            <ThemeCustomizer theme={theme}>
                                                <Button size="sm" variant="outline"><Palette className='h-4 w-4' /></Button>
                                            </ThemeCustomizer>
                                        </div>
                                    </div>
                                </div>
                             )
                        })}
                    </div>
                </div>
                <Separator />
                <div className='flex flex-col gap-4'>
                    <ThemeCustomizer theme={defaultTheme}>
                        <Button variant="outline" className="w-fit">
                            <Palette className="mr-2 h-4 w-4" />
                            Create New Theme
                        </Button>
                    </ThemeCustomizer>

                    <div className='grid gap-2 max-w-sm'>
                        <Label>Font Scaling</Label>
                        <div className='flex items-center gap-4'>
                            <Slider
                                value={[fontSize]}
                                onValueChange={(value) => setFontSize(value[0])}
                                min={12}
                                max={18}
                                step={1}
                            />
                            <span className='text-sm text-muted-foreground w-12 text-center'>{fontSize}px</span>
                        </div>
                        <p className="text-sm text-muted-foreground">Adjust the base font size for the dashboard interface.</p>
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
