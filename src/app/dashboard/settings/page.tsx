
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
import { CheckCircle, Loader2, Palette, Library } from 'lucide-react';
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
import { useFirestore, useDoc, useCollection, useMemoFirebase, useAuth } from '@/firebase';
import { doc, setDoc, collection, query, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { timezones } from '@/lib/timezones';
import { languages } from '@/lib/languages';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { MediaLibrary } from '@/components/media-library';
import { Textarea } from '@/components/ui/textarea';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useRouter } from 'next/navigation';

type SiteSettings = {
  activeTheme?: string;
  siteName?: string;
  siteDescription?: string;
  companyName?: string;
  siteLogoUrl?: string;
  homepageType?: 'latest' | 'static';
  homepagePageId?: string;
  language?: string;
  timezone?: string;
  dashboardTheme?: string;
  hideAllPageTitles?: boolean;
  autoSaveInterval?: number;
};

type Page = {
    id: string;
    title: string;
}

type UserRole = {
  role: 'superuser' | 'writer' | string;
};

export default function SettingsPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const auth = useAuth();
  const [currentUser, authLoading] = useAuthState(auth);
  const router = useRouter();
  
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  
  const [siteName, setSiteName] = useState('');
  const [siteDescription, setSiteDescription] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [siteLogoUrl, setSiteLogoUrl] = useState('');
  const [homepageType, setHomepageType] = useState<'latest' | 'static'>('latest');
  const [homepagePageId, setHomepagePageId] = useState<string | undefined>(undefined);
  const [language, setLanguage] = useState<string>('en');
  const [timezone, setTimezone] = useState<string>('');
  const [hideAllPageTitles, setHideAllPageTitles] = useState(false);
  const [autoSaveInterval, setAutoSaveInterval] = useState(5);

  const userRef = useMemoFirebase(() => {
    if (!firestore || !currentUser) return null;
    return doc(firestore, 'users', currentUser.uid);
  }, [firestore, currentUser]);

  const { data: userData, isLoading: userLoading } = useDoc<UserRole>(userRef);

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
      setSiteDescription(settings.siteDescription || '');
      setCompanyName(settings.companyName || '');
      setSiteLogoUrl(settings.siteLogoUrl || '');
      setHomepageType(settings.homepageType || 'latest');
      setHomepagePageId(settings.homepagePageId);
      setLanguage(settings.language || 'en');
      setHideAllPageTitles(settings.hideAllPageTitles || false);
      setAutoSaveInterval(settings.autoSaveInterval || 5);
      if (settings.timezone) {
        setTimezone(settings.timezone);
      }
    } else if (!isLoadingSettings) {
      const offsetInMinutes = new Date().getTimezoneOffset();
      const offsetInHours = Math.round(-offsetInMinutes / 60);
      const utcString = `(UTC${offsetInHours >= 0 ? '+' : ''}${offsetInHours})`;
      
      const matchedTimezone = timezones.find(tz => tz.startsWith(utcString)) || timezones.find(tz => tz.startsWith('(UTC+0)'));
      if (matchedTimezone) {
        setTimezone(matchedTimezone);
      }
    }
  }, [settings, isLoadingSettings]);

  useEffect(() => {
    if (!authLoading && !userLoading && userData?.role !== 'superuser') {
      router.push('/dashboard');
    }
  }, [authLoading, userLoading, userData, router]);

  if (authLoading || userLoading || userData?.role !== 'superuser') {
    return null; // or a loading spinner
  }

  const handleSaveSettings = async () => {
    if (!firestore) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not connect to the database.' });
        return;
    }
    setIsSavingSettings(true);
    const settingsToSave: Partial<SiteSettings> = {
        siteName,
        siteDescription,
        companyName,
        siteLogoUrl,
        homepageType,
        homepagePageId: homepageType === 'static' ? homepagePageId : '',
        language,
        timezone,
        hideAllPageTitles,
        autoSaveInterval,
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="grid gap-2 max-w-sm">
                        <Label htmlFor="siteName">Site Name</Label>
                        <Input id="siteName" value={siteName} onChange={(e) => setSiteName(e.target.value)} />
                    </div>
                     <div className="grid gap-2 max-w-sm">
                        <Label>Site Logo</Label>
                        <div className="flex items-center gap-4">
                            {siteLogoUrl && (
                                <Image
                                src={siteLogoUrl}
                                alt="Site Logo Preview"
                                width={48}
                                height={48}
                                className="rounded-md object-contain bg-muted"
                                />
                            )}
                            <MediaLibrary onSelect={setSiteLogoUrl}>
                                <Button variant="outline">
                                    <Library className="mr-2 h-4 w-4" />
                                    Choose from Library
                                </Button>
                            </MediaLibrary>
                        </div>
                    </div>
                    <div className="grid gap-2 max-w-sm">
                        <Label htmlFor="siteDescription">Site Description</Label>
                        <Textarea id="siteDescription" value={siteDescription} onChange={(e) => setSiteDescription(e.target.value)} rows={3} />
                    </div>
                    <div className="grid gap-2 max-w-sm">
                        <Label htmlFor="companyName">Company Name</Label>
                        <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                        <p className="text-sm text-muted-foreground">Used for the copyright notice in the footer.</p>
                    </div>
                </div>
                 <div className="flex items-center space-x-2">
                    <Switch
                        id="hide-all-titles"
                        checked={hideAllPageTitles}
                        onCheckedChange={setHideAllPageTitles}
                    />
                    <Label htmlFor="hide-all-titles">Hide All Page Titles</Label>
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

                <div className='grid gap-2 max-w-sm'>
                    <Label>Auto-save interval</Label>
                    <div className='flex items-center gap-4'>
                        <Slider
                            value={[autoSaveInterval]}
                            onValueChange={(value) => setAutoSaveInterval(value[0])}
                            min={1}
                            max={10}
                            step={1}
                        />
                        <span className='text-sm text-muted-foreground w-20 text-center'>{autoSaveInterval} min</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Sets the auto-save frequency for new posts.</p>
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
