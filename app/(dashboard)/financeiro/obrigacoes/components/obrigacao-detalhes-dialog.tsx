'use client';

/**
 * Dialog de Detalhes de Obrigação
 * Exibe informações completas de uma obrigação financeira
 */

import * as React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  RefreshCw,
  Link as LinkIcon,
  ExternalLink,
  User,
  FileText,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  ObrigacaoComDetalhes,
  TipoObrigacao,
  StatusObrigacao,
  StatusSincronizacao,
} from '@/backend/types/financeiro/obrigacoes.types';

// ============================================================================
// Types
// ============================================================================

interface ObrigacaoDetalhesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  obrigacao: ObrigacaoComDetalhes | null;
  onSincronizar: (obrigacao: ObrigacaoComDetalhes) => void;
  onVerLancamento: (obrigacao: ObrigacaoComDetalhes) => void;
}

// ============================================================================
// Constantes
// ============================================================================

type BadgeTone = 'primary' | 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'muted';

const TIPO_CONFIG: Record<TipoObrigacao, { label: string; tone: BadgeTone }> = {
  acordo_recebimento: { label: 'Acordo - Recebimento', tone: 'success' },
  acordo_pagamento: { label: 'Acordo - Pagamento', tone: 'danger' },
  conta_receber: { label: 'Conta a Receber', tone: 'info' },
  conta_pagar: { label: 'Conta a Pagar', tone: 'warning' },
};

const STATUS_CONFIG: Record<StatusObrigacao, { label: string; tone: BadgeTone }> = {
  pendente: { label: 'Pendente', tone: 'warning' },
  vencida: { label: 'Vencida', tone: 'danger' },
  efetivada: { label: 'Efetivada', tone: 'success' },
  cancelada: { label: 'Cancelada', tone: 'neutral' },
  estornada: { label: 'Estornada', tone: 'muted' },
};

const SINCRONIZACAO_CONFIG: Record<StatusSincronizacao, { label: string; icon: React.ReactNode; className: string }> = {
  sincronizado: { label: 'Sincronizado', icon: <CheckCircle className="h-4 w-4" />, className: 'text-green-600' },
  pendente: { label: 'Pendente', icon: <Clock className="h-4 w-4" />, className: 'text-amber-600' },
  inconsistente: { label: 'Inconsistente', icon: <AlertCircle className="h-4 w-4" />, className: 'text-red-600' },
  nao_aplicavel: { label: 'N/A', icon: null, className: 'text-muted-foreground' },
};

// ============================================================================
// Helpers
// ============================================================================

const formatarValor = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
};

const formatarData = (data: string | null | undefined): string => {
  if (!data) return '-';
  return format(new Date(data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
};

const formatarDataCurta = (data: string | null | undefined): string => {
  if (!data) return '-';
  return format(new Date(data), 'dd/MM/yyyy', { locale: ptBR });
};

// ============================================================================
// Sub-components
// ============================================================================

interface InfoRowProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}

function InfoRow({ label, value, icon }: InfoRowProps) {
  return (
    <div className="flex items-start gap-3 py-2">
      {icon && (
        <div className="flex-shrink-0 mt-0.5 text-muted-foreground">{icon}</div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value || '-'}</p>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
      {children}
    </h4>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ObrigacaoDetalhesDialog({
  open,
  onOpenChange,
  obrigacao,
  onSincronizar,
  onVerLancamento,
}: ObrigacaoDetalhesDialogProps) {
  if (!obrigacao) {
    return null;
  }

  const tipoConfig = TIPO_CONFIG[obrigacao.tipo];
  const statusConfig = STATUS_CONFIG[obrigacao.status];
  const sincConfig = SINCRONIZACAO_CONFIG[obrigacao.statusSincronizacao];

  const podeVerLancamento = obrigacao.lancamentoId !== null;
  const podeSincronizar =
    obrigacao.tipoEntidade === 'parcela' &&
    (obrigacao.statusSincronizacao === 'pendente' ||
      obrigacao.statusSincronizacao === 'inconsistente');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>{obrigacao.descricao}</span>
          </DialogTitle>
          <DialogDescription>
            Detalhes completos da obrigação financeira
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Badges de status */}
          <div className="flex flex-wrap gap-2">
            <Badge tone={tipoConfig.tone} variant="soft">
              {tipoConfig.label}
            </Badge>
            <Badge tone={statusConfig.tone} variant="soft">
              {statusConfig.label}
            </Badge>
            <div className={cn('flex items-center gap-1 text-sm', sincConfig.className)}>
              {sincConfig.icon}
              <span>{sincConfig.label}</span>
            </div>
          </div>

          {/* Valores */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/50">
            <div>
              <p className="text-xs text-muted-foreground">Valor</p>
              <p className="text-2xl font-bold">{formatarValor(obrigacao.valor)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Vencimento</p>
              <p
                className={cn(
                  'text-2xl font-bold',
                  obrigacao.status === 'vencida' && 'text-destructive'
                )}
              >
                {formatarDataCurta(obrigacao.dataVencimento)}
              </p>
              {obrigacao.diasAteVencimento !== null && (
                <p className="text-xs text-muted-foreground">
                  {obrigacao.diasAteVencimento === 0
                    ? 'Vence hoje'
                    : obrigacao.diasAteVencimento > 0
                      ? `Em ${obrigacao.diasAteVencimento} dia${obrigacao.diasAteVencimento > 1 ? 's' : ''}`
                      : `Vencido há ${Math.abs(obrigacao.diasAteVencimento)} dia${Math.abs(obrigacao.diasAteVencimento) > 1 ? 's' : ''}`}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Informações gerais */}
          <div>
            <SectionTitle>Informações Gerais</SectionTitle>
            <div className="grid grid-cols-2 gap-x-4">
              <InfoRow
                label="Data de Lançamento"
                value={formatarData(obrigacao.dataLancamento)}
                icon={<Calendar className="h-4 w-4" />}
              />
              <InfoRow
                label="Data de Efetivação"
                value={formatarData(obrigacao.dataEfetivacao)}
                icon={<CheckCircle className="h-4 w-4" />}
              />
              <InfoRow
                label="Competência"
                value={formatarDataCurta(obrigacao.dataCompetencia)}
                icon={<Calendar className="h-4 w-4" />}
              />
              {obrigacao.percentualHonorarios !== null && (
                <InfoRow
                  label="Honorários"
                  value={`${obrigacao.percentualHonorarios.toFixed(1)}%`}
                  icon={<DollarSign className="h-4 w-4" />}
                />
              )}
            </div>
          </div>

          {/* Cliente */}
          {obrigacao.cliente && (
            <>
              <Separator />
              <div>
                <SectionTitle>Cliente</SectionTitle>
                <InfoRow
                  label="Nome"
                  value={obrigacao.cliente.nome}
                  icon={<User className="h-4 w-4" />}
                />
                {obrigacao.cliente.razaoSocial && (
                  <InfoRow
                    label="Razão Social"
                    value={obrigacao.cliente.razaoSocial}
                    icon={<Building2 className="h-4 w-4" />}
                  />
                )}
                {obrigacao.cliente.cpfCnpj && (
                  <InfoRow label="CPF/CNPJ" value={obrigacao.cliente.cpfCnpj} />
                )}
              </div>
            </>
          )}

          {/* Processo */}
          {obrigacao.processo && (
            <>
              <Separator />
              <div>
                <SectionTitle>Processo</SectionTitle>
                <InfoRow
                  label="Número"
                  value={obrigacao.processo.numeroProcesso}
                  icon={<FileText className="h-4 w-4" />}
                />
                {obrigacao.processo.autor && (
                  <InfoRow label="Autor" value={obrigacao.processo.autor} />
                )}
                {obrigacao.processo.reu && (
                  <InfoRow label="Réu" value={obrigacao.processo.reu} />
                )}
                {obrigacao.processo.vara && (
                  <InfoRow label="Vara" value={obrigacao.processo.vara} />
                )}
                {obrigacao.processo.tribunal && (
                  <InfoRow label="Tribunal" value={obrigacao.processo.tribunal} />
                )}
              </div>
            </>
          )}

          {/* Acordo */}
          {obrigacao.acordo && (
            <>
              <Separator />
              <div>
                <SectionTitle>Acordo</SectionTitle>
                <div className="grid grid-cols-2 gap-x-4">
                  <InfoRow
                    label="Tipo"
                    value={
                      obrigacao.acordo.tipo === 'acordo' ? 'Acordo' : 'Condenação'
                    }
                  />
                  <InfoRow
                    label="Direção"
                    value={
                      obrigacao.acordo.direcao === 'recebimento'
                        ? 'Recebimento'
                        : 'Pagamento'
                    }
                  />
                  <InfoRow
                    label="Valor Total"
                    value={formatarValor(obrigacao.acordo.valorTotal)}
                  />
                  <InfoRow
                    label="Parcelas"
                    value={`${obrigacao.acordo.numeroParcelas} parcela${obrigacao.acordo.numeroParcelas > 1 ? 's' : ''}`}
                  />
                </div>
              </div>
            </>
          )}

          {/* Parcela */}
          {obrigacao.parcela && (
            <>
              <Separator />
              <div>
                <SectionTitle>Parcela</SectionTitle>
                <div className="grid grid-cols-2 gap-x-4">
                  <InfoRow label="Número" value={`#${obrigacao.parcela.numeroParcela}`} />
                  <InfoRow label="Status" value={obrigacao.parcela.status} />
                  <InfoRow
                    label="Valor Principal"
                    value={formatarValor(obrigacao.parcela.valorBrutoCreditoPrincipal)}
                  />
                  {obrigacao.parcela.honorariosContratuais !== null && (
                    <InfoRow
                      label="Hon. Contratuais"
                      value={formatarValor(obrigacao.parcela.honorariosContratuais)}
                    />
                  )}
                  {obrigacao.parcela.formaPagamento && (
                    <InfoRow
                      label="Forma de Pagamento"
                      value={obrigacao.parcela.formaPagamento}
                    />
                  )}
                </div>
              </div>
            </>
          )}

          {/* Lançamento vinculado */}
          {obrigacao.lancamento && (
            <>
              <Separator />
              <div>
                <SectionTitle>Lançamento Financeiro</SectionTitle>
                <div className="grid grid-cols-2 gap-x-4">
                  <InfoRow label="ID" value={`#${obrigacao.lancamento.id}`} />
                  <InfoRow
                    label="Tipo"
                    value={obrigacao.lancamento.tipo === 'receita' ? 'Receita' : 'Despesa'}
                  />
                  <InfoRow label="Status" value={obrigacao.lancamento.status} />
                  <InfoRow
                    label="Data"
                    value={formatarDataCurta(obrigacao.lancamento.dataLancamento)}
                  />
                </div>
              </div>
            </>
          )}

          {/* Conta contábil */}
          {obrigacao.contaContabil && (
            <>
              <Separator />
              <div>
                <SectionTitle>Conta Contábil</SectionTitle>
                <InfoRow
                  label="Conta"
                  value={`${obrigacao.contaContabil.codigo} - ${obrigacao.contaContabil.nome}`}
                />
              </div>
            </>
          )}

          {/* Ações */}
          <Separator />
          <div className="flex flex-wrap gap-2">
            {podeVerLancamento && (
              <Button
                variant="outline"
                onClick={() => onVerLancamento(obrigacao)}
              >
                <LinkIcon className="mr-2 h-4 w-4" />
                Ver Lançamento Financeiro
                <ExternalLink className="ml-2 h-3 w-3" />
              </Button>
            )}
            {podeSincronizar && (
              <Button variant="outline" onClick={() => onSincronizar(obrigacao)}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sincronizar
              </Button>
            )}
            {obrigacao.acordoId && (
              <Button
                variant="outline"
                onClick={() => {
                  window.location.href = `/acordos-condenacoes/${obrigacao.acordoId}`;
                }}
              >
                <FileText className="mr-2 h-4 w-4" />
                Ver Acordo
                <ExternalLink className="ml-2 h-3 w-3" />
              </Button>
            )}
            {obrigacao.processoId && (
              <Button
                variant="outline"
                onClick={() => {
                  window.location.href = `/acervo/${obrigacao.processoId}`;
                }}
              >
                <FileText className="mr-2 h-4 w-4" />
                Ver Processo
                <ExternalLink className="ml-2 h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
