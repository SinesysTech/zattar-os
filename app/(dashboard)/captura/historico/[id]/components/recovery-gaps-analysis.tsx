/**
 * RecoveryGapsAnalysis - Análise de gaps e re-processamento
 *
 * Exibe elementos faltantes identificados pela análise de gaps
 * e permite re-processar elementos selecionados.
 */

'use client';

import { useState, useMemo } from 'react';
import {
  AlertCircle,
  Loader2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  MapPin,
  Users,
  UserCheck,
  Play,
  Check,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useRecoveryAnalysis, useReprocess } from '@/app/_lib/hooks/use-recovery-analysis';
import { RecoveryReprocessDialog } from './recovery-reprocess-dialog';
import type { TipoEntidadeRecuperavel } from '@/backend/captura/services/recovery/types';

interface RecoveryGapsAnalysisProps {
  mongoId: string;
  onClose?: () => void;
}

const formatarData = (dataISO: string): string => {
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

const TipoElementoIcon = ({ tipo }: { tipo: string }) => {
  switch (tipo) {
    case 'endereco':
      return <MapPin className="h-4 w-4" />;
    case 'parte':
      return <Users className="h-4 w-4" />;
    case 'representante':
      return <UserCheck className="h-4 w-4" />;
    default:
      return <AlertCircle className="h-4 w-4" />;
  }
};

const StatusPersistenciaBadge = ({ status }: { status: string }) => {
  switch (status) {
    case 'faltando':
      return (
        <Badge tone="danger" variant="soft" className="gap-1">
          <XCircle className="h-3 w-3" />
          Faltando
        </Badge>
      );
    case 'existente':
      return (
        <Badge tone="success" variant="soft" className="gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Existente
        </Badge>
      );
    case 'pendente':
      return (
        <Badge tone="warning" variant="soft" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          Pendente
        </Badge>
      );
    case 'erro':
      return (
        <Badge tone="danger" variant="solid" className="gap-1">
          <XCircle className="h-3 w-3" />
          Erro
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export function RecoveryGapsAnalysis({ mongoId, onClose }: RecoveryGapsAnalysisProps) {
  const [selectedElements, setSelectedElements] = useState<Set<string>>(new Set());
  const [showReprocessDialog, setShowReprocessDialog] = useState(false);
  const [enderecosOpen, setEnderecosOpen] = useState(true);
  const [partesOpen, setPartesOpen] = useState(true);
  const [representantesOpen, setRepresentantesOpen] = useState(true);

  const { log, analise, isLoading, error, refetch } = useRecoveryAnalysis({
    mongoId,
    analisarGaps: true,
  });

  const { reprocessar, isProcessing, resultado } = useReprocess({
    onSuccess: () => {
      refetch();
      setSelectedElements(new Set());
    },
  });

  // Calcular totais de gaps
  const totaisGaps = useMemo(() => {
    if (!analise?.gaps) return { enderecos: 0, partes: 0, representantes: 0, total: 0 };

    const enderecos = analise.gaps.enderecosFaltantes?.length || 0;
    const partes = analise.gaps.partesFaltantes?.length || 0;
    const representantes = analise.gaps.representantesFaltantes?.length || 0;

    return {
      enderecos,
      partes,
      representantes,
      total: enderecos + partes + representantes,
    };
  }, [analise]);

  // Toggle seleção de elemento
  const toggleElement = (id: string) => {
    const newSelected = new Set(selectedElements);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedElements(newSelected);
  };

  // Selecionar/deselecionar todos de um tipo
  const toggleAllOfType = (
    tipo: 'enderecos' | 'partes' | 'representantes',
    elements: Array<{ identificador: string }>
  ) => {
    const newSelected = new Set(selectedElements);
    const allSelected = elements.every((e) => newSelected.has(`${tipo}:${e.identificador}`));

    if (allSelected) {
      elements.forEach((e) => newSelected.delete(`${tipo}:${e.identificador}`));
    } else {
      elements.forEach((e) => newSelected.add(`${tipo}:${e.identificador}`));
    }
    setSelectedElements(newSelected);
  };

  // Processar elementos selecionados
  const handleReprocess = async () => {
    if (selectedElements.size === 0) return;

    // Por enquanto, só processa endereços
    const tiposElementos: TipoEntidadeRecuperavel[] = ['endereco'];

    await reprocessar({
      mongoIds: [mongoId],
      tiposElementos,
      filtros: {
        apenasGaps: true,
      },
    });

    setShowReprocessDialog(false);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro ao carregar análise</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={refetch} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Tentar Novamente
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!log || !analise) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Análise não disponível</AlertTitle>
        <AlertDescription>
          Não foi possível analisar os gaps para este log.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Informações do log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Detalhes do Log</CardTitle>
          <CardDescription>
            Informações do log MongoDB selecionado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Processo</p>
              <p className="font-mono">{analise.processo.numeroProcesso || '-'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">TRT / Grau</p>
              <p>{analise.processo.trt} / {analise.processo.grau === 'primeiro_grau' ? '1º Grau' : '2º Grau'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Criado em</p>
              <p>{formatarData(log.criadoEm)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                {log.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo de totais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Resumo da Análise</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">{analise.totais.partes}</p>
              <p className="text-xs text-muted-foreground">Partes Esperadas</p>
              <p className="text-xs text-green-600">{analise.totais.partesPersistidas} persistidas</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">{analise.totais.enderecosEsperados}</p>
              <p className="text-xs text-muted-foreground">Endereços Esperados</p>
              <p className="text-xs text-green-600">{analise.totais.enderecosPersistidos} persistidos</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">{analise.totais.representantes}</p>
              <p className="text-xs text-muted-foreground">Representantes</p>
              <p className="text-xs text-green-600">{analise.totais.representantesPersistidos} persistidos</p>
            </div>
            <div className="text-center p-3 bg-red-500/10 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{totaisGaps.total}</p>
              <p className="text-xs text-muted-foreground">Total de Gaps</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gaps identificados */}
      {totaisGaps.total > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm">Elementos Faltantes</CardTitle>
              <CardDescription>
                {selectedElements.size} de {totaisGaps.total} selecionados para re-processamento
              </CardDescription>
            </div>
            <Button
              size="sm"
              disabled={selectedElements.size === 0 || isProcessing}
              onClick={() => setShowReprocessDialog(true)}
              className="gap-2"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Re-processar ({selectedElements.size})
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Endereços faltantes */}
            {analise.gaps.enderecosFaltantes && analise.gaps.enderecosFaltantes.length > 0 && (
              <Collapsible open={enderecosOpen} onOpenChange={setEnderecosOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-3 h-auto">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-red-500" />
                      <span className="font-medium">Endereços Faltantes</span>
                      <Badge variant="destructive" className="ml-2">
                        {analise.gaps.enderecosFaltantes.length}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleAllOfType('enderecos', analise.gaps.enderecosFaltantes!);
                        }}
                      >
                        {analise.gaps.enderecosFaltantes.every((e) =>
                          selectedElements.has(`enderecos:${e.identificador}`)
                        )
                          ? 'Desmarcar todos'
                          : 'Selecionar todos'}
                      </Button>
                    </div>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 mt-2">
                  {analise.gaps.enderecosFaltantes.map((elemento) => (
                    <div
                      key={elemento.identificador}
                      className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={selectedElements.has(`enderecos:${elemento.identificador}`)}
                        onCheckedChange={() => toggleElement(`enderecos:${elemento.identificador}`)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <TipoElementoIcon tipo={elemento.tipo} />
                          <span className="font-medium text-sm">{elemento.nome}</span>
                          <StatusPersistenciaBadge status={elemento.statusPersistencia} />
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">
                          {elemento.identificador}
                        </p>
                        {elemento.contexto?.entidadeTipo && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Entidade: {elemento.contexto.entidadeTipo} #{elemento.contexto.entidadeId}
                          </p>
                        )}
                        {elemento.erro && (
                          <p className="text-xs text-destructive mt-1">{elemento.erro}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Partes faltantes */}
            {analise.gaps.partesFaltantes && analise.gaps.partesFaltantes.length > 0 && (
              <Collapsible open={partesOpen} onOpenChange={setPartesOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-3 h-auto">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-orange-500" />
                      <span className="font-medium">Partes Faltantes</span>
                      <Badge variant="destructive" className="ml-2">
                        {analise.gaps.partesFaltantes.length}
                      </Badge>
                    </div>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 mt-2">
                  {analise.gaps.partesFaltantes.map((elemento) => (
                    <div
                      key={elemento.identificador}
                      className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <TipoElementoIcon tipo={elemento.tipo} />
                          <span className="font-medium text-sm">{elemento.nome}</span>
                          <StatusPersistenciaBadge status={elemento.statusPersistencia} />
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">
                          {elemento.identificador}
                        </p>
                      </div>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Representantes faltantes */}
            {analise.gaps.representantesFaltantes && analise.gaps.representantesFaltantes.length > 0 && (
              <Collapsible open={representantesOpen} onOpenChange={setRepresentantesOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-3 h-auto">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">Representantes Faltantes</span>
                      <Badge variant="destructive" className="ml-2">
                        {analise.gaps.representantesFaltantes.length}
                      </Badge>
                    </div>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 mt-2">
                  {analise.gaps.representantesFaltantes.map((elemento) => (
                    <div
                      key={elemento.identificador}
                      className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <TipoElementoIcon tipo={elemento.tipo} />
                          <span className="font-medium text-sm">{elemento.nome}</span>
                          <StatusPersistenciaBadge status={elemento.statusPersistencia} />
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">
                          {elemento.identificador}
                        </p>
                      </div>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}
          </CardContent>
        </Card>
      )}

      {/* Mensagem quando não há gaps */}
      {totaisGaps.total === 0 && (
        <Alert>
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertTitle>Sem gaps identificados</AlertTitle>
          <AlertDescription>
            Todos os elementos esperados foram persistidos corretamente no PostgreSQL.
          </AlertDescription>
        </Alert>
      )}

      {/* Resultado do re-processamento */}
      {resultado && (
        <Alert variant={resultado.sucesso ? 'default' : 'destructive'}>
          {resultado.sucesso ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <AlertTitle>
            {resultado.sucesso ? 'Re-processamento concluído' : 'Re-processamento com erros'}
          </AlertTitle>
          <AlertDescription>
            Processados: {resultado.totalElementos} | Sucessos: {resultado.totalSucessos} | Erros: {resultado.totalErros}
            <br />
            Tempo: {resultado.duracaoMs}ms
          </AlertDescription>
        </Alert>
      )}

      {/* Dialog de confirmação de re-processamento */}
      <RecoveryReprocessDialog
        open={showReprocessDialog}
        onOpenChange={setShowReprocessDialog}
        selectedCount={selectedElements.size}
        isProcessing={isProcessing}
        onConfirm={handleReprocess}
      />
    </div>
  );
}

