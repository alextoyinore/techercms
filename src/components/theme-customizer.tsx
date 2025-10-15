
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
import { useTheme } from '@/components/theme-provider';
import type { Theme, ThemeColors } from '@/lib/themes';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Separator } from './ui/separator';

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
    <div className="flex items-center gap-2">
        <Label className="flex-1 capitalize">{label.replace(/([A-Z])/g, ' $1')}</Label>
        <Input
            type="color"
            value={hex}
            onChange={(e) => handleHexChange(e.target.value)}
            className="w-10 h-10 p-1"
        />
    </div>
  );
}


export function ThemeCustomizer({ children, theme }: { children: React.ReactNode, theme: Theme }) {
  const { addTheme, setTheme: setActiveTheme } = useTheme();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(`${theme.name} (Custom)`);
  const [colors, setColors] = useState<ThemeColors>(JSON.parse(JSON.stringify(theme.colors)));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setName(`${theme.name} (Custom)`);
    setColors(JSON.parse(JSON.stringify(theme.colors)));
  }, [theme, open]);

  const handleColorChange = (key: keyof Omit<ThemeColors, 'sidebar'>, value: string) => {
    const newColors = { ...colors, [key]: value };
    setColors(newColors);
    // Apply changes live
    const temporaryTheme = { name: 'temporary-preview', colors: newColors };
    setActiveTheme(temporaryTheme, true);
  };
  
  const handleSidebarColorChange = (key: keyof ThemeColors['sidebar'], value: string) => {
    const newColors = { ...colors, sidebar: { ...colors.sidebar, [key]: value }};
    setColors(newColors);
     // Apply changes live
     const temporaryTheme = { name: 'temporary-preview', colors: newColors };
     setActiveTheme(temporaryTheme, true);
  };

  const handleSave = () => {
    if (!name.trim()) {
        toast({
            variant: 'destructive',
            title: 'Invalid Name',
            description: 'Please enter a name for your new theme.',
        });
        return;
    }
    setIsSaving(true);
    const newTheme: Theme = { name, colors };
    addTheme(newTheme);
    setActiveTheme(newTheme);
    setIsSaving(false);
    setOpen(false);
    toast({
        title: 'Theme Saved!',
        description: `"${name}" has been saved and applied.`,
    });
  };
  
  // Flatten sidebar colors for rendering
  const sidebarColorEntries = Object.entries(colors.sidebar);
  const mainColorEntries = Object.entries(colors).filter(([key]) => key !== 'sidebar');


  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Customize Theme</SheetTitle>
          <SheetDescription>
            Adjust the colors and save your changes as a new theme.
          </SheetDescription>
        </SheetHeader>
        <Separator />
        <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="grid gap-6 py-4">
                <div className="grid gap-2">
                    <Label htmlFor="theme-name">Theme Name</Label>
                    <Input id="theme-name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>

                <div className='grid gap-4'>
                    <h4 className='font-medium text-sm'>Main Colors</h4>
                    {mainColorEntries.map(([key, value]) => (
                        <ColorInput
                        key={key}
                        label={key}
                        value={value as string}
                        onChange={(newValue) => handleColorChange(key as any, newValue)}
                        />
                    ))}
                </div>

                <Separator />

                <div className='grid gap-4'>
                    <h4 className='font-medium text-sm'>Sidebar Colors</h4>
                    {sidebarColorEntries.map(([key, value]) => (
                        <ColorInput
                        key={key}
                        label={key}
                        value={value}
                        onChange={(newValue) => handleSidebarColorChange(key as any, newValue)}
                        />
                    ))}
                </div>
            </div>
        </ScrollArea>
        <Separator />
        <SheetFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Theme'}
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
