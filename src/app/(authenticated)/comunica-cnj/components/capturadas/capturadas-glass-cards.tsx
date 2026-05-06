'use client';

import { Link2, Unlink, AlertTriangle, FileSearch } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassPanel } from '@/components/shared/glass-panel';
import { EmptyState } from '@/components/shared/empty-state';
import { Heading, Text } from '@/components/ui/typography';
import { TribunalBadge } from '@/components/ui/tribunal-badge';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import type { ComunicacaoCNJEnriquecida } from '@/app/(authenticated)/comunica-cnj/domain';

export interface CapturadasGlassCardsProps {
  comunicacoes: ComunicacaoCNJEnriquecida[];
  onSelect: (c: ComunicacaoCNJEnriquecida) => void;
  selectedId?: number | null;
}

function StatusIcon({ status, diasParaPrazo }: { status: string; diasParaPrazo: number | null }) {
  if (status === 'vinculado') {
    return <Link2 className="size-3.5 text-success" aria-hidden />;
  }
  if (status === 'orfao') {
    const critico = diasParaPrazo !== null && diasParaPrazo <= 3;
    return critico ? (
      <AlertTriangle className="size-3.5 text-destructive" aria-hidden />
    ) : (
      <Unlink className="size-3.5 text-warning" aria-hidden />
    );
  }
  return null;
}

export function CapturadasGlassCards({
  comunicacoes,
  onSelect,
  selectedId = null,
}: CapturadasGlassCardsProps) {
  if (comunicacoes.length === 0) {
    return (
      <EmptyState
        icon={FileSearch}
        title="Nenhuma comunicação"
        description="Não há comunicações para os filtros atuais."
      />
    );
  }

  return (
    <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3")}>
      {comunicacoes.map((c) => {
        const partesAutor = c.partesAutor.slice(0, 2).join(' · ');
        const partesReu = c.partesReu.slice(0, 2).join(' · ');
        const data = c.dataDisponibilizacao
          ? new Date(c.dataDisponibilizacao).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: '2-digit',
            })
          : '—';
        const isSelected = selectedId === c.id;

        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(c)}
            className="text-left"
          >
            <GlassPanel
              className={cn(
                /* design-system-escape: p-4 → migrar para <Inset variant="card-compact"> */ 'inline-tight p-4 transition-all duration-200',
                'hover:border-primary/30 hover:shadow-[0_4px_24px_rgba(85,35,235,0.06)]',
                isSelected && 'border-primary/40 bg-primary/5',
              )}
            >
              <div className={cn("flex items-center inline-tight")}>
                <TribunalBadge codigo={c.siglaTribunal} />
                {c.tipoComunicacao && (
                  <Badge variant="outline" className="text-[10px]">
                    {c.tipoComunicacao}
                  </Badge>
                )}
                <div className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "ml-auto flex items-center gap-1.5")}>
                  <StatusIcon
                    status={c.statusVinculacao}
                    diasParaPrazo={c.diasParaPrazo}
                  />
                  <Text variant="micro-caption" className="tabular-nums">
                    {data}
                  </Text>
                </div>
              </div>

              <Heading level="widget" className="tabular-nums">
                {c.numeroProcessoMascara ?? c.numeroProcesso}
              </Heading>

              {(partesAutor || partesReu) && (
                <Text variant="caption" className="line-clamp-2 text-muted-foreground">
                  {[partesAutor, partesReu].filter(Boolean).join(' · ')}
                </Text>
              )}

              {c.nomeOrgao && (
                <Text variant="micro-caption" className={cn(/* design-system-escape: pt-2 padding direcional sem Inset equiv. */ "truncate border-t border-border/30 pt-2")}>
                  {c.nomeOrgao}
                </Text>
              )}
            </GlassPanel>
          </button>
        );
      })}
    </div>
  );
}
