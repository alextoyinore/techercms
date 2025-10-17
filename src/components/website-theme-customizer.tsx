
'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload } from 'lucide-react';
import { Separator } from './ui/separator';
import { useFirestore, useDoc, useMemoFirebase, useAuth } from '@/firebase';
import { doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { fontList } from '@/lib/fonts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { defaultTheme, type Theme, type ThemeColors } from '@/lib/themes';
import { Textarea } from './ui/textarea';

const globalColorKeys = [
    'background', 'foreground', 'card', 'cardForeground',
    'popover', 'popoverForeground', 'primary', 'primaryForeground',
    'secondary', 'secondaryForeground', 'muted', 'mutedForeground',
    'accent', 'accentForeground', 'destructive', 'destructiveForeground',
    'border', 'input', 'ring'
] as const;

type GlobalColors = Pick<ThemeColors, Exclude<keyof ThemeColors, 'sidebar'>>;

type SiteSettings = {
  bodyFont?: string;
  headlineFont?: string;
  baseFontSize?: number;
};

type CustomTheme = {
    id?: string;
    name: string;
    description?: string;
    previewImageUrl?: string;
    colors: ThemeColors;
    authorId: string;
};

type WebsiteThemeCustomizerProps = {
    children: React.ReactNode;
    themeSource: 'new' | CustomTheme;
};


function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  if (typeof value !== 'string') {
    // Failsafe for unexpected value types
    return null;
  }
  const [h, s, l] = value.split(' ').map(v => v.replace('%', ''));
  const hex = hslToHex(Number(h), Number(s), Number(l));

  const handleHexChange = (hexValue: string) => {
    const hsl = hexToHsl(hexValue);
    if (hsl) {
      onChange(`${hsl.h} ${hsl.s}% ${hsl.l}%`);
    }
  };

  return (
    <div className="grid grid-cols-2 items-center gap-4">
        <Label className="capitalize">{label.replace(/([A-Z])/g, ' $1')}</Label>
        <Input
            type="color"
            value={hex}
            onChange={(e) => handleHexChange(e.target.value)}
            className="w-16 h-10 p-1"
        />
    </div>
  );
}


export function WebsiteThemeCustomizer({ children, themeSource }: WebsiteThemeCustomizerProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const auth = useAuth();
  const [open, setOpen] = useState(false);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [colors, setColors] = useState<ThemeColors | null>(null);
  const [previewImageFile, setPreviewImageFile] = useState<File | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');
  
  const [headlineFont, setHeadlineFont] = useState('Poppins');
  const [bodyFont, setBodyFont] = useState('Inter');
  const [baseFontSize, setBaseFontSize] = useState(16);

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'site_settings', 'config');
  }, [firestore]);
  
  const { data: settings, isLoading: isLoadingSettings } = useDoc<SiteSettings>(settingsRef);

  useEffect(() => {
    if (open) {
        setIsLoading(true);
        if (themeSource === 'new') {
            setName('My Custom Theme');
            setDescription('');
            setColors(defaultTheme.colors);
            setPreviewImageUrl('');
            setPreviewImageFile(null);
        } else {
            setName(themeSource.name);
            setDescription(themeSource.description || '');
            setColors(themeSource.colors);
            setPreviewImageUrl(themeSource.previewImageUrl || '');
            setPreviewImageFile(null);
        }

        if (settings) {
            setHeadlineFont(settings.headlineFont || 'Poppins');
            setBodyFont(settings.bodyFont || 'Inter');
            setBaseFontSize(settings.baseFontSize || 16);
        }
        setIsLoading(false);
    }
  }, [open, themeSource, settings]);

  const handleColorChange = (key: keyof GlobalColors, value: string) => {
    if (!colors) return;
    const newColors: ThemeColors = {
      ...colors,
      [key]: value
    };
    setColors(newColors);
    
    // Apply changes live
    const root = window.document.documentElement;
    const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    root.style.setProperty(cssVar, value);
  };

  const handleSidebarColorChange = (key: keyof ThemeColors['sidebar'], value: string) => {
    if (!colors) return;
    const newColors: ThemeColors = { 
        ...colors, 
        sidebar: { ...colors.sidebar, [key]: value }
    };
    setColors(newColors);

     // Apply changes live
     const root = window.document.documentElement;
     const cssVar = `--sidebar-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
     root.style.setProperty(cssVar, value);
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        setPreviewImageFile(file);
        setPreviewImageUrl(URL.createObjectURL(file));
    }
  };
  
  const uploadImage = async (): Promise<string | undefined> => {
    if (!previewImageFile) return previewImageUrl; // Return existing URL if no new file
    
    setIsUploading(true);
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      toast({ variant: "destructive", title: "Cloudinary not configured" });
      setIsUploading(false);
      return undefined;
    }

    const formData = new FormData();
    formData.append('file', previewImageFile);
    formData.append('upload_preset', uploadPreset);

    try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) throw new Error('Upload failed');
        const data = await response.json();
        return data.secure_url;
    } catch (error: any) {
        toast({ variant: "destructive", title: "Image Upload Failed", description: error.message });
        return undefined;
    } finally {
        setIsUploading(false);
    }
  }


  const handleSave = async () => {
    if (!colors || !firestore || !auth?.currentUser || !settingsRef) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not save changes.' });
        return;
    }
    
    setIsSaving(true);
    
    const finalImageUrl = await uploadImage();
    if (isUploading) {
        // A toast is already shown by uploadImage on failure, so we just stop the save process.
        setIsSaving(false);
        return;
    }
    
    try {
        const typographyPromise = setDoc(settingsRef, { headlineFont, bodyFont, baseFontSize }, { merge: true });

        let themePromise;
        const themeData: Omit<CustomTheme, 'id'> = {
            name,
            description,
            previewImageUrl: finalImageUrl,
            colors,
            authorId: auth.currentUser.uid,
        };

        if (themeSource !== 'new' && themeSource.id) {
            const themeRef = doc(firestore, 'custom_themes', themeSource.id);
            themePromise = setDocumentNonBlocking(themeRef, themeData, { merge: true });
        } else {
            themePromise = addDoc(collection(firestore, 'custom_themes'), themeData);
        }

        await Promise.all([themePromise, typographyPromise]);

        toast({
            title: 'Website Theme Updated!',
            description: 'Your changes have been saved.',
        });
        setOpen(false);

    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Failed to Save Theme',
            description: error.message,
        });
    } finally {
        setIsSaving(false);
    }
  };

  const isNew = themeSource === 'new';
  const title = isNew ? "Create Custom Theme" : "Edit Custom Theme";
  const descriptionText = isNew ? "Create a new theme for your public-facing website." : "Modify this custom theme.";

  // Separate main colors from sidebar colors
  const mainColorEntries = colors ? Object.entries(colors).filter(([key]) => key !== 'sidebar') : [];
  const sidebarColorEntries = colors?.sidebar ? Object.entries(colors.sidebar) : [];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="flex flex-col w-full md:max-w-md">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{descriptionText}</SheetDescription>
        </SheetHeader>
        <Separator />
        <ScrollArea className="flex-1 -mx-6 px-6">
            {isLoading || isLoadingSettings ? (
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="grid gap-8 py-4">
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="theme-name">Theme Name</Label>
                            <Input id="theme-name" value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="theme-description">Description</Label>
                            <Textarea id="theme-description" value={description} onChange={(e) => setDescription(e.target.value)} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Preview Image</Label>
                        {previewImageUrl && (
                             <div className="relative aspect-video w-full">
                                <Image src={previewImageUrl} alt="Theme preview" fill className="rounded-md object-cover" />
                            </div>
                        )}
                        <input type="file" ref={fileInputRef} onChange={handleImageSelect} className="hidden" accept="image/*" />
                        <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                            {isUploading ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <Upload className='mr-2 h-4 w-4' />}
                            Upload Image
                        </Button>
                    </div>

                    <Separator />
                    <div className='grid gap-4'>
                        <h3 className="font-medium text-sm">Main Colors</h3>
                        {mainColorEntries.map(([key, value]) => (
                            <ColorInput
                                key={key}
                                label={key}
                                value={value as string}
                                onChange={(newValue) => handleColorChange(key as keyof GlobalColors, newValue)}
                            />
                        ))}
                    </div>
                     <Separator />
                    <div className='grid gap-4'>
                        <h3 className="font-medium text-sm">Sidebar Colors</h3>
                        {sidebarColorEntries.map(([key, value]) => (
                            <ColorInput
                                key={key}
                                label={key}
                                value={value}
                                onChange={(newValue) => handleSidebarColorChange(key as keyof ThemeColors['sidebar'], newValue)}
                            />
                        ))}
                    </div>
                    <Separator />
                     <div className="space-y-4">
                        <h3 className="font-medium text-sm">Typography</h3>
                        <div className="space-y-2">
                            <Label>Headline Font</Label>
                             <Select value={headlineFont} onValueChange={setHeadlineFont}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a font" />
                                </SelectTrigger>
                                <SelectContent>
                                    {fontList.map(font => (
                                        <SelectItem key={font.name} value={font.name}>{font.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label>Body Font</Label>
                             <Select value={bodyFont} onValueChange={setBodyFont}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a font" />
                                </SelectTrigger>
                                <SelectContent>
                                    {fontList.map(font => (
                                        <SelectItem key={font.name} value={font.name}>{font.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label>Base Font Size</Label>
                            <div className='flex items-center gap-4'>
                                <Slider
                                    value={[baseFontSize]}
                                    onValueChange={(value) => setBaseFontSize(value[0])}
                                    min={12}
                                    max={20}
                                    step={1}
                                />
                                <span className='text-sm text-muted-foreground w-12 text-center'>{baseFontSize}px</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </ScrollArea>
        <Separator />
        <SheetFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Changes'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// HSL to Hex conversion
function hslToHex(h: number, s: number, l: number): string {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

// Hex to HSL conversion
function hexToHsl(hex: string): { h: number, s: number, l: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return null;
  
    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;
  
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
  
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
  
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

    