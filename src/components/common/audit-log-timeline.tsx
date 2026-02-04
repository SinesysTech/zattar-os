import React from 'react';
import { LogAlteracao } from '@/features/audit/services/audit-log.service';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AuditLogTimelineProps {
  logs: LogAlteracao[];
  isLoading?: boolean;
  className?: string;
}

export function AuditLogTimeline({ logs, isLoading, className }: AuditLogTimelineProps) {
  if (isLoading) {
    return <div className="p-4 text-center text-muted-foreground">Carregando histórico...</div>;
  }

  if (!logs || logs.length === 0) {
    return <div className="p-4 text-center text-muted-foreground">Nenhum registro de alteração encontrado.</div>;
  }

  return (
    <ScrollArea className={cn("h-full pr-4", className)}>
      <div className="relative border-l border-muted ml-4 space-y-8 py-4">
        {logs.map((log) => (
          <div key={log.id} className="relative pl-6">
            {/* Dot on the timeline */}
            <div className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />

            <div className="flex flex-col gap-2">
              {/* Header: User and Date */}
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-foreground">
                  {log.usuario?.nome || 'Sistema/Desconhecido'}
                </span>
                <span className="text-muted-foreground">
                  {format(new Date(log.created_at), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>

              {/* Event Content */}
              <div className="text-sm">
                <LogEventContent log={log} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

interface LogBaixaExpediente {
  protocolo_id?: string;
  justificativa_baixa?: string;
  baixado_em?: string;
}

interface LogAlteracaoManualChanges {
  [key: string]: {
    old: unknown;
    new: unknown;
  };
}

interface LogAlteracaoManual {
  changes: LogAlteracaoManualChanges;
}

function LogEventContent({ log }: { log: LogAlteracao }) {
  if (log.tipo_evento === 'atribuicao_responsavel') {
    return (
      <div className="text-muted-foreground">
        Atribuiu o processo para <span className="font-medium text-foreground">{log.responsavel_novo?.nome || 'Ninguém'}</span>
        {log.responsavel_anterior && (
          <> (anteriormente: {log.responsavel_anterior.nome})</>
        )}
      </div>
    );
  }

  if (log.tipo_evento === 'transferencia_responsavel') {
    return (
      <div className="text-muted-foreground">
        Transferiu a responsabilidade de <span className="font-medium">{log.responsavel_anterior?.nome}</span> para <span className="font-medium text-foreground">{log.responsavel_novo?.nome}</span>
      </div>
    );
  }

  if (log.tipo_evento === 'desatribuicao_responsavel') {
    return (
      <div className="text-muted-foreground">
        Removeu <span className="font-medium">{log.responsavel_anterior?.nome}</span> da responsabilidade.
      </div>
    )
  }

  if (log.tipo_evento === 'baixa_expediente') {
    const dados = log.dados_evento as LogBaixaExpediente;
    return (
      <div className="space-y-1">
        <div className="font-medium text-foreground">Baixou o expediente</div>
        {dados.protocolo_id && (
          <div className="text-xs text-muted-foreground">Protocolo: {dados.protocolo_id}</div>
        )}
        {dados.justificativa_baixa && (
          <div className="text-xs text-muted-foreground">Justificativa: {dados.justificativa_baixa}</div>
        )}
      </div>
    );
  }

  if (log.tipo_evento === 'reversao_baixa_expediente') {
    return (
      <div className="font-medium text-foreground">Reverteu a baixa do expediente</div>
    )
  }

  if (log.tipo_evento === 'alteracao_manual') {
    const dados = log.dados_evento as unknown as LogAlteracaoManual;
    const changes = dados?.changes || {};

    return (
      <div className="space-y-2">
        <div className="font-medium text-foreground">Alterou os seguintes campos:</div>
        <div className="grid gap-2 text-xs">
          {Object.entries(changes).map(([field, diff]) => (
            <div key={field} className="bg-muted/50 p-2 rounded border">
              <div className="font-semibold mb-1 capitalize text-muted-foreground">{formatFieldName(field)}</div>
              <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-center">
                <div className="bg-red-500/10 text-red-700 dark:text-red-400 px-1 rounded line-through truncate" title={String(diff.old)}>
                  {formatValue(diff.old)}
                </div>
                <div className="text-muted-foreground">➜</div>
                <div className="bg-green-500/10 text-green-700 dark:text-green-400 px-1 rounded truncate" title={String(diff.new)}>
                  {formatValue(diff.new)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return <div className="text-muted-foreground">Evento: {log.tipo_evento}</div>;
}

function formatFieldName(field: string): string {
  const map: Record<string, string> = {
    data_inicio: 'Data Início',
    data_fim: 'Data Fim',
    status: 'Status',
    observacoes: 'Observações',
    modalidade: 'Modalidade',
    link_audiencia: 'Link',
    sala: 'Sala',
    // ... add more mappings as needed
  };
  return map[field] || field.replace(/_/g, ' ');
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return 'Vazio';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  // Check if it looks like a date
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    try {
      // Simple check to differentiate date-only vs datetime might be hard without more context,
      // but let's try to format nicely if valid
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        // return format(d, "dd/MM/yyyy HH:mm", { locale: ptBR });
        // Keeping the raw value for now might be safer to avoid timezone confusion unless we are sure about the field type
        // Or just showing a simpler string:
        return value;
      }
    } catch (_e) { }
  }
  return String(value);
}
