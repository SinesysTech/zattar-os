'use client';

import * as React from 'react';
import { FileSearch } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

import { type Expediente } from '../domain';
import type { Usuario } from '@/app/(authenticated)/usuarios';
import { ExpedienteCard } from './expediente-card';

// =============================================================================
// TYPES
// =============================================================================

interface TipoExpedienteOption {
  id: number;
  tipoExpediente?: string;
}

interface ExpedientesGlassListProps {
  expedientes: Expediente[];
  isLoading: boolean;
  onViewDetail: (expediente: Expediente) => void;
  onBaixar?: (expediente: Expediente) => void;
  usuariosData?: Usuario[];
  tiposExpedientesData?: TipoExpedienteOption[];
  onSuccess?: () => void;
}

// =============================================================================
// SKELETON
// =============================================================================

function ListSkeleton() {
  return (
    <div
      className={cn(
        /* design-system-escape: gap-2 entre rows do skeleton da lista — espaçamento da própria lista */ 'flex flex-col gap-2',
      )}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          className={cn(
            /* design-system-escape: p-4 padding interno do row de skeleton (mirror do ExpedienteCard compact) */ 'rounded-2xl border border-border/60 bg-card p-4',
          )}
        >
          <div
            className={cn(
              /* design-system-escape: items-center espelha o ExpedienteCard compact que centraliza verticalmente a PrazoColumn; gap-4 entre coluna temporal e bloco principal */ 'flex items-center gap-4',
            )}
          >
            <div
              className={cn(
                /* design-system-escape: w-24 + gap-3 espelham a PrazoColumn (Fatal + Ciência empilhados) */ 'flex w-24 shrink-0 flex-col items-center gap-3',
              )}
            >
              <div className="flex flex-col items-center gap-0.5">
                <Skeleton className="h-4 w-18" />
                <Skeleton className="h-2.5 w-10" />
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <Skeleton className="h-3.5 w-18" />
                <Skeleton className="h-2.5 w-12" />
              </div>
            </div>
            <div
              className={cn(
                /* design-system-escape: space-y-2 stack vertical do skeleton dos blocos textuais do row */ 'flex-1 space-y-2',
              )}
            >
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3.5 w-64" />
              <Skeleton className="h-3 w-72" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// EMPTY STATE
// =============================================================================

function GlassEmptyState() {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 opacity-60',
      )}
    >
      <FileSearch className="mb-4 size-10 text-muted-foreground/55" />
      <p
        className={cn(
          /* design-system-escape: text-sm/font-medium do título do empty state — peso visual canônico */ 'text-sm font-medium text-muted-foreground/70',
        )}
      >
        Nenhum expediente encontrado
      </p>
      <p
        className={cn(
          /* design-system-escape: text-xs do subtítulo do empty state */ 'mt-1 text-xs text-muted-foreground/55',
        )}
      >
        Tente ajustar os filtros ou criar um novo expediente
      </p>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ExpedientesGlassList({
  expedientes,
  isLoading,
  onViewDetail,
  onBaixar,
  usuariosData,
  tiposExpedientesData,
  onSuccess,
}: ExpedientesGlassListProps) {
  if (isLoading) return <ListSkeleton />;
  if (expedientes.length === 0) return <GlassEmptyState />;

  return (
    <div
      className={cn(
        /* design-system-escape: gap-2 entre rows da lista — densidade canônica do glass list */ 'flex flex-col gap-2',
      )}
    >
      {expedientes.map((exp) => (
        <ExpedienteCard
          key={exp.id}
          expediente={exp}
          density="compact"
          usuariosData={usuariosData ?? []}
          tiposExpedientesData={tiposExpedientesData ?? []}
          onSelect={() => onViewDetail(exp)}
          onBaixar={onBaixar}
          onViewDetail={onViewDetail}
          onSuccess={onSuccess}
        />
      ))}
    </div>
  );
}
