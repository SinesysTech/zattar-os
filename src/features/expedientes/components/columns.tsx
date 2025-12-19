'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, CheckCircle2, RotateCcw, Eye, Pencil } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Expediente, GrauTribunal, GRAU_TRIBUNAL_LABELS } from '../domain';
import { actionAtualizarExpediente } from '../actions';
import { ExpedienteVisualizarDialog } from './expediente-visualizar-dialog';
import { ExpedientesBaixarDialog } from './expedientes-baixar-dialog';
import { ExpedientesReverterBaixaDialog } from './expedientes-reverter-baixa-dialog';
import { PdfViewerDialog } from './pdf-viewer-dialog';
import { DialogFormShell } from '@/components/shared/dialog-form-shell';
import { EditableTextCell } from '@/components/shared/data-shell';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getSemanticBadgeVariant } from '@/lib/design-system';

// =============================================================================
// TYPES
// =============================================================================

interface Usuario {
  id: number;
  nomeExibicao: string;
}

interface TipoExpediente {
  id: number;
  tipoExpediente: string;
}

// =============================================================================
// HELPER COMPONENTS (CELL RENDERERS)
// =============================================================================

// Função getTipoExpedienteColorClass removida.
// Agora usamos getSemanticBadgeVariant('expediente_tipo', tipoId) de @/lib/design-system

/**
 * Badge composto para Tribunal + Grau
 * Metade esquerda mostra o TRT (azul), metade direita mostra o Grau (cor por nível)
 * Baseado no padrão OabSituacaoBadge de representantes
 */
function TribunalGrauBadge({ trt, grau }: { trt: string; grau: GrauTribunal }) {
  const grauLabel = GRAU_TRIBUNAL_LABELS[grau] || grau;

  // Classes de cor baseadas no grau
  const grauColorClasses: Record<GrauTribunal, string> = {
    primeiro_grau: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
    segundo_grau: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
    tribunal_superior: 'bg-violet-500/15 text-violet-700 dark:text-violet-400',
  };

  return (
    <div className="inline-flex items-center text-sm font-medium shrink-0">
      {/* Tribunal (lado esquerdo - azul, arredondado à esquerda) */}
      <span className="bg-sky-500/15 text-sky-700 dark:text-sky-400 px-2 py-0.5 rounded-l-full">
        {trt}
      </span>
      {/* Grau (lado direito - cor baseada no grau, arredondado à direita) */}
      <span className={cn(
        'px-2 py-0.5 border-l border-background/50 rounded-r-full',
        grauColorClasses[grau] || 'bg-muted text-muted-foreground'
      )}>
        {grauLabel}
      </span>
    </div>
  );
}

export function TipoDescricaoCell({
  expediente,
  onSuccess,
  tiposExpedientes = [],
  isLoadingTipos
}: {
  expediente: Expediente;
  onSuccess: () => void;
  tiposExpedientes?: TipoExpediente[];
  isLoadingTipos?: boolean;
}) {
  // Estados separados para cada interação
  const [isDescricaoDialogOpen, setIsDescricaoDialogOpen] = React.useState(false);
  const [isTipoPopoverOpen, setIsTipoPopoverOpen] = React.useState(false);
  const [isPdfViewerOpen, setIsPdfViewerOpen] = React.useState(false);

  const [isLoadingTipo, setIsLoadingTipo] = React.useState(false);
  const [isLoadingDescricao, setIsLoadingDescricao] = React.useState(false);

  const [descricao, setDescricao] = React.useState<string>(
    expediente.descricaoArquivos || ''
  );

  React.useEffect(() => {
    setDescricao(expediente.descricaoArquivos || '');
  }, [expediente.descricaoArquivos]);

  // Salvar apenas tipo
  const handleSaveTipo = async (tipoId: string) => {
    setIsLoadingTipo(true);
    try {
      const tipoExpedienteId = tipoId === 'null' ? null : parseInt(tipoId, 10);
      const formData = new FormData();
      if (tipoExpedienteId !== null) {
        formData.append('tipoExpedienteId', tipoExpedienteId.toString());
      } else {
        formData.append('tipoExpedienteId', '');
      }

      const result = await actionAtualizarExpediente(expediente.id, null, formData);
      if (!result.success) {
        throw new Error(result.message || 'Erro ao atualizar tipo');
      }
      setIsTipoPopoverOpen(false);
      onSuccess();
    } catch (error) {
      console.error('Erro ao atualizar tipo:', error);
    } finally {
      setIsLoadingTipo(false);
    }
  };

  // Salvar apenas descrição
  const handleSaveDescricao = async () => {
    setIsLoadingDescricao(true);
    try {
      const descricaoArquivos = descricao.trim() || null;
      const formData = new FormData();
      formData.append('descricaoArquivos', descricaoArquivos || '');

      const result = await actionAtualizarExpediente(expediente.id, null, formData);
      if (!result.success) {
        throw new Error(result.message || 'Erro ao atualizar descrição');
      }
      setIsDescricaoDialogOpen(false);
      onSuccess();
    } catch (error) {
      console.error('Erro ao atualizar descrição:', error);
    } finally {
      setIsLoadingDescricao(false);
    }
  };

  const tipoExpediente = tiposExpedientes?.find(t => t.id === expediente.tipoExpedienteId);
  const tipoNome = tipoExpediente ? tipoExpediente.tipoExpediente : 'Sem tipo';
  const descricaoExibicao = expediente.descricaoArquivos || '-';
  const temDocumento = !!expediente.arquivoKey;

  const badgeVariant = expediente.tipoExpedienteId
    ? getSemanticBadgeVariant('expediente_tipo', expediente.tipoExpedienteId)
    : 'outline';

  return (
    <>
      <div className="flex flex-col items-start gap-0.5 w-full">
        {/* Badge de tipo (clicável - abre popover) + ícone de documento */}
        <div className="flex items-center gap-1.5">
          <Popover open={isTipoPopoverOpen} onOpenChange={setIsTipoPopoverOpen}>
            <PopoverTrigger asChild>
              <button type="button" className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded">
                <Badge
                  variant={badgeVariant}
                  className="w-fit text-xs shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  {tipoNome}
                </Badge>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="start">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Tipo de Expediente</p>
                <Select
                  value={expediente.tipoExpedienteId?.toString() || 'null'}
                  onValueChange={handleSaveTipo}
                  disabled={isLoadingTipo || tiposExpedientes.length === 0}
                >
                  <SelectTrigger className="w-full h-8 text-sm">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    <SelectItem value="null">Sem tipo</SelectItem>
                    {tiposExpedientes.length > 0 ? (
                      tiposExpedientes.map((tipo) => (
                        <SelectItem key={tipo.id} value={tipo.id.toString()}>{tipo.tipoExpediente}</SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        {isLoadingTipos ? 'Carregando...' : 'Nenhum tipo'}
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </PopoverContent>
          </Popover>
          {temDocumento && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setIsPdfViewerOpen(true); }}
              className="p-1 hover:bg-accent rounded-md transition-colors"
              title="Visualizar documento"
            >
              <FileText className="h-3.5 w-3.5 text-primary" />
            </button>
          )}
        </div>

        {/* Descrição (clicável - abre dialog) */}
        <button
          type="button"
          onClick={() => setIsDescricaoDialogOpen(true)}
          className="text-sm text-muted-foreground w-full text-justify whitespace-pre-wrap leading-relaxed cursor-pointer hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded"
        >
          {descricaoExibicao}
        </button>
      </div>

      <DialogFormShell
        open={isDescricaoDialogOpen}
        onOpenChange={setIsDescricaoDialogOpen}
        title="Editar Descrição"
        description="Atualize a descrição do expediente"
        maxWidth="md"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" onClick={() => setIsDescricaoDialogOpen(false)} disabled={isLoadingDescricao}>Cancelar</Button>
            <Button onClick={handleSaveDescricao} disabled={isLoadingDescricao}>
              {isLoadingDescricao && <span className="mr-2 animate-spin">⏳</span>}
              Salvar
            </Button>
          </div>
        }
      >
        <div className="py-2">
          <Textarea
            value={descricao}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescricao(e.target.value)}
            placeholder="Descreva o conteúdo do expediente..."
            className="resize-none"
            rows={5}
            disabled={isLoadingDescricao}
          />
        </div>
      </DialogFormShell>

      <PdfViewerDialog
        open={isPdfViewerOpen}
        onOpenChange={setIsPdfViewerOpen}
        fileKey={expediente.arquivoKey}
        documentTitle={`Documento - ${expediente.numeroProcesso}`}
      />
    </>
  );
}

/**
 * Badge composto para Prazo (Início + Fim)
 * Layout vertical: início em cima (verde), fim embaixo (vermelho)
 * Sem bordas, cores semânticas
 */
function PrazoBadge({ dataInicio, dataFim, baixado }: {
  dataInicio: string | null;
  dataFim: string | null;
  baixado: boolean;
}) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  // Se não tem nenhuma data, mostra placeholder
  if (!dataInicio && !dataFim) {
    return <span className="text-sm text-muted-foreground">-</span>;
  }

  const opacityClass = baixado ? 'opacity-50' : '';

  return (
    <div className={cn("inline-flex flex-col items-center text-sm font-medium shrink-0 gap-0.5", opacityClass)}>
      {/* Data Início (verde - arredondado) */}
      <span className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full">
        {formatDate(dataInicio)}
      </span>
      {/* Data Fim (vermelho - arredondado) */}
      <span className="bg-red-500/15 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full">
        {formatDate(dataFim)}
      </span>
    </div>
  );
}

export function PrazoCell({ expediente }: { expediente: Expediente }) {
  const baixado = !!expediente.baixadoEm;

  return (
    <div className="flex flex-col items-center gap-0.5">
      <PrazoBadge
        dataInicio={expediente.dataCienciaParte}
        dataFim={expediente.dataPrazoLegalParte}
        baixado={baixado}
      />
      {baixado && (
        <span className="text-xs text-muted-foreground">
          (Baixado)
        </span>
      )}
    </div>
  );
}

export function ResponsavelCell({ expediente, usuarios = [] }: { expediente: Expediente; usuarios?: Usuario[] }) {
  const responsavel = usuarios.find(u => u.id === expediente.responsavelId);
  return (
    <div className="text-sm text-center max-w-[100px] truncate" title={responsavel?.nomeExibicao || '-'}>
      {responsavel?.nomeExibicao || '-'}
    </div>
  );
}

export function ObservacoesCell({ expediente, onSuccess }: { expediente: Expediente; onSuccess: () => void }) {
  const handleSave = async (newText: string) => {
    try {
      const formData = new FormData();
      formData.append('observacoes', newText);
      const result = await actionAtualizarExpediente(expediente.id, null, formData);
      if (result.success) {
        onSuccess();
      } else {
        throw new Error(result.message || 'Erro ao atualizar observações');
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  return (
    <EditableTextCell
      value={expediente.observacoes}
      onSave={handleSave}
      title="Observações"
      description={`Editar observações do processo ${expediente.numeroProcesso}`}
      placeholder="Adicione observações aqui..."
    />
  );
}

// =============================================================================
// ACTIONS COLUMN
// =============================================================================

export function ExpedienteActions({
  expediente,
  onSuccess,
  usuarios,
  tiposExpedientes,
}: {
  expediente: Expediente;
  onSuccess: () => void;
  usuarios: Usuario[];
  tiposExpedientes: TipoExpediente[];
}) {
  const [showVisualizar, setShowVisualizar] = React.useState(false);
  const [showBaixar, setShowBaixar] = React.useState(false);
  const [showReverter, setShowReverter] = React.useState(false);

  return (
    <>
      <div className="flex items-center justify-center gap-1">
        {/* Visualizar */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowVisualizar(true)}
            >
              <Eye className="h-4 w-4" />
              <span className="sr-only">Visualizar</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Visualizar</TooltipContent>
        </Tooltip>

        {/* Baixar (se não baixado) */}
        {!expediente.baixadoEm && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-success hover:text-success"
                onClick={() => setShowBaixar(true)}
              >
                <CheckCircle2 className="h-4 w-4" />
                <span className="sr-only">Baixar Expediente</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Baixar Expediente</TooltipContent>
          </Tooltip>
        )}

        {/* Reverter (se baixado) */}
        {expediente.baixadoEm && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-warning hover:text-warning"
                onClick={() => setShowReverter(true)}
              >
                <RotateCcw className="h-4 w-4" />
                <span className="sr-only">Reverter Baixa</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reverter Baixa</TooltipContent>
          </Tooltip>
        )}
      </div>

      <ExpedienteVisualizarDialog
        open={showVisualizar}
        onOpenChange={setShowVisualizar}
        expediente={expediente}
        usuarios={usuarios}
        tiposExpedientes={tiposExpedientes}
      />

      <ExpedientesBaixarDialog
        open={showBaixar}
        onOpenChange={setShowBaixar}
        expediente={expediente}
        onSuccess={onSuccess}
      />

      <ExpedientesReverterBaixaDialog
        open={showReverter}
        onOpenChange={setShowReverter}
        expediente={expediente}
        onSuccess={onSuccess}
      />
    </>
  );
}

// =============================================================================
// COLUMN DEFINITIONS
// =============================================================================

export interface ExpedientesTableMeta {
  usuarios: Usuario[];
  tiposExpedientes: TipoExpediente[];
  onSuccess: () => void;
}

export const columns: ColumnDef<Expediente>[] = [
  // 1. Select (checkbox)
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 40,
  },
  // 2. Prazo (badge vertical: início verde em cima, fim vermelho embaixo)
  {
    accessorKey: "dataPrazoLegalParte",
    header: "Prazo",
    cell: ({ row }) => <PrazoCell expediente={row.original} />,
    size: 80,
  },
  // 3. Expediente (tipo + descrição)
  {
    accessorKey: "tipoDescricao",
    header: "Expediente",
    meta: { align: 'left' as const },
    cell: ({ row, table }) => {
      const meta = table.options.meta as ExpedientesTableMeta;
      return <TipoDescricaoCell
        expediente={row.original}
        onSuccess={meta?.onSuccess || (() => { })}
        tiposExpedientes={meta?.tiposExpedientes || []}
      />;
    },
    size: 280,
  },
  // 4. Processo (coluna composta: Tribunal+Grau, Classe+Número, Órgão Julgador, Partes)
  {
    id: "processo",
    accessorKey: "numeroProcesso",
    header: "Processo",
    meta: { align: 'left' as const },
    cell: ({ row }) => {
      const e = row.original;
      return (
        <div className="flex flex-col gap-px items-start">
          {/* Linha 1: Badge Tribunal + Grau */}
          <TribunalGrauBadge trt={e.trt} grau={e.grau} />

          {/* Linha 2: Classe processual + Número do processo */}
          <span className="text-sm" title={`${e.classeJudicial ? e.classeJudicial + ' ' : ''}${e.numeroProcesso}`}>
            {e.classeJudicial && <span>{e.classeJudicial} </span>}
            {e.numeroProcesso}
          </span>

          {/* Linha 3: Órgão julgador */}
          <span className="text-sm text-muted-foreground" title={e.descricaoOrgaoJulgador ?? undefined}>
            {e.descricaoOrgaoJulgador}
          </span>

          {/* Partes com badges de polo (nome dentro do badge) */}
          <div className="flex flex-col gap-px">
            {/* Polo Ativo (Autor) - nome dentro do badge */}
            <div className="flex items-center gap-1 text-sm">
              <Badge variant={getSemanticBadgeVariant('polo', 'ATIVO')} className="text-sm px-1.5 py-0">
                {e.nomeParteAutora || '-'}
              </Badge>
              {(e.qtdeParteAutora ?? 0) > 1 && (
                <span className="text-muted-foreground text-sm shrink-0">+{(e.qtdeParteAutora ?? 1) - 1}</span>
              )}
            </div>
            {/* Polo Passivo (Réu) - nome dentro do badge */}
            <div className="flex items-center gap-1 text-sm">
              <Badge variant={getSemanticBadgeVariant('polo', 'PASSIVO')} className="text-sm px-1.5 py-0">
                {e.nomeParteRe || '-'}
              </Badge>
              {(e.qtdeParteRe ?? 0) > 1 && (
                <span className="text-muted-foreground text-sm shrink-0">+{(e.qtdeParteRe ?? 1) - 1}</span>
              )}
            </div>
          </div>
        </div>
      );
    },
    size: 260,
  },
  // 5. Observações
  {
    accessorKey: "observacoes",
    header: "Observações",
    cell: ({ row, table }) => {
      const meta = table.options.meta as ExpedientesTableMeta;
      return <ObservacoesCell expediente={row.original} onSuccess={meta?.onSuccess} />;
    },
    size: 180,
  },
  // 6. Responsável (penúltima)
  {
    accessorKey: "responsavelId",
    header: "Responsável",
    cell: ({ row, table }) => {
      const meta = table.options.meta as ExpedientesTableMeta;
      return <ResponsavelCell expediente={row.original} usuarios={meta?.usuarios} />;
    },
    size: 100,
  },
  // 7. Ações (última, com título)
  {
    id: "actions",
    header: () => <span className="text-center block">Ações</span>,
    cell: ({ row, table }) => {
      const meta = table.options.meta as ExpedientesTableMeta;
      return (
        <ExpedienteActions
          expediente={row.original}
          onSuccess={meta?.onSuccess}
          usuarios={meta?.usuarios}
          tiposExpedientes={meta?.tiposExpedientes}
        />
      );
    },
    size: 80,
  },
];
