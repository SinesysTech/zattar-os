'use client';

import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useState } from 'react';
import { useDashboardStore } from '@/_lib/stores/dashboard-store';
import { DraggableWidget } from './draggable-widget';
import { DroppableArea } from './droppable-area';
import { Card } from '@/components/ui/card';

export function DragDropDashboard() {
  const { widgets, updateWidgets } = useDashboardStore();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }

    const activeWidget = widgets.find(w => w.id === active.id);
    const overWidget = widgets.find(w => w.id === over.id);

    if (!activeWidget || !overWidget || activeWidget.id === overWidget.id) {
      setActiveId(null);
      return;
    }

    // Reorder widgets
    const oldIndex = widgets.findIndex(w => w.id === activeWidget.id);
    const newIndex = widgets.findIndex(w => w.id === overWidget.id);

    const newWidgets = [...widgets];
    newWidgets.splice(oldIndex, 1);
    newWidgets.splice(newIndex, 0, activeWidget);

    updateWidgets(newWidgets);
    setActiveId(null);
  };

  const activeWidget = activeId ? widgets.find(w => w.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <DroppableArea id="dashboard-container" className="space-y-4">
        <SortableContext items={widgets.map(w => w.id)} strategy={verticalListSortingStrategy}>
          {widgets.map((widget) => (
            <DraggableWidget key={widget.id} id={widget.id}>
              {widget.type === 'tarefas' && (
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Tarefas widget content */}
                </div>
              )}
              {widget.type === 'notas' && (
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Notas widget content */}
                </div>
              )}
              {widget.type === 'links' && (
                <div className="grid gap-4">
                  {/* Links widget content */}
                </div>
              )}
            </DraggableWidget>
          ))}
        </SortableContext>
      </DroppableArea>

      <DragOverlay>
        {activeWidget ? (
          <Card className="shadow-lg border-primary">
            <div className="p-4">
              <h3 className="font-semibold">{activeWidget.title}</h3>
              <p className="text-sm text-muted-foreground">Arrastando...</p>
            </div>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}