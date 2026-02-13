'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { DataPagination, DataShell, DataTable, DataTableToolbar } from '@/components/shared/data-shell';
import { DataTableColumnHeader } from '@/components/shared/data-shell/data-table-column-header';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TIPOS_CAPTURA, STATUS_CAPTURA } from './captura-filters';
import { useCapturasLog } from '../hooks/use-capturas-log';
import { useAdvogados } from '@/features/advogados';
import { useCredenciais } from '@/features/advogados';
import { deletarCapturaLog } from '@/features/captura/services/api-client';
import type { ColumnDef, Table as TanstackTable } from '@tanstack/react-table';
import type { CapturaLog, TipoCaptura, StatusCaptura } from '@/features/captura/types';
import type { CodigoTRT } from '@/features/captura';
import { Eye, Search, Trash2 } from 'lucide-react';
import { getSemanticBadgeVariant, CAPTURA_STATUS_LABELS } from '@/lib/design-system';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

/**
 * Formata data e hora ISO para formato brasileiro (DD/MM/YYYY HH:mm)
 */
const formatarDataHora = (dataISO: string | null): string => {
  if (!dataISO) return '-';
  try {
    const data = new Date(dataISO);
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
};

/**
 * Formata tipo de captura para exibição
 */
const formatarTipoCaptura = (tipo: TipoCaptura): string => {
  const tipos: Record<TipoCaptura, string> = {
    acervo_geral: 'Acervo Geral',
    arquivados: 'Arquivados',
    audiencias: 'Audiências',
    pendentes: 'Expedientes',
    partes: 'Partes',
    combinada: 'Combinada',
    timeline: 'Timeline',
    audiencias_designadas: 'Audiências Designadas',
    audiencias_realizadas: 'Audiências Realizadas',
    audiencias_canceladas: 'Audiências Canceladas',
    expedientes_no_prazo: 'Expedientes no Prazo',
    expedientes_sem_prazo: 'Expedientes sem Prazo',
    pericias: 'Perícias',
  };
  return tipos[tipo] || tipo;
};

/**
 * Retorna badge de status com cor apropriada usando o sistema semântico.
 *
 * @ai-context Este componente usa getSemanticBadgeVariant() do design system.
 */
const StatusBadge = ({ status }: { status: StatusCaptura }) => {
  const variant = getSemanticBadgeVariant('captura_status', status);
  const label = CAPTURA_STATUS_LABELS[status] || status;

  return <Badge variant={variant}>{label}</Badge>;
};

/**
 * Formata grau para exibição curta
 */
const formatarGrauCurto = (grau: string | undefined | null): string => {
  if (!grau) return '1G'; // Fallback para primeiro grau se undefined/null
  if (grau === '1' || grau === 'primeiro_grau') return '1G';
  if (grau === '2' || grau === 'segundo_grau') return '2G';
  return grau;
};

/**
 * Extrai informações de tribunais/graus que tiveram erro do campo resultado
 */
const extrairTribunaisComErro = (
  resultado: CapturaLog['resultado'],
  credenciaisMap: Map<number, CredencialInfo>
): Array<{ tribunal: CodigoTRT; grau: string }> => {
  const tribunaisComErro: Array<{ tribunal: CodigoTRT; grau: string }> = [];

  if (!resultado || typeof resultado !== 'object') {
    return tribunaisComErro;
  }

  // Verificar se resultado tem a propriedade 'resultados' (array)
  if ('resultados' in resultado && Array.isArray(resultado.resultados)) {
    // Filtrar apenas resultados que têm erro
    const resultadosComErro = resultado.resultados.filter(
      (r: unknown) => r && typeof r === 'object' && 'erro' in r && r.erro
    );

    // Extrair tribunal e grau de cada resultado com erro
    resultadosComErro.forEach((r: unknown) => {
      if (r && typeof r === 'object') {
        const resultadoItem = r as {
          credencial_id?: number;
          tribunal?: string;
          grau?: string;
          erro?: string;
        };

        // Prioridade 1: usar tribunal e grau diretamente do resultado
        if (resultadoItem.tribunal && resultadoItem.grau) {
          tribunaisComErro.push({
            tribunal: resultadoItem.tribunal as CodigoTRT,
            grau: resultadoItem.grau,
          });
        }
        // Prioridade 2: usar credencial_id para buscar no mapa
        else if (resultadoItem.credencial_id) {
          const info = credenciaisMap.get(resultadoItem.credencial_id);
          if (info) {
            tribunaisComErro.push({
              tribunal: info.tribunal,
              grau: info.grau || 'primeiro_grau',
            });
          }
        }
      }
    });
  }

  return tribunaisComErro;
};

/**
 * Tenta extrair informações de credencial_id do texto de erro
 * Formato esperado: "TRT7 segundo_grau (ID 14) - ..." ou múltiplos erros separados por quebra de linha
 */
const extrairCredenciaisDoTextoErro = (
  erro: string,
  credenciaisMap: Map<number, CredencialInfo>
): Array<{ tribunal: CodigoTRT; grau: string }> => {
  const tribunaisComErro: Array<{ tribunal: CodigoTRT; grau: string }> = [];
  const uniqueKey = new Set<string>();

  // Padrão: "TRT7 segundo_grau (ID 14)" ou "TST tribunal_superior (ID 49)"
  // Suporta múltiplos erros no mesmo texto (separados por quebra de linha)
  const padrao = /(\w+)\s+(\S+)\s+\(ID\s+(\d+)\)/g;
  let match;

  while ((match = padrao.exec(erro)) !== null) {
    const tribunal = match[1] as CodigoTRT;
    const grau = match[2];
    const credencialId = parseInt(match[3], 10);

    if (!isNaN(credencialId)) {
      // Criar chave única para evitar duplicatas
      const key = `${tribunal}-${grau}-${credencialId}`;
      if (uniqueKey.has(key)) continue;
      uniqueKey.add(key);

      // Tentar buscar no mapa primeiro
      const info = credenciaisMap.get(credencialId);
      if (info) {
        tribunaisComErro.push({
          tribunal: info.tribunal,
          grau: info.grau || grau || 'primeiro_grau',
        });
      } else {
        // Se não encontrar no mapa, usar os valores extraídos do texto
        tribunaisComErro.push({
          tribunal,
          grau: grau || 'primeiro_grau',
        });
      }
    }
  }

  return tribunaisComErro;
};

/**
 * Tipo para info de credencial
 */
type CredencialInfo = { tribunal: CodigoTRT; grau: string };

/**
 * Colunas da tabela de histórico
 */
function criarColunas(
  router: ReturnType<typeof useRouter>,
  onDelete: (captura: CapturaLog) => void,
  advogadosMap: Map<number, string>,
  credenciaisMap: Map<number, CredencialInfo>
): ColumnDef<CapturaLog>[] {
  return [
    {
      accessorKey: 'tipo_captura',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Tipo" className="justify-center" />
      ),
      enableSorting: true,
      size: 140,
      meta: { align: 'center' },
      cell: ({ row }) => (
        <span className="text-sm">{formatarTipoCaptura(row.getValue('tipo_captura'))}</span>
      ),
    },
    {
      accessorKey: 'advogado_id',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Advogado" className="justify-center" />
      ),
      enableSorting: true,
      size: 220,
      minSize: 200,
      meta: { align: 'center' },
      cell: ({ row }) => {
        const advogadoId = row.getValue('advogado_id') as number | null;
        const nomeAdvogado = advogadoId ? advogadosMap.get(advogadoId) : null;
        return (
          <span className="text-sm">
            {nomeAdvogado || '-'}
          </span>
        );
      },
    },
    {
      accessorKey: 'credencial_ids',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Tribunais" className="justify-center" />
      ),
      enableSorting: false,
      size: 220,
      meta: { align: 'center' },
      cell: ({ row }) => {
        const credencialIds = row.getValue('credencial_ids') as number[] | null | undefined;

        // Validar que credencial_ids existe e é um array válido
        if (!credencialIds || !Array.isArray(credencialIds) || credencialIds.length === 0) {
          return <span className="text-sm text-muted-foreground">-</span>;
        }

        // Debug: verificar IDs que não estão no mapa
        const idsNaoEncontrados: number[] = [];
        
        // Mapear credencial_ids para { tribunal, grau }
        const tribunaisInfo = credencialIds
          .map((id) => {
            // Validar que id é um número válido
            if (typeof id !== 'number' || isNaN(id)) {
              console.warn('[CapturaList] ID de credencial inválido:', id, 'tipo:', typeof id);
              return null;
            }

            const info = credenciaisMap.get(id);
            if (!info) {
              idsNaoEncontrados.push(id);
            }
            return info;
          })
          .filter((info): info is CredencialInfo => info !== undefined);

        // Log de debug se houver IDs não encontrados
        if (idsNaoEncontrados.length > 0) {
          console.warn('[CapturaList] Credenciais não encontradas no mapa:', idsNaoEncontrados, 'Mapa tem', credenciaisMap.size, 'entradas');
        }

        // Remover duplicatas por tribunal+grau
        const uniqueKey = new Set<string>();
        const tribunaisUnicos = tribunaisInfo.filter((info) => {
          // Garantir que grau sempre tenha um valor válido
          const grau = info.grau || 'primeiro_grau';
          const key = `${info.tribunal}-${grau}`;
          if (uniqueKey.has(key)) return false;
          uniqueKey.add(key);
          return true;
        });

        if (tribunaisUnicos.length === 0) {
          // Se não encontrou nenhum tribunal, pode ser que as credenciais ainda estejam carregando
          if (credenciaisMap.size === 0) {
            return <span className="text-sm text-muted-foreground">Carregando...</span>;
          }
          return <span className="text-sm text-muted-foreground">-</span>;
        }

        return (
          <div className="flex flex-wrap gap-1 justify-center">
            {tribunaisUnicos.slice(0, 3).map((info, idx) => {
              const grau = info.grau || 'primeiro_grau';
              return (
                <Badge
                  key={`${info.tribunal}-${grau}-${idx}`}
                  variant={getSemanticBadgeVariant('tribunal', info.tribunal)}
                  className="text-xs"
                >
                  {info.tribunal} {formatarGrauCurto(grau)}
                </Badge>
              );
            })}
            {tribunaisUnicos.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{tribunaisUnicos.length - 3}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" className="justify-center" />
      ),
      enableSorting: true,
      size: 130,
      meta: { align: 'center' },
      cell: ({ row }) => <StatusBadge status={row.getValue('status')} />,
    },
    {
      accessorKey: 'iniciado_em',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Período" className="justify-center" />
      ),
      enableSorting: true,
      size: 200,
      meta: { align: 'center' },
      cell: ({ row }) => {
        const iniciadoEm = row.getValue('iniciado_em') as string | null;
        const concluidoEm = row.original.concluido_em;
        return (
          <div className="flex flex-col items-center text-sm">
            <span>
              <span className="text-muted-foreground">Início:</span> {formatarDataHora(iniciadoEm)}
            </span>
            {concluidoEm && (
              <span>
                <span className="text-muted-foreground">Fim:</span> {formatarDataHora(concluidoEm)}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'erro',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Erros" className="justify-center" />
      ),
      enableSorting: false,
      size: 200,
      meta: { align: 'center' },
      cell: ({ row }) => {
        const erro = row.getValue('erro') as string | null;
        const resultado = row.original.resultado;
        const credencialIds = row.original.credencial_ids;

        if (!erro) {
          return <span className="text-sm text-muted-foreground">-</span>;
        }

        // Prioridade 1: Extrair tribunais com erro do campo resultado
        let tribunaisComErro = extrairTribunaisComErro(resultado, credenciaisMap);

        // Prioridade 2: Se não encontrou no resultado, tentar extrair do texto do erro
        if (tribunaisComErro.length === 0 && erro) {
          tribunaisComErro = extrairCredenciaisDoTextoErro(erro, credenciaisMap);
        }

        // Prioridade 3: Fallback - se ainda não encontrou, usar todas as credenciais (comportamento antigo)
        if (tribunaisComErro.length === 0) {
          if (!credencialIds || !Array.isArray(credencialIds) || credencialIds.length === 0) {
            return (
              <Badge variant="destructive" className="text-xs">
                1 erro
              </Badge>
            );
          }

          // Mapear todas as credenciais (fallback)
          const tribunaisInfo = credencialIds
            .map((id) => {
              if (typeof id !== 'number' || isNaN(id)) {
                return null;
              }
              return credenciaisMap.get(id);
            })
            .filter((info): info is CredencialInfo => info !== undefined);

          if (tribunaisInfo.length === 0) {
            return (
              <Badge variant="destructive" className="text-xs">
                1 erro
              </Badge>
            );
          }

          tribunaisComErro = tribunaisInfo.map((info) => ({
            tribunal: info.tribunal,
            grau: info.grau || 'primeiro_grau',
          }));
        }

        // Remover duplicatas por tribunal+grau
        const uniqueKey = new Set<string>();
        const tribunaisUnicos = tribunaisComErro.filter((info) => {
          const grau = info.grau || 'primeiro_grau';
          const key = `${info.tribunal}-${grau}`;
          if (uniqueKey.has(key)) return false;
          uniqueKey.add(key);
          return true;
        });

        if (tribunaisUnicos.length === 0) {
          return (
            <Badge variant="destructive" className="text-xs">
              1 erro
            </Badge>
          );
        }

        // Agrupar por tribunal+grau (para contagem se houver múltiplos erros do mesmo tribunal/grau)
        const contagem = new Map<string, { tribunal: CodigoTRT; grau: string; count: number }>();
        tribunaisUnicos.forEach((info) => {
          const grau = info.grau || 'primeiro_grau';
          const key = `${info.tribunal}-${grau}`;
          const existing = contagem.get(key);
          if (existing) {
            existing.count++;
          } else {
            contagem.set(key, { tribunal: info.tribunal, grau, count: 1 });
          }
        });

        return (
          <div className="flex flex-wrap gap-1 justify-center">
            {Array.from(contagem.values()).slice(0, 2).map((info, idx) => {
              const grau = info.grau || 'primeiro_grau';
              return (
                <Badge
                  key={`${info.tribunal}-${grau}-${idx}`}
                  variant="destructive"
                  className="text-xs"
                >
                  {info.tribunal} {formatarGrauCurto(grau)}
                </Badge>
              );
            })}
            {contagem.size > 2 && (
              <Badge variant="destructive" className="text-xs">
                +{contagem.size - 2}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      id: 'acoes',
      header: () => <span className="text-center w-full block">Ações</span>,
      size: 100,
      meta: { align: 'center' },
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const captura = row.original;
        return (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => router.push(`/captura/historico/${captura.id}`)}
              title="Visualizar detalhes"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" title="Deletar">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja deletar esta captura? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(captura)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Deletar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        );
      },
    },
  ];
}

interface CapturaListProps {
  onNewClick?: () => void;
}

export function CapturaList({ onNewClick }: CapturaListProps = {}) {
  const router = useRouter();

  // Estado para evitar hydration mismatch com Select components
  const [mounted, setMounted] = React.useState(false);

  // Estados de busca e paginação
  const [busca, setBusca] = React.useState('');
  const [pagina, setPagina] = React.useState(0);
  const [limite, setLimite] = React.useState(50);

  // Estados de filtros individuais
  const [tipoCaptura, setTipoCaptura] = React.useState<'all' | TipoCaptura>('all');
  const [statusCaptura, setStatusCaptura] = React.useState<'all' | StatusCaptura>('all');
  const [advogadoId, setAdvogadoId] = React.useState<'all' | string>('all');

  // Marcar como montado após hidratação
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Estados para DataTableToolbar
  const [table, setTable] = React.useState<TanstackTable<CapturaLog> | null>(null);
  const [density, setDensity] = React.useState<'compact' | 'standard' | 'relaxed'>('standard');

  // Buscar advogados para filtro e mapeamento
  const { advogados } = useAdvogados({ limite: 1000 });

  // Buscar credenciais para mapeamento
  const { credenciais, isLoading: credenciaisLoading, error: credenciaisError } = useCredenciais({});

  // Debug: verificar credenciais e possíveis erros
  React.useEffect(() => {
    console.log('[CapturaList] credenciais:', credenciais?.length, 'loading:', credenciaisLoading, 'error:', credenciaisError);
    if (credenciais && credenciais.length > 0) {
      console.log('[CapturaList] Primeiras 3 credenciais:', credenciais.slice(0, 3).map(c => ({ id: c.id, tribunal: c.tribunal, grau: c.grau })));
    }
  }, [credenciais, credenciaisLoading, credenciaisError]);

  // Criar mapa de advogado_id -> nome
  const advogadosMap = React.useMemo(() => {
    const map = new Map<number, string>();
    advogados?.forEach((advogado) => {
      map.set(advogado.id, advogado.nome_completo);
    });
    return map;
  }, [advogados]);

  // Criar mapa de credencial_id -> { tribunal, grau }
  const credenciaisMap = React.useMemo(() => {
    const map = new Map<number, CredencialInfo>();
    
    if (!credenciais || credenciais.length === 0) {
      console.warn('[CapturaList] Nenhuma credencial disponível para criar o mapa');
      return map;
    }

    credenciais.forEach((credencial) => {
      // Validar que a credencial tem id válido
      if (!credencial.id) {
        console.warn('[CapturaList] Credencial sem ID:', credencial);
        return;
      }

      // Garantir que grau sempre tenha um valor válido (fallback para 'primeiro_grau' se undefined/null)
      const grau = credencial.grau || 'primeiro_grau';
      
      // Validar que tribunal existe
      if (!credencial.tribunal) {
        console.warn('[CapturaList] Credencial sem tribunal:', credencial);
        return;
      }

      map.set(credencial.id, {
        tribunal: credencial.tribunal as CodigoTRT,
        grau: grau,
      });
    });

    console.log('[CapturaList] credenciaisMap criado com', map.size, 'entradas');
    return map;
  }, [credenciais]);

  // Parâmetros para buscar capturas
  const params = React.useMemo(
    () => ({
      pagina: pagina + 1, // API usa 1-indexed
      limite,
      tipo_captura: tipoCaptura !== 'all' ? tipoCaptura : undefined,
      status: statusCaptura !== 'all' ? statusCaptura : undefined,
      advogado_id: advogadoId !== 'all' ? Number(advogadoId) : undefined,
    }),
    [pagina, limite, tipoCaptura, statusCaptura, advogadoId]
  );

  // Buscar histórico de capturas
  const { capturas, paginacao, isLoading, error, refetch } = useCapturasLog(params);

  const handleDelete = React.useCallback(
    async (captura: CapturaLog) => {
      try {
        await deletarCapturaLog(captura.id);
        refetch();
      } catch (error) {
        console.error('Erro ao deletar captura:', error);
      }
    },
    [refetch]
  );

  const colunas = React.useMemo(
    () => criarColunas(router, handleDelete, advogadosMap, credenciaisMap),
    [router, handleDelete, advogadosMap, credenciaisMap]
  );

  // Ocultar coluna advogado por padrão quando table estiver pronta
  React.useEffect(() => {
    if (table) {
      table.setColumnVisibility((prev) => ({
        ...prev,
        advogado_id: false,
      }));
    }
  }, [table]);

  // Classes padronizadas para filtros (seguindo padrão DataShell)
  const filterClasses = 'h-9 w-32 border-dashed bg-card font-normal';

  return (
    <DataShell
      header={
        table ? (
          <DataTableToolbar
            table={table}
            title="Histórico de Capturas"
            density={density}
            onDensityChange={setDensity}
            searchValue={busca}
            onSearchValueChange={(value) => {
              setBusca(value);
              setPagina(0);
            }}
            searchPlaceholder="Buscar capturas..."
            actionButton={
              onNewClick
                ? {
                    label: 'Nova Captura',
                    onClick: onNewClick,
                  }
                : undefined
            }
            filtersSlot={
              mounted ? (
                <>
                  <Select
                    value={tipoCaptura}
                    onValueChange={(val) => {
                      setTipoCaptura(val as 'all' | TipoCaptura);
                      setPagina(0);
                    }}
                  >
                    <SelectTrigger className={filterClasses}>
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      {TIPOS_CAPTURA.map((tipo) => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={statusCaptura}
                    onValueChange={(val) => {
                      setStatusCaptura(val as 'all' | StatusCaptura);
                      setPagina(0);
                    }}
                  >
                    <SelectTrigger className={filterClasses}>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      {STATUS_CAPTURA.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={advogadoId}
                    onValueChange={(val) => {
                      setAdvogadoId(val);
                      setPagina(0);
                    }}
                  >
                    <SelectTrigger className={filterClasses}>
                      <SelectValue placeholder="Advogado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os advogados</SelectItem>
                      {advogados?.map((advogado) => (
                        <SelectItem key={advogado.id} value={advogado.id.toString()}>
                          {advogado.nome_completo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              ) : (
                <>
                  <div className="h-9 w-32 rounded-md border border-dashed border-input bg-card" />
                  <div className="h-9 w-32 rounded-md border border-dashed border-input bg-card" />
                  <div className="h-9 w-32 rounded-md border border-dashed border-input bg-card" />
                </>
              )
            }
          />
        ) : (
          <div className="px-6 py-4">
            <div className="flex items-center gap-2">
              <div className="relative w-full max-w-xs">
                <Search
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  type="search"
                  placeholder="Buscar capturas..."
                  aria-label="Buscar na tabela"
                  value={busca}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    setBusca(event.target.value);
                    setPagina(0);
                  }}
                  className="h-9 w-full pl-9 bg-card"
                />
              </div>

              {mounted ? (
                <>
                  <Select
                    value={tipoCaptura}
                    onValueChange={(val) => {
                      setTipoCaptura(val as 'all' | TipoCaptura);
                      setPagina(0);
                    }}
                  >
                    <SelectTrigger className={filterClasses}>
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      {TIPOS_CAPTURA.map((tipo) => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={statusCaptura}
                    onValueChange={(val) => {
                      setStatusCaptura(val as 'all' | StatusCaptura);
                      setPagina(0);
                    }}
                  >
                    <SelectTrigger className={filterClasses}>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      {STATUS_CAPTURA.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={advogadoId}
                    onValueChange={(val) => {
                      setAdvogadoId(val);
                      setPagina(0);
                    }}
                  >
                    <SelectTrigger className={filterClasses}>
                      <SelectValue placeholder="Advogado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os advogados</SelectItem>
                      {advogados?.map((advogado) => (
                        <SelectItem key={advogado.id} value={advogado.id.toString()}>
                          {advogado.nome_completo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              ) : (
                <>
                  <div className="h-9 w-32 rounded-md border border-dashed border-input bg-card" />
                  <div className="h-9 w-32 rounded-md border border-dashed border-input bg-card" />
                  <div className="h-9 w-32 rounded-md border border-dashed border-input bg-card" />
                </>
              )}

              <div className="flex-1" />
            </div>
          </div>
        )
      }
      footer={
        paginacao && paginacao.totalPaginas > 0 ? (
          <DataPagination
            pageIndex={paginacao.pagina - 1}
            pageSize={paginacao.limite}
            total={paginacao.total}
            totalPages={paginacao.totalPaginas}
            onPageChange={setPagina}
            onPageSizeChange={setLimite}
            isLoading={isLoading}
          />
        ) : null
      }
    >
      <DataTable
        data={capturas}
        columns={colunas}
        pagination={
          paginacao
            ? {
                pageIndex: paginacao.pagina - 1,
                pageSize: paginacao.limite,
                total: paginacao.total,
                totalPages: paginacao.totalPaginas,
                onPageChange: setPagina,
                onPageSizeChange: setLimite,
              }
            : undefined
        }
        isLoading={isLoading}
        error={error}
        density={density}
        onTableReady={(t) => setTable(t as TanstackTable<CapturaLog>)}
        emptyMessage="Nenhuma captura encontrada no histórico."
      />
    </DataShell>
  );
}
