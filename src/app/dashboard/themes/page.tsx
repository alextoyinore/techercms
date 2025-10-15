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
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

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
    if (!firestore || !settingsRef) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not connect to the database.' });
        return;
    }
    setIsActivating(themeName);
    
    const newSettings = { activeTheme: themeName };

    // Use non-blocking update and catch permission errors
    setDocumentNonBlocking(settingsRef, newSettings, { merge: true })
      .catch((error: any) => {
          toast({
              variant: "destructive",
              title: "Uh oh! Something went wrong.",
              description: error.message || "Could not activate the theme.",
          });
      })
      .finally(() => {
          // Optimistically show toast, the error will be caught by the global listener
          toast({ title: 'Theme Activated', description: `"${themeName}" is now your active website theme.` });
          
          // We can't await the result here, so we'll just reset the loading state
          // after a short delay to provide visual feedback.
          setTimeout(() => setIsActivating(null), 1000);
      });
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
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="w-full" disabled={!!isActivating}>
                      Customize
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-full md:max-w-sm">
                    <SheetHeader>
                      <SheetTitle>Customize: {theme.name}</SheetTitle>
                      <SheetDescription>
                        Modify the design tokens for your frontend theme. Changes are saved automatically.
                      </SheetDescription>
                    </SheetHeader>
                    <Separator className="my-4" />
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <h3 className="font-medium text-sm">Colors</h3>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Primary</Label>
                                    <Input type="color" defaultValue="#000000" className="p-1 h-10"/>
                                </div>
                                <div className="space-y-2">
                                    <Label>Background</Label>
                                    <Input type="color" defaultValue="#ffffff" className="p-1 h-10"/>
                                </div>
                                <div className="space-y-2">
                                    <Label>Foreground</Label>
                                    <Input type="color" defaultValue="#333333" className="p-1 h-10"/>
                                </div>
                                <div className="space-y-2">
                                    <Label>Accent</Label>
                                    <Input type="color" defaultValue="#555555" className="p-1 h-10"/>
                                </div>
                            </div>
                        </div>
                        <Separator />
                         <div className="space-y-4">
                            <h3 className="font-medium text-sm">Typography</h3>
                            <div className="space-y-2">
                                <Label>Headline Font</Label>
                                <Select defaultValue="poppins">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a font" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="inter">Inter</SelectItem>
                                        <SelectItem value="poppins">Poppins</SelectItem>
                                        <SelectItem value="georgia">Georgia</SelectItem>
                                        <SelectItem value="monospace">Monospace</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <Label>Body Font</Label>
                                <Select defaultValue="inter">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a font" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="inter">Inter</SelectItem>
                                        <SelectItem value="poppins">Poppins</SelectItem>
                                        <SelectItem value="georgia">Georgia</SelectItem>
                                        <SelectItem value="monospace">Monospace</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <SheetFooter className="mt-6">
                        <Button type="submit" className="w-full">Save Changes</Button>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
