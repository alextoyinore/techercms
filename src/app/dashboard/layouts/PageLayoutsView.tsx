'use client';
import { useState, useEffect, useMemo } from 'react';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, writeBatch, setDoc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Columns, PanelLeft, PanelRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';

const defaultPageLayouts = [
  { name: 'Single Column', structure: 'single-column', icon: Columns },
  { name: 'Right Sidebar', structure: 'two-column-right', icon: PanelLeft },
  { name: 'Left Sidebar', structure: 'two-column-left', icon: PanelRight },
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

  // Initialize default layouts if none exist
  useEffect(() => {
    if (!isLoadingLayouts && pageLayouts?.length === 0 && firestore) {
      const batch = writeBatch(firestore);
      defaultPageLayouts.forEach(layoutData => {
        const newLayoutRef = doc(collection(firestore, 'page_layouts'));
        batch.set(newLayoutRef, { name: layoutData.name, structure: layoutData.structure });
      });
      batch.commit().catch(err => console.error("Failed to initialize default page layouts:", err));
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {pageLayouts?.map((layout) => {
              const LayoutIcon = defaultPageLayouts.find(l => l.structure === layout.structure)?.icon || Columns;
              const isActive = layout.id === activeLayoutId;
              return (
                <div
                  key={layout.id}
                  onClick={() => handleSelectLayout(layout.id)}
                  className={cn(
                    "relative p-4 border-2 rounded-lg cursor-pointer transition-all flex flex-col items-center justify-center gap-2 aspect-square",
                    isActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  )}
                >
                  <LayoutIcon className="w-12 h-12 text-muted-foreground" />
                  <p className="font-medium">{layout.name}</p>
                  {isActive && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 text-xs font-semibold text-primary">
                      <CheckCircle className="w-4 h-4" />
                      Active
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
