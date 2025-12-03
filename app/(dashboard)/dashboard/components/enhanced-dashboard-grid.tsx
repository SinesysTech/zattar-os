'use client';

import { useEffect, useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDashboardStore } from '@/_lib/stores/dashboard-store';
import { TarefasWidget } from './tarefas-widget';
import { NotasWidget } from './notas-widget';
import { LinksWidget } from './links-widget';
import { DraggableWidget } from './draggable-widget';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { GripVertical } from 'lucide-react';
import type { DashboardWidget } from '@/app/api/dashboard-api';

export function EnhancedDashboardGrid() {
  const { 
    widgets, 
    isLoading, 
    error, 
    loadDashboardData,
    updateWidgets 
  } = useDashboardStore();
  
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }

    if (active.id !== over.id) {
      const oldIndex = widgets.findIndex(w => w.id === active.id);
      const newIndex = widgets.findIndex(w => w.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newWidgets = [...widgets];
        const [movedWidget] = newWidgets.splice(oldIndex, 1);
        newWidgets.splice(newIndex, 0, movedWidget);
        
        updateWidgets(newWidgets);
      }
    }
    
    setActiveId(null);
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-1">
          <Skeleton className="h-[200px] w-full" />
        </Card>
        <Card className="col-span-1">
          <Skeleton className="h-[200px] w-full" />
        </Card>
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
          <Skeleton className="h-[100px] w-full" />
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 text-center">
        <p className="text-destructive">Erro ao carregar dashboard: {error}</p>
      </Card>
    );
  }

  const renderWidget = (widget: DashboardWidget) => {
    switch (widget.type) {
      case 'tarefas':
        return <TarefasWidget key={widget.id} />;
      case 'notas':
        return <NotasWidget key={widget.id} />;
      case 'links':
        return <LinksWidget key={widget.id} />;
      default:
        return (
          <Card key={widget.id} className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">Widget não implementado: {widget.type}</p>
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
          </Card>
        );
    }
  };

  const activeWidget = activeId ? widgets.find(w => w.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
        <SortableContext items={widgets.map(w => w.id)} strategy={verticalListSortingStrategy}>
          {widgets.map((widget) => (
            <DraggableWidget key={widget.id} id={widget.id}>
              {renderWidget(widget)}
            </DraggableWidget>
          ))}
        </SortableContext>
      </div>

      <DragOverlay>
        {activeWidget ? (
          <Card className="shadow-lg border-primary opacity-80">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{activeWidget.title}</h3>
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Arrastando...</p>
            </div>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
