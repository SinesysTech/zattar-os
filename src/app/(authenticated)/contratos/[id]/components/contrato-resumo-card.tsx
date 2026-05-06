'use client';

import { FORMAT } from '@/lib/design-system';

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
      <div className={cn("flex flex-col stack-loose")}>
        {/* Estatisticas */}
        <div className={cn("grid grid-cols-3 inline-tight")}>
          <GlassPanel depth={2} className={cn("px-3 py-3 text-center")}>
            <p className={cn( "font-display text-body-lg font-bold tabular-nums")}>{stats.totalPartes}</p>
            <Text variant="meta-label">Partes</Text>
          </GlassPanel>
          <GlassPanel depth={2} className={cn("px-3 py-3 text-center")}>
            <p className={cn( "font-display text-body-lg font-bold tabular-nums")}>{stats.totalProcessos}</p>
            <Text variant="meta-label">Processos</Text>
          </GlassPanel>
          <GlassPanel depth={2} className={cn("px-3 py-3 text-center")}>
            <p className={cn( "font-display text-body-lg font-bold tabular-nums")}>{stats.totalDocumentos}</p>
            <Text variant="meta-label">Documentos</Text>
          </GlassPanel>
        </div>

        {/* Contato do cliente */}
        {hasContactInfo && (
          <div className="flex flex-col gap-y-3">
            {cliente?.cpfCnpj && (
              <div className={cn("flex items-center inline-medium text-body-sm")}>
                <Hash className="text-muted-foreground size-4 shrink-0" />
                <span>
                  <span className="text-muted-foreground">{cliente.tipoPessoa === 'pf' ? 'CPF' : 'CNPJ'}:</span>{' '}
                  {cliente.cpfCnpj}
                </span>
              </div>
            )}
            {email && (
              <div className={cn("flex items-center inline-medium text-body-sm")}>
                <Mail className="text-muted-foreground size-4 shrink-0" />
                <span className="truncate">{email}</span>
              </div>
            )}
            {telefone && (
              <div className={cn("flex items-center inline-medium text-body-sm")}>
                <PhoneCall className="text-muted-foreground size-4 shrink-0" />
                {telefone}
              </div>
            )}
            {localizacao && (
              <div className={cn("flex items-center inline-medium text-body-sm")}>
                <MapPin className="text-muted-foreground size-4 shrink-0" />
                {localizacao}
              </div>
            )}
          </div>
        )}

        {/* Lancamentos */}
        {stats.totalLancamentos > 0 && (
          <div className={cn("flex items-center inline-medium text-body-sm")}>
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
