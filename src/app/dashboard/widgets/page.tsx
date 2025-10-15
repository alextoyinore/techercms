'use client';

import { useMemo, useState } from 'react';
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
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, DocumentData, doc } from 'firebase/firestore';
import { DndContext, useDraggable, useDroppable, DragEndEvent, DragOverlay, Active } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const availableWidgets = [
    { type: 'recent-posts', name: 'Recent Posts', description: 'Display a list of your most recent posts.' },
    { type: 'categories-list', name: 'Categories', description: 'Show a list of all post categories.' },
    { type: 'tag-cloud', name: 'Tag Cloud', description: 'A cloud of your most used tags.' },
    { type: 'search', name: 'Search', description: 'Display a search form.' },
    { type: 'custom-html', name: 'Custom HTML', description: 'Enter arbitrary HTML.' },
];

type WidgetArea = {
    id: string;
    name: string;
    description: string;
}

type WidgetInstance = {
    id: string;
    widgetAreaId: string;
    type: string;
    order: number;
}

type AvailableWidget = typeof availableWidgets[0];

function AvailableWidgetCard({ widget }: { widget: AvailableWidget }) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: `available-${widget.type}`,
        data: { widget },
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="flex items-start gap-2 rounded-md border p-3 bg-muted/50 cursor-grab active:cursor-grabbing">
            <GripVertical className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="grid gap-0.5">
                <p className="font-medium">{widget.name}</p>
                <p className="text-xs text-muted-foreground">{widget.description}</p>
            </div>
        </div>
    )
}

function WidgetInstanceCard({ instance }: { instance: WidgetInstance }) {
    const widgetInfo = availableWidgets.find(w => w.type === instance.type);
    const name = widgetInfo?.name || instance.type;
    
    return (
        <div className="flex items-start gap-2 rounded-md border p-3 bg-card cursor-grab active:cursor-grabbing">
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

function DroppableWidgetArea({ area, widgets }: { area: WidgetArea, widgets: WidgetInstance[] }) {
    const { setNodeRef } = useDroppable({
        id: area.id,
    });
    
    return (
         <Card ref={setNodeRef}>
            <AccordionItem value={area.id} className="border-b-0">
                <AccordionTrigger className="p-4 hover:no-underline">
                    <div className="flex-1 text-left">
                        <h3 className="font-semibold">{area.name}</h3>
                        <p className="text-sm text-muted-foreground">{area.description}</p>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 pt-0">
                    <div className="grid gap-2">
                        {widgets && widgets.length > 0 ? (
                            widgets.map(instance => (
                                <WidgetInstanceCard key={instance.id} instance={instance} />
                            ))
                        ) : (
                            <WidgetPlaceholder />
                        )}
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Card>
    );
}

export default function WidgetsPage() {
    const firestore = useFirestore();
    const [activeDragItem, setActiveDragItem] = useState<Active | null>(null);

    const areasCollection = useMemoFirebase(() => firestore ? collection(firestore, 'widget_areas') : null, [firestore]);
    const instancesCollection = useMemoFirebase(() => firestore ? collection(firestore, 'widget_instances') : null, [firestore]);

    const { data: widgetAreas, isLoading: isLoadingAreas } = useCollection<WidgetArea>(areasCollection);
    const { data: widgetInstances, isLoading: isLoadingInstances } = useCollection<WidgetInstance>(instancesCollection);

    const widgetsByArea = useMemo(() => {
        if (!widgetInstances) return {};
        return widgetInstances.reduce((acc, instance) => {
            if (!acc[instance.widgetAreaId]) {
                acc[instance.widgetAreaId] = [];
            }
            acc[instance.widgetAreaId].push(instance);
            acc[instance.widgetAreaId].sort((a, b) => a.order - b.order);
            return acc;
        }, {} as Record<string, WidgetInstance[]>);
    }, [widgetInstances]);


    const handleDragEnd = (event: DragEndEvent) => {
        setActiveDragItem(null);
        const { active, over } = event;

        if (!over) return;
        
        const activeId = active.id.toString();
        const overId = over.id.toString();

        const isAddingNewWidget = activeId.startsWith('available-');

        if (isAddingNewWidget) {
            if (!firestore) return;
            const widgetType = active.data.current?.widget.type;
            const targetAreaId = overId;
            const areaWidgets = widgetsByArea[targetAreaId] || [];

            const newWidgetInstance = {
                widgetAreaId: targetAreaId,
                type: widgetType,
                order: areaWidgets.length, // Add to the end
                config: {}, // Default empty config
            };
            
            const instancesRef = collection(firestore, 'widget_instances');
            addDocumentNonBlocking(instancesRef, newWidgetInstance);
        }
    };

    return (
        <DndContext 
            onDragStart={({ active }) => setActiveDragItem(active)}
            onDragEnd={handleDragEnd}
        >
            <div className="flex flex-col gap-6">
                <PageHeader
                    title="Widgets"
                    description="Manage your site's widgets and widget areas."
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="font-headline">Widget Areas</CardTitle>
                                <CardDescription>
                                    Drag widgets from the right to a widget area below to activate them.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                               <Accordion type="multiple" defaultValue={widgetAreas?.map(a => a.id) || []} className="space-y-4">
                                    {isLoadingAreas && <p>Loading widget areas...</p>}
                                    {widgetAreas?.map((area) => (
                                        <DroppableWidgetArea key={area.id} area={area} widgets={widgetsByArea[area.id] || []} />
                                    ))}
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
                {activeDragItem && activeDragItem.id.toString().startsWith('available-') ? (
                    <AvailableWidgetCard widget={activeDragItem.data.current?.widget} />
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
