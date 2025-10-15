

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
import { PageHeader } from '@/components/page-header';
import { CheckCircle, Loader2, Palette } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, setDoc, collection, query, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { ThemeCustomizer } from '@/components/theme-customizer';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { themes as defaultThemes, type Theme } from '@/lib/themes';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { timezones } from '@/lib/timezones';
import { languages } from '@/lib/languages';

type SiteSettings = {
  activeTheme?: string;
  siteName?: string;
  homepageType?: 'latest' | 'static';
  homepagePageId?: string;
  language?: string;
  timezone?: string;
};

type Page = {
    id: string;
    title: string;
}

export default function SettingsPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { theme: activeTheme, setTheme: setActiveTheme, fontSize, setFontSize, themes: availableThemes } = useTheme();
  
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isActivating, setIsActivating] = useState<string | null>(null);
  
  const [siteName, setSiteName] = useState('');
  const [homepageType, setHomepageType] = useState<'latest' | 'static'>('latest');
  const [homepagePageId, setHomepagePageId] = useState<string | undefined>(undefined);
  const [language, setLanguage] = useState<string>('en');
  const [timezone, setTimezone] = useState<string>('');

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'site_settings', 'config');
  }, [firestore]);
  
  const pagesQuery = useMemoFirebase(() => {
    if(!firestore) return null;
    return query(collection(firestore, 'pages'), where('status', '==', 'published'));
  }, [firestore]);

  const { data: settings, isLoading: isLoadingSettings } = useDoc<SiteSettings>(settingsRef);
  const { data: publishedPages, isLoading: isLoadingPages } = useCollection<Page>(pagesQuery);
  
  useEffect(() => {
    if (settings) {
      setSiteName(settings.siteName || '');
      setHomepageType(settings.homepageType || 'latest');
      setHomepagePageId(settings.homepagePageId);
      setLanguage(settings.language || 'en');
      // If a timezone is saved in the DB, use it.
      if (settings.timezone) {
        setTimezone(settings.timezone);
      }
    } else if (!isLoadingSettings) {
      // If loading is finished and there are no settings, auto-detect timezone.
      const offsetInMinutes = new Date().getTimezoneOffset();
      const offsetInHours = Math.round(-offsetInMinutes / 60);
      const utcString = `(UTC${offsetInHours >= 0 ? '+' : ''}${offsetInHours})`;
      
      const matchedTimezone = timezones.find(tz => tz.startsWith(utcString)) || timezones.find(tz => tz.startsWith('(UTC+0)'));
      if (matchedTimezone) {
        setTimezone(matchedTimezone);
      }
    }
  }, [settings, isLoadingSettings]);

  const handleSaveSettings = async () => {
    if (!firestore) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not connect to the database.' });
        return;
    }
    setIsSavingSettings(true);
    const settingsToSave = {
        siteName,
        homepageType,
        homepagePageId: homepageType === 'static' ? homepagePageId : '',
        activeTheme: activeTheme.name,
        language,
        timezone,
    };
    try {
        await setDoc(doc(firestore, 'site_settings', 'config'), settingsToSave, { merge: true });
        toast({ title: 'Settings Saved', description: 'Your site settings have been updated.' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message || 'Could not save settings.' });
    } finally {
        setIsSavingSettings(false);
    }
  }

  const handleActivateTheme = (themeName: string) => {
    const newTheme = availableThemes.find(t => t.name === themeName);
    if (newTheme) {
        setIsActivating(themeName);
        setActiveTheme(newTheme);
        toast({ title: 'Theme Selected', description: `"${themeName}" is now active. Save settings to persist.` });
        setTimeout(() => setIsActivating(null), 1000);
    }
  }
  
  const themeImages = PlaceHolderImages.filter(img => img.id.startsWith('theme-'));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Settings"
        description="Manage your website's global settings."
      />
      <div className="grid gap-6">
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">General</CardTitle>
                <CardDescription>
                    Manage your public website's general settings.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
                <div className="grid gap-2 max-w-sm">
                    <Label htmlFor="siteName">Site Name</Label>
                    <Input id="siteName" value={siteName} onChange={(e) => setSiteName(e.target.value)} />
                    <p className="text-sm text-muted-foreground">This name is displayed publicly on your site.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="language">Language</Label>
                        <Select value={language} onValueChange={setLanguage}>
                            <SelectTrigger id='language'>
                                <SelectValue placeholder="Select a language..." />
                            </SelectTrigger>
                            <SelectContent>
                                {languages.map(lang => (
                                    <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">The primary language of your site.</p>
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="timezone">Timezone</Label>
                        <Select value={timezone} onValueChange={setTimezone}>
                            <SelectTrigger id='timezone'>
                                <SelectValue placeholder="Select a timezone..." />
                            </SelectTrigger>
                            <SelectContent>
                                {timezones.map(tz => (
                                    <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">Set the timezone for your site.</p>
                    </div>
                </div>
                <Separator />
                <div className="grid gap-4">
                    <Label>Homepage Settings</Label>
                    <RadioGroup value={homepageType} onValueChange={(value: 'latest' | 'static') => setHomepageType(value)}>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="latest" id="latest" />
                            <Label htmlFor="latest" className="font-normal">Your latest posts</Label>
                        </div>
                        <div className="flex items-start space-x-2">
                            <RadioGroupItem value="static" id="static" />
                            <div className="grid gap-1.5">
                                <Label htmlFor="static" className="font-normal">A static page</Label>
                                {homepageType === 'static' && (
                                    <Select 
                                        value={homepagePageId}
                                        onValueChange={setHomepagePageId}
                                        disabled={isLoadingPages}
                                    >
                                        <SelectTrigger className="w-[280px]">
                                            <SelectValue placeholder="Select a page..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {publishedPages?.map(page => (
                                                <SelectItem key={page.id} value={page.id}>{page.title}</SelectItem>
                                            ))}
                                            {isLoadingPages && <SelectItem value="loading" disabled>Loading pages...</SelectItem>}
                                            {!isLoadingPages && publishedPages?.length === 0 && <SelectItem value="no-pages" disabled>No published pages found.</SelectItem>}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                        </div>
                    </RadioGroup>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Appearance</CardTitle>
                <CardDescription>
                    Customize your dashboard's look and feel.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
                <div className='grid gap-2'>
                    <Label>Dashboard Theme</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {availableThemes.map((theme, index) => {
                             const image = themeImages[index % themeImages.length];
                             const isActive = theme.name === activeTheme.name;
                             const isProcessing = isActivating === theme.name;
                             return (
                                <div key={theme.name} className="relative group">
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
                                    <div className={cn("absolute inset-0 bg-black/50 flex flex-col items-center justify-center rounded-md opacity-0 group-hover:opacity-100 transition-opacity", isActive && "hidden")}>
                                        <Button size="sm" onClick={() => handleActivateTheme(theme.name)} disabled={!!isActivating}>
                                            {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Activating...</> : 'Activate'}
                                        </Button>
                                    </div>
                                    <p className='text-sm font-medium mt-2'>{theme.name}</p>
                                </div>
                             )
                        })}
                    </div>
                </div>
                 <ThemeCustomizer theme={activeTheme}>
                    <Button variant="outline" className="w-fit">
                        <Palette className="mr-2 h-4 w-4" />
                        Customize & Create New Theme
                    </Button>
                </ThemeCustomizer>
                <Separator />
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
            </CardContent>
        </Card>
      </div>
      <div className="sticky bottom-0 bg-background/95 py-4 border-t mt-4">
        <div className='flex justify-end'>
            <Button onClick={handleSaveSettings} disabled={isSavingSettings}>
                {isSavingSettings ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Saving...</> : 'Save All Settings'}
            </Button>
        </div>
      </div>
    </div>
  );
}
