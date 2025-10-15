
'use client';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { DraggableWidget } from './DraggableWidget';

type WidgetInstance = {
  id: string;
  widgetAreaId: string;
  type: string;
  order: number;
  config?: any;
};

type WidgetDropAreaProps = {
  areaName: string;
  widgets: WidgetInstance[];
  onDeleteWidget: (id: string, name: string) => void;
};

export function WidgetDropArea({ areaName, widgets, onDeleteWidget }: WidgetDropAreaProps) {
  const { setNodeRef } = useDroppable({
    id: areaName,
    data: {
      containerId: areaName,
    }
  });

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle className="font-headline text-lg">{areaName}</CardTitle>
      </CardHeader>
      <CardContent
        ref={setNodeRef}
        className="flex-grow bg-muted/30 rounded-b-lg p-4 space-y-2 min-h-48"
      >
        <SortableContext items={widgets.map(w => w.id)} strategy={verticalListSortingStrategy}>
            {widgets.map(widget => (
                <DraggableWidget
                    key={widget.id}
                    widget={{
                        id: widget.id,
                        type: widget.type,
                        label: '',
                        areaName: areaName
                    }}
                    onDelete={onDeleteWidget}
                />
            ))}
        </SortableContext>
        {widgets.length === 0 && (
            <div className="flex items-center justify-center h-full">
                <p className="text-sm text-muted-foreground">Drop widgets here</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
