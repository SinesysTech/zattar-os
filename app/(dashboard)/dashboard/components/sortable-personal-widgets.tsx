'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Settings, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { TarefasWidget } from './tarefas-widget';
import { NotasWidget } from './notas-widget';
import { LinksWidget } from './links-widget';
import { WidgetSaldoContas } from './widgets/widget-saldo-contas';
import { WidgetContasPagarReceber } from './widgets/widget-contas-pagar-receber';
import { WidgetFluxoCaixa } from './widgets/widget-fluxo-caixa';
import { WidgetDespesasCategoria } from './widgets/widget-despesas-categoria';
import { WidgetOrcamentoAtual } from './widgets/widget-orcamento-atual';
import { WidgetAlertasFinanceiros } from './widgets/widget-alertas-financeiros';

// Tipos
interface PersonalWidget {
  id: string;
  type:
    | 'tarefas'
    | 'notas'
    | 'links'
    | 'saldo_contas'
    | 'contas_financeiras'
    | 'fluxo_caixa'
    | 'despesas_categoria'
    | 'orcamento_atual'
    | 'alertas_financeiros';
  title: string;
  visible: boolean;
}

const DEFAULT_WIDGETS: PersonalWidget[] = [
  { id: 'tarefas', type: 'tarefas', title: 'Minhas Tarefas', visible: true },
  { id: 'notas', type: 'notas', title: 'Notas Rapidas', visible: true },
  { id: 'links', type: 'links', title: 'Links Uteis', visible: true },
  { id: 'saldo', type: 'saldo_contas', title: 'Saldo de Contas', visible: true },
  { id: 'contas-financeiras', type: 'contas_financeiras', title: 'Contas a Pagar/Receber', visible: true },
  { id: 'fluxo-caixa', type: 'fluxo_caixa', title: 'Fluxo de Caixa', visible: true },
  { id: 'despesas-categoria', type: 'despesas_categoria', title: 'Despesas por Categoria', visible: true },
  { id: 'orcamento', type: 'orcamento_atual', title: 'Orcamento Atual', visible: true },
  { id: 'alertas-fin', type: 'alertas_financeiros', title: 'Alertas Financeiros', visible: true },
];

const STORAGE_KEY = 'dashboard-personal-widgets-order';

// Componente Sortable Item
interface SortableWidgetItemProps {
  widget: PersonalWidget;
}

function SortableWidgetItem({ widget }: SortableWidgetItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  const renderWidget = () => {
    switch (widget.type) {
      case 'tarefas':
        return <TarefasWidget />;
      case 'notas':
        return <NotasWidget />;
      case 'links':
        return <LinksWidget />;
      case 'saldo_contas':
        return <WidgetSaldoContas />;
      case 'contas_financeiras':
        return <WidgetContasPagarReceber />;
      case 'fluxo_caixa':
        return <WidgetFluxoCaixa />;
      case 'despesas_categoria':
        return <WidgetDespesasCategoria />;
      case 'orcamento_atual':
        return <WidgetOrcamentoAtual />;
      case 'alertas_financeiros':
        return <WidgetAlertasFinanceiros />;
      default:
        return null;
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      {/* Handle de drag */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1 rounded hover:bg-accent"
        title="Arrastar para reordenar"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      {renderWidget()}
    </div>
  );
}

// Overlay durante o drag
function DragOverlayContent({ widget }: { widget: PersonalWidget }) {
  return (
    <Card className="shadow-lg border-primary/50 bg-card/95 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <GripVertical className="h-4 w-4" />
          {widget.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">Solte para reposicionar</p>
      </CardContent>
    </Card>
  );
}

// Componente Principal
export function SortablePersonalWidgets() {
  const [widgets, setWidgets] = useState<PersonalWidget[]>(DEFAULT_WIDGETS);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Carregar ordem salva do localStorage
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- necessário para hydration guard
    setMounted(true);
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as PersonalWidget[];
        // Merge com defaults para garantir que novos widgets sejam incluídos
        const merged = DEFAULT_WIDGETS.map((defaultWidget) => {
          const savedWidget = parsed.find((w) => w.id === defaultWidget.id);
          return savedWidget || defaultWidget;
        });
        // Reordenar baseado na ordem salva
        const orderedIds = parsed.map((w) => w.id);
        merged.sort((a, b) => {
          const indexA = orderedIds.indexOf(a.id);
          const indexB = orderedIds.indexOf(b.id);
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;
          return indexA - indexB;
        });
        setWidgets(merged);
      } catch {
        // Ignorar erro de parse
      }
    }
  }, []);

  // Salvar ordem no localStorage
  const saveOrder = useCallback((newWidgets: PersonalWidget[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newWidgets));
  }, []);

  // Sensores para drag
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setWidgets((items) => {
        const oldIndex = items.findIndex((w) => w.id === active.id);
        const newIndex = items.findIndex((w) => w.id === over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        saveOrder(newOrder);
        return newOrder;
      });
    }

    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  // Toggle visibilidade
  const toggleVisibility = (widgetId: string) => {
    setWidgets((items) => {
      const newItems = items.map((w) =>
        w.id === widgetId ? { ...w, visible: !w.visible } : w
      );
      saveOrder(newItems);
      return newItems;
    });
  };

  // Restaurar ordem padrão
  const resetToDefault = () => {
    setWidgets(DEFAULT_WIDGETS);
    localStorage.removeItem(STORAGE_KEY);
  };

  const activeWidget = activeId ? widgets.find((w) => w.id === activeId) : null;
  const visibleWidgets = widgets.filter((w) => w.visible);
  const hasHiddenWidgets = widgets.some((w) => !w.visible);

  // Não renderizar no servidor
  if (!mounted) {
    return (
      <div className="grid gap-6 lg:grid-cols-3">
        {DEFAULT_WIDGETS.map((widget) => (
          <Card key={widget.id} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 w-24 bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-32 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Menu de configuração */}
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-1">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Configurar</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Widgets Visíveis</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {widgets.map((widget) => (
              <DropdownMenuCheckboxItem
                key={widget.id}
                checked={widget.visible}
                onCheckedChange={() => toggleVisibility(widget.id)}
              >
                <span className="flex items-center gap-2">
                  {widget.visible ? (
                    <Eye className="h-3 w-3" />
                  ) : (
                    <EyeOff className="h-3 w-3 text-muted-foreground" />
                  )}
                  {widget.title}
                </span>
              </DropdownMenuCheckboxItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={false}
              onCheckedChange={resetToDefault}
            >
              Restaurar padrão
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Aviso de widgets ocultos */}
      {hasHiddenWidgets && (
        <p className="text-xs text-muted-foreground text-center">
          {widgets.filter((w) => !w.visible).length} widget(s) oculto(s). Use o
          menu acima para exibi-los.
        </p>
      )}

      {/* Grade de widgets */}
      {visibleWidgets.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext
            items={visibleWidgets.map((w) => w.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid gap-6 lg:grid-cols-3">
              {visibleWidgets.map((widget) => (
                <SortableWidgetItem key={widget.id} widget={widget} />
              ))}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeWidget ? <DragOverlayContent widget={activeWidget} /> : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            Todos os widgets estão ocultos. Use o menu acima para exibi-los.
          </p>
        </Card>
      )}
    </div>
  );
}
