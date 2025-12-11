'use client';

/**
 * Página de Detalhes da Obrigação
 * Visualiza informações completas de uma obrigação financeira
 */

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Typography } from '@/components/ui/typography';
import {
  ArrowLeft,
  RefreshCw,
  Link as LinkIcon,
  ExternalLink,
  User,
  FileText,
  Calendar,
  DollarSign,
  CheckCircle,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useObrigacoes } from '@/features/financeiro';
import type {
  TipoObrigacao,
  StatusObrigacao,
} from '@/features/financeiro/types/obrigacoes.types';
import { RepasseTracking } from '../components/repasse-tracking';

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

// Helper para obter classes CSS do Badge baseado no tone
const getBadgeClasses = (tone: BadgeTone): string => {
  const toneClasses: Record<BadgeTone, string> = {
    primary: 'bg-primary/10 text-primary border-primary/20',
    neutral: 'bg-muted text-muted-foreground border-border',
    info: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
    success: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
    warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    danger: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
    muted: 'bg-muted/50 text-muted-foreground border-border',
  };
  return toneClasses[tone] || toneClasses.neutral;
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
        <div className="shrink-0 mt-0.5 text-muted-foreground">{icon}</div>
      )}
      <div className="flex-1 min-w-0">
        <Typography.Small className="text-muted-foreground">{label}</Typography.Small>
        <Typography.P className="font-medium mt-0.5">{value || '-'}</Typography.P>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography.H4 className="mb-4 uppercase tracking-wider text-muted-foreground">
      {children}
    </Typography.H4>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function ObrigacaoDetalhesPage() {
  const router = useRouter();
  const params = useParams();
  const obrigacaoId = params.id as string;

  // Decodificar ID da obrigação (formato: tipoEntidade_entidadeId)
  const [tipoEntidade, entidadeId] = obrigacaoId.includes('_')
    ? obrigacaoId.split('_')
    : ['parcela', obrigacaoId];

  // Buscar obrigações para encontrar a específica
  const { obrigacoes, isLoading, error } = useObrigacoes({
    limite: 1000, // Buscar muitas para encontrar a específica
  });

  // Encontrar a obrigação específica
  const obrigacao = React.useMemo(() => {
    if (!obrigacoes || obrigacoes.length === 0) return null;

    return obrigacoes.find(
      (o) =>
        o.tipoEntidade === tipoEntidade &&
        (tipoEntidade === 'parcela'
          ? o.parcelaId?.toString() === entidadeId
          : o.id === obrigacaoId)
    ) || null;
  }, [obrigacoes, tipoEntidade, entidadeId, obrigacaoId]) as typeof obrigacoes[0] | null;

  const handleVoltar = () => {
    router.push('/financeiro/obrigacoes');
  };

  const handleSincronizar = async () => {
    if (!obrigacao) return;
    // Implementar sincronização
    console.log('Sincronizar obrigação:', obrigacao.id);
  };

  const handleVerLancamento = () => {
    if (!obrigacao || !obrigacao.lancamentoId) return;
    router.push(`/financeiro/lancamentos/${obrigacao.lancamentoId}`);
  };

  // Loading
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Erro ou não encontrado
  if (error || !obrigacao) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleVoltar}
          className="rounded-full bg-background"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
          <Typography.P className="font-semibold">Erro ao carregar obrigação</Typography.P>
          <Typography.P>{error || 'Obrigação não encontrada'}</Typography.P>
        </div>
      </div>
    );
  }

  const tipoConfig = TIPO_CONFIG[obrigacao.tipo];
  const statusConfig = STATUS_CONFIG[obrigacao.status];

  const podeVerLancamento = obrigacao.lancamentoId !== null;
  const podeSincronizar =
    obrigacao.tipoEntidade === 'parcela' &&
    (obrigacao.statusSincronizacao === 'pendente' ||
      obrigacao.statusSincronizacao === 'inconsistente');

  return (
    <div className="space-y-6">
      {/* Header com botão voltar e status */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleVoltar}
          className="rounded-full bg-background h-10 w-10"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Badge variant="outline" className={cn('text-sm', getBadgeClasses(statusConfig.tone))}>
          {statusConfig.label}
        </Badge>
      </div>

      {/* Card único com todas as informações */}
      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Processo e Cliente - Primeira seção */}
          {(obrigacao.processo || obrigacao.cliente) && (
            <>
              <div className="space-y-4">
                {/* Processo */}
                {obrigacao.processo && (
                  <div>
                    <SectionTitle>Processo</SectionTitle>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InfoRow
                        label="Número do Processo"
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
                  </div>
                )}

                {/* Cliente */}
                {obrigacao.cliente && (
                  <>
                    {obrigacao.processo && <Separator />}
                    <div>
                      <SectionTitle>Cliente</SectionTitle>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    </div>
                  </>
                )}
              </div>
              <Separator />
            </>
          )}

          {/* Informações Gerais */}
          <div>
            <SectionTitle>Informações Gerais</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoRow
                label="Tipo"
                value={tipoConfig.label}
                icon={<FileText className="h-4 w-4" />}
              />
              <InfoRow
                label="Descrição"
                value={obrigacao.descricao}
              />
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
                label="Data de Vencimento"
                value={formatarDataCurta(obrigacao.dataVencimento)}
                icon={<Calendar className="h-4 w-4" />}
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

          <Separator />

          {/* Valores */}
          <div>
            <SectionTitle>Valores</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg bg-muted/50">
              <div>
                <Typography.Small className="text-muted-foreground">Valor</Typography.Small>
                <Typography.H3 className="mt-1">{formatarValor(obrigacao.valor)}</Typography.H3>
              </div>
              <div>
                <Typography.Small className="text-muted-foreground">Dias até Vencimento</Typography.Small>
                <Typography.H3
                  className={cn(
                    'mt-1',
                    obrigacao.status === 'vencida' && 'text-destructive'
                  )}
                >
                  {obrigacao.diasAteVencimento !== null
                    ? obrigacao.diasAteVencimento === 0
                      ? 'Vence hoje'
                      : obrigacao.diasAteVencimento > 0
                        ? `Em ${obrigacao.diasAteVencimento} dia${obrigacao.diasAteVencimento > 1 ? 's' : ''}`
                        : `Vencido há ${Math.abs(obrigacao.diasAteVencimento)} dia${Math.abs(obrigacao.diasAteVencimento) > 1 ? 's' : ''}`
                    : '-'}
                </Typography.H3>
              </div>
            </div>
          </div>

          {/* Acordo */}
          {obrigacao.acordo && (
            <>
              <Separator />
              <div>
                <SectionTitle>Acordo</SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {/* Tracking de Repasse (apenas para recebimentos com cliente) */}
          {obrigacao.tipo === 'acordo_recebimento' && obrigacao.parcela && (
            <>
              <Separator />
              <div className="mb-6">
                <RepasseTracking
                  parcela={obrigacao.parcela as any} // Cast because of type mismatch between Core and Backend types, but fields match now
                  onRegistrarDeclaracao={() => {
                    // TODO: Implement dialog or action call
                    console.log('Registrar declaração');
                  }}
                  onRegistrarComprovante={() => {
                    // TODO: Implement dialog or action call
                    console.log('Registrar comprovante');
                  }}
                />
              </div>
            </>
          )}

          {/* Parcela */}
          {obrigacao.parcela && (
            <>
              <Separator />
              <div>
                <SectionTitle>Parcela</SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                onClick={handleVerLancamento}
              >
                <LinkIcon className="mr-2 h-4 w-4" />
                Ver Lançamento Financeiro
                <ExternalLink className="ml-2 h-3 w-3" />
              </Button>
            )}
            {podeSincronizar && (
              <Button variant="outline" onClick={handleSincronizar}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sincronizar
              </Button>
            )}
            {obrigacao.acordoId && (
              <Button
                variant="outline"
                onClick={() => {
                  router.push(`/acordos-condenacoes/${obrigacao.acordoId}`);
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
                  router.push(`/acervo/${obrigacao.processoId}`);
                }}
              >
                <FileText className="mr-2 h-4 w-4" />
                Ver Processo
                <ExternalLink className="ml-2 h-3 w-3" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
