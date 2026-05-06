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
  FilePlus,
  FileX,
  AlertTriangle,
  GitMerge,
  ScrollText,
  ArrowRight,
} from 'lucide-react';
import type { CapturaRawLog } from '@/app/(authenticated)/captura';
import type {
  LogEntry,
  LogRegistroInserido,
  LogRegistroAtualizado,
  LogErro,
  ValorAlteradoLog,
} from '../services/persistence/capture-log.service';
import {
  formatarGrau,
  formatarTipoCaptura,
  formatarEntidade,
  formatarCampoAlterado,
} from '../utils/format-captura';
import { Text } from '@/components/ui/typography';

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

function formatarValor(valor: unknown): string {
  if (valor === null || valor === undefined) return '—';
  if (typeof valor === 'boolean') return valor ? 'Sim' : 'Não';
  if (typeof valor === 'string') {
    // Datas ISO
    if (/^\d{4}-\d{2}-\d{2}T/.test(valor)) {
      try {
        return new Date(valor).toLocaleString('pt-BR');
      } catch {
        return valor;
      }
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
      try {
        return new Date(valor + 'T00:00:00').toLocaleDateString('pt-BR');
      } catch {
        return valor;
      }
    }
    return valor || '—';
  }
  return String(valor);
}

function ValoresDiff({ valores }: { valores: ValorAlteradoLog[] }) {
  return (
    <div className={cn("mt-2 stack-snug")}>
      {valores.map((v, i) => (
        <div
          key={i}
          className={cn("flex flex-wrap items-start gap-x-2 gap-y-0.5 rounded-md bg-info/4 border border-info/10 px-3 py-2")}
        >
          <span className={cn(/* design-system-escape: min-w arbitrária para alinhar diff lado a lado */ "text-[11px] font-medium text-foreground/70 shrink-0 min-w-30")}>
            {formatarCampoAlterado(v.campo)}
          </span>
          <div className={cn("flex items-center inline-snug flex-wrap")}>
            <span className="text-[11px] text-muted-foreground line-through decoration-muted-foreground/40">
              {formatarValor(v.antes)}
            </span>
            <ArrowRight className="size-3 text-muted-foreground/70 shrink-0" />
            <span className={cn( "text-[11px] font-medium text-foreground/80")}>
              {formatarValor(v.depois)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function LogStats({ logs }: { logs: LogEntry[] }) {
  const stats = calcularEstatisticas(logs);

  return (
    <div className={cn("grid grid-cols-2 inline-tight sm:grid-cols-4")}>
      <div className={cn(/* design-system-escape: p-2.5 → usar <Inset> */ "flex items-center inline-tight-plus rounded-lg border bg-success/5 border-success/20 p-2.5")}>
        <FilePlus className="h-4 w-4 text-success shrink-0" />
        <div>
          <p className={cn("text-overline text-muted-foreground")}>Inseridos</p>
          <p className={cn( "text-body-sm font-semibold tabular-nums")}>{stats.inseridos}</p>
        </div>
      </div>
      <div className={cn(/* design-system-escape: p-2.5 → usar <Inset> */ "flex items-center inline-tight-plus rounded-lg border bg-info/5 border-info/20 p-2.5")}>
        <ArrowRight className="h-4 w-4 text-info shrink-0" />
        <div>
          <p className={cn("text-overline text-muted-foreground")}>Atualizados</p>
          <p className={cn( "text-body-sm font-semibold tabular-nums")}>{stats.atualizados}</p>
        </div>
      </div>
      <div className={cn(/* design-system-escape: p-2.5 → usar <Inset> */ "flex items-center inline-tight-plus rounded-lg border bg-muted/40 p-2.5")}>
        <FileX className="h-4 w-4 text-muted-foreground shrink-0" />
        <div>
          <p className={cn("text-overline text-muted-foreground")}>Sem Alteração</p>
          <p className={cn( "text-body-sm font-semibold tabular-nums")}>{stats.naoAtualizados}</p>
        </div>
      </div>
      <div className={cn(/* design-system-escape: p-2.5 → usar <Inset> */ "flex items-center inline-tight-plus rounded-lg border bg-destructive/5 border-destructive/20 p-2.5")}>
        <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
        <div>
          <p className={cn("text-overline text-muted-foreground")}>Erros</p>
          <p className={cn( "text-body-sm font-semibold tabular-nums")}>{stats.erros}</p>
        </div>
      </div>
      {stats.conflitos > 0 && (
        <div className={cn(/* design-system-escape: p-2.5 → usar <Inset> */ "flex items-center inline-tight-plus rounded-lg border bg-warning/5 border-warning/20 p-2.5 col-span-2 sm:col-span-4")}>
          <GitMerge className="h-4 w-4 text-warning shrink-0" />
          <div>
            <p className={cn("text-overline text-muted-foreground")}>Conflitos de Concorrência</p>
            <p className={cn( "text-body-sm font-semibold tabular-nums")}>{stats.conflitos}</p>
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
    <div className={cn(/* design-system-escape: space-y-4 sem token DS */ "mt-3 space-y-4")}>
      {erros.length > 0 && (
        <div>
          <p className={cn("text-overline text-destructive mb-2")}>
            Erros ({erros.length})
          </p>
          <div className={cn("stack-snug")}>
            {erros.map((log, i) => (
              <div
                key={i}
                className={cn(/* design-system-escape: p-2.5 → usar <Inset> */ "flex items-start inline-tight rounded-lg border border-destructive/30 bg-destructive/6 p-2.5")}
              >
                <XCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                <Text variant="caption" className="min-w-0">
                  <span className={cn( "font-medium text-foreground")}>{formatarEntidade(log.entidade)}</span>
                  <span className="text-muted-foreground ml-1.5">— {log.erro}</span>
                </Text>
              </div>
            ))}
          </div>
        </div>
      )}

      {inseridos.length > 0 && (
        <div>
          <p className={cn("text-overline text-success mb-2")}>
            Processos incluídos ({inseridos.length})
          </p>
          <div className={cn("stack-micro")}>
            {inseridos.slice(0, 30).map((log, i) => (
              <div
                key={i}
                className={cn("flex items-center inline-tight rounded-md bg-success/4 border border-success/15 px-2.5 py-1.5")}
              >
                <CheckCircle2 className="h-3 w-3 text-success shrink-0" />
                <Text variant="caption" className="text-foreground/80">
                  {log.numero_processo || `Processo PJE ${log.id_pje}`}
                </Text>
              </div>
            ))}
            {inseridos.length > 30 && (
              <p className={cn("text-[11px] text-muted-foreground pl-1")}>
                +{inseridos.length - 30} registros adicionais
              </p>
            )}
          </div>
        </div>
      )}

      {atualizados.length > 0 && (
        <div>
          <p className={cn("text-overline text-info mb-2")}>
            Processos atualizados ({atualizados.length})
          </p>
          <div className={cn(/* design-system-escape: space-y-2 sem token DS */ "space-y-2")}>
            {atualizados.slice(0, 15).map((log, i) => (
              <div
                key={i}
                className={cn("rounded-md border border-border/60 bg-muted/20 px-3 py-2.5")}
              >
                <p className={cn( "text-body-sm font-medium text-foreground/90 mb-1")}>
                  {log.numero_processo || `Processo PJE ${log.id_pje}`}
                </p>

                {log.valores_alterados && log.valores_alterados.length > 0 ? (
                  <ValoresDiff valores={log.valores_alterados} />
                ) : log.campos_alterados.length > 0 ? (
                  <p className="text-[11px] text-muted-foreground">
                    Campos alterados: {log.campos_alterados.map(formatarCampoAlterado).join(', ')}
                  </p>
                ) : null}
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
      <div className={cn(/* design-system-escape: p-8 → usar <Inset> */ "flex flex-col items-center justify-center inline-tight rounded-lg border border-dashed p-8 text-center")}>
        <ScrollText className="h-8 w-8 text-muted-foreground/65" />
        <p className={cn("text-body-sm text-muted-foreground")}>Nenhum log detalhado disponível para esta captura.</p>
      </div>
    );
  }

  const totalSucesso = rawLogs.filter((l) => l.status === 'success').length;
  const totalErro = rawLogs.filter((l) => l.status === 'error').length;

  return (
    <div className={cn("stack-default")}>
      {/* Resumo geral */}
      <div className={cn("flex flex-wrap inline-tight items-center")}>
        <Badge variant="outline" className={cn("text-caption")}>
          {rawLogs.length} registro{rawLogs.length !== 1 ? 's' : ''}
        </Badge>
        {totalSucesso > 0 && (
          <Badge
            variant="outline"
            className={cn("text-caption inline-micro border-success/30 bg-success/5 text-success")}
          >
            <CheckCircle2 className="h-3 w-3" />
            {totalSucesso} com sucesso
          </Badge>
        )}
        {totalErro > 0 && (
          <Badge
            variant="outline"
            className={cn("text-caption inline-micro border-destructive/30 bg-destructive/5 text-destructive")}
          >
            <XCircle className="h-3 w-3" />
            {totalErro} com erro{totalErro !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Logs por tribunal/grau */}
      <Accordion type="multiple" className={cn("stack-tight")}>
        {rawLogs.map((rawLog) => {
          const logs = (rawLog.logs ?? []) as LogEntry[];
          const stats = calcularEstatisticas(logs);
          const isError = rawLog.status === 'error';

          const resumo: string[] = [];
          if (stats.inseridos > 0) resumo.push(`${stats.inseridos} incluído${stats.inseridos !== 1 ? 's' : ''}`);
          if (stats.atualizados > 0) resumo.push(`${stats.atualizados} atualizado${stats.atualizados !== 1 ? 's' : ''}`);
          if (stats.naoAtualizados > 0) resumo.push(`${stats.naoAtualizados} sem alteração`);
          if (stats.erros > 0) resumo.push(`${stats.erros} erro${stats.erros !== 1 ? 's' : ''}`);

          return (
            <AccordionItem
              key={rawLog.raw_log_id}
              value={rawLog.raw_log_id}
              className={cn("rounded-lg border px-4 cursor-pointer hover:border-border/80 transition-colors duration-150")}
            >
              <AccordionTrigger className={cn("py-3 hover:no-underline")}>
                <div className={cn("flex flex-1 items-center inline-tight-plus text-sm min-w-0")}>
                  {isError ? (
                    <XCircle className="h-4 w-4 text-destructive shrink-0" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                  )}
                  <span className={cn( "font-semibold shrink-0")}>{rawLog.trt}</span>
                  <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0 font-normal shrink-0")}>
                    {formatarGrau(rawLog.grau)}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn("text-[10px] px-1.5 py-0 font-normal shrink-0 hidden sm:inline-flex")}
                  >
                    {formatarTipoCaptura(rawLog.tipo_captura)}
                  </Badge>
                  {resumo.length > 0 && !isError && (
                    <span className={cn("ml-auto text-[11px] text-muted-foreground hidden sm:inline shrink-0 pl-2")}>
                      {resumo.join(' · ')}
                    </span>
                  )}
                  {isError && rawLog.erro && (
                    <span className={cn("ml-auto text-[11px] text-destructive hidden sm:inline truncate max-w-50 pl-2")}>
                      {rawLog.erro.length > 60 ? `${rawLog.erro.slice(0, 60)}…` : rawLog.erro}
                    </span>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className={cn("stack-medium pb-3")}>
                  {/* Erro principal do raw log */}
                  {rawLog.erro && (
                    <div className={cn(/* design-system-escape: p-3 → usar <Inset> */ "flex items-start inline-tight rounded-lg border border-destructive/30 bg-destructive/6 p-3")}>
                      <XCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                      <p className={cn("text-body-sm text-foreground leading-relaxed")}>{rawLog.erro}</p>
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
                  <div className={cn("flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground pt-2.5 border-t")}>
                    <span>
                      Credencial #{rawLog.credencial_id}
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
