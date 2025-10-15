
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
import { GripVertical, X, Cog } from "lucide-react";
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

const availableWidgets = [
    { type: 'recent-posts', name: 'Recent Posts', description: 'Display a list of your most recent posts.' },
    { type: 'categories-list', name: 'Categories', description: 'Show a list of all post categories.' },
    { type: 'tag-cloud', name: 'Tag Cloud', description: 'A cloud of your most used tags.' },
    { type: 'search', name: 'Search', description: 'Display a search form.' },
    { type: 'custom-html', name: 'Custom HTML', description: 'Enter arbitrary HTML.' },
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
                return <p className="text-sm text-muted-foreground">This widget has no configurable options.</p>;
        }
    }


    return (
        <div ref={setNodeRef} style={style}  className={cn(`relative group/item flex items-start gap-2 rounded-md border p-3 bg-card cursor-grab active:cursor-grabbing`, isDragging && 'opacity-50 shadow-lg')}>
             <div {...attributes} {...listeners} className="flex-grow flex items-start gap-2">
                <GripVertical className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="grid gap-0.5">
                    <p className="font-medium">{name}</p>
                </div>
            </div>
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                     <button
                        className="absolute top-1 right-8 z-10 p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted"
                        aria-label="Configure widget"
                    >
                        <Cog className="h-3 w-3" />
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
                className="absolute top-1 right-1 z-10 p-1 text-muted-foreground hover:text-destructive rounded-full hover:bg-destructive/10"
                aria-label="Remove widget"
            >
                <X className="h-3 w-3" />
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

    const handleDragEnd = async (event: DragEndEvent) => {
        setActiveItem(null);
        const { active, over } = event;

        if (!over) return;
        
        const activeId = active.id.toString();
        const overId = over.id.toString();

        const fromAvailable = active.data.current?.from === 'available';

        // Scenario 1: Dragging a new widget into an area
        if (fromAvailable) {
            const widgetType = active.data.current?.widget.type;
            const widgetName = active.data.current?.widget.name;
            
            const targetAreaId = over.data.current?.isWidgetArea 
                ? overId 
                : over.data.current?.instance?.widgetAreaId;

            if (!targetAreaId) return;

            const targetArea = widgetAreas?.find(area => area.id === targetAreaId);
            if (!targetArea || !firestore) return;

            const areaWidgets = widgetsByArea[targetAreaId] || [];
            
            let newOrder = 0;
            const overInstance = localInstances?.find(i => i.id === overId);
            if (overInstance) {
                newOrder = overInstance.order;
            } else if (areaWidgets.length > 0) {
                 newOrder = areaWidgets.length;
            }

            const newWidgetData = {
                widgetAreaId: targetAreaId,
                type: widgetType,
                order: newOrder,
                config: {},
            };
            
            try {
                const instancesRef = collection(firestore, 'widget_instances');
                const newDocRef = await addDocumentNonBlocking(instancesRef, newWidgetData);
                 if (newDocRef) {
                    setLocalInstances(prev => {
                        const newInstances = [...(prev || []), { ...newWidgetData, id: newDocRef.id }];
                         // Recalculate order for the target area
                        const itemsInArea = newInstances
                            .filter(i => i.widgetAreaId === targetAreaId)
                            .sort((a,b) => a.order - b.order);
                        
                        itemsInArea.splice(newOrder, 0, { ...newWidgetData, id: newDocRef.id });

                        const otherItems = newInstances.filter(i => i.widgetAreaId !== targetAreaId);

                        const finalInstances = [...otherItems, ...itemsInArea.map((item, index) => ({ ...item, order: index }))];

                        return finalInstances;
                    });
                 }
                
                toast({
                    title: "Widget Added",
                    description: `The "${widgetName}" widget was added to the "${targetArea.name}" area.`
                });
            } catch (error: any) {
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
        if (!fromAvailable && localInstances) {
            const activeInstance = localInstances.find(i => i.id === activeId);
            const overInstance = localInstances.find(i => i.id === overId);
            const targetAreaId = over.data.current?.isWidgetArea ? overId : overInstance?.widgetAreaId;

            if (!activeInstance || !targetAreaId) return;

            let newInstances = [...localInstances];
            const sourceAreaId = activeInstance.widgetAreaId;

            // Remove from old position
            newInstances = newInstances.filter(i => i.id !== activeId);

            // Find new position
            let targetIndex;
            if (overId && overInstance) {
                targetIndex = newInstances.findIndex(i => i.id === overId);
            } else {
                // Dropped on an empty area
                targetIndex = newInstances.length;
            }
            
            // Insert at new position
            newInstances.splice(targetIndex, 0, {
                ...activeInstance,
                widgetAreaId: targetAreaId,
            });

            // Re-calculate order for all affected areas
            const finalInstances = widgetAreas?.reduce((acc, area) => {
                const areaId = area.id;
                // Get items for the current area from the latest state
                const itemsInArea = newInstances
                    .filter(i => i.widgetAreaId === areaId)
                    // Keep relative order, then re-index
                    .map((item, index) => ({ ...item, order: index }));
                return [...acc, ...itemsInArea];
            }, [] as WidgetInstance[]) || [];
            
            setLocalInstances(finalInstances);

            if (!firestore) return;
            const batch = writeBatch(firestore);
            finalInstances.forEach(instance => {
                const docRef = doc(firestore, 'widget_instances', instance.id);
                batch.set(docRef, instance);
            });

            try {
                await batch.commit();
                toast({ title: "Widgets updated" });
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Error updating widgets', description: error.message });
                setLocalInstances(widgetInstances); // Revert on error
            }
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
                           <p className="font-medium">{activeItem.name || availableWidgets.find(w => w.type === activeItem.type)?.name}</p>
                       </div>
                   </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}

