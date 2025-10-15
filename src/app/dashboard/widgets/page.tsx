
'use client';

import { useMemo, useState, useEffect } from 'react';
import { PageHeader } from "@/components/page-header";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { GripVertical, X, Cog, Library } from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch, setDoc } from 'firebase/firestore';
import { DndContext, closestCenter, DragEndEvent, DragStartEvent, DragOverlay, useDraggable, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MediaLibrary } from '@/components/media-library';

const availableWidgets = [
    { type: 'recent-posts', name: 'Recent Posts', description: 'Display a list of your most recent posts.' },
    { type: 'categories-list', name: 'Categories', description: 'Show a list of all post categories.' },
    { type: 'tag-cloud', name: 'Tag Cloud', description: 'A cloud of your most used tags.' },
    { type: 'search', name: 'Search', description: 'Display a search form.' },
    { type: 'custom-html', name: 'Custom HTML', description: 'Enter arbitrary HTML.' },
    { type: 'image', name: 'Image', description: 'Display an image from your media library.' },
];

const defaultWidgetAreas: Omit<WidgetArea, 'id'>[] = [
    { name: 'Sidebar', description: 'Main sidebar for posts and pages.', theme: 'all' },
    { name: 'Header', description: 'Header area, useful for banners or announcements.', theme: 'all' },
    { name: 'Footer Column 1', description: 'First column in the site footer.', theme: 'all' },
    { name: 'Footer Column 2', description: 'Second column in the site footer.', theme: 'all' },
    { name: 'Homepage Content', description: 'Special content area on the homepage.', theme: 'all' },
];

type WidgetArea = {
    id: string;
    name: string;
    description: string;
    theme: string;
}

type WidgetInstance = {
    id: string;
    widgetAreaId: string;
    type: string;
    order: number;
    config?: {
        title?: string;
        html?: string;
        count?: number;
        imageUrl?: string;
        caption?: string;
        linkUrl?: string;
    }
}

type AvailableWidget = typeof availableWidgets[0];

function AvailableWidgetCard({ widget }: { widget: AvailableWidget }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `available-${widget.type}`,
        data: { widget, from: 'available' },
    });

    return (
        <div 
            ref={setNodeRef}
            className={cn(`flex items-start gap-2 rounded-md border p-3 bg-muted/50 cursor-grab active:cursor-grabbing`, isDragging && 'opacity-50')}
            {...listeners} 
            {...attributes}
        >
            <GripVertical className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="grid gap-0.5">
                <p className="font-medium">{widget.name}</p>
                <p className="text-xs text-muted-foreground">{widget.description}</p>
            </div>
        </div>
    )
}

function SortableWidgetInstance({ instance, onDelete, onSaveConfig }: { instance: WidgetInstance; onDelete: (id: string) => void; onSaveConfig: (id: string, config: any) => void; }) {
    const widgetInfo = availableWidgets.find(w => w.type === instance.type);
    const name = widgetInfo?.name || instance.type;

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
         id: instance.id,
         data: { instance, from: 'area', isWidgetInstance: true } 
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 100 : 'auto',
    };

    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [config, setConfig] = useState(instance.config || {});

    const handleSave = () => {
        onSaveConfig(instance.id, config);
        setIsSheetOpen(false);
    }
    
    const renderConfigFields = () => {
        switch (instance.type) {
            case 'image':
                return (
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="widget-title">Title</Label>
                            <Input
                                id="widget-title"
                                placeholder="Widget Title (optional)"
                                value={config.title || ''}
                                onChange={(e) => setConfig({ ...config, title: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Image</Label>
                            <MediaLibrary onSelect={(url) => setConfig({ ...config, imageUrl: url})}>
                                <Button variant="outline" className='w-full'>
                                    <Library className='mr-2 h-4 w-4' />
                                    Choose from Library
                                </Button>
                            </MediaLibrary>
                            {config.imageUrl && (
                                <img src={config.imageUrl} alt="Selected image" className="rounded-md aspect-video object-cover mt-2" />
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="widget-caption">Caption</Label>
                            <Input
                                id="widget-caption"
                                placeholder="Image caption (optional)"
                                value={config.caption || ''}
                                onChange={(e) => setConfig({ ...config, caption: e.target.value })}
                            />
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="widget-linkUrl">Link URL</Label>
                            <Input
                                id="widget-linkUrl"
                                placeholder="https://example.com (optional)"
                                value={config.linkUrl || ''}
                                onChange={(e) => setConfig({ ...config, linkUrl: e.target.value })}
                            />
                        </div>
                    </div>
                );
            case 'recent-posts':
                 return (
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="widget-title">Title</Label>
                            <Input
                                id="widget-title"
                                placeholder="Recent Posts"
                                value={config.title || ''}
                                onChange={(e) => setConfig({ ...config, title: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="widget-count">Number of posts to show</Label>
                            <Input
                                id="widget-count"
                                type="number"
                                value={config.count || 5}
                                onChange={(e) => setConfig({ ...config, count: parseInt(e.target.value, 10) || 5 })}
                            />
                        </div>
                    </div>
                );
            case 'custom-html':
                return (
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="widget-title">Title</Label>
                            <Input
                                id="widget-title"
                                value={config.title || ''}
                                onChange={(e) => setConfig({ ...config, title: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="widget-html">HTML Content</Label>
                            <Textarea
                                id="widget-html"
                                className="min-h-40 font-mono"
                                value={config.html || ''}
                                onChange={(e) => setConfig({ ...config, html: e.target.value })}
                            />
                        </div>
                    </div>
                );
            default:
                return (
                     <div className="grid gap-2">
                        <Label htmlFor="widget-title">Title</Label>
                        <Input
                            id="widget-title"
                            value={config.title || ''}
                            onChange={(e) => setConfig({ ...config, title: e.target.value })}
                        />
                        <p className="text-sm text-muted-foreground">This widget has no other configurable options.</p>
                    </div>
                )
        }
    }


    return (
        <div ref={setNodeRef} style={style}  className={cn(`relative group/item flex items-center gap-2 rounded-md border p-3 bg-card cursor-grab active:cursor-grabbing`, isDragging && 'opacity-50 shadow-lg')}>
             <div {...attributes} {...listeners} className="flex-grow flex items-center gap-2">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
                <div className="grid gap-0.5">
                    <p className="font-medium">{instance.config?.title || name}</p>
                </div>
            </div>
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                     <button
                        className="absolute top-1/2 -translate-y-1/2 right-10 z-10 p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted"
                        aria-label="Configure widget"
                    >
                        <Cog className="h-4 w-4" />
                    </button>
                </SheetTrigger>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>Configure: {name}</SheetTitle>
                        <SheetDescription>
                            Modify the settings for this widget instance.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="py-4">
                       {renderConfigFields()}
                    </div>
                    <SheetFooter>
                        <Button variant="outline" onClick={() => setIsSheetOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave}>Save Changes</Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
            <button
                onClick={() => onDelete(instance.id)}
                className="absolute top-1/2 -translate-y-1/2 right-2 z-10 p-1 text-muted-foreground hover:text-destructive rounded-full hover:bg-destructive/10"
                aria-label="Remove widget"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}

function WidgetPlaceholder() {
    return (
        <div className="p-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
            Drag widgets here
        </div>
    )
}


export default function WidgetsPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [activeItem, setActiveItem] = useState<any>(null);

    const areasCollection = useMemoFirebase(() => firestore ? collection(firestore, 'widget_areas') : null, [firestore]);
    const instancesCollection = useMemoFirebase(() => firestore ? collection(firestore, 'widget_instances') : null, [firestore]);

    const { data: widgetAreas, isLoading: isLoadingAreas } = useCollection<WidgetArea>(areasCollection);
    const { data: widgetInstances, isLoading: isLoadingInstances } = useCollection<WidgetInstance>(instancesCollection);

    const [localInstances, setLocalInstances] = useState<WidgetInstance[] | null>(null);

     useEffect(() => {
        if (widgetInstances) {
            setLocalInstances(widgetInstances);
        }
    }, [widgetInstances]);
    
     useEffect(() => {
        if (!isLoadingAreas && widgetAreas && widgetAreas.length === 0 && firestore) {
            const batch = writeBatch(firestore);
            defaultWidgetAreas.forEach(areaData => {
                const newAreaRef = doc(collection(firestore, 'widget_areas'));
                batch.set(newAreaRef, areaData);
            });
            batch.commit().then(() => {
                toast({
                    title: "Widget Areas Initialized",
                    description: "Default widget areas have been created.",
                });
            }).catch(error => {
                toast({
                    variant: "destructive",
                    title: "Error Initializing Areas",
                    description: error.message || "Could not create default widget areas.",
                });
            });
        }
    }, [isLoadingAreas, widgetAreas, firestore, toast]);


    const widgetsByArea = useMemo(() => {
        if (!localInstances) return {};
        return localInstances.reduce((acc, instance) => {
            if (!acc[instance.widgetAreaId]) {
                acc[instance.widgetAreaId] = [];
            }
            acc[instance.widgetAreaId].push(instance);
            acc[instance.widgetAreaId].sort((a, b) => a.order - b.order);
            return acc;
        }, {} as Record<string, WidgetInstance[]>);
    }, [localInstances]);

    const sensors = useSensors(useSensor(PointerSensor));

    const handleDragStart = (event: DragStartEvent) => {
        if(event.active.data.current?.from === 'available') {
            setActiveItem(event.active.data.current?.widget);
        } else {
            setActiveItem(event.active.data.current?.instance);
        }
    };
    
    const handleDeleteWidget = (instanceId: string) => {
        if (!firestore) return;

        const instanceToDelete = localInstances?.find(i => i.id === instanceId);
        const widgetName = instanceToDelete ? (availableWidgets.find(w => w.type === instanceToDelete.type)?.name || 'Widget') : 'Widget';
        
        try {
            deleteDocumentNonBlocking(doc(firestore, 'widget_instances', instanceId));
            
            setLocalInstances(prev => (prev || []).filter(i => i.id !== instanceId));

            toast({
                title: "Widget Removed",
                description: `The "${widgetName}" widget has been removed.`
            });
        } catch(error: any) {
             toast({
                variant: "destructive",
                title: "Error Removing Widget",
                description: error.message || "Could not remove the widget.",
            });
        }
    };

    const handleSaveConfig = async (instanceId: string, config: any) => {
        if (!firestore) return;

        try {
            const instanceRef = doc(firestore, 'widget_instances', instanceId);
            await setDoc(instanceRef, { config }, { merge: true });

            setLocalInstances(prev => (prev || []).map(inst => inst.id === instanceId ? { ...inst, config } : inst));

            toast({
                title: 'Widget Updated',
                description: 'Your widget settings have been saved.',
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error Saving Settings',
                description: error.message || 'Could not save widget settings.',
            });
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveItem(null);
        const { active, over } = event;
    
        if (!over) return;
    
        const activeId = String(active.id);
        const overId = String(over.id);
    
        // Item is dropped in the same container
        if (activeId === overId) {
            return;
        }
    
        const fromAvailable = active.data.current?.from === 'available';
        
        // Scenario 1: Dragging a new widget into an area
        if (fromAvailable && firestore) {
            const widgetType = active.data.current?.widget.type;
            const widgetName = active.data.current?.widget.name;
    
            const targetAreaId = over.data.current?.isWidgetArea 
                ? overId 
                : over.data.current?.instance?.widgetAreaId;
    
            if (!targetAreaId) return;
            const targetArea = widgetAreas?.find(area => area.id === targetAreaId);
            if (!targetArea) return;
    
            const newWidgetData: Omit<WidgetInstance, 'id'> = {
                widgetAreaId: targetAreaId,
                type: widgetType,
                order: widgetsByArea[targetAreaId]?.length || 0,
                config: { title: widgetName },
            };
    
            try {
                addDocumentNonBlocking(collection(firestore, 'widget_instances'), newWidgetData);
                toast({
                    title: "Widget Added",
                    description: `The "${widgetName}" widget was added to the "${targetArea.name}" area. It may take a moment to appear.`
                });
            } catch(error: any) {
                console.error("Error adding widget:", error);
                toast({
                    variant: "destructive",
                    title: "Error Adding Widget",
                    description: error.message || "Could not save the new widget.",
                });
            }
            return;
        }
    
        // Scenario 2: Reordering widgets
        if (!fromAvailable && localInstances && firestore) {
            setLocalInstances((instances) => {
                if (!instances) return null;
                const activeIndex = instances.findIndex((t) => t.id === activeId);
                const overIndex = instances.findIndex((t) => t.id === overId);
                const activeInstance = instances[activeIndex];
                const overInstance = instances[overIndex];
    
                if (!activeInstance) return instances;
    
                const targetAreaId = over.data.current?.isWidgetArea ? overId : overInstance?.widgetAreaId;
    
                if (!targetAreaId) return instances;
    
                let newInstances = [...instances];
    
                // Update widget's areaId if moved to a new area
                if (activeInstance.widgetAreaId !== targetAreaId) {
                    newInstances[activeIndex] = {
                        ...activeInstance,
                        widgetAreaId: targetAreaId,
                    };
                }
    
                // Reorder
                newInstances = arrayMove(newInstances, activeIndex, overIndex);
    
                // Update order property for all affected widgets
                const affectedAreaIds = new Set([activeInstance.widgetAreaId, targetAreaId]);
                
                const finalInstances: WidgetInstance[] = [];
                const processedIds = new Set<string>();

                widgetAreas?.forEach(area => {
                    const itemsInArea = newInstances
                        .filter(i => i.widgetAreaId === area.id)
                        .sort((a,b) => a.order - b.order) // Ensure stable sort before re-indexing
                        .map((item, index) => ({ ...item, order: index }));

                    itemsInArea.forEach(item => {
                        if (!processedIds.has(item.id)) {
                            finalInstances.push(item);
                            processedIds.add(item.id);
                        }
                    });
                });
                
                // Persist changes to Firestore
                const batch = writeBatch(firestore);
                finalInstances.forEach(instance => {
                    const docRef = doc(firestore, 'widget_instances', instance.id);
                    batch.set(docRef, instance, { merge: true });
                });
    
                batch.commit().catch(error => {
                    toast({ variant: 'destructive', title: 'Error updating widgets', description: error.message });
                    setLocalInstances(widgetInstances); // Revert on error
                });
    
                return finalInstances;
            });
        }
    };
    
    function DroppableWidgetArea({ area, areaWidgets }: { area: WidgetArea, areaWidgets: WidgetInstance[] }) {
        const { setNodeRef, isOver } = useDroppable({
            id: area.id,
            data: { isWidgetArea: true, areaId: area.id },
        });

        return (
            <div ref={setNodeRef} className={cn('p-4 rounded-lg min-h-[100px]', isOver ? 'bg-primary/10 ring-2 ring-primary' : 'bg-muted/30')}>
                <SortableContext items={areaWidgets.map(w => w.id)} strategy={verticalListSortingStrategy}>
                    <div className="grid gap-2">
                        {areaWidgets.length > 0 ? (
                            areaWidgets.map(instance => (
                                <SortableWidgetInstance key={instance.id} instance={instance} onDelete={handleDeleteWidget} onSaveConfig={handleSaveConfig} />
                            ))
                        ) : (
                            <WidgetPlaceholder />
                        )}
                    </div>
                </SortableContext>
            </div>
        );
    }

    return (
        <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex flex-col gap-6">
                <PageHeader
                    title="Widgets"
                    description="Manage your site's widgets and widget areas."
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="font-headline">Widget Areas</CardTitle>
                                <CardDescription>
                                    Drag widgets from the right to a widget area below to activate them. Drag existing widgets to reorder.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                               <Accordion type="multiple" defaultValue={widgetAreas?.map(a => a.id) || []} className="w-full space-y-4">
                                    {(isLoadingAreas && !widgetAreas) && <p>Loading widget areas...</p>}
                                    {widgetAreas?.map((area) => {
                                        const areaWidgets = widgetsByArea[area.id] || [];
                                        return (
                                            <Card key={area.id}>
                                                <AccordionItem value={area.id} className="border-b-0">
                                                    <AccordionTrigger className="p-4 hover:no-underline rounded-t-lg">
                                                        <div className="flex-1 text-left">
                                                            <h3 className="font-semibold">{area.name}</h3>
                                                            <p className="text-sm text-muted-foreground">{area.description}</p>
                                                        </div>
                                                    </AccordionTrigger>
                                                    <AccordionContent className="px-4 pb-4 pt-0">
                                                        <DroppableWidgetArea area={area} areaWidgets={areaWidgets} />
                                                    </AccordionContent>
                                                </AccordionItem>
                                            </Card>
                                        )
                                    })}
                                    {!isLoadingAreas && widgetAreas?.length === 0 && (
                                         <div className="p-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                                            <p>No widget areas found. They will be created automatically.</p>
                                        </div>
                                    )}
                                </Accordion>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="lg:col-span-1">
                        <Card className="sticky top-20">
                            <CardHeader>
                                <CardTitle className="font-headline">Available Widgets</CardTitle>
                                 <CardDescription>
                                    Drag these to a widget area on the left.
                                 </CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-2">
                                {availableWidgets.map((widget) => (
                                    <AvailableWidgetCard key={widget.type} widget={widget} />
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
             <DragOverlay>
                {activeItem ? (
                    <div className="flex items-start gap-2 rounded-md border p-3 bg-card shadow-lg cursor-grabbing">
                       <GripVertical className="h-5 w-5 text-muted-foreground mt-0.5" />
                       <div className="grid gap-0.5">
                           <p className="font-medium">{activeItem.config?.title || activeItem.name || availableWidgets.find(w => w.type === activeItem.type)?.name}</p>
                       </div>
                   </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
