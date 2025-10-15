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
import { GripVertical } from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, addDoc, writeBatch } from 'firebase/firestore';
import { DndContext, closestCenter, DragEndEvent, DragStartEvent, DragOverlay, useDraggable, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';

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

function SortableWidgetInstance({ instance }: { instance: WidgetInstance }) {
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

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={cn(`flex items-start gap-2 rounded-md border p-3 bg-card cursor-grab active:cursor-grabbing`, isDragging && 'opacity-50 shadow-lg')}>
             <GripVertical className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="grid gap-0.5">
                <p className="font-medium">{name}</p>
            </div>
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

            const newWidgetData = {
                widgetAreaId: targetAreaId,
                type: widgetType,
                order: areaWidgets.length,
                config: {},
            };
            
            try {
                const instancesRef = collection(firestore, 'widget_instances');
                const newDocRef = await addDoc(instancesRef, newWidgetData);
                
                setLocalInstances(prev => [...(prev || []), { ...newWidgetData, id: newDocRef.id }]);
                
                toast({
                    title: "Widget Added",
                    description: `The "${widgetName}" widget was added to the "${targetArea.name}" area.`
                });
            } catch (error: any) {
                toast({
                    variant: "destructive",
                    title: "Error Adding Widget",
                    description: error.message || "Could not save the new widget.",
                });
            }
            return;
        }

        // Scenario 2: Reordering widgets within the same area
        if (!fromAvailable && localInstances) {
            const activeInstance = localInstances.find(i => i.id === activeId);
            const overInstance = localInstances.find(i => i.id === overId);
            
            if (activeInstance && overInstance && activeInstance.widgetAreaId === overInstance.widgetAreaId) {
                const areaId = activeInstance.widgetAreaId;
                const areaWidgets = widgetsByArea[areaId];
                const oldIndex = areaWidgets.findIndex(i => i.id === activeId);
                const newIndex = areaWidgets.findIndex(i => i.id === overId);

                if (oldIndex !== newIndex) {
                    const reorderedInstances = arrayMove(areaWidgets, oldIndex, newIndex);
                    
                    const updatedLocalInstances = [...localInstances.filter(i => i.widgetAreaId !== areaId), ...reorderedInstances];
                    setLocalInstances(updatedLocalInstances);

                    if (!firestore) return;
                    const batch = writeBatch(firestore);
                    reorderedInstances.forEach((instance, index) => {
                        const docRef = doc(firestore, 'widget_instances', instance.id);
                        batch.update(docRef, { order: index });
                    });
                    await batch.commit().catch(error => {
                        toast({ variant: 'destructive', title: 'Error updating order', description: error.message });
                        setLocalInstances(widgetInstances); // Revert on error
                    });
                }
            }
        }
    };
    
    function DroppableWidgetArea({ area, areaWidgets }: { area: WidgetArea, areaWidgets: WidgetInstance[] }) {
        const { setNodeRef, isOver } = useDroppable({
            id: area.id,
            data: { isWidgetArea: true },
        });

        return (
            <div ref={setNodeRef} className={cn('p-4 rounded-lg min-h-[100px]', isOver ? 'bg-primary/10 ring-2 ring-primary' : 'bg-muted/30')}>
                <SortableContext items={areaWidgets.map(w => w.id)} strategy={verticalListSortingStrategy}>
                    <div className="grid gap-2">
                        {areaWidgets.length > 0 ? (
                            areaWidgets.map(instance => (
                                <SortableWidgetInstance key={instance.id} instance={instance} />
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
                                    {isLoadingAreas && <p>Loading widget areas...</p>}
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
