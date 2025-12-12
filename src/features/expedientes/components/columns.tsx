'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, FileText, CheckCircle2, AlertTriangle, Scale, Eye, Pencil, FileDown } from 'lucide-react';
import { Expediente, GrauTribunal, CodigoTribunal, GRAU_TRIBUNAL_LABELS } from '../domain';
import { actionAtualizarExpediente } from '../actions';
import { ExpedienteVisualizarDialog } from './expediente-visualizar-dialog';
import { ExpedientesBaixarDialog } from './expedientes-baixar-dialog';
import { ExpedientesReverterBaixaDialog } from './expedientes-reverter-baixa-dialog';
import { ParteDetalheDialog } from './parte-detalhe-dialog';
import { PdfViewerDialog } from './pdf-viewer-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import { getSemanticBadgeVariant } from '@/lib/design-system';

// =============================================================================
// HELPER COMPONENTS (CELL RENDERERS)
// =============================================================================

// Função getTipoExpedienteColorClass removida.
// Agora usamos getSemanticBadgeVariant('expediente_tipo', tipoId) de @/lib/design-system

export function TipoDescricaoCell({
  expediente,
  onSuccess,
  tiposExpedientes = [],
  isLoadingTipos
}: {
  expediente: Expediente;
  onSuccess: () => void;
  tiposExpedientes?: Array<{ id: number; tipoExpediente: string }>;
  isLoadingTipos?: boolean;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isPdfViewerOpen, setIsPdfViewerOpen] = React.useState(false);
  const [tipoSelecionado, setTipoSelecionado] = React.useState<string>(
    expediente.tipoExpedienteId?.toString() || 'null'
  );
  const [descricao, setDescricao] = React.useState<string>(
    expediente.descricaoArquivos || ''
  );

  React.useEffect(() => {
    setTipoSelecionado(expediente.tipoExpedienteId?.toString() || 'null');
    setDescricao(expediente.descricaoArquivos || '');
  }, [expediente.tipoExpedienteId, expediente.descricaoArquivos]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const tipoExpedienteId = tipoSelecionado === 'null' ? null : parseInt(tipoSelecionado, 10);
      const descricaoArquivos = descricao.trim() || null;

      const formData = new FormData();
      if (tipoExpedienteId !== null) formData.append('tipoExpedienteId', tipoExpedienteId.toString());
      if (descricaoArquivos !== null) formData.append('descricaoArquivos', descricaoArquivos);

      const result = await actionAtualizarExpediente(expediente.id, null, formData);

      if (!result.success) {
        throw new Error(result.message || 'Erro ao atualizar tipo e descrição');
      }

      setIsOpen(false);
      onSuccess(); // Triggers router.refresh()
    } catch (error) {
      console.error('Erro ao atualizar tipo e descrição:', error);
      // TODO: Adicionar tratamento de erro na UI
    } finally {
      setIsLoading(false);
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
      <div className="relative min-h-10 max-w-[300px] group">
        <div className="w-full min-h-10 flex items-start gap-2 pr-8 py-2">
          <div className="flex flex-col items-start justify-start gap-1.5 flex-1">
            {/* Badge de tipo seguido do ícone de documento - usa sistema semântico */}
            <div className="flex items-center gap-1.5">
              <Badge
                variant={badgeVariant}
                className="w-fit text-xs shrink-0"
              >
                {tipoNome}
              </Badge>
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
            <div className="text-xs text-muted-foreground w-full wrap-break-word whitespace-pre-wrap leading-relaxed indent-0 text-justify">
              {descricaoExibicao}
            </div>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity absolute top-1 right-1"
          title="Editar tipo e descrição"
          onClick={() => setIsOpen(true)}
        >
          <Pencil className="h-3 w-3" />
        </Button>
      </div>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[min(92vw,31.25rem)]">
          <DialogHeader>
            <DialogTitle>Editar Tipo e Descrição</DialogTitle>
            <DialogDescription>Atualize o tipo de expediente e a descrição dos arquivos</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Expediente</label>
              <Select value={tipoSelecionado} onValueChange={setTipoSelecionado} disabled={isLoading || tiposExpedientes.length === 0}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o tipo">
                    {tipoSelecionado === 'null' ? 'Sem tipo' : tiposExpedientes.find(t => t.id.toString() === tipoSelecionado)?.tipoExpediente || 'Selecione o tipo'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="null">Sem tipo</SelectItem>
                  {tiposExpedientes.length > 0 ? (
                    tiposExpedientes.map((tipo) => (
                      <SelectItem key={tipo.id} value={tipo.id.toString()}>{tipo.tipoExpediente}</SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      {isLoadingTipos ? 'Carregando tipos...' : 'Nenhum tipo disponível'}
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição / Arquivos</label>
              <Textarea
                value={descricao}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescricao(e.target.value)}
                placeholder="Descreva o conteúdo do expediente..."
                className="resize-none"
                rows={5}
                disabled={isLoading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading && <span className="mr-2 animate-spin">⏳</span>}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <PdfViewerDialog
        open={isPdfViewerOpen}
        onOpenChange={setIsPdfViewerOpen}
        fileKey={expediente.arquivoKey}
        documentTitle={`Documento - ${expediente.numeroProcesso}`}
      />
    </>
  );
}

export function PrazoCell({ expediente }: { expediente: Expediente }) {
  const dataPrazo = expediente.dataPrazoLegalParte;
  if (!dataPrazo) return <span className="text-xs text-muted-foreground">-</span>;

  const date = new Date(dataPrazo);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const diffTime = date.getTime() - hoje.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let colorClass = "text-muted-foreground";
  if (expediente.baixadoEm) {
    colorClass = "text-muted-foreground line-through opacity-70";
  } else if (diffDays < 0) {
    colorClass = "text-red-500 font-bold";
  } else if (diffDays <= 2) {
    colorClass = "text-orange-500 font-medium";
  } else if (diffDays <= 5) {
    colorClass = "text-yellow-600 font-medium";
  }

  return (
    <div className="flex flex-col items-center">
      <span className={`text-xs ${colorClass}`}>
        {date.toLocaleDateString('pt-BR')}
      </span>
      {expediente.baixadoEm && (
         <span className="text-[10px] text-muted-foreground mt-0.5">
           (Baixado)
         </span>
      )}
    </div>
  );
}

export function ResponsavelCell({ expediente, usuarios = [] }: { expediente: Expediente; usuarios?: any[] }) {
    const responsavel = usuarios.find(u => u.id === expediente.responsavelId);
    return (
        <div className="text-xs text-center max-w-[100px] truncate" title={responsavel?.nomeExibicao || '-'}>
            {responsavel?.nomeExibicao || '-'}
        </div>
    );
}

export function ObservacoesCell({ expediente, onSuccess }: { expediente: Expediente; onSuccess: () => void }) {
    const [isEditing, setIsEditing] = React.useState(false);
    const [text, setText] = React.useState(expediente.observacoes || '');
    const [isLoading, setIsLoading] = React.useState(false);

    const handleSave = async () => {
        if (text === (expediente.observacoes || '')) {
            setIsEditing(false);
            return;
        }

        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append('observacoes', text);
            const result = await actionAtualizarExpediente(expediente.id, null, formData);
            if (result.success) {
                onSuccess();
                setIsEditing(false);
            } else {
                console.error(result.message);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isEditing) {
        return (
            <div className="flex flex-col gap-1 min-w-[200px]">
                <Textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="h-20 text-xs"
                    placeholder="Adicione observações..."
                />
                <div className="flex justify-end gap-1">
                     <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="h-6 w-6 p-0"><span className="sr-only">Cancelar</span>❌</Button>
                     <Button size="sm" variant="ghost" onClick={handleSave} disabled={isLoading} className="h-6 w-6 p-0"><span className="sr-only">Salvar</span>✅</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="group relative min-w-[100px] min-h-[20px] cursor-pointer" onClick={() => setIsEditing(true)}>
             <div className="text-xs text-muted-foreground whitespace-pre-wrap break-words max-h-[80px] overflow-hidden text-ellipsis">
                 {expediente.observacoes || <span className="opacity-30 italic">Sem obs.</span>}
             </div>
             <Pencil className="absolute top-0 right-0 h-3 w-3 opacity-0 group-hover:opacity-50" />
        </div>
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
  usuarios: any[];
  tiposExpedientes: any[];
}) {
  const [showVisualizar, setShowVisualizar] = React.useState(false);
  const [showBaixar, setShowBaixar] = React.useState(false);
  const [showReverter, setShowReverter] = React.useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setShowVisualizar(true)}>
            <Eye className="mr-2 h-4 w-4" />
            Visualizar Detalhes
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {!expediente.baixadoEm ? (
            <DropdownMenuItem onClick={() => setShowBaixar(true)}>
              <CheckCircle2 className="mr-2 h-4 w-4 text-success" />
              Baixar Expediente
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => setShowReverter(true)}>
              <AlertTriangle className="mr-2 h-4 w-4 text-warning" />
              Reverter Baixa
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

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
    usuarios: any[];
    tiposExpedientes: any[];
    onSuccess: () => void;
}

export const columns: ColumnDef<Expediente>[] = [
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
  {
    accessorKey: "dataPrazoLegalParte",
    header: "Prazo",
    cell: ({ row }) => <PrazoCell expediente={row.original} />,
    size: 100,
  },
  {
    accessorKey: "processo",
    header: "Processo / Tribunal",
    cell: ({ row }) => {
      const e = row.original;
      return (
        <div className="flex flex-col gap-0.5 max-w-[150px]">
          <span className="font-medium text-xs truncate" title={e.numeroProcesso}>
            {e.numeroProcesso}
          </span>
          <div className="flex items-center gap-1">
             <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">{e.trt}</Badge>
             <span className="text-[10px] text-muted-foreground truncate" title={GRAU_TRIBUNAL_LABELS[e.grau]}>
                 {GRAU_TRIBUNAL_LABELS[e.grau]?.split(' ')[0]}
             </span>
          </div>
        </div>
      );
    },
    size: 180,
  },
  {
    id: 'partes',
    header: 'Partes',
    cell: ({ row }) => {
        const e = row.original;
        return (
            <div className="flex flex-col gap-1 max-w-[200px]">
               <ParteDetalheButton
                 nome={e.nomeParteAutora}
                 processoId={e.processoId}
                 polo="ATIVO"
               />
               <ParteDetalheButton
                 nome={e.nomeParteRe}
                 processoId={e.processoId}
                 polo="PASSIVO"
               />
            </div>
        );
    },
    size: 200,
  },
  {
    accessorKey: "tipoDescricao",
    header: "Tipo / Descrição",
    cell: ({ row, table }) => {
       const meta = table.options.meta as ExpedientesTableMeta;
       return <TipoDescricaoCell
                expediente={row.original}
                onSuccess={meta?.onSuccess || (() => {})}
                tiposExpedientes={meta?.tiposExpedientes || []}
                // isLoadingTipos could be passed via meta if needed
              />;
    },
    size: 300,
  },
  {
      accessorKey: "responsavelId",
      header: "Resp.",
      cell: ({ row, table }) => {
          const meta = table.options.meta as ExpedientesTableMeta;
           return <ResponsavelCell expediente={row.original} usuarios={meta?.usuarios} />;
      },
      size: 100,
  },
  {
      accessorKey: "observacoes",
      header: "Observações",
      cell: ({ row, table }) => {
          const meta = table.options.meta as ExpedientesTableMeta;
            return <ObservacoesCell expediente={row.original} onSuccess={meta?.onSuccess} />;
      },
      size: 200,
  },
  {
    id: "actions",
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
    size: 50,
  },
];

// Helper component for Parte Button
function ParteDetalheButton({ nome, processoId, polo }: { nome: string | null; processoId: number | null; polo: 'ATIVO' | 'PASSIVO' }) {
    const [open, setOpen] = React.useState(false);
    if (!nome) return <span className="text-xs text-muted-foreground">-</span>;

    return (
        <>
        <Badge
            variant={getSemanticBadgeVariant('polo', polo)}
            className="cursor-pointer w-fit max-w-full truncate block"
            onClick={() => setOpen(true)}
            title={nome}
        >
            {nome}
        </Badge>
        <ParteDetalheDialog
            open={open}
            onOpenChange={setOpen}
            processoId={processoId}
            polo={polo}
            nomeExibido={nome}
        />
        </>
    );
}
