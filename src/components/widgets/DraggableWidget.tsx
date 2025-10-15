
'use client';

import { useDraggable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { availableWidgets, Widget } from './widget-list';
import { cn } from '@/lib/utils';

type DraggableWidgetProps = {
  widget: Widget;
  isNewWidget?: boolean;
  isOverlay?: boolean;
  onDelete?: (id: string, name: string) => void;
};

export function DraggableWidget({ widget, isNewWidget = false, isOverlay = false, onDelete }: DraggableWidgetProps) {
  
  const componentData = isNewWidget ? widget : availableWidgets.find(w => w.type === widget.type);
  
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: isNewWidget ? widget.type : widget.id,
    data: {
      widget,
      isNewWidget,
    },
  });

  const {
    attributes: sortableAttributes,
    listeners: sortableListeners,
    setNodeRef: sortableSetNodeRef,
    transform: sortableTransform,
    transition: sortableTransition,
  } = useSortable({ 
      id: widget.id,
      data: {
        containerId: widget.areaName,
      }
   });

  const style = {
    transform: isNewWidget ? CSS.Translate.toString(transform) : CSS.Translate.toString(sortableTransform),
    transition: isNewWidget ? undefined : sortableTransition,
  };

  const ref = isNewWidget ? setNodeRef : sortableSetNodeRef;
  const combinedListeners = isNewWidget ? listeners : sortableListeners;
  const combinedAttributes = isNewWidget ? attributes : sortableAttributes;

  const Icon = componentData?.icon;

  return (
    <div ref={ref} style={style} {...combinedAttributes} className={cn(isOverlay && "z-50", "touch-none")}>
       <Card className={cn("cursor-grab", isOverlay && "shadow-2xl")}>
        <CardContent className="p-2 flex items-center gap-2">
            <div {...combinedListeners} className="flex items-center gap-2 flex-grow">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
                {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                <span className="text-sm font-medium">{componentData?.label || 'Unknown Widget'}</span>
            </div>
            {!isNewWidget && onDelete && (
                <Button variant="ghost" size="icon" className="h-6 w-6 cursor-pointer" onClick={() => onDelete(widget.id, widget.type)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
