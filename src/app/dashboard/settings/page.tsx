
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
import { CheckCircle, Loader2, Palette, Radio } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useTheme } from '@/components/theme-provider';
import { themes } from '@/lib/themes';
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

type SiteSettings = {
  activeTheme?: string;
  siteName?: string;
  homepageType?: 'latest' | 'static';
  homepagePageId?: string;
};

type Page = {
    id: string;
    title: string;
}

export default function SettingsPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  
  const [siteName, setSiteName] = useState('');
  const [homepageType, setHomepageType] = useState<'latest' | 'static'>('latest');
  const [homepagePageId, setHomepagePageId] = useState<string | undefined>(undefined);

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
    }
  }, [settings]);

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
                <div className="grid gap-2 max-w-sm">
                    <Label htmlFor="siteName">Site Name</Label>
                    <Input id="siteName" value={siteName} onChange={(e) => setSiteName(e.target.value)} />
                    <p className="text-sm text-muted-foreground">This name is displayed publicly on your site.</p>
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
            <CardFooter className="border-t px-6 py-4">
                <Button onClick={handleSaveSettings} disabled={isSavingSettings}>
                    {isSavingSettings ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Saving...</> : 'Save Settings'}
                </Button>
            </CardFooter>
        </Card>
      </div>
    </div>
  );
}

