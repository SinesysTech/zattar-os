import { FORMAT } from '@/lib/design-system';
'use client';

import { cn } from '@/lib/utils';
import { Mail, MapPin, PhoneCall, FolderOpen, Hash, ClipboardList } from 'lucide-react';

import { GlassPanel, WidgetContainer } from '@/components/shared/glass-panel';
import { Text } from '@/components/ui/typography';

import type {
  Contrato,
  ClienteDetalhado,
  ContratoCompletoStats,
} from '@/app/(authenticated)/contratos';

interface ContratoResumoCardProps {
  contrato: Contrato;
  cliente: ClienteDetalhado | null;
  stats: ContratoCompletoStats;
}

/**
 * Formata telefone considerando casos especiais de dados importados
 * onde o DDI (55) pode estar no campo DDD
 */


function formatEndereco(endereco: ClienteDetalhado['endereco']): string | null {
  if (!endereco) return null;
  const parts: string[] = [];
  if (endereco.municipio) parts.push(endereco.municipio);
  if (endereco.estadoSigla) parts.push(endereco.estadoSigla);
  return parts.length > 0 ? parts.join(', ') : null;
}

export function ContratoResumoCard({
  contrato: _contrato,
  cliente,
  stats,
}: ContratoResumoCardProps) {
  const email = cliente?.emails?.[0] ?? null;
  const telefone = FORMAT.phone(cliente?.dddCelular ?? null, cliente?.numeroCelular ?? null);
  const localizacao = formatEndereco(cliente?.endereco ?? null);

  const hasContactInfo = email || telefone || localizacao || cliente?.cpfCnpj;

  return (
    <WidgetContainer title="Resumo" icon={ClipboardList}>
      <div className={cn(/* design-system-escape: space-y-6 → migrar para <Stack gap="loose"> */ "space-y-6")}>
        {/* Estatisticas */}
        <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "grid grid-cols-3 gap-2")}>
          <GlassPanel depth={2} className={cn(/* design-system-escape: px-3 padding direcional sem Inset equiv.; py-3 padding direcional sem Inset equiv. */ "px-3 py-3 text-center")}>
            <p className={cn(/* design-system-escape: text-lg → migrar para <Text variant="body-lg">; font-bold → className de <Text>/<Heading> */ "font-display text-lg font-bold tabular-nums")}>{stats.totalPartes}</p>
            <Text variant="meta-label">Partes</Text>
          </GlassPanel>
          <GlassPanel depth={2} className={cn(/* design-system-escape: px-3 padding direcional sem Inset equiv.; py-3 padding direcional sem Inset equiv. */ "px-3 py-3 text-center")}>
            <p className={cn(/* design-system-escape: text-lg → migrar para <Text variant="body-lg">; font-bold → className de <Text>/<Heading> */ "font-display text-lg font-bold tabular-nums")}>{stats.totalProcessos}</p>
            <Text variant="meta-label">Processos</Text>
          </GlassPanel>
          <GlassPanel depth={2} className={cn(/* design-system-escape: px-3 padding direcional sem Inset equiv.; py-3 padding direcional sem Inset equiv. */ "px-3 py-3 text-center")}>
            <p className={cn(/* design-system-escape: text-lg → migrar para <Text variant="body-lg">; font-bold → className de <Text>/<Heading> */ "font-display text-lg font-bold tabular-nums")}>{stats.totalDocumentos}</p>
            <Text variant="meta-label">Documentos</Text>
          </GlassPanel>
        </div>

        {/* Contato do cliente */}
        {hasContactInfo && (
          <div className="flex flex-col gap-y-3">
            {cliente?.cpfCnpj && (
              <div className={cn(/* design-system-escape: gap-3 gap sem token DS; text-sm → migrar para <Text variant="body-sm"> */ "flex items-center gap-3 text-sm")}>
                <Hash className="text-muted-foreground size-4 shrink-0" />
                <span>
                  <span className="text-muted-foreground">{cliente.tipoPessoa === 'pf' ? 'CPF' : 'CNPJ'}:</span>{' '}
                  {cliente.cpfCnpj}
                </span>
              </div>
            )}
            {email && (
              <div className={cn(/* design-system-escape: gap-3 gap sem token DS; text-sm → migrar para <Text variant="body-sm"> */ "flex items-center gap-3 text-sm")}>
                <Mail className="text-muted-foreground size-4 shrink-0" />
                <span className="truncate">{email}</span>
              </div>
            )}
            {telefone && (
              <div className={cn(/* design-system-escape: gap-3 gap sem token DS; text-sm → migrar para <Text variant="body-sm"> */ "flex items-center gap-3 text-sm")}>
                <PhoneCall className="text-muted-foreground size-4 shrink-0" />
                {telefone}
              </div>
            )}
            {localizacao && (
              <div className={cn(/* design-system-escape: gap-3 gap sem token DS; text-sm → migrar para <Text variant="body-sm"> */ "flex items-center gap-3 text-sm")}>
                <MapPin className="text-muted-foreground size-4 shrink-0" />
                {localizacao}
              </div>
            )}
          </div>
        )}

        {/* Lancamentos */}
        {stats.totalLancamentos > 0 && (
          <div className={cn(/* design-system-escape: gap-3 gap sem token DS; text-sm → migrar para <Text variant="body-sm"> */ "flex items-center gap-3 text-sm")}>
            <FolderOpen className="text-muted-foreground size-4 shrink-0" />
            <span>
              <span className="text-muted-foreground">Lançamentos:</span> {stats.totalLancamentos}
            </span>
          </div>
        )}
      </div>
    </WidgetContainer>
  );
}
