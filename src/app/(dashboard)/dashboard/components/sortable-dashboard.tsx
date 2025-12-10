'use client';

import { useState, useEffect, useCallback, ReactNode } from 'react';
import { useMinhasPermissoes } from '@/app/_lib/hooks/use-minhas-permissoes';
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
import {
  GripVertical,
  Settings,
  Eye,
  EyeOff,
  RotateCcw,
  Maximize2,
  Square,
  Columns2,
  Columns3,
  Columns4,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import type {
  DashboardUsuarioData,
  DashboardAdminData,
} from '@/backend/types/dashboard/types';

import {
  UserStatusCards,
  AdminStatusCards,
  WidgetProcessosResumo,
  WidgetAudienciasProximas,
  WidgetExpedientesUrgentes,
  WidgetProdutividadePerformance,
  WidgetFolhaPagamento,
  WidgetCustoPessoal,
} from './widgets';
import { TarefasWidget } from './tarefas-widget';
import { NotasWidget } from './notas-widget';
import { LinksWidget } from './links-widget';
import { ObrigacoesWidget } from './obrigacoes-widget';

// ============================================================================
// Tipos
// ============================================================================

type WidgetType =
  | 'status-cards'
  | 'processos-resumo'
  | 'audiencias-proximas'
  | 'expedientes-urgentes'
  | 'produtividade'
  | 'tarefas'
  | 'notas'
  | 'links'
  | 'obrigacoes'
  | 'admin-status-cards'
  | 'folha-pagamento'
  | 'custo-pessoal';

// Tamanhos disponíveis para widgets (spans de coluna em grid de 4)
type WidgetSize = 'small' | 'medium' | 'large' | 'full';

interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  visible: boolean;
  section: 'status' | 'detail' | 'personal';
  size: WidgetSize;
}

// Labels para o menu de tamanhos
const SIZE_LABELS: Record<WidgetSize, string> = {
  small: '1 Coluna',
  medium: '2 Colunas',
  large: '3 Colunas',
  full: 'Largura Total',
};

const USER_DEFAULT_WIDGETS: DashboardWidget[] = [
  { id: 'status-cards', type: 'status-cards', title: 'Cards de Status', visible: true, section: 'status', size: 'full' },
  { id: 'processos-resumo', type: 'processos-resumo', title: 'Resumo de Processos', visible: true, section: 'detail', size: 'medium' },
  { id: 'audiencias-proximas', type: 'audiencias-proximas', title: 'Próximas Audiências', visible: true, section: 'detail', size: 'medium' },
  { id: 'expedientes-urgentes', type: 'expedientes-urgentes', title: 'Expedientes Urgentes', visible: true, section: 'detail', size: 'medium' },
  { id: 'produtividade', type: 'produtividade', title: 'Produtividade', visible: true, section: 'detail', size: 'medium' },
  { id: 'obrigacoes', type: 'obrigacoes', title: 'Obrigações Financeiras', visible: true, section: 'detail', size: 'medium' },
  { id: 'tarefas', type: 'tarefas', title: 'Minhas Tarefas', visible: true, section: 'personal', size: 'medium' },
  { id: 'notas', type: 'notas', title: 'Notas Rápidas', visible: true, section: 'personal', size: 'small' },
  { id: 'links', type: 'links', title: 'Links Úteis', visible: true, section: 'personal', size: 'small' },
];

const ADMIN_DEFAULT_WIDGETS: DashboardWidget[] = [
  { id: 'admin-status-cards', type: 'admin-status-cards', title: 'Cards de Status', visible: true, section: 'status', size: 'full' },
  { id: 'audiencias-proximas', type: 'audiencias-proximas', title: 'Próximas Audiências', visible: true, section: 'detail', size: 'medium' },
  { id: 'expedientes-urgentes', type: 'expedientes-urgentes', title: 'Expedientes Urgentes', visible: true, section: 'detail', size: 'medium' },
  { id: 'obrigacoes', type: 'obrigacoes', title: 'Obrigações Financeiras', visible: true, section: 'detail', size: 'medium' },
  { id: 'folha-pagamento', type: 'folha-pagamento', title: 'Folha do Mês', visible: true, section: 'detail', size: 'medium' },
  { id: 'custo-pessoal', type: 'custo-pessoal', title: 'Custo com Pessoal', visible: true, section: 'detail', size: 'medium' },
  { id: 'tarefas', type: 'tarefas', title: 'Minhas Tarefas', visible: true, section: 'personal', size: 'medium' },
  { id: 'notas', type: 'notas', title: 'Notas Rápidas', visible: true, section: 'personal', size: 'small' },
  { id: 'links', type: 'links', title: 'Links úteis', visible: true, section: 'personal', size: 'small' },
];

const USER_STORAGE_KEY = 'dashboard-user-widgets-order';
const ADMIN_STORAGE_KEY = 'dashboard-admin-widgets-order';

// ============================================================================
// Ícones de tamanho
// ============================================================================

const SIZE_ICONS: Record<WidgetSize, React.ReactNode> = {
  small: <Square className="h-3 w-3" />,
  medium: <Columns2 className="h-3 w-3" />,
  large: <Columns3 className="h-3 w-3" />,
  full: <Columns4 className="h-3 w-3" />,
};

// ============================================================================
// Componente Sortable Item
// ============================================================================

interface SortableWidgetItemProps {
  widget: DashboardWidget;
  children: ReactNode;
  onSizeChange: (widgetId: string, size: WidgetSize) => void;
}

function SortableWidgetItem({ widget, children, onSizeChange }: SortableWidgetItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Classes responsivas baseadas no tamanho
  const sizeClasses = {
    small: 'col-span-4 md:col-span-2 lg:col-span-1',
    medium: 'col-span-4 md:col-span-2 lg:col-span-2',
    large: 'col-span-4 md:col-span-4 lg:col-span-3',
    full: 'col-span-4',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${sizeClasses[widget.size]}`}
    >
      {/* Toolbar flutuante */}
      <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
        {/* Menu de tamanho */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="p-1 hover:bg-accent/50 rounded transition-colors"
              title="Alterar tamanho"
            >
              <Maximize2 className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuLabel className="text-xs">Tamanho</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(Object.keys(SIZE_LABELS) as WidgetSize[]).map((size) => (
              <DropdownMenuCheckboxItem
                key={size}
                checked={widget.size === size}
                onCheckedChange={() => onSizeChange(widget.id, size)}
              >
                <span className="flex items-center gap-2">
                  {SIZE_ICONS[size]}
                  {SIZE_LABELS[size]}
                </span>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Handle de drag */}
        <div
          {...attributes}
          {...listeners}
          className="p-1 hover:bg-accent/50 rounded cursor-grab active:cursor-grabbing transition-colors"
          title="Arrastar para reordenar"
        >
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </div>
      {children}
    </div>
  );
}

// ============================================================================
// Overlay durante o drag
// ============================================================================

function DragOverlayContent({ widget }: { widget: DashboardWidget }) {
  return (
    <Card className="shadow-xl border-primary/50 bg-card/95 backdrop-blur min-w-[200px]">
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

// ============================================================================
// Componente Principal - User Dashboard
// ============================================================================

interface SortableUserDashboardProps {
  data: DashboardUsuarioData;
}

export function SortableUserDashboard({ data }: SortableUserDashboardProps) {
  const [widgets, setWidgets] = useState<DashboardWidget[]>(USER_DEFAULT_WIDGETS);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Hook de permissões
  const { isSuperAdmin, temPermissao, isLoading: isLoadingPermissoes } = useMinhasPermissoes();

  // Carregar ordem salva
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- necessário para hydration guard
    setMounted(true);
    const saved = localStorage.getItem(USER_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as DashboardWidget[];
        const merged = USER_DEFAULT_WIDGETS.map((defaultWidget) => {
          const savedWidget = parsed.find((w) => w.id === defaultWidget.id);
          return savedWidget
            ? { ...defaultWidget, visible: savedWidget.visible, size: savedWidget.size || defaultWidget.size }
            : defaultWidget;
        });
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
        // Ignorar erro
      }
    }
  }, []);

  const saveOrder = useCallback((newWidgets: DashboardWidget[]) => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newWidgets));
  }, []);

  // Verificar se tem acesso a qualquer módulo financeiro
  const temAcessoFinanceiro = isSuperAdmin ||
    temPermissao('obrigacoes', 'visualizar') ||
    temPermissao('folhas_pagamento', 'visualizar') ||
    temPermissao('salarios', 'visualizar') ||
    temPermissao('plano_contas', 'listar') ||
    temPermissao('contas_pagar', 'listar') ||
    temPermissao('contas_receber', 'listar') ||
    temPermissao('dre', 'visualizar');

  // Filtrar widgets financeiros baseado em permissões
  const widgetsPermitidos = !isLoadingPermissoes && !temAcessoFinanceiro
    ? widgets.filter((w) =>
      w.type !== 'obrigacoes' &&
      w.type !== 'folha-pagamento' &&
      w.type !== 'custo-pessoal'
    )
    : widgets;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
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

  const toggleVisibility = (widgetId: string) => {
    setWidgets((items) => {
      const newItems = items.map((w) =>
        w.id === widgetId ? { ...w, visible: !w.visible } : w
      );
      saveOrder(newItems);
      return newItems;
    });
  };

  const changeSize = useCallback((widgetId: string, size: WidgetSize) => {
    setWidgets((items) => {
      const newItems = items.map((w) =>
        w.id === widgetId ? { ...w, size } : w
      );
      saveOrder(newItems);
      return newItems;
    });
  }, [saveOrder]);

  const resetToDefault = () => {
    setWidgets(USER_DEFAULT_WIDGETS);
    localStorage.removeItem(USER_STORAGE_KEY);
  };

  const activeWidget = activeId ? widgetsPermitidos.find((w) => w.id === activeId) : null;
  const visibleWidgets = widgetsPermitidos.filter((w) => w.visible);
  const hasHiddenWidgets = widgetsPermitidos.some((w) => !w.visible);

  const renderWidget = (widget: DashboardWidget) => {
    switch (widget.type) {
      case 'status-cards':
        return (
          <UserStatusCards
            processos={data.processos}
            audiencias={data.audiencias}
            expedientes={data.expedientes}
          />
        );
      case 'processos-resumo':
        return <WidgetProcessosResumo data={data.processos} />;
      case 'audiencias-proximas':
        return (
          <WidgetAudienciasProximas
            audiencias={data.proximasAudiencias}
            resumo={data.audiencias}
          />
        );
      case 'expedientes-urgentes':
        return (
          <WidgetExpedientesUrgentes
            expedientes={data.expedientesUrgentes}
            resumo={data.expedientes}
          />
        );
      case 'produtividade':
        return <WidgetProdutividadePerformance data={data.produtividade} />;
      case 'tarefas':
        return <TarefasWidget />;
      case 'notas':
        return <NotasWidget />;
      case 'links':
        return <LinksWidget />;
      case 'obrigacoes':
        return <ObrigacoesWidget />;
      case 'folha-pagamento':
        return <WidgetFolhaPagamento />;
      case 'custo-pessoal':
        return <WidgetCustoPessoal />;
      default:
        return null;
    }
  };

  if (!mounted) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Menu de configuração */}
      <div className="flex justify-end group/settings">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="p-2 hover:bg-accent/50 rounded transition-colors opacity-0 group-hover/settings:opacity-100"
              title="Personalizar Dashboard"
            >
              <Settings className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>Widgets Visíveis</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {widgetsPermitidos.map((widget) => (
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
            <DropdownMenuCheckboxItem checked={false} onCheckedChange={resetToDefault}>
              <RotateCcw className="h-3 w-3 mr-2" />
              Restaurar padrão
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {hasHiddenWidgets && (
        <p className="text-xs text-muted-foreground text-center">
          {widgetsPermitidos.filter((w) => !w.visible).length} widget(s) oculto(s)
        </p>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={visibleWidgets.map((w) => w.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-4 gap-4">
            {visibleWidgets.map((widget) => (
              <SortableWidgetItem key={widget.id} widget={widget} onSizeChange={changeSize}>
                {renderWidget(widget)}
              </SortableWidgetItem>
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeWidget ? <DragOverlayContent widget={activeWidget} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

// ============================================================================
// Componente Principal - Admin Dashboard
// ============================================================================

interface SortableAdminDashboardProps {
  data: DashboardAdminData;
}

export function SortableAdminDashboard({ data }: SortableAdminDashboardProps) {
  const [widgets, setWidgets] = useState<DashboardWidget[]>(ADMIN_DEFAULT_WIDGETS);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Hook de permissões
  const { isSuperAdmin, temPermissao, isLoading: isLoadingPermissoes } = useMinhasPermissoes();

  const expedientesVencidos = data.expedientesUrgentes.filter(
    (e) => e.dias_restantes < 0
  ).length;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- necessário para hydration guard
    setMounted(true);
    const saved = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as DashboardWidget[];
        const merged = ADMIN_DEFAULT_WIDGETS.map((defaultWidget) => {
          const savedWidget = parsed.find((w) => w.id === defaultWidget.id);
          return savedWidget
            ? { ...defaultWidget, visible: savedWidget.visible, size: savedWidget.size || defaultWidget.size }
            : defaultWidget;
        });
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
        // Ignorar erro
      }
    }
  }, []);

  const saveOrder = useCallback((newWidgets: DashboardWidget[]) => {
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(newWidgets));
  }, []);

  // Verificar se tem acesso a qualquer módulo financeiro
  const temAcessoFinanceiro = isSuperAdmin ||
    temPermissao('obrigacoes', 'visualizar') ||
    temPermissao('folhas_pagamento', 'visualizar') ||
    temPermissao('salarios', 'visualizar') ||
    temPermissao('plano_contas', 'listar') ||
    temPermissao('contas_pagar', 'listar') ||
    temPermissao('contas_receber', 'listar') ||
    temPermissao('dre', 'visualizar');

  // Filtrar widgets financeiros baseado em permissões
  const widgetsPermitidos = !isLoadingPermissoes && !temAcessoFinanceiro
    ? widgets.filter((w) =>
      w.type !== 'obrigacoes' &&
      w.type !== 'folha-pagamento' &&
      w.type !== 'custo-pessoal'
    )
    : widgets;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
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

  const toggleVisibility = (widgetId: string) => {
    setWidgets((items) => {
      const newItems = items.map((w) =>
        w.id === widgetId ? { ...w, visible: !w.visible } : w
      );
      saveOrder(newItems);
      return newItems;
    });
  };

  const changeSize = useCallback((widgetId: string, size: WidgetSize) => {
    setWidgets((items) => {
      const newItems = items.map((w) =>
        w.id === widgetId ? { ...w, size } : w
      );
      saveOrder(newItems);
      return newItems;
    });
  }, [saveOrder]);

  const resetToDefault = () => {
    setWidgets(ADMIN_DEFAULT_WIDGETS);
    localStorage.removeItem(ADMIN_STORAGE_KEY);
  };

  const activeWidget = activeId ? widgetsPermitidos.find((w) => w.id === activeId) : null;
  const visibleWidgets = widgetsPermitidos.filter((w) => w.visible);
  const hasHiddenWidgets = widgetsPermitidos.some((w) => !w.visible);

  const renderWidget = (widget: DashboardWidget) => {
    switch (widget.type) {
      case 'admin-status-cards':
        return (
          <AdminStatusCards
            metricas={data.metricas}
            expedientesVencidos={expedientesVencidos}
          />
        );
      case 'audiencias-proximas':
        return <WidgetAudienciasProximas audiencias={data.proximasAudiencias} />;
      case 'expedientes-urgentes':
        return <WidgetExpedientesUrgentes expedientes={data.expedientesUrgentes} />;
      case 'tarefas':
        return <TarefasWidget />;
      case 'notas':
        return <NotasWidget />;
      case 'links':
        return <LinksWidget />;
      case 'obrigacoes':
        return <ObrigacoesWidget />;
      case 'folha-pagamento':
        return <WidgetFolhaPagamento />;
      case 'custo-pessoal':
        return <WidgetCustoPessoal />;
      default:
        return null;
    }
  };

  if (!mounted) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Menu de configuração */}
      <div className="flex justify-end group/settings">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="p-2 hover:bg-accent/50 rounded transition-colors opacity-0 group-hover/settings:opacity-100"
              title="Personalizar Dashboard"
            >
              <Settings className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>Widgets Visíveis</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {widgetsPermitidos.map((widget) => (
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
            <DropdownMenuCheckboxItem checked={false} onCheckedChange={resetToDefault}>
              <RotateCcw className="h-3 w-3 mr-2" />
              Restaurar padrão
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {hasHiddenWidgets && (
        <p className="text-xs text-muted-foreground text-center">
          {widgetsPermitidos.filter((w) => !w.visible).length} widget(s) oculto(s)
        </p>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={visibleWidgets.map((w) => w.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-4 gap-4">
            {visibleWidgets.map((widget) => (
              <SortableWidgetItem key={widget.id} widget={widget} onSizeChange={changeSize}>
                {renderWidget(widget)}
              </SortableWidgetItem>
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeWidget ? <DragOverlayContent widget={activeWidget} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

// ============================================================================
// Skeleton
// ============================================================================

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 w-24 bg-muted rounded mb-2" />
              <div className="h-8 w-16 bg-muted rounded mb-2" />
              <div className="h-3 w-32 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-5 w-32 bg-muted rounded mb-4" />
              <div className="h-24 w-full bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
