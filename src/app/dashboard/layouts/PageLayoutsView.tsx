'use client';
import { useState, useEffect, useMemo } from 'react';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, writeBatch, setDoc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';

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
}

export function PageLayoutsView() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const layoutsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'page_layouts') : null, [firestore]);
  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'site_settings', 'config') : null, [firestore]);

  const { data: pageLayouts, isLoading: isLoadingLayouts } = useCollection<PageLayout>(layoutsCollection);
  const { data: settings, isLoading: isLoadingSettings } = useDoc<SiteSettings>(settingsRef);
  
  const [activeLayoutId, setActiveLayoutId] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setActiveLayoutId(settings.activePageLayoutId || null);
    }
  }, [settings]);

  // Initialize default layouts if they don't exist
  useEffect(() => {
    if (!isLoadingLayouts && pageLayouts && firestore) {
      const existingStructures = new Set(pageLayouts.map(p => p.structure));
      const missingLayouts = defaultPageLayouts.filter(d => !existingStructures.has(d.structure));

      if (missingLayouts.length > 0) {
        const batch = writeBatch(firestore);
        missingLayouts.forEach(layoutData => {
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

  return (
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
  );
}
