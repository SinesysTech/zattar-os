import * as React from 'react';
import { format, differenceInDays, startOfDay } from 'date-fns';
import { CheckCircle2, UserPlus, FileSearch } from 'lucide-react';
import { GlassPanel } from '@/components/shared/glass-panel';
import { UrgencyDot } from '@/app/(authenticated)/dashboard/mock/widgets/primitives';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Heading } from '@/components/ui/typography';
import type { Expediente } from '../domain';
import { GRAU_TRIBUNAL_LABELS } from '../domain';

interface ExpedienteListRowProps {
  expediente: Expediente;
  tipoExpedienteNome: string;
  responsavelNome?: string;
  onBaixar?: (id: number) => void;
  onAtribuir?: (id: number) => void;
  onVisualizar?: (id: number) => void;
}

export function ExpedienteListRow({
  expediente,
  tipoExpedienteNome,
  responsavelNome,
  onBaixar,
  onAtribuir,
  onVisualizar,
}: ExpedienteListRowProps) {
  // Cálculo de prazos e urgência
  const prazo = expediente.dataPrazoLegalParte ? new Date(expediente.dataPrazoLegalParte) : null;
  const hoje = startOfDay(new Date());
  
  let diasRestantes = null;
  let isVencido = expediente.prazoVencido;
  let urgencyLevel: 'critico' | 'alto' | 'medio' | 'baixo' | 'ok' = 'ok';
  let prazoLabel = 'Sem prazo';

  if (prazo) {
    const prazoD = startOfDay(prazo);
    diasRestantes = differenceInDays(prazoD, hoje);
    
    if (diasRestantes < 0 || isVencido) {
      urgencyLevel = 'critico';
      prazoLabel = diasRestantes < 0 ? `${Math.abs(diasRestantes)}d vencido` : 'Vencido';
    } else if (diasRestantes === 0) {
      urgencyLevel = 'critico';
      prazoLabel = 'Vence hoje';
    } else if (diasRestantes <= 2) {
      urgencyLevel = 'alto';
      prazoLabel = `Vence em ${diasRestantes}d`;
    } else if (diasRestantes <= 5) {
      urgencyLevel = 'medio';
      prazoLabel = `Vence em ${diasRestantes}d`;
    } else {
      urgencyLevel = 'baixo';
      prazoLabel = format(prazoD, 'dd/MM/yyyy');
    }
  }

  if (expediente.baixadoEm) {
    urgencyLevel = 'ok';
    prazoLabel = 'Concluído';
  }

  const isUrgenteCor = urgencyLevel === 'critico' || urgencyLevel === 'alto';

  return (
    <GlassPanel 
      depth={1} 
      className={cn(
        "group flex flex-col sm:flex-row sm:items-center gap-4 p-4 transition-colors hover:border-primary/20 hover:bg-primary/4",
        expediente.baixadoEm && "opacity-60"
      )}
    >
      {/* 1. Indicador de Urgência e Tipo do Expediente */}
      <div className="flex flex-1 min-w-0 items-start sm:items-center gap-3">
        <div className="mt-1 sm:mt-0">
          <UrgencyDot level={urgencyLevel} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Heading level="card" as="h3" className="truncate text-sm text-foreground">
              {tipoExpedienteNome || 'Expediente sem tipo'}
            </Heading>
          </div>
          
          {/* Processo: TRT + Grau + Número */}
          <div className="mt-0.5 flex items-center gap-1.5 text-xs min-w-0">
            {expediente.trt && (
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary/70 shrink-0">{expediente.trt}</span>
            )}
            {expediente.grau && (
              <span className="text-[9px] text-muted-foreground/45 shrink-0">{GRAU_TRIBUNAL_LABELS[expediente.grau]}</span>
            )}
            <span className="tabular-nums tracking-tight text-muted-foreground/70 truncate">{expediente.numeroProcesso || 'Sem processo vinculado'}</span>
          </div>
          {/* Órgão jurisdicional */}
          {(expediente.descricaoOrgaoJulgador || expediente.orgaoJulgadorOrigem) && (
            <p className="text-[9px] text-muted-foreground/40 mt-0.5 truncate" title={expediente.descricaoOrgaoJulgador || expediente.orgaoJulgadorOrigem || ''}>
              {expediente.descricaoOrgaoJulgador || expediente.orgaoJulgadorOrigem}
            </p>
          )}
          {/* Partes */}
          {expediente.nomeParteAutora && expediente.nomeParteRe && (
            <p className="text-[10px] text-muted-foreground/55 mt-0.5 truncate">
              {expediente.nomeParteAutora} <span className="text-muted-foreground/35">x</span> {expediente.nomeParteRe}
            </p>
          )}
          {/* Observações inline */}
          {expediente.observacoes && (
            <p className="text-[9px] text-muted-foreground/35 mt-0.5 truncate italic" title={expediente.observacoes}>
              {expediente.observacoes}
            </p>
          )}
          
          <div className="mt-2 flex items-center gap-2 sm:hidden">
            <span className={cn(
              "text-[11px] font-medium px-1.5 py-0.5 rounded-md",
              isUrgenteCor ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
            )}>
              {prazoLabel}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Responsável e Prazo (Desktop) */}
      <div className="hidden sm:flex flex-col items-end gap-1 shrink-0 min-w-30">
        <span className={cn(
          "text-[11px] font-medium px-2 py-0.5 rounded-md",
          isUrgenteCor ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
        )}>
          {prazoLabel}
        </span>
        <div className="text-[11px] text-muted-foreground/60">
          {responsavelNome ? (
            <span className="truncate max-w-30">{responsavelNome}</span>
          ) : (
            <span className="italic text-warning/70">Sem responsável</span>
          )}
        </div>
      </div>

      {/* 3. Quick Actions */}
      <div className="flex items-center gap-1.5 shrink-0 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 px-2 text-xs text-success/80 hover:text-success hover:bg-success/10"
          onClick={() => onBaixar?.(expediente.id)}
        >
          <CheckCircle2 className="size-3.5 mr-1" />
          Concluir
        </Button>
        <Button 
          variant="ghost" 
          size="icon"
          className="size-8 text-primary hover:text-primary hover:bg-primary/10"
          onClick={() => onAtribuir?.(expediente.id)}
          aria-label="Atribuir responsável"
        >
          <UserPlus className="size-3.5" />
        </Button>
        {expediente.arquivoUrl && (
          <Button 
            variant="ghost" 
            size="icon"
            className="size-8 text-muted-foreground hover:text-foreground"
            onClick={() => onVisualizar?.(expediente.id)}
            aria-label="Visualizar PDF"
          >
            <FileSearch className="size-3.5" />
          </Button>
        )}
      </div>
    </GlassPanel>
  );
}
