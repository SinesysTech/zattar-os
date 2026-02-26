'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AppBadge } from '@/components/ui/app-badge';
import {
  Clock,
  UserPlus,
  ArrowRightLeft,
  UserMinus,
  RefreshCw,
  MessageSquarePlus,
  Activity,
  Loader2,
} from 'lucide-react';
import { actionBuscarAtividadesUsuario } from '../../actions/audit-atividades-actions';
import type { AtividadeLog } from '../../repository-audit-atividades';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// --- Mapas de configuração por tipo de evento ---

const EVENT_ICONS: Record<string, typeof Clock> = {
  atribuicao_responsavel: UserPlus,
  transferencia_responsavel: ArrowRightLeft,
  desatribuicao_responsavel: UserMinus,
  mudanca_status: RefreshCw,
  observacao_adicionada: MessageSquarePlus,
};

const EVENT_LABELS: Record<string, string> = {
  atribuicao_responsavel: 'Atribuiu responsável',
  transferencia_responsavel: 'Transferiu responsável',
  desatribuicao_responsavel: 'Removeu responsável',
  mudanca_status: 'Alterou status',
  observacao_adicionada: 'Adicionou observação',
};

const EVENT_COLORS: Record<string, string> = {
  atribuicao_responsavel: 'text-green-600 dark:text-green-400',
  transferencia_responsavel: 'text-blue-600 dark:text-blue-400',
  desatribuicao_responsavel: 'text-orange-600 dark:text-orange-400',
  mudanca_status: 'text-violet-600 dark:text-violet-400',
  observacao_adicionada: 'text-cyan-600 dark:text-cyan-400',
};

const ENTITY_LABELS: Record<string, string> = {
  acervo: 'Processo',
  audiencias: 'Audiência',
  expedientes: 'Expediente',
  contratos: 'Contrato',
  clientes: 'Cliente',
  partes_contrarias: 'Parte Contrária',
  terceiros: 'Terceiro',
  representantes: 'Representante',
};

// --- Descrição humanizada ---

function gerarDescricaoEvento(atividade: AtividadeLog): string {
  const entidade = ENTITY_LABELS[atividade.tipoEntidade] ?? atividade.tipoEntidade;
  const nomeAnterior = atividade.nomeResponsavelAnterior ?? 'Usuário removido';
  const nomeNovo = atividade.nomeResponsavelNovo ?? 'Usuário removido';

  switch (atividade.tipoEvento) {
    case 'atribuicao_responsavel':
      return `Atribuiu ${entidade} #${atividade.entidadeId} para ${nomeNovo}`;

    case 'transferencia_responsavel':
      return `Transferiu ${entidade} #${atividade.entidadeId} de ${nomeAnterior} para ${nomeNovo}`;

    case 'desatribuicao_responsavel':
      return `Removeu ${nomeAnterior} de ${entidade} #${atividade.entidadeId}`;

    case 'mudanca_status': {
      const dados = atividade.dadosEvento;
      if (dados && dados.status_anterior && dados.status_novo) {
        return `Alterou status de ${entidade} #${atividade.entidadeId}: ${dados.status_anterior} → ${dados.status_novo}`;
      }
      return `Alterou status de ${entidade} #${atividade.entidadeId}`;
    }

    case 'observacao_adicionada':
      return `Adicionou observação em ${entidade} #${atividade.entidadeId}`;

    default:
      return `Atividade registrada em ${entidade} #${atividade.entidadeId}`;
  }
}

// --- Componente ---

const LIMITE_POR_PAGINA = 20;

interface AtividadesRecentesProps {
  usuarioId: number;
}

export function AtividadesRecentes({ usuarioId }: AtividadesRecentesProps) {
  const [atividades, setAtividades] = useState<AtividadeLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [temMais, setTemMais] = useState(false);

  useEffect(() => {
    async function loadAtividades() {
      setIsLoading(true);
      setError(null);

      const result = await actionBuscarAtividadesUsuario(usuarioId, LIMITE_POR_PAGINA, 0);

      if (!result.success) {
        setError(result.error || 'Erro ao carregar atividades');
      } else {
        setAtividades(result.data.atividades);
        setTemMais(result.data.temMais);
      }

      setIsLoading(false);
    }

    loadAtividades();
  }, [usuarioId]);

  const carregarMais = useCallback(async () => {
    setIsLoadingMore(true);

    const result = await actionBuscarAtividadesUsuario(
      usuarioId,
      LIMITE_POR_PAGINA,
      atividades.length
    );

    if (result.success) {
      setAtividades((prev) => [...prev, ...result.data.atividades]);
      setTemMais(result.data.temMais);
    }

    setIsLoadingMore(false);
  }, [usuarioId, atividades.length]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Atividades Recentes
        </CardTitle>
        <CardDescription>
          Últimas ações realizadas pelo usuário no sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-sm text-destructive p-4 bg-destructive/10 rounded-lg">
            {error}
          </div>
        )}

        {!error && atividades.length === 0 && (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Activity className="h-6 w-6" />
              </EmptyMedia>
              <EmptyTitle>Nenhuma atividade registrada</EmptyTitle>
              <EmptyDescription>
                Este usuário ainda não possui ações registradas no sistema.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        {!error && atividades.length > 0 && (
          <div className="relative">
            {/* Linha vertical da timeline */}
            <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

            <div className="space-y-6">
              {atividades.map((atividade) => {
                const Icon = EVENT_ICONS[atividade.tipoEvento] ?? Activity;
                const label = EVENT_LABELS[atividade.tipoEvento] ?? 'Atividade registrada';
                const colorClass = EVENT_COLORS[atividade.tipoEvento] ?? 'text-muted-foreground';
                const entidadeLabel = ENTITY_LABELS[atividade.tipoEntidade] ?? atividade.tipoEntidade;
                const descricao = gerarDescricaoEvento(atividade);

                return (
                  <div key={atividade.id} className="relative flex gap-4">
                    {/* Ícone do evento */}
                    <div
                      className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-background border-2 ${colorClass}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 pb-6">
                      <div className="rounded-lg border bg-card p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className={`font-medium ${colorClass}`}>{label}</p>
                              <AppBadge variant="outline" className="text-xs">
                                {entidadeLabel}
                              </AppBadge>
                            </div>
                            <p className="text-sm text-muted-foreground">{descricao}</p>
                          </div>
                          <p className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(new Date(atividade.createdAt), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Botão Carregar mais */}
            {temMais && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={carregarMais}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Carregando...
                    </>
                  ) : (
                    'Carregar mais'
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
