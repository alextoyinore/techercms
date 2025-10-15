
'use client';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
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
  onWidgetClick: (widget: WidgetInstance) => void;
};

export function WidgetDropArea({ areaName, widgets, onDeleteWidget, onWidgetClick }: WidgetDropAreaProps) {
  const { setNodeRef } = useDroppable({
    id: areaName,
    data: {
      containerId: areaName,
    }
  });

  return (
    <div
      ref={setNodeRef}
      className="p-4 space-y-2 min-h-48"
    >
      <SortableContext items={widgets.map(w => w.id)} strategy={verticalListSortingStrategy}>
          {widgets.map(widget => (
              <DraggableWidget
                  key={widget.id}
                  widget={{
                      ...widget,
                      label: widget.config?.title || widget.type,
                      areaName: areaName,
                      icon: () => null,
                  }}
                  onDelete={onDeleteWidget}
                  onClick={onWidgetClick}
              />
          ))}
      </SortableContext>
      {widgets.length === 0 && (
          <div className="flex items-center justify-center h-full border-2 border-dashed rounded-md py-10">
              <p className="text-sm text-muted-foreground">Drop widgets here</p>
          </div>
      )}
    </div>
  );
}
