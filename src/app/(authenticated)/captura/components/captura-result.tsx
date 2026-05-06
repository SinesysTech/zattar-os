'use client';

import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, Clock, Database, Users, FileText, Layers } from 'lucide-react';
import { Text } from '@/components/ui/typography';

export interface CapturaResultData {
  total?: number;
  processos?: unknown[];
  audiencias?: unknown[];
  persistencia?: {
    total: number;
    atualizados: number;
    erros: number;
    conflitos?: number;
    orgaosJulgadoresCriados?: number;
  };
  dataInicio?: string;
  dataFim?: string;
  filtroPrazo?: string;
  credenciais_processadas?: number;
  message?: string;
  total_processos?: number;
  total_partes?: number;
  clientes?: number;
  partes_contrarias?: number;
  terceiros?: number;
  representantes?: number;
  vinculos?: number;
  erros?: Array<{ processo_id: number; numero_processo: string; erro: string }>;
  duracao_ms?: number;
  timeline?: unknown[];
  totalItens?: number;
  totalDocumentos?: number;
  totalMovimentos?: number;
  documentosBaixados?: Array<{
    detalhes: unknown;
    pdfTamanho?: number;
    erro?: string;
  }>;
  totalBaixadosSucesso?: number;
  totalErros?: number;
  mongoId?: string;
}

interface CapturaResultProps {
  success: boolean | null;
  error?: string;
  data?: CapturaResultData;
  captureId?: number | null;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  variant?: 'default' | 'success' | 'warning' | 'info';
}

function StatCard({ icon, label, value, variant = 'default' }: StatCardProps) {
  const variants = {
    default: 'bg-muted/40 border-border',
    success: 'bg-success/5 border-success/20',
    warning: 'bg-warning/5 border-warning/20',
    info: 'bg-info/5 border-info/20',
  };

  return (
    <div className={`flex items-center gap-2.5 rounded-lg border p-2.5 ${variants[variant]}`}>
      <div className="text-muted-foreground shrink-0">{icon}</div>
      <div>
        <p className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading>; tracking-wider sem token DS */ "text-[10px] font-medium text-muted-foreground uppercase tracking-wider")}>{label}</p>
        <p className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading> */ "text-body-sm font-semibold tabular-nums")}>{value}</p>
      </div>
    </div>
  );
}

export function CapturaResult({ success, error, data, captureId }: CapturaResultProps) {
  if (success === null) return null;

  if (!success) {
    return (
      <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/6 inset-card-compact")}>
        <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
        <div>
          <p className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading> */ "text-body-sm font-semibold text-destructive")}>Erro na Captura</p>
          <Text variant="caption" className="mt-1">{error || 'Erro desconhecido'}</Text>
        </div>
      </div>
    );
  }

  const isAsync = data?.message?.includes('background') || data?.credenciais_processadas !== undefined;

  const hasProcessStats =
    data?.persistencia ||
    data?.total !== undefined ||
    data?.total_processos !== undefined ||
    data?.totalItens !== undefined;

  const hasParteStats =
    data?.total_partes !== undefined ||
    data?.clientes !== undefined ||
    data?.representantes !== undefined;

  const hasTimelineStats =
    data?.totalDocumentos !== undefined ||
    data?.totalMovimentos !== undefined;

  const hasPeriodo = data?.dataInicio && data?.dataFim;

  return (
    <div className={cn("stack-default")}>
      {/* Banner de status */}
      <div className={`flex items-start gap-3 rounded-lg border p-4 ${
        isAsync
          ? 'border-info/30 bg-info/6'
          : 'border-success/30 bg-success/6'
      }`}>
        <CheckCircle2 className={`h-4 w-4 shrink-0 mt-0.5 ${isAsync ? 'text-info' : 'text-success'}`} />
        <div>
          <p className={`text-sm font-semibold ${isAsync ? 'text-info' : 'text-success'}`}>
            {isAsync ? 'Captura iniciada em segundo plano' : 'Captura concluída com sucesso'}
          </p>
          {isAsync && (
            <Text variant="caption" className="mt-1">
              {data?.message || 'Os dados estão sendo processados. Consulte o histórico para acompanhar o progresso.'}
            </Text>
          )}
          {isAsync && captureId && (
            <Text variant="caption" className="mt-0.5">
              ID da captura: <span className="font-mono">#{captureId}</span>
            </Text>
          )}
        </div>
      </div>

      {/* Grade de métricas — processos */}
      {hasProcessStats && (
        <div className={cn("grid grid-cols-2 inline-tight sm:grid-cols-3 lg:grid-cols-4")}>
          {data?.total !== undefined && (
            <StatCard
              icon={<Database className="h-4 w-4" />}
              label="Total capturado"
              value={data.total}
              variant="info"
            />
          )}
          {data?.total_processos !== undefined && (
            <StatCard
              icon={<Database className="h-4 w-4" />}
              label="Processos"
              value={data.total_processos}
              variant="info"
            />
          )}
          {data?.totalItens !== undefined && (
            <StatCard
              icon={<Layers className="h-4 w-4" />}
              label="Itens processados"
              value={data.totalItens}
              variant="info"
            />
          )}
          {data?.credenciais_processadas !== undefined && (
            <StatCard
              icon={<Users className="h-4 w-4" />}
              label="Credenciais"
              value={data.credenciais_processadas}
            />
          )}
          {data?.persistencia && (
            <>
              <StatCard
                icon={<Database className="h-4 w-4" />}
                label="Persistidos"
                value={data.persistencia.total}
                variant="success"
              />
              <StatCard
                icon={<FileText className="h-4 w-4" />}
                label="Atualizados"
                value={data.persistencia.atualizados}
                variant="info"
              />
              {data.persistencia.conflitos !== undefined && data.persistencia.conflitos > 0 && (
                <StatCard
                  icon={<XCircle className="h-4 w-4" />}
                  label="Conflitos OCC"
                  value={data.persistencia.conflitos}
                  variant="warning"
                />
              )}
              {data.persistencia.erros > 0 && (
                <StatCard
                  icon={<XCircle className="h-4 w-4" />}
                  label="Erros"
                  value={data.persistencia.erros}
                  variant="warning"
                />
              )}
              {data.persistencia.orgaosJulgadoresCriados !== undefined && (
                <StatCard
                  icon={<Layers className="h-4 w-4" />}
                  label="Órgãos julgadores criados"
                  value={data.persistencia.orgaosJulgadoresCriados}
                />
              )}
            </>
          )}
        </div>
      )}

      {/* Grade de métricas — partes */}
      {hasParteStats && (
        <div className={cn("grid grid-cols-2 inline-tight sm:grid-cols-3 lg:grid-cols-4")}>
          {data?.total_partes !== undefined && (
            <StatCard icon={<Users className="h-4 w-4" />} label="Total de partes" value={data.total_partes} variant="info" />
          )}
          {data?.clientes !== undefined && (
            <StatCard icon={<Users className="h-4 w-4" />} label="Clientes" value={data.clientes} variant="success" />
          )}
          {data?.partes_contrarias !== undefined && (
            <StatCard icon={<Users className="h-4 w-4" />} label="Partes contrárias" value={data.partes_contrarias} />
          )}
          {data?.terceiros !== undefined && (
            <StatCard icon={<Users className="h-4 w-4" />} label="Terceiros" value={data.terceiros} />
          )}
          {data?.representantes !== undefined && (
            <StatCard icon={<Users className="h-4 w-4" />} label="Representantes" value={data.representantes} />
          )}
          {data?.vinculos !== undefined && (
            <StatCard icon={<Layers className="h-4 w-4" />} label="Vínculos criados" value={data.vinculos} variant="success" />
          )}
        </div>
      )}

      {/* Grade de métricas — timeline/documentos */}
      {hasTimelineStats && (
        <div className={cn("grid grid-cols-2 inline-tight sm:grid-cols-3 lg:grid-cols-4")}>
          {data?.totalDocumentos !== undefined && (
            <StatCard icon={<FileText className="h-4 w-4" />} label="Documentos" value={data.totalDocumentos} variant="info" />
          )}
          {data?.totalMovimentos !== undefined && (
            <StatCard icon={<Layers className="h-4 w-4" />} label="Movimentos" value={data.totalMovimentos} />
          )}
          {data?.totalBaixadosSucesso !== undefined && (
            <StatCard icon={<FileText className="h-4 w-4" />} label="Baixados" value={data.totalBaixadosSucesso} variant="success" />
          )}
          {data?.totalErros !== undefined && data.totalErros > 0 && (
            <StatCard icon={<XCircle className="h-4 w-4" />} label="Erros de download" value={data.totalErros} variant="warning" />
          )}
        </div>
      )}

      {/* Período de referência */}
      {hasPeriodo && (
        <div className={cn(/* design-system-escape: px-3 padding direcional sem Inset equiv.; py-2.5 padding direcional sem Inset equiv. */ "flex items-center inline-tight rounded-lg border bg-muted/30 px-3 py-2.5")}>
          <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <Text variant="caption">
            Período: {new Date(data!.dataInicio!).toLocaleDateString('pt-BR')} até{' '}
            {new Date(data!.dataFim!).toLocaleDateString('pt-BR')}
            {data?.filtroPrazo && (
              <span className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "ml-1.5 font-medium")}>
                ({data.filtroPrazo === 'no_prazo' ? 'No Prazo' : 'Sem Prazo'})
              </span>
            )}
          </Text>
        </div>
      )}

      {/* Erros de processos específicos */}
      {data?.erros && data.erros.length > 0 && (
        <div>
          <p className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading>; tracking-wider sem token DS */ "text-[10px] font-semibold text-destructive uppercase tracking-wider mb-2")}>
            Erros em processos ({data.erros.length})
          </p>
          <div className={cn(/* design-system-escape: space-y-1.5 sem token DS */ "space-y-1.5")}>
            {data.erros.slice(0, 5).map((e, i) => (
              <div key={i} className={cn(/* design-system-escape: p-2.5 → usar <Inset> */ "flex items-start inline-tight rounded-lg border border-destructive/30 bg-destructive/6 p-2.5 text-caption")}>
                <XCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <span className="font-mono text-foreground/80">{e.numero_processo}</span>
                  <span className="text-muted-foreground ml-1.5">— {e.erro}</span>
                </div>
              </div>
            ))}
            {data.erros.length > 5 && (
              <p className="text-[11px] text-muted-foreground">+{data.erros.length - 5} erros adicionais nos logs detalhados</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
