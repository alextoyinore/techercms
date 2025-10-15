
'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, setDoc, collection, query, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useTheme } from '@/components/theme-provider';
import { ThemeCustomizer } from '@/components/theme-customizer';
import { WebsiteThemeCustomizer } from '@/components/website-theme-customizer';
import { defaultTheme, type Theme } from '@/lib/themes';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { fontList } from '@/lib/fonts';

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { DraggableWidget } from '@/components/widgets/DraggableWidget';
import { WidgetDropArea } from '@/components/widgets/WidgetDropArea';
import { availableWidgets, Widget } from '@/components/widgets/widget-list';

const websiteThemes = [
    {
      name: 'Magazine Pro',
      description: 'A classic, content-focused theme perfect for blogs and news sites.',
      imageHintId: 'theme-1'
    },
    {
      name: 'Minimalist Blog',
      description: 'A clean and simple theme for writers who want their content to shine.',
      imageHintId: 'theme-2'
    },
    {
      name: 'Creative Portfolio',
      description: 'A visually-driven theme to showcase your creative work and projects.',
      imageHintId: 'theme-3'
    },
    {
      name: 'Newspaper',
      description: 'A traditional, information-dense theme for news organizations.',
      imageHintId: 'theme-9'
    },
    {
      name: 'Tech Today',
      description: 'A modern, sleek theme for tech blogs and review sites.',
      imageHintId: 'theme-10'
    },
    {
      name: 'Earthy Elegance',
      description: 'An organic, natural theme for lifestyle or wellness brands.',
      imageHintId: 'theme-11'
    },
];

type SiteSettings = {
  activeTheme?: string;
  dashboardTheme?: string;
  bodyFont?: string;
  headlineFont?: string;
  baseFontSize?: number;
};

type WidgetInstance = {
  id: string;
  widgetAreaId: string;
  type: string;
  order: number;
  config?: any;
};

type WidgetArea = {
  id: string;
  name: string;
  pageId?: string | null;
}

export default function ThemesPage() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const [isActivatingWebsiteTheme, setIsActivatingWebsiteTheme] = useState<string | null>(null);
    const [isSavingTypography, setIsSavingTypography] = useState(false);

    const { 
        theme: activeDashboardTheme, 
        setTheme: setActiveDashboardTheme, 
        fontSize, 
        setFontSize, 
        themes: availableDashboardThemes 
    } = useTheme();

    const [isActivatingDashboard, setIsActivatingDashboard] = useState<string | null>(null);

    const settingsRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'site_settings', 'config');
    }, [firestore]);
    
    const { data: settings, isLoading: isLoadingSettings } = useDoc<SiteSettings>(settingsRef);
    const [activeWebsiteTheme, setActiveWebsiteTheme] = useState<string | undefined>(undefined);
    
    // Typography state
    const [bodyFont, setBodyFont] = useState('Inter');
    const [headlineFont, setHeadlineFont] = useState('Poppins');
    const [baseFontSize, setBaseFontSize] = useState(16);

    // Widget state
    const [activeWidget, setActiveWidget] = useState<Widget | null>(null);
    const [widgetInstances, setWidgetInstances] = useState<Record<string, WidgetInstance[]>>({});

    const themeWidgetAreasQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'widget_areas'), where('pageId', '==', null));
    }, [firestore]);
    
    const { data: themeWidgetAreas, isLoading: isLoadingWidgetAreas } = useCollection<WidgetArea>(themeWidgetAreasQuery);

    const areaIds = useMemo(() => themeWidgetAreas?.map(a => a.id) || [], [themeWidgetAreas]);

    const widgetInstancesQuery = useMemoFirebase(() => {
        if (!firestore || areaIds.length === 0) return null;
        return query(collection(firestore, 'widget_instances'), where('widgetAreaId', 'in', areaIds));
    }, [firestore, areaIds]);

    const { data: instances, isLoading: isLoadingInstances } = useCollection<WidgetInstance>(widgetInstancesQuery);

    useEffect(() => {
        if (instances && themeWidgetAreas) {
            const grouped: Record<string, WidgetInstance[]> = {};
            themeWidgetAreas.forEach(area => {
                const areaInstances = instances
                    .filter(inst => inst.widgetAreaId === area.id)
                    .sort((a, b) => a.order - b.order);
                grouped[area.name] = areaInstances;
            });
            setWidgetInstances(grouped);
        }
    }, [instances, themeWidgetAreas]);
    
    useEffect(() => {
        if (settings) {
            setActiveWebsiteTheme(settings.activeTheme);
            setBodyFont(settings.bodyFont || 'Inter');
            setHeadlineFont(settings.headlineFont || 'Poppins');
            setBaseFontSize(settings.baseFontSize || 16);
        }
    }, [settings]);

    const handleActivateWebsiteTheme = async (themeName: string) => {
        if (!firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not connect to the database.' });
            return;
        }
        setIsActivatingWebsiteTheme(themeName);
        try {
            await setDoc(doc(firestore, 'site_settings', 'config'), { activeTheme: themeName }, { merge: true });
            setActiveWebsiteTheme(themeName);
            toast({ title: 'Theme Activated!', description: `"${themeName}" is now your active website theme.` });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message || 'Could not activate theme.' });
        } finally {
            setIsActivatingWebsiteTheme(null);
        }
    }
    
    const handleActivateDashboardTheme = (themeName: string) => {
        const newTheme = availableDashboardThemes.find(t => t.name === themeName);
        if (newTheme) {
            setIsActivatingDashboard(themeName);
            setActiveDashboardTheme(newTheme);
            // We need to save this to the database to persist it
            if(firestore) {
                setDoc(doc(firestore, 'site_settings', 'config'), { dashboardTheme: themeName }, { merge: true });
            }
            toast({ title: 'Dashboard Theme Selected', description: `"${themeName}" is now active.` });
            setTimeout(() => setIsActivatingDashboard(null), 1000);
        }
    }

    const handleSaveTypography = async () => {
        if (!firestore || !settingsRef) return;
        setIsSavingTypography(true);
        try {
            await setDoc(settingsRef, {
                bodyFont,
                headlineFont,
                baseFontSize,
            }, { merge: true });
            toast({
                title: 'Typography Saved',
                description: 'Your new font settings have been saved and applied.',
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error Saving Typography',
                description: error.message,
            });
        } finally {
            setIsSavingTypography(false);
        }
    }
    
    // DND Handlers
    const sensors = useSensors(useSensor(PointerSensor));

    function handleDragStart(event: DragStartEvent) {
        setActiveWidget(event.active.data.current?.widget || null);
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        setActiveWidget(null);

        if (!over) return;

        const isNewWidget = active.data.current?.isNewWidget;
        const activeAreaName = active.data.current?.areaName;
        const overAreaName = over.data.current?.containerId || over.id;
        
        const area = themeWidgetAreas?.find(a => a.name === overAreaName);
        if (!area || !firestore) return;
        
        const areaInstances = widgetInstances[overAreaName] || [];

        if (isNewWidget) {
            const newInstance: Omit<WidgetInstance, 'id'> = {
                widgetAreaId: area.id,
                type: active.id as string,
                order: areaInstances.length,
                config: {},
            };
            addDocumentNonBlocking(collection(firestore, 'widget_instances'), newInstance);
            toast({ title: 'Widget Added', description: `Added a new ${active.data.current?.widget.label} widget.` });

        } else { // Moving existing widget
            const activeId = active.id;
            const overId = over.id;

            if (activeId === overId) return;

            const activeContainerName = active.data.current?.containerId;
            const overContainerName = over.data.current?.containerId || over.id;

            const oldAreaInstances = widgetInstances[activeContainerName] || [];
            const newAreaInstances = widgetInstances[overContainerName] || [];
            const oldIndex = oldAreaInstances.findIndex(w => w.id === activeId);
            let newIndex = newAreaInstances.findIndex(w => w.id === overId);

            if (newIndex === -1 && over.data.current?.containerId) {
                newIndex = newAreaInstances.length;
            }

            if (activeContainerName === overContainerName) {
                const movedInstances = arrayMove(oldAreaInstances, oldIndex, newIndex);
                movedInstances.forEach((instance, index) => {
                    if (instance.order !== index) {
                        updateDocumentNonBlocking(doc(firestore, 'widget_instances', instance.id), { order: index });
                    }
                });
            } else {
                const activeInstance = oldAreaInstances[oldIndex];
                if (!activeInstance) return;

                const overArea = themeWidgetAreas?.find(a => a.name === overContainerName);
                if (!overArea) return;

                updateDocumentNonBlocking(doc(firestore, 'widget_instances', activeInstance.id), { widgetAreaId: overArea.id, order: newIndex });

                oldAreaInstances.splice(oldIndex, 1);
                oldAreaInstances.forEach((instance, index) => {
                    if (instance.order !== index) {
                        updateDocumentNonBlocking(doc(firestore, 'widget_instances', instance.id), { order: index });
                    }
                });

                newAreaInstances.splice(newIndex, 0, activeInstance);
                newAreaInstances.forEach((instance, index) => {
                    if (instance.order !== index) {
                         updateDocumentNonBlocking(doc(firestore, 'widget_instances', instance.id), { order: index });
                    }
                })
            }
            toast({ title: 'Widget Moved' });
        }
    }

    const handleDeleteWidget = (id: string, name: string) => {
        if (!firestore) return;
        deleteDocumentNonBlocking(doc(firestore, 'widget_instances', id));
        toast({ title: 'Widget Deleted', description: `Removed the ${name} widget.` });
    }

    const themeImages = PlaceHolderImages.filter(img => img.id.startsWith('theme-'));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Themes"
        description="Manage your website's appearance, widgets, and typography."
      />
      <Tabs defaultValue="themes" className="w-full">
        <TabsList>
            <TabsTrigger value="themes">Appearance</TabsTrigger>
            <TabsTrigger value="widgets">Widgets</TabsTrigger>
            <TabsTrigger value="typography">Typography</TabsTrigger>
        </TabsList>
        <TabsContent value="themes">
            <div className="grid gap-6 mt-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Website Themes</CardTitle>
                        <CardDescription>Choose a theme to change the look and feel of your public-facing website.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {websiteThemes.map((theme) => {
                            const image = PlaceHolderImages.find(img => img.id === theme.imageHintId) || PlaceHolderImages[0];
                            const isActive = theme.name === activeWebsiteTheme;
                            const isProcessing = isActivatingWebsiteTheme === theme.name;

                            return (
                                <Card key={theme.name} className="flex flex-col">
                                    <CardHeader>
                                        <div className="relative aspect-video w-full">
                                            <Image
                                                src={image.imageUrl}
                                                alt={theme.name}
                                                fill
                                                className="rounded-md object-cover"
                                            />
                                            {isActive && (
                                                <div className='absolute inset-0 bg-black/50 flex items-center justify-center rounded-md'>
                                                    <CheckCircle className="h-10 w-10 text-white" />
                                                </div>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex-grow">
                                        <CardTitle className="font-headline">{theme.name}</CardTitle>
                                        <CardDescription className="mt-2">{theme.description}</CardDescription>
                                    </CardContent>
                                    <div className="p-4 pt-0 flex gap-2">
                                        <Button
                                            className="w-full"
                                            onClick={() => handleActivateWebsiteTheme(theme.name)}
                                            disabled={isActive || !!isActivatingWebsiteTheme}
                                        >
                                            {isProcessing ? (
                                                <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Activating...</>
                                            ) : isActive ? (
                                                'Active'
                                            ) : (
                                                'Activate'
                                            )}
                                        </Button>
                                        <WebsiteThemeCustomizer>
                                            <Button variant="outline"><Palette className='h-4 w-4' /></Button>
                                        </WebsiteThemeCustomizer>
                                    </div>
                                </Card>
                            )
                        })}
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Dashboard Appearance</CardTitle>
                        <CardDescription>
                            Customize your dashboard's look and feel.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <div className='grid gap-2'>
                            <Label>Dashboard Theme</Label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {availableDashboardThemes.map((theme, index) => {
                                    const image = themeImages[index % themeImages.length];
                                    const isActive = theme.name === activeDashboardTheme.name;
                                    const isProcessing = isActivatingDashboard === theme.name;
                                    return (
                                        <div key={theme.name} className="group">
                                            <div className='relative'>
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
                                            </div>
                                            <div className='mt-2 space-y-2'>
                                                <p className='text-sm font-medium'>{theme.name}</p>
                                                <div className='flex items-center gap-2'>
                                                    <Button size="sm" onClick={() => handleActivateDashboardTheme(theme.name)} disabled={!!isActivatingDashboard || isActive} className='flex-1'>
                                                        {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Activating...</> : isActive ? 'Active' : 'Activate'}
                                                    </Button>
                                                    <ThemeCustomizer theme={theme}>
                                                        <Button size="sm" variant="outline"><Palette className='h-4 w-4' /></Button>
                                                    </ThemeCustomizer>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                        <Separator />
                        <div className='flex flex-col gap-4'>
                            <ThemeCustomizer theme={defaultTheme}>
                                <Button variant="outline" className="w-fit">
                                    <Palette className="mr-2 h-4 w-4" />
                                    Create New Theme
                                </Button>
                            </ThemeCustomizer>

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
                        </div>
                    </CardContent>
                </Card>
            </div>
        </TabsContent>
        <TabsContent value="widgets">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="grid md:grid-cols-4 gap-6 mt-4">
                    <div className="md:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle className="font-headline">Available Widgets</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-2">
                                {availableWidgets.map((widget) => (
                                    <DraggableWidget key={widget.type} widget={widget} isNewWidget />
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                        {(isLoadingWidgetAreas || isLoadingInstances) ? (
                            <>
                                <Skeleton className="h-96" />
                                <Skeleton className="h-96" />
                                <Skeleton className="h-96" />
                            </>
                        ) : themeWidgetAreas ? (
                            themeWidgetAreas.map(area => (
                                <WidgetDropArea
                                    key={area.id}
                                    areaName={area.name}
                                    widgets={widgetInstances[area.name] || []}
                                    onDeleteWidget={handleDeleteWidget}
                                />
                            ))
                        ) : (
                            <p>Could not load widget areas.</p>
                        )}
                    </div>
                </div>
                <DragOverlay>
                    {activeWidget ? <DraggableWidget widget={activeWidget} isOverlay /> : null}
                </DragOverlay>
            </DndContext>
        </TabsContent>
        <TabsContent value="typography">
             <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Typography</CardTitle>
                    <CardDescription>
                        Manage your website's fonts and text styles. These settings apply globally to your public-facing site.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="headlineFont">Headline Font</Label>
                             <Select value={headlineFont} onValueChange={setHeadlineFont}>
                                <SelectTrigger id="headlineFont">
                                    <SelectValue placeholder="Select a font..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {fontList.map(font => (
                                        <SelectItem key={font.name} value={font.name}>{font.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="bodyFont">Body Font</Label>
                            <Select value={bodyFont} onValueChange={setBodyFont}>
                                <SelectTrigger id="bodyFont">
                                    <SelectValue placeholder="Select a font..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {fontList.map(font => (
                                        <SelectItem key={font.name} value={font.name}>{font.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                     <div className='grid gap-2 max-w-sm'>
                        <Label>Base Font Size</Label>
                        <div className='flex items-center gap-4'>
                            <Slider
                                value={[baseFontSize]}
                                onValueChange={(value) => setBaseFontSize(value[0])}
                                min={14}
                                max={20}
                                step={1}
                            />
                            <span className='text-sm text-muted-foreground w-12 text-center'>{baseFontSize}px</span>
                        </div>
                    </div>
                </CardContent>
                <div className="sticky bottom-0 bg-background/95 py-4 px-6 border-t mt-4 -mx-6 -mb-6 rounded-b-lg">
                    <div className='flex justify-end'>
                        <Button onClick={handleSaveTypography} disabled={isSavingTypography}>
                            {isSavingTypography ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Saving...</> : 'Save Typography Settings'}
                        </Button>
                    </div>
                </div>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

    