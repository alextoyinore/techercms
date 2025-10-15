
'use client';

import { useState, useEffect } from 'react';
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
import { Loader2 } from 'lucide-react';
import { Separator } from './ui/separator';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { fontList } from '@/lib/fonts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';


const globalColorKeys = [
    'background', 'foreground', 'card', 'cardForeground',
    'popover', 'popoverForeground', 'primary', 'primaryForeground',
    'secondary', 'secondaryForeground', 'muted', 'mutedForeground',
    'accent', 'accentForeground', 'destructive', 'destructiveForeground',
    'border', 'input', 'ring'
] as const;

type GlobalColors = Pick<Record<typeof globalColorKeys[number], string>, typeof globalColorKeys[number]>;

type SiteSettings = {
  bodyFont?: string;
  headlineFont?: string;
  baseFontSize?: number;
};


function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
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


export function WebsiteThemeCustomizer({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [open, setOpen] = useState(false);
  
  const [colors, setColors] = useState<GlobalColors | null>(null);
  
  const [headlineFont, setHeadlineFont] = useState('Poppins');
  const [bodyFont, setBodyFont] = useState('Inter');
  const [baseFontSize, setBaseFontSize] = useState(16);

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'site_settings', 'config');
  }, [firestore]);
  
  const { data: settings, isLoading: isLoadingSettings } = useDoc<SiteSettings>(settingsRef);

  useEffect(() => {
    if (open) {
      setIsLoading(true);
      // Read variables from the DOM
      const root = window.document.documentElement;
      const computedStyle = getComputedStyle(root);
      const initialColors: Partial<GlobalColors> = {};
      
      for (const key of globalColorKeys) {
         const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
         initialColors[key] = computedStyle.getPropertyValue(cssVar).trim();
      }

      setColors(initialColors as GlobalColors);
      
      if (settings) {
        setHeadlineFont(settings.headlineFont || 'Poppins');
        setBodyFont(settings.bodyFont || 'Inter');
        setBaseFontSize(settings.baseFontSize || 16);
      }

      setIsLoading(false);
    }
  }, [open, settings]);

  const handleColorChange = (key: keyof GlobalColors, value: string) => {
    if (!colors) return;
    const newColors = { ...colors, [key]: value };
    setColors(newColors);
    // Apply changes live
    const root = window.document.documentElement;
    const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    root.style.setProperty(cssVar, value);
  };

  const handleSave = async () => {
    if (!colors || !firestore) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not save changes.' });
        return;
    }
    
    setIsSaving(true);
    
    try {
        const colorPromise = fetch('/api/update-theme', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ colors }),
        });

        const settingsToSave: Partial<SiteSettings> = {
            headlineFont,
            bodyFont,
            baseFontSize,
        };
        const typographyPromise = setDoc(settingsRef, settingsToSave, { merge: true });

        const [colorResponse] = await Promise.all([colorPromise, typographyPromise]);
        
        if (!colorResponse.ok) {
            const errorData = await colorResponse.json();
            throw new Error(errorData.error || 'Failed to update theme file.');
        }

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

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="flex flex-col w-full md:max-w-md">
        <SheetHeader>
          <SheetTitle>Customize Website Theme</SheetTitle>
          <SheetDescription>
            Adjust the global colors and typography for your public-facing website.
          </SheetDescription>
        </SheetHeader>
        <Separator />
        <ScrollArea className="flex-1 -mx-6 px-6">
            {isLoading || isLoadingSettings ? (
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="grid gap-8 py-4">
                    <div className='grid gap-4'>
                        <h3 className="font-medium text-sm">Colors</h3>
                        {colors && Object.entries(colors).map(([key, value]) => (
                            <ColorInput
                                key={key}
                                label={key}
                                value={value}
                                onChange={(newValue) => handleColorChange(key as any, newValue)}
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
