'use client';

import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import {
  CheckCircle2,
  XCircle,
  FileEdit,
  FilePlus,
  FileX,
  AlertTriangle,
  GitMerge,
  ScrollText,
} from 'lucide-react';
import type { CapturaRawLog } from '@/app/(authenticated)/captura';
import type {
  LogEntry,
  LogRegistroInserido,
  LogRegistroAtualizado,
  LogErro,
} from '../services/persistence/capture-log.service';
import {
  formatarGrau,
  formatarTipoCaptura,
  formatarEntidade,
  formatarCampoAlterado,
} from '../utils/format-captura';

function calcularEstatisticas(logs: LogEntry[]) {
  return {
    inseridos: logs.filter((l) => l.tipo === 'inserido').length,
    atualizados: logs.filter((l) => l.tipo === 'atualizado').length,
    naoAtualizados: logs.filter((l) => l.tipo === 'nao_atualizado').length,
    conflitos: logs.filter((l) => l.tipo === 'conflito').length,
    erros: logs.filter((l) => l.tipo === 'erro').length,
    total: logs.length,
  };
}

function LogStats({ logs }: { logs: LogEntry[] }) {
  const stats = calcularEstatisticas(logs);

  return (
    <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "grid grid-cols-2 gap-2 sm:grid-cols-4")}>
      <div className={cn(/* design-system-escape: gap-2.5 gap sem token DS; p-2.5 → usar <Inset> */ "flex items-center gap-2.5 rounded-lg border bg-success/5 border-success/20 p-2.5")}>
        <FilePlus className="h-4 w-4 text-success shrink-0" />
        <div>
          <p className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading>; tracking-wider sem token DS */ "text-[10px] font-medium text-muted-foreground uppercase tracking-wider")}>Inseridos</p>
          <p className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm">; font-semibold → className de <Text>/<Heading> */ "text-sm font-semibold tabular-nums")}>{stats.inseridos}</p>
        </div>
      </div>
      <div className={cn(/* design-system-escape: gap-2.5 gap sem token DS; p-2.5 → usar <Inset> */ "flex items-center gap-2.5 rounded-lg border bg-info/5 border-info/20 p-2.5")}>
        <FileEdit className="h-4 w-4 text-info shrink-0" />
        <div>
          <p className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading>; tracking-wider sem token DS */ "text-[10px] font-medium text-muted-foreground uppercase tracking-wider")}>Atualizados</p>
          <p className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm">; font-semibold → className de <Text>/<Heading> */ "text-sm font-semibold tabular-nums")}>{stats.atualizados}</p>
        </div>
      </div>
      <div className={cn(/* design-system-escape: gap-2.5 gap sem token DS; p-2.5 → usar <Inset> */ "flex items-center gap-2.5 rounded-lg border bg-muted/40 p-2.5")}>
        <FileX className="h-4 w-4 text-muted-foreground shrink-0" />
        <div>
          <p className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading>; tracking-wider sem token DS */ "text-[10px] font-medium text-muted-foreground uppercase tracking-wider")}>Sem Alteração</p>
          <p className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm">; font-semibold → className de <Text>/<Heading> */ "text-sm font-semibold tabular-nums")}>{stats.naoAtualizados}</p>
        </div>
      </div>
      <div className={cn(/* design-system-escape: gap-2.5 gap sem token DS; p-2.5 → usar <Inset> */ "flex items-center gap-2.5 rounded-lg border bg-destructive/5 border-destructive/20 p-2.5")}>
        <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
        <div>
          <p className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading>; tracking-wider sem token DS */ "text-[10px] font-medium text-muted-foreground uppercase tracking-wider")}>Erros</p>
          <p className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm">; font-semibold → className de <Text>/<Heading> */ "text-sm font-semibold tabular-nums")}>{stats.erros}</p>
        </div>
      </div>
      {stats.conflitos > 0 && (
        <div className={cn(/* design-system-escape: gap-2.5 gap sem token DS; p-2.5 → usar <Inset> */ "flex items-center gap-2.5 rounded-lg border bg-warning/5 border-warning/20 p-2.5 col-span-2 sm:col-span-4")}>
          <GitMerge className="h-4 w-4 text-warning shrink-0" />
          <div>
            <p className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading>; tracking-wider sem token DS */ "text-[10px] font-medium text-muted-foreground uppercase tracking-wider")}>Conflitos de Concorrência</p>
            <p className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm">; font-semibold → className de <Text>/<Heading> */ "text-sm font-semibold tabular-nums")}>{stats.conflitos}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function LogEntries({ logs }: { logs: LogEntry[] }) {
  if (logs.length === 0) return null;

  const erros = logs.filter((l): l is LogErro => l.tipo === 'erro');
  const inseridos = logs.filter((l): l is LogRegistroInserido => l.tipo === 'inserido');
  const atualizados = logs.filter((l): l is LogRegistroAtualizado => l.tipo === 'atualizado');

  return (
    <div className={cn(/* design-system-escape: space-y-3 sem token DS */ "mt-3 space-y-3")}>
      {erros.length > 0 && (
        <div>
          <p className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading>; tracking-wider sem token DS */ "text-[10px] font-semibold text-destructive uppercase tracking-wider mb-2")}>
            Erros ({erros.length})
          </p>
          <div className={cn(/* design-system-escape: space-y-1.5 sem token DS */ "space-y-1.5")}>
            {erros.map((log, i) => (
              <div
                key={i}
                className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight">; p-2.5 → usar <Inset>; text-xs → migrar para <Text variant="caption"> */ "flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/[0.06] p-2.5 text-xs")}
              >
                <XCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium text-foreground")}>{formatarEntidade(log.entidade)}</span>
                  <span className="text-muted-foreground ml-1.5">— {log.erro}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {inseridos.length > 0 && (
        <div>
          <p className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading>; tracking-wider sem token DS */ "text-[10px] font-semibold text-success uppercase tracking-wider mb-2")}>
            Processos inseridos ({inseridos.length})
          </p>
          <div className={cn(/* design-system-escape: gap-1 gap sem token DS */ "flex flex-wrap gap-1")}>
            {inseridos.slice(0, 30).map((log, i) => (
              <Badge
                key={i}
                variant="outline"
                className={cn(/* design-system-escape: px-1.5 padding direcional sem Inset equiv.; py-0 padding direcional sem Inset equiv. */ "text-[10px] px-1.5 py-0 font-mono bg-success/5 border-success/20")}
              >
                {log.numero_processo || `PJE #${log.id_pje}`}
              </Badge>
            ))}
            {inseridos.length > 30 && (
              <Badge variant="secondary" className={cn(/* design-system-escape: px-1.5 padding direcional sem Inset equiv.; py-0 padding direcional sem Inset equiv. */ "text-[10px] px-1.5 py-0")}>
                +{inseridos.length - 30} mais
              </Badge>
            )}
          </div>
        </div>
      )}

      {atualizados.length > 0 && (
        <div>
          <p className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading>; tracking-wider sem token DS */ "text-[10px] font-semibold text-info uppercase tracking-wider mb-2")}>
            Processos atualizados ({atualizados.length})
          </p>
          <div className={cn(/* design-system-escape: space-y-1.5 sem token DS */ "space-y-1.5")}>
            {atualizados.slice(0, 15).map((log, i) => (
              <div
                key={i}
                className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight">; text-xs → migrar para <Text variant="caption">; px-2.5 padding direcional sem Inset equiv.; py-2 padding direcional sem Inset equiv. */ "flex items-start gap-2 text-xs rounded-md bg-info/[0.04] border border-info/10 px-2.5 py-2")}
              >
                <span className="font-mono text-foreground/80 shrink-0">
                  {log.numero_processo || `PJE #${log.id_pje}`}
                </span>
                {log.campos_alterados.length > 0 && (
                  <span className="text-muted-foreground">
                    — {log.campos_alterados.map(formatarCampoAlterado).join(', ')}
                  </span>
                )}
              </div>
            ))}
            {atualizados.length > 15 && (
              <p className="text-[11px] text-muted-foreground">
                +{atualizados.length - 15} registros adicionais
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface CapturaRawLogsProps {
  rawLogs: CapturaRawLog[];
}

export function CapturaRawLogs({ rawLogs }: CapturaRawLogsProps) {
  if (rawLogs.length === 0) {
    return (
      <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight">; p-8 → usar <Inset> */ "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center")}>
        <ScrollText className="h-8 w-8 text-muted-foreground/40" />
        <p className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm"> */ "text-sm text-muted-foreground")}>Nenhum log detalhado disponível para esta captura.</p>
      </div>
    );
  }

  const totalSucesso = rawLogs.filter((l) => l.status === 'success').length;
  const totalErro = rawLogs.filter((l) => l.status === 'error').length;

  return (
    <div className={cn(/* design-system-escape: space-y-4 → migrar para <Stack gap="default"> */ "space-y-4")}>
      {/* Resumo geral */}
      <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex flex-wrap gap-2 items-center")}>
        <Badge variant="outline" className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption"> */ "text-xs")}>
          {rawLogs.length} registro{rawLogs.length !== 1 ? 's' : ''}
        </Badge>
        {totalSucesso > 0 && (
          <Badge
            variant="outline"
            className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption">; gap-1 gap sem token DS */ "text-xs gap-1 border-success/30 bg-success/5 text-success")}
          >
            <CheckCircle2 className="h-3 w-3" />
            {totalSucesso} com sucesso
          </Badge>
        )}
        {totalErro > 0 && (
          <Badge
            variant="outline"
            className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption">; gap-1 gap sem token DS */ "text-xs gap-1 border-destructive/30 bg-destructive/5 text-destructive")}
          >
            <XCircle className="h-3 w-3" />
            {totalErro} com erro{totalErro !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Logs por tribunal/grau */}
      <Accordion type="multiple" className={cn(/* design-system-escape: space-y-2 → migrar para <Stack gap="tight"> */ "space-y-2")}>
        {rawLogs.map((rawLog) => {
          const logs = (rawLog.logs ?? []) as LogEntry[];
          const stats = calcularEstatisticas(logs);
          const isError = rawLog.status === 'error';

          const resumo: string[] = [];
          if (stats.inseridos > 0) resumo.push(`${stats.inseridos} inserido${stats.inseridos !== 1 ? 's' : ''}`);
          if (stats.atualizados > 0) resumo.push(`${stats.atualizados} atualizado${stats.atualizados !== 1 ? 's' : ''}`);
          if (stats.naoAtualizados > 0) resumo.push(`${stats.naoAtualizados} sem alteração`);
          if (stats.erros > 0) resumo.push(`${stats.erros} erro${stats.erros !== 1 ? 's' : ''}`);

          return (
            <AccordionItem
              key={rawLog.raw_log_id}
              value={rawLog.raw_log_id}
              className={cn(/* design-system-escape: px-4 padding direcional sem Inset equiv. */ "rounded-lg border px-4 cursor-pointer hover:border-border/80 transition-colors duration-150")}
            >
              <AccordionTrigger className={cn(/* design-system-escape: py-3 padding direcional sem Inset equiv. */ "py-3 hover:no-underline")}>
                <div className={cn(/* design-system-escape: gap-2.5 gap sem token DS; text-sm → migrar para <Text variant="body-sm"> */ "flex flex-1 items-center gap-2.5 text-sm min-w-0")}>
                  {isError ? (
                    <XCircle className="h-4 w-4 text-destructive shrink-0" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                  )}
                  <span className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading> */ "font-semibold shrink-0")}>{rawLog.trt}</span>
                  <Badge variant="secondary" className={cn(/* design-system-escape: px-1.5 padding direcional sem Inset equiv.; py-0 padding direcional sem Inset equiv. */ "text-[10px] px-1.5 py-0 font-normal shrink-0")}>
                    {formatarGrau(rawLog.grau)}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn(/* design-system-escape: px-1.5 padding direcional sem Inset equiv.; py-0 padding direcional sem Inset equiv. */ "text-[10px] px-1.5 py-0 font-normal shrink-0 hidden sm:inline-flex")}
                  >
                    {formatarTipoCaptura(rawLog.tipo_captura)}
                  </Badge>
                  {resumo.length > 0 && !isError && (
                    <span className={cn(/* design-system-escape: pl-2 padding direcional sem Inset equiv. */ "ml-auto text-[11px] text-muted-foreground hidden sm:inline shrink-0 pl-2")}>
                      {resumo.join(' · ')}
                    </span>
                  )}
                  {isError && rawLog.erro && (
                    <span className={cn(/* design-system-escape: pl-2 padding direcional sem Inset equiv. */ "ml-auto text-[11px] text-destructive hidden sm:inline truncate max-w-[200px] pl-2")}>
                      {rawLog.erro.length > 60 ? `${rawLog.erro.slice(0, 60)}…` : rawLog.erro}
                    </span>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className={cn(/* design-system-escape: space-y-3 sem token DS; pb-3 padding direcional sem Inset equiv. */ "space-y-3 pb-3")}>
                  {/* Erro principal do raw log */}
                  {rawLog.erro && (
                    <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight">; p-3 → usar <Inset>; text-xs → migrar para <Text variant="caption"> */ "flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/[0.06] p-3 text-xs")}>
                      <XCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                      <p className={cn(/* design-system-escape: leading-relaxed sem token DS */ "text-foreground leading-relaxed")}>{rawLog.erro}</p>
                    </div>
                  )}

                  {/* Estatísticas dos LogEntries */}
                  {logs.length > 0 && (
                    <>
                      <LogStats logs={logs} />
                      <LogEntries logs={logs} />
                    </>
                  )}

                  {/* Metadados */}
                  <div className={cn(/* design-system-escape: pt-2.5 padding direcional sem Inset equiv. */ "flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground pt-2.5 border-t")}>
                    <span>
                      Credencial <span className="font-mono">#{rawLog.credencial_id}</span>
                    </span>
                    <span>Registrado em {new Date(rawLog.criado_em).toLocaleString('pt-BR')}</span>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
