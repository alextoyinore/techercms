'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, writeBatch } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';

function OneColumnIcon() {
    return (
        <div className="h-12 w-16 flex gap-1 p-1 rounded-md bg-muted">
            <div className="flex-1 rounded-sm bg-muted-foreground/50"></div>
        </div>
    )
}

function TwoColumnLeftIcon() {
    return (
         <div className="h-12 w-16 flex gap-1 p-1 rounded-md bg-muted">
            <div className="w-1/3 rounded-sm bg-muted-foreground/50"></div>
            <div className="flex-1 rounded-sm bg-muted-foreground/20"></div>
        </div>
    )
}

function TwoColumnRightIcon() {
    return (
         <div className="h-12 w-16 flex gap-1 p-1 rounded-md bg-muted">
            <div className="flex-1 rounded-sm bg-muted-foreground/20"></div>
            <div className="w-1/3 rounded-sm bg-muted-foreground/50"></div>
        </div>
    )
}

function ThreeColumnIcon() {
    return (
         <div className="h-12 w-16 flex gap-1 p-1 rounded-md bg-muted">
            <div className="w-1/4 rounded-sm bg-muted-foreground/50"></div>
            <div className="flex-1 rounded-sm bg-muted-foreground/20"></div>
            <div className="w-1/4 rounded-sm bg-muted-foreground/50"></div>
        </div>
    )
}


const defaultPageLayouts = [
  { name: 'Single Column', structure: 'single-column', icon: OneColumnIcon },
  { name: 'Left Sidebar', structure: 'two-column-left', icon: TwoColumnLeftIcon },
  { name: 'Right Sidebar', structure: 'two-column-right', icon: TwoColumnRightIcon },
  { name: 'Three Columns', structure: 'three-column', icon: ThreeColumnIcon },
];

type PageLayout = {
  id: string;
  name: string;
  structure: string;
}

type SiteSettings = {
  activePageLayoutId?: string;
  pageWidth?: 'full' | 'centered';
  contentWidth?: number;
}

export function PageLayoutsView() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const initialized = useRef(false);

  const layoutsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'page_layouts') : null, [firestore]);
  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'site_settings', 'config') : null, [firestore]);

  const { data: pageLayouts, isLoading: isLoadingLayouts } = useCollection<PageLayout>(layoutsCollection);
  const { data: settings, isLoading: isLoadingSettings } = useDoc<SiteSettings>(settingsRef);
  
  const [activeLayoutId, setActiveLayoutId] = useState<string | null>(null);
  const [pageWidth, setPageWidth] = useState<'full' | 'centered'>('full');
  const [contentWidth, setContentWidth] = useState(75);

  useEffect(() => {
    if (settings) {
      setActiveLayoutId(settings.activePageLayoutId || null);
      setPageWidth(settings.pageWidth || 'full');
      setContentWidth(settings.contentWidth || 75);
    }
  }, [settings]);

  // Initialize default layouts if they don't exist
  useEffect(() => {
    if (!isLoadingLayouts && pageLayouts?.length === 0 && !initialized.current) {
        initialized.current = true;
        
        if (firestore) {
            const batch = writeBatch(firestore);
            defaultPageLayouts.forEach(layoutData => {
                const newLayoutRef = doc(collection(firestore, 'page_layouts'));
                batch.set(newLayoutRef, { name: layoutData.name, structure: layoutData.structure });
            });
            batch.commit().catch(err => console.error("Failed to initialize default page layouts:", err));
        }
    }
  }, [isLoadingLayouts, pageLayouts, firestore]);

  const handleSelectLayout = (layoutId: string) => {
    if (!settingsRef) return;
    setActiveLayoutId(layoutId);
    setDocumentNonBlocking(settingsRef, { activePageLayoutId: layoutId }, { merge: true });
    toast({ title: 'Default Layout Updated' });
  };
  
  const handleWidthSettingsChange = (newWidth?: 'full' | 'centered', newContentWidth?: number) => {
    if (!settingsRef) return;
    const finalPageWidth = newWidth || pageWidth;
    const finalContentWidth = newContentWidth ?? contentWidth;
    
    setDocumentNonBlocking(settingsRef, { pageWidth: finalPageWidth, contentWidth: finalContentWidth }, { merge: true });
    toast({ title: 'Global Layout Settings Updated' });
  }

  return (
    <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Default Page Structure</CardTitle>
            <CardDescription>
              Choose the default column layout for new pages and posts. This can often be overridden by individual page or theme settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingLayouts || isLoadingSettings ? (
              <p>Loading layouts...</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {pageLayouts?.map((layout) => {
                  const LayoutIcon = defaultPageLayouts.find(l => l.structure === layout.structure)?.icon || OneColumnIcon;
                  const isActive = layout.id === activeLayoutId;
                  return (
                    <div
                      key={layout.id}
                      onClick={() => handleSelectLayout(layout.id)}
                      className={cn(
                        "relative p-4 border rounded-lg cursor-pointer transition-all flex flex-col items-center justify-center gap-2 aspect-[4/3]",
                        isActive ? "border-primary ring-2 ring-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-accent/50"
                      )}
                    >
                      <LayoutIcon />
                      <p className="font-medium text-sm text-center">{layout.name}</p>
                      {isActive && (
                        <div className="absolute top-2 right-2 flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground">
                          <CheckCircle className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Global Layout Settings</CardTitle>
                <CardDescription>
                    Control the overall width and container settings for your public website.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
                <RadioGroup 
                    value={pageWidth} 
                    onValueChange={(value: 'full' | 'centered') => {
                        setPageWidth(value);
                        handleWidthSettingsChange(value);
                    }}
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="full" id="full" />
                        <Label htmlFor="full" className="font-normal">Full Width</Label>
                    </div>
                     <div className="flex items-center space-x-2">
                        <RadioGroupItem value="centered" id="centered" />
                        <Label htmlFor="centered" className="font-normal">Centered</Label>
                    </div>
                </RadioGroup>

                {pageWidth === 'centered' && (
                    <div className='grid gap-8'>
                        <div className='grid gap-2 max-w-sm'>
                            <Label>Max Content Width ({contentWidth}%)</Label>
                            <Slider
                                value={[contentWidth]}
                                onValueChange={(value) => setContentWidth(value[0])}
                                onValueCommit={(value) => handleWidthSettingsChange(undefined, value[0])}
                                min={50}
                                max={100}
                                step={1}
                            />
                            <p className="text-sm text-muted-foreground">Sets the maximum width for large screens (over 1600px). Smaller screens will use 95%.</p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
