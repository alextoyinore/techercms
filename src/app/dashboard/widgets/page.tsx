'use client';
import { useState, useEffect, useMemo } from 'react';
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
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { PageHeader } from '@/components/page-header';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import {
  collection,
  doc,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DraggableWidget } from '@/components/widgets/DraggableWidget';
import { WidgetDropArea } from '@/components/widgets/WidgetDropArea';
import { availableWidgets, Widget } from '@/components/widgets/widget-list';
import { WidgetConfigSheet } from '@/components/widgets/WidgetConfigSheet';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const themeWidgetAreas = [
    { name: 'Header', description: 'Displays at the very top of your site.', theme: 'all' },
    { name: 'Sidebar', description: 'The main sidebar for your theme.', theme: 'all' },
    { name: 'Homepage Content', description: 'An area on the homepage to display widgets before the main content.', theme: 'all' },
    { name: 'Footer Column 1', description: 'The first column in the site footer.', theme: 'all' },
    { name: 'Footer Column 2', description: 'The second column in the site footer.', theme: 'all' },
];

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

export default function WidgetsPage() {
  const { toast } = useToast();
  const firestore = useFirestore();

  const [isInitializing, setIsInitializing] = useState(false);
  const [activeWidget, setActiveWidget] = useState<Widget | null>(null);
  const [widgetInstances, setWidgetInstances] = useState<Record<string, WidgetInstance[]>>({});
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<WidgetInstance | null>(null);


  const themeWidgetAreasQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'widget_areas'), where('pageId', '==', null));
  }, [firestore]);

  const { data: currentThemeAreas, isLoading: isLoadingAreas } = useCollection<WidgetArea>(themeWidgetAreasQuery);
  const hasInitializedWidgets = currentThemeAreas && currentThemeAreas.length > 0;
  
  const areaIds = useMemo(() => currentThemeAreas?.map(a => a.id) || [], [currentThemeAreas]);

  const widgetInstancesQuery = useMemoFirebase(() => {
      if (!firestore || areaIds.length === 0) return null;
      return query(collection(firestore, 'widget_instances'), where('widgetAreaId', 'in', areaIds));
  }, [firestore, areaIds]);

  const { data: instances, isLoading: isLoadingInstances } = useCollection<WidgetInstance>(widgetInstancesQuery);

  useEffect(() => {
      if (instances && currentThemeAreas) {
          const grouped: Record<string, WidgetInstance[]> = {};
          currentThemeAreas.forEach(area => {
              const areaInstances = instances
                  .filter(inst => inst.widgetAreaId === area.id)
                  .sort((a, b) => a.order - b.order);
              grouped[area.name] = areaInstances;
          });
          setWidgetInstances(grouped);
      }
  }, [instances, currentThemeAreas]);

  const handleInitializeWidgets = async () => {
    if (!firestore) return;
    setIsInitializing(true);
    try {
      const batch = writeBatch(firestore);
      themeWidgetAreas.forEach(area => {
        const areaRef = doc(collection(firestore, 'widget_areas'));
        batch.set(areaRef, { ...area, pageId: null });
      });
      await batch.commit();
      toast({
        title: 'Widget Areas Initialized',
        description: 'Your theme is now ready for widgets.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Initialization Failed',
        description: error.message,
      });
    } finally {
      setIsInitializing(false);
    }
  };
  
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
        const overAreaName = over.data.current?.containerId || over.id;
        
        const area = currentThemeAreas?.find(a => a.name === overAreaName);
        if (!area || !firestore) return;
        
        const areaInstances = widgetInstances[overAreaName] || [];

        if (isNewWidget) {
            const widgetTypeData = availableWidgets.find(w => w.type === active.id);
            const newInstance: Omit<WidgetInstance, 'id'> = {
                widgetAreaId: area.id,
                type: active.id as string,
                order: areaInstances.length,
                config: widgetTypeData?.defaultConfig || {},
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

                const overArea = currentThemeAreas?.find(a => a.name === overContainerName);
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

    const handleConfigSave = (widgetId: string, newConfig: any) => {
        if(!firestore) return;
        updateDocumentNonBlocking(doc(firestore, 'widget_instances', widgetId), { config: newConfig });
        toast({ title: 'Widget Updated', description: 'Your widget configuration has been saved.'})
    }

    const handleWidgetClick = (widget: WidgetInstance) => {
      setSelectedWidget(widget);
      setIsSheetOpen(true);
    };

    if (!hasInitializedWidgets && !isLoadingAreas) {
        return (
             <div className="flex flex-col gap-6">
                <PageHeader
                    title="Widgets"
                    description="Manage your theme's widget areas."
                />
                <Card>
                    <CardHeader>
                        <CardTitle>Initialize Theme Widgets</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="mb-4 text-muted-foreground">Your theme has not been set up to use widgets yet. Initialize the default widget areas to get started.</p>
                        <Button onClick={handleInitializeWidgets} disabled={isInitializing}>
                            {isInitializing ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Initializing...</>
                            ) : (
                            <><Wand2 className="mr-2 h-4 w-4" /> Initialize Widget Areas</>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
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
          description="Drag and drop to build and customize your theme's layout."
        />
        <div className="grid md:grid-cols-4 gap-6">
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
            {(isLoadingAreas || isLoadingInstances) ? (
                <>
                    <Skeleton className="h-96" />
                    <Skeleton className="h-96" />
                    <Skeleton className="h-96" />
                </>
            ) : currentThemeAreas ? (
                currentThemeAreas.map(area => (
                    <WidgetDropArea
                        key={area.id}
                        areaName={area.name}
                        widgets={widgetInstances[area.name] || []}
                        onDeleteWidget={handleDeleteWidget}
                        onWidgetClick={handleWidgetClick}
                    />
                ))
            ) : (
                <p>Could not load widget areas.</p>
            )}
          </div>
        </div>
      </div>
      <DragOverlay>
        {activeWidget ? <DraggableWidget widget={activeWidget} isOverlay /> : null}
      </DragOverlay>
      <WidgetConfigSheet
        isOpen={isSheetOpen}
        setIsOpen={setIsSheetOpen}
        widget={selectedWidget}
        onSave={handleConfigSave}
       />
    </DndContext>
  );
}