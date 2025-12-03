'use client';

import { useEffect } from 'react';
import { useDashboardStore } from '@/app/_lib/stores/dashboard-store';
import { TarefasWidget } from './tarefas-widget';
import { NotasWidget } from './notas-widget';
import { LinksWidget } from './links-widget';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { DashboardWidget } from '@/app/api/dashboard-api';

export function DashboardGrid() {
  const { 
    widgets, 
    isLoading, 
    error, 
    loadDashboardData 
  } = useDashboardStore();

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

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
            <p className="text-muted-foreground">Widget não implementado: {widget.type}</p>
          </Card>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {widgets.filter(w => ['tarefas', 'notas'].includes(w.type)).map(renderWidget)}
      </div>
      <div className="grid gap-4">
        {widgets.filter(w => w.type === 'links').map(renderWidget)}
      </div>
    </div>
  );
}
