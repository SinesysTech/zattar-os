'use client';

import React, { useMemo } from 'react';
import { LayoutGrid } from 'lucide-react';
import { usePermissoes } from '@/providers/user-provider';
import { useWidgetLayout } from '../hooks/use-widget-layout';
import { GlassPanel } from '../mock/widgets/primitives';
import { WidgetPicker, type WidgetDefinition } from './widget-picker';
import { Button } from '@/components/ui/button';

// ─── Registry import (gerado por agent paralelo) ────────────────────────────
// Se o arquivo ainda não existir no momento do build, o dashboard renderiza
// um estado vazio sem quebrar a aplicação.
let WIDGET_REGISTRY: WidgetDefinition[] = [];
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('../registry/widget-registry') as {
    WIDGET_REGISTRY?: WidgetDefinition[];
    default?: WidgetDefinition[];
  };
  WIDGET_REGISTRY = mod.WIDGET_REGISTRY ?? mod.default ?? [];
} catch {
  // Registry ainda nao existe — dashboard exibe estado vazio
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getSaudacao(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function getColSpanClass(size: WidgetDefinition['size']): string {
  switch (size) {
    case 'md':
    case 'lg':
      return 'md:col-span-2';
    case 'full':
      return 'md:col-span-2 lg:col-span-3';
    default:
      return '';
  }
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface WidgetDashboardProps {
  currentUserId: number;
  currentUserName: string;
}

// ─── Componente ──────────────────────────────────────────────────────────────

export function WidgetDashboard({ currentUserId, currentUserName }: WidgetDashboardProps) {
  const { temPermissao } = usePermissoes();
  const {
    enabledWidgets,
    hasCustomized,
    toggleWidget,
    setWidgets,
    resetToDefaults,
  } = useWidgetLayout(currentUserId);

  // Filtrar registry pelas permissoes do usuario
  const availableWidgets = useMemo<WidgetDefinition[]>(
    () =>
      WIDGET_REGISTRY.filter(
        (w) =>
          w.permission === null ||
          temPermissao(w.permission.recurso, w.permission.operacao)
      ),
    [temPermissao]
  );

  // Determinar quais widgets renderizar:
  // - Sem customizacao: exibir os marcados como defaultEnabled
  // - Com customizacao: exibir apenas os que o usuario selecionou
  const visibleWidgets = useMemo<WidgetDefinition[]>(() => {
    if (!hasCustomized) {
      return availableWidgets.filter((w) => w.defaultEnabled);
    }
    return availableWidgets.filter((w) => enabledWidgets.includes(w.id));
  }, [availableWidgets, enabledWidgets, hasCustomized]);

  // IDs efetivos para o picker (considera defaults quando nao personalizado)
  const effectiveEnabledIds = useMemo<string[]>(() => {
    if (!hasCustomized) {
      return availableWidgets.filter((w) => w.defaultEnabled).map((w) => w.id);
    }
    return enabledWidgets;
  }, [availableWidgets, enabledWidgets, hasCustomized]);

  const saudacao = getSaudacao();
  const primeiroNome = currentUserName.split(' ')[0] ?? currentUserName;

  const hoje = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="space-y-6">
      {/* ── Cabecalho ───────────────────────────────────────────── */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-semibold tracking-tight">
            {saudacao}, {primeiroNome}.
          </h1>
          <p className="text-sm text-muted-foreground/60 mt-0.5 capitalize">
            {hoje} &mdash;{' '}
            {visibleWidgets.length === 0
              ? 'nenhum widget ativo'
              : `${visibleWidgets.length} widget${visibleWidgets.length !== 1 ? 's' : ''} ativo${visibleWidgets.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        <WidgetPicker
          availableWidgets={availableWidgets}
          enabledWidgets={effectiveEnabledIds}
          onToggle={(id) => {
            // Na primeira interacao, inicializar a partir dos defaults para
            // nao partir de uma lista vazia ao desativar o primeiro widget.
            if (!hasCustomized) {
              const defaultIds = availableWidgets
                .filter((w) => w.defaultEnabled)
                .map((w) => w.id);
              const next = defaultIds.includes(id)
                ? defaultIds.filter((d) => d !== id)
                : [...defaultIds, id];
              setWidgets(next);
              return;
            }
            toggleWidget(id);
          }}
          onResetDefaults={resetToDefaults}
        />
      </div>

      {/* ── Grid de widgets ─────────────────────────────────────── */}
      {visibleWidgets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-auto">
          {visibleWidgets.map((widget) => {
            const WidgetComponent = widget.component;
            return (
              <div
                key={widget.id}
                className={getColSpanClass(widget.size)}
              >
                <WidgetComponent />
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState onOpenPicker={undefined} />
      )}
    </div>
  );
}

// ─── Estado vazio ─────────────────────────────────────────────────────────────

function EmptyState({ onOpenPicker }: { onOpenPicker?: () => void }) {
  return (
    <GlassPanel depth={1} className="p-12">
      <div className="flex flex-col items-center justify-center text-center gap-4">
        <div className="size-14 rounded-2xl border border-border/20 bg-white/3 flex items-center justify-center">
          <LayoutGrid className="size-6 text-muted-foreground/30" />
        </div>
        <div>
          <p className="font-heading text-base font-semibold text-foreground/70">
            Nenhum widget selecionado
          </p>
          <p className="text-sm text-muted-foreground/50 mt-1 max-w-xs">
            Clique em{' '}
            <span className="font-medium text-foreground/60">Personalizar</span>{' '}
            para escolher quais informacoes exibir no seu painel.
          </p>
        </div>
        {onOpenPicker && (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenPicker}
            className="gap-2 border-border/30 bg-transparent hover:bg-white/5"
          >
            <LayoutGrid className="size-3.5" />
            Personalizar
          </Button>
        )}
      </div>
    </GlassPanel>
  );
}
