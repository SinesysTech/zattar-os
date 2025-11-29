/**
 * RecoveryGapsAnalysis - Visualização de elementos capturados
 *
 * Exibe TODOS os elementos capturados no payload MongoDB,
 * com status de persistência e opção de re-processar.
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
  Filter,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useRecoveryElementos, useReprocess } from '@/app/_lib/hooks/use-recovery-analysis';
import { RecoveryReprocessDialog } from './recovery-reprocess-dialog';
import type { TipoEntidadeRecuperavel } from '@/backend/captura/services/recovery/types';

interface RecoveryGapsAnalysisProps {
  mongoId: string;
  onClose?: () => void;
}

const formatarData = (dataISO: string | Date): string => {
  try {
    const data = dataISO instanceof Date ? dataISO : new Date(dataISO);
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

interface ElementoItemProps {
  elemento: {
    tipo: string;
    identificador: string;
    nome: string;
    statusPersistencia: string;
    contexto?: {
      entidadeTipo?: string;
      entidadeId?: number;
    };
    erro?: string;
  };
  isSelected: boolean;
  onToggle: () => void;
  showCheckbox?: boolean;
}

const ElementoItem = ({ elemento, isSelected, onToggle, showCheckbox = true }: ElementoItemProps) => (
  <div className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50">
    {showCheckbox && (
      <Checkbox
        checked={isSelected}
        onCheckedChange={onToggle}
        disabled={elemento.statusPersistencia === 'erro'}
      />
    )}
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-1">
        <TipoElementoIcon tipo={elemento.tipo} />
        <span className="font-medium text-sm truncate">{elemento.nome}</span>
        <StatusPersistenciaBadge status={elemento.statusPersistencia} />
      </div>
      <p className="text-xs text-muted-foreground font-mono">
        {elemento.identificador}
      </p>
      {elemento.contexto?.entidadeTipo && (
        <p className="text-xs text-muted-foreground mt-1">
          Entidade: {elemento.contexto.entidadeTipo}
          {elemento.contexto.entidadeId && ` #${elemento.contexto.entidadeId}`}
        </p>
      )}
      {elemento.erro && (
        <p className="text-xs text-destructive mt-1">{elemento.erro}</p>
      )}
    </div>
  </div>
);

export function RecoveryGapsAnalysis({ mongoId, onClose }: RecoveryGapsAnalysisProps) {
  const [selectedElements, setSelectedElements] = useState<Set<string>>(new Set());
  const [showReprocessDialog, setShowReprocessDialog] = useState(false);
  const [mostrarApenasFaltantes, setMostrarApenasFaltantes] = useState(false);
  const [forcarAtualizacao, setForcarAtualizacao] = useState(false);
  const [partesOpen, setPartesOpen] = useState(true);
  const [enderecosOpen, setEnderecosOpen] = useState(true);
  const [representantesOpen, setRepresentantesOpen] = useState(true);

  const { log, payloadDisponivel, elementos, isLoading, error, refetch } = useRecoveryElementos({
    mongoId,
  });

  const { reprocessar, isProcessing, resultado } = useReprocess({
    onSuccess: () => {
      refetch();
      setSelectedElements(new Set());
    },
  });

  // Filtrar elementos baseado no toggle
  const elementosFiltrados = useMemo(() => {
    if (!elementos) return null;

    if (!mostrarApenasFaltantes) {
      return elementos;
    }

    return {
      partes: elementos.partes.filter((e) => e.statusPersistencia === 'faltando'),
      enderecos: elementos.enderecos.filter((e) => e.statusPersistencia === 'faltando'),
      representantes: elementos.representantes.filter((e) => e.statusPersistencia === 'faltando'),
      totais: elementos.totais,
    };
  }, [elementos, mostrarApenasFaltantes]);

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
    tipo: 'partes' | 'enderecos' | 'representantes',
    elements: Array<{ identificador: string; statusPersistencia: string }>
  ) => {
    const newSelected = new Set(selectedElements);
    const selectableElements = elements.filter((e) => e.statusPersistencia !== 'erro');
    const allSelected = selectableElements.every((e) => newSelected.has(`${tipo}:${e.identificador}`));

    if (allSelected) {
      selectableElements.forEach((e) => newSelected.delete(`${tipo}:${e.identificador}`));
    } else {
      selectableElements.forEach((e) => newSelected.add(`${tipo}:${e.identificador}`));
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
        apenasGaps: !forcarAtualizacao,
        forcarAtualizacao,
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
        <AlertTitle>Erro ao carregar elementos</AlertTitle>
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

  if (!log || !payloadDisponivel) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Payload não disponível</AlertTitle>
        <AlertDescription>
          Não foi possível carregar os elementos deste log.
        </AlertDescription>
      </Alert>
    );
  }

  const totais = elementosFiltrados?.totais;

  return (
    <div className="space-y-4">
      {/* Informações do log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Detalhes do Log</CardTitle>
          <CardDescription>
            Elementos capturados no payload MongoDB
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">TRT / Grau</p>
              <p>{log.trt} / {log.grau === 'primeiro_grau' ? '1º Grau' : '2º Grau'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Tipo</p>
              <p>{log.tipoCaptura}</p>
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
      {totais && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Resumo dos Elementos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold">{totais.partes}</p>
                <p className="text-xs text-muted-foreground">Partes</p>
                <div className="flex justify-center gap-2 mt-1 text-xs">
                  <span className="text-green-600">{totais.partesExistentes} ✓</span>
                  <span className="text-red-600">{totais.partesFaltantes} ✗</span>
                </div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold">{totais.enderecos}</p>
                <p className="text-xs text-muted-foreground">Endereços</p>
                <div className="flex justify-center gap-2 mt-1 text-xs">
                  <span className="text-green-600">{totais.enderecosExistentes} ✓</span>
                  <span className="text-red-600">{totais.enderecosFaltantes} ✗</span>
                </div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold">{totais.representantes}</p>
                <p className="text-xs text-muted-foreground">Representantes</p>
                <div className="flex justify-center gap-2 mt-1 text-xs">
                  <span className="text-green-600">{totais.representantesExistentes} ✓</span>
                  <span className="text-red-600">{totais.representantesFaltantes} ✗</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Controles de filtro e ações */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-sm">Elementos Capturados</CardTitle>
            <CardDescription>
              {selectedElements.size > 0
                ? `${selectedElements.size} elemento(s) selecionado(s)`
                : 'Selecione elementos para re-persistir'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            {/* Toggle para mostrar apenas faltantes */}
            <div className="flex items-center gap-2">
              <Switch
                id="filtro-faltantes"
                checked={mostrarApenasFaltantes}
                onCheckedChange={setMostrarApenasFaltantes}
              />
              <Label htmlFor="filtro-faltantes" className="text-sm cursor-pointer flex items-center gap-1">
                {mostrarApenasFaltantes ? (
                  <>
                    <EyeOff className="h-4 w-4" />
                    Apenas faltantes
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    Todos
                  </>
                )}
              </Label>
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
              Re-persistir ({selectedElements.size})
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {elementosFiltrados && (
            <>
              {/* Partes */}
              {elementosFiltrados.partes.length > 0 && (
                <Collapsible open={partesOpen} onOpenChange={setPartesOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between p-3 h-auto">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">Partes</span>
                        <Badge variant="outline" className="ml-2">
                          {elementosFiltrados.partes.length}
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleAllOfType('partes', elementosFiltrados.partes);
                        }}
                      >
                        {elementosFiltrados.partes
                          .filter((e) => e.statusPersistencia !== 'erro')
                          .every((e) => selectedElements.has(`partes:${e.identificador}`))
                          ? 'Desmarcar'
                          : 'Selecionar'}{' '}
                        todos
                      </Button>
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 mt-2">
                    {elementosFiltrados.partes.map((elemento) => (
                      <ElementoItem
                        key={elemento.identificador}
                        elemento={elemento}
                        isSelected={selectedElements.has(`partes:${elemento.identificador}`)}
                        onToggle={() => toggleElement(`partes:${elemento.identificador}`)}
                        showCheckbox={false}
                      />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Endereços */}
              {elementosFiltrados.enderecos.length > 0 && (
                <Collapsible open={enderecosOpen} onOpenChange={setEnderecosOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between p-3 h-auto">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-green-500" />
                        <span className="font-medium">Endereços</span>
                        <Badge variant="outline" className="ml-2">
                          {elementosFiltrados.enderecos.length}
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleAllOfType('enderecos', elementosFiltrados.enderecos);
                        }}
                      >
                        {elementosFiltrados.enderecos
                          .filter((e) => e.statusPersistencia !== 'erro')
                          .every((e) => selectedElements.has(`enderecos:${e.identificador}`))
                          ? 'Desmarcar'
                          : 'Selecionar'}{' '}
                        todos
                      </Button>
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 mt-2">
                    {elementosFiltrados.enderecos.map((elemento) => (
                      <ElementoItem
                        key={elemento.identificador}
                        elemento={elemento}
                        isSelected={selectedElements.has(`enderecos:${elemento.identificador}`)}
                        onToggle={() => toggleElement(`enderecos:${elemento.identificador}`)}
                      />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Representantes */}
              {elementosFiltrados.representantes.length > 0 && (
                <Collapsible open={representantesOpen} onOpenChange={setRepresentantesOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between p-3 h-auto">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-purple-500" />
                        <span className="font-medium">Representantes</span>
                        <Badge variant="outline" className="ml-2">
                          {elementosFiltrados.representantes.length}
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleAllOfType('representantes', elementosFiltrados.representantes);
                        }}
                      >
                        {elementosFiltrados.representantes
                          .filter((e) => e.statusPersistencia !== 'erro')
                          .every((e) => selectedElements.has(`representantes:${e.identificador}`))
                          ? 'Desmarcar'
                          : 'Selecionar'}{' '}
                        todos
                      </Button>
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 mt-2">
                    {elementosFiltrados.representantes.map((elemento) => (
                      <ElementoItem
                        key={elemento.identificador}
                        elemento={elemento}
                        isSelected={selectedElements.has(`representantes:${elemento.identificador}`)}
                        onToggle={() => toggleElement(`representantes:${elemento.identificador}`)}
                        showCheckbox={false}
                      />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Mensagem quando não há elementos */}
              {elementosFiltrados.partes.length === 0 &&
                elementosFiltrados.enderecos.length === 0 &&
                elementosFiltrados.representantes.length === 0 && (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <AlertTitle>
                      {mostrarApenasFaltantes
                        ? 'Nenhum elemento faltante'
                        : 'Nenhum elemento encontrado'}
                    </AlertTitle>
                    <AlertDescription>
                      {mostrarApenasFaltantes
                        ? 'Todos os elementos já foram persistidos no PostgreSQL.'
                        : 'O payload não contém elementos para exibir.'}
                    </AlertDescription>
                  </Alert>
                )}
            </>
          )}
        </CardContent>
      </Card>

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
            Processados: {resultado.totalElementos} | Sucessos: {resultado.totalSucessos} | Erros:{' '}
            {resultado.totalErros}
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
        forcarAtualizacao={forcarAtualizacao}
        onForcarAtualizacaoChange={setForcarAtualizacao}
      />
    </div>
  );
}
