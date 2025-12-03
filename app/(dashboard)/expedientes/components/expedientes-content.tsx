'use client';

// Componente compartilhado de conteúdo de expedientes para diferentes visualizações

import * as React from 'react';
import { useDebounce } from '@/app/_lib/hooks/use-debounce';
import { DataTable } from '@/components/ui/data-table';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { NovoExpedienteDialog } from './novo-expediente-dialog';
import {
  buildExpedientesFilterOptions,
  buildExpedientesFilterGroups,
  parseExpedientesFilters,
} from './expedientes-toolbar-filters';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ButtonGroup, ButtonGroupText } from '@/components/ui/button-group';
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  FileText,
  Pencil,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ExpedientesVisualizacaoSemana } from './expedientes-visualizacao-semana';
import { ExpedientesVisualizacaoMes } from './expedientes-visualizacao-mes';
import { ExpedientesVisualizacaoAno } from './expedientes-visualizacao-ano';
import { usePendentes } from '@/app/_lib/hooks/use-pendentes';
import { useMinhasPermissoes } from '@/app/_lib/hooks/use-minhas-permissoes';
import { useUsuarios } from '@/app/_lib/hooks/use-usuarios';
import { useTiposExpedientes } from '@/app/_lib/hooks/use-tipos-expedientes';
import { ExpedientesBaixarDialog } from './expedientes-baixar-dialog';
import { ExpedientesReverterBaixaDialog } from './expedientes-reverter-baixa-dialog';
import { ExpedienteVisualizarDialog } from './expediente-visualizar-dialog';
import { PdfViewerDialog } from './pdf-viewer-dialog';
import { ParteDetalheDialog } from './parte-detalhe-dialog';
import { CheckCircle2, Undo2, Eye } from 'lucide-react';
import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import type { PendenteManifestacao } from '@/backend/types/pendentes/types';
import type { ExpedientesFilters } from '@/app/_lib/types/expedientes';
import type { Usuario } from '@/backend/usuarios/services/persistence/usuario-persistence.service';

interface ExpedientesContentProps {
  viewMode: 'tabela' | 'semana' | 'mes' | 'ano';
}

/**
 * Formata data ISO para formato brasileiro (DD/MM/YYYY)
 */
const formatarData = (dataISO: string | null): string => {
  if (!dataISO) return '-';
  try {
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR');
  } catch {
    return '-';
  }
};

/**
 * Retorna a classe CSS de cor para badge da Parte Autora
 */
const getParteAutoraColorClass = (): string => {
  return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800';
};

/**
 * Retorna a classe CSS de cor para badge da Parte Ré
 */
const getParteReColorClass = (): string => {
  return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-800';
};

/**
 * Retorna a classe CSS de cor para badge do TRT
 */
const getTRTColorClass = (trt: string): string => {
  const trtColors: Record<string, string> = {
    'TRT1': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800',
    'TRT2': 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800',
    'TRT3': 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-800',
    'TRT4': 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900 dark:text-pink-200 dark:border-pink-800',
    'TRT5': 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-800',
    'TRT6': 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900 dark:text-indigo-200 dark:border-indigo-800',
  };
  return trtColors[trt] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-800';
};

/**
 * Retorna a classe CSS de cor para badge do grau
 */
const getGrauColorClass = (grau: 'primeiro_grau' | 'segundo_grau' | 'tribunal_superior'): string => {
  const grauColors: Record<string, string> = {
    'primeiro_grau': 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-200 dark:border-emerald-800',
    'tribunal_superior': 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-800',
    'segundo_grau': 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-800',
  };
  return grauColors[grau] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-800';
};

/**
 * Formata o grau para exibição
 */
const formatarGrau = (grau: 'primeiro_grau' | 'segundo_grau' | 'tribunal_superior'): string => {
  if (grau === 'primeiro_grau') return '1º Grau';
  if (grau === 'segundo_grau') return '2º Grau';
  if (grau === 'tribunal_superior') return 'Tribunal Superior';
  return grau;
};

/**
 * Retorna a classe CSS de cor para badge do tipo de expediente
 */
const getTipoExpedienteColorClass = (tipoId: number): string => {
  const colors = [
    'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800',
    'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800',
    'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-800',
    'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900 dark:text-pink-200 dark:border-pink-800',
    'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-800',
    'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900 dark:text-indigo-200 dark:border-indigo-800',
    'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-800',
    'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900 dark:text-teal-200 dark:border-teal-800',
    'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900 dark:text-cyan-200 dark:border-cyan-800',
    'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900 dark:text-rose-200 dark:border-rose-800',
    'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900 dark:text-violet-200 dark:border-violet-800',
    'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200 dark:bg-fuchsia-900 dark:text-fuchsia-200 dark:border-fuchsia-800',
  ];
  const index = (tipoId - 1) % colors.length;
  return colors[index];
};

/**
 * Feriados nacionais brasileiros fixos (formato MM-DD)
 */
const feriadosNacionaisFixos = [
  '01-01', '04-21', '05-01', '09-07', '10-12', '11-02', '11-15', '12-25',
];

const ehFeriadoNacional = (data: Date): boolean => {
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return feriadosNacionaisFixos.includes(`${mes}-${dia}`);
};

const ehDiaUtil = (data: Date): boolean => {
  const diaSemana = data.getDay();
  if (diaSemana === 0 || diaSemana === 6) return false;
  if (ehFeriadoNacional(data)) return false;
  return true;
};

const calcularDiasUteis = (dataInicio: string | null, dataFim: string | null): number | null => {
  if (!dataInicio || !dataFim) return null;
  try {
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    const dataAtual = new Date(inicio);
    dataAtual.setDate(dataAtual.getDate() + 1);
    while (!ehDiaUtil(dataAtual)) {
      dataAtual.setDate(dataAtual.getDate() + 1);
    }
    let diasUteis = 0;
    while (dataAtual <= fim) {
      if (ehDiaUtil(dataAtual)) diasUteis++;
      dataAtual.setDate(dataAtual.getDate() + 1);
    }
    return diasUteis;
  } catch {
    return null;
  }
};

const getCorBadgeDias = (dias: number): string => {
  switch (dias) {
    case 3: return 'bg-green-600 text-white hover:bg-green-700 border-0';
    case 5: return 'bg-orange-600 text-white hover:bg-orange-700 border-0';
    case 8: return 'bg-blue-600 text-white hover:bg-blue-700 border-0';
    default: return 'bg-purple-600 text-white hover:bg-purple-700 border-0';
  }
};

// Componente TipoDescricaoCell
function TipoDescricaoCell({
  expediente,
  onSuccess,
  tiposExpedientes,
  isLoadingTipos
}: {
  expediente: PendenteManifestacao;
  onSuccess: () => void;
  tiposExpedientes: Array<{ id: number; tipo_expediente: string }>;
  isLoadingTipos?: boolean;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isPdfViewerOpen, setIsPdfViewerOpen] = React.useState(false);
  const [tipoSelecionado, setTipoSelecionado] = React.useState<string>(
    expediente.tipo_expediente_id?.toString() || 'null'
  );
  const [descricao, setDescricao] = React.useState<string>(
    expediente.descricao_arquivos || ''
  );

  React.useEffect(() => {
    setTipoSelecionado(expediente.tipo_expediente_id?.toString() || 'null');
    setDescricao(expediente.descricao_arquivos || '');
  }, [expediente.tipo_expediente_id, expediente.descricao_arquivos]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const tipoExpedienteId = tipoSelecionado === 'null' ? null : parseInt(tipoSelecionado, 10);
      const descricaoArquivos = descricao.trim() || null;
      const response = await fetch(`/api/pendentes-manifestacao/${expediente.id}/tipo-descricao`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipoExpedienteId, descricaoArquivos }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || 'Erro ao atualizar tipo e descrição');
      }
      setIsOpen(false);
      onSuccess();
    } catch (error) {
      console.error('Erro ao atualizar tipo e descrição:', error);
      setIsOpen(false);
      onSuccess();
    } finally {
      setIsLoading(false);
    }
  };

  const tipoExpediente = tiposExpedientes.find(t => t.id === expediente.tipo_expediente_id);
  const tipoNome = tipoExpediente ? tipoExpediente.tipo_expediente : 'Sem tipo';
  const descricaoExibicao = expediente.descricao_arquivos || '-';
  const temDocumento = !!expediente.arquivo_key;

  return (
    <>
      <div className="relative min-h-10 max-w-[300px] group">
        <div className="w-full min-h-10 flex items-start gap-2 pr-8 py-2">
          <div className="flex flex-col items-start justify-start gap-1.5 flex-1">
            {/* Badge de tipo seguido do ícone de documento */}
            <div className="flex items-center gap-1.5">
              <Badge
                variant="outline"
                className={`w-fit text-xs shrink-0 ${expediente.tipo_expediente_id ? getTipoExpedienteColorClass(expediente.tipo_expediente_id) : ''}`}
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
                    {tipoSelecionado === 'null' ? 'Sem tipo' : tiposExpedientes.find(t => t.id.toString() === tipoSelecionado)?.tipo_expediente || 'Selecione o tipo'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="null">Sem tipo</SelectItem>
                  {tiposExpedientes.length > 0 ? (
                    tiposExpedientes.map((tipo) => (
                      <SelectItem key={tipo.id} value={tipo.id.toString()}>{tipo.tipo_expediente}</SelectItem>
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
                placeholder="Digite a descrição ou referência aos arquivos..."
                disabled={isLoading}
                rows={5}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <PdfViewerDialog
        open={isPdfViewerOpen}
        onOpenChange={setIsPdfViewerOpen}
        fileKey={expediente.arquivo_key}
        documentTitle={`Documento - ${expediente.numero_processo}`}
      />
    </>
  );
}

// Componente PrazoColumnHeader
function PrazoColumnHeader({ onSort }: { onSort: (field: 'data_ciencia_parte' | 'data_prazo_legal_parte', direction: 'asc' | 'desc') => void }) {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <div className="flex items-center justify-center">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="-ml-3 h-8 data-[state=open]:bg-accent">
            <span className="text-sm font-medium">Prazo</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1 h-4 w-4">
              <path d="m7 15 5 5 5-5" /><path d="m7 9 5-5 5 5" />
            </svg>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[min(92vw,12.5rem)] p-2" align="center">
          <div className="space-y-1">
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Ordenar por Data de Início</div>
            <Button variant="ghost" className="w-full justify-start text-sm" onClick={() => { onSort('data_ciencia_parte', 'asc'); setIsOpen(false); }}>↑ Crescente</Button>
            <Button variant="ghost" className="w-full justify-start text-sm" onClick={() => { onSort('data_ciencia_parte', 'desc'); setIsOpen(false); }}>↓ Decrescente</Button>
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">Ordenar por Data de Fim</div>
            <Button variant="ghost" className="w-full justify-start text-sm" onClick={() => { onSort('data_prazo_legal_parte', 'asc'); setIsOpen(false); }}>↑ Crescente</Button>
            <Button variant="ghost" className="w-full justify-start text-sm" onClick={() => { onSort('data_prazo_legal_parte', 'desc'); setIsOpen(false); }}>↓ Decrescente</Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Componente ProcessoColumnHeader
function ProcessoColumnHeader({ onSort }: { onSort: (field: 'trt' | 'grau' | 'descricao_orgao_julgador' | 'classe_judicial', direction: 'asc' | 'desc') => void }) {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <div className="flex items-center justify-center">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="-ml-3 h-8 data-[state=open]:bg-accent">
            <span className="text-sm font-medium">Processo</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1 h-4 w-4">
              <path d="m7 15 5 5 5-5" /><path d="m7 9 5-5 5 5" />
            </svg>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[min(92vw,13.75rem)] p-2" align="center">
          <div className="space-y-1">
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Ordenar por Tribunal</div>
            <Button variant="ghost" className="w-full justify-start text-sm" onClick={() => { onSort('trt', 'asc'); setIsOpen(false); }}>↑ Crescente</Button>
            <Button variant="ghost" className="w-full justify-start text-sm" onClick={() => { onSort('trt', 'desc'); setIsOpen(false); }}>↓ Decrescente</Button>
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">Ordenar por Grau</div>
            <Button variant="ghost" className="w-full justify-start text-sm" onClick={() => { onSort('grau', 'asc'); setIsOpen(false); }}>↑ Crescente</Button>
            <Button variant="ghost" className="w-full justify-start text-sm" onClick={() => { onSort('grau', 'desc'); setIsOpen(false); }}>↓ Decrescente</Button>
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">Ordenar por Órgão Julgador</div>
            <Button variant="ghost" className="w-full justify-start text-sm" onClick={() => { onSort('descricao_orgao_julgador', 'asc'); setIsOpen(false); }}>↑ Crescente</Button>
            <Button variant="ghost" className="w-full justify-start text-sm" onClick={() => { onSort('descricao_orgao_julgador', 'desc'); setIsOpen(false); }}>↓ Decrescente</Button>
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">Ordenar por Classe Judicial</div>
            <Button variant="ghost" className="w-full justify-start text-sm" onClick={() => { onSort('classe_judicial', 'asc'); setIsOpen(false); }}>↑ Crescente</Button>
            <Button variant="ghost" className="w-full justify-start text-sm" onClick={() => { onSort('classe_judicial', 'desc'); setIsOpen(false); }}>↓ Decrescente</Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Componente ResponsavelColumnHeader
function ResponsavelColumnHeader({ onSort }: { onSort: (direction: 'asc' | 'desc') => void }) {
  const [currentDirection, setCurrentDirection] = React.useState<'asc' | 'desc'>('asc');
  const handleClick = () => {
    const newDirection = currentDirection === 'asc' ? 'desc' : 'asc';
    setCurrentDirection(newDirection);
    onSort(newDirection);
  };
  return (
    <div className="flex items-center justify-center">
      <Button variant="ghost" size="sm" className="-ml-3 h-8 hover:bg-accent" onClick={handleClick}>
        <span className="text-sm font-medium">Responsável</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1 h-4 w-4">
          <path d="m7 15 5 5 5-5" /><path d="m7 9 5-5 5 5" />
        </svg>
      </Button>
    </div>
  );
}

// Componente ResponsavelCell
function ResponsavelCell({ expediente, onSuccess, usuarios }: { expediente: PendenteManifestacao; onSuccess: () => void; usuarios: Usuario[] }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSelect = async (value: string) => {
    setIsLoading(true);
    try {
      const responsavelId = value === 'null' || value === '' ? null : parseInt(value, 10);
      const response = await fetch(`/api/pendentes-manifestacao/${expediente.id}/responsavel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responsavelId }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || 'Erro ao atribuir responsável');
      }
      setIsOpen(false);
      onSuccess();
    } catch (error) {
      console.error('Erro ao atribuir responsável:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const responsavelAtual = usuarios.find(u => u.id === expediente.responsavel_id);

  return (
    <div className="relative group h-full w-full min-h-[60px] flex items-center justify-center p-2">
      <span className="text-sm">{responsavelAtual ? responsavelAtual.nomeExibicao : 'Sem responsável'}</span>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button size="sm" variant="ghost" className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-1 right-1" title="Editar responsável" disabled={isLoading}>
            <Pencil className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[min(92vw,15.625rem)] p-2">
          <div className="space-y-1">
            <Button variant="ghost" className="w-full justify-start text-sm" onClick={() => handleSelect('null')} disabled={isLoading}>Sem responsável</Button>
            {usuarios.map((usuario) => (
              <Button key={usuario.id} variant="ghost" className="w-full justify-start text-sm" onClick={() => handleSelect(usuario.id.toString())} disabled={isLoading}>{usuario.nomeExibicao}</Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Componente AcoesExpediente
function AcoesExpediente({
  expediente,
  usuarios,
  tiposExpedientes,
  onSuccess,
}: {
  expediente: PendenteManifestacao;
  usuarios: Usuario[];
  tiposExpedientes: Array<{ id: number; tipo_expediente: string }>;
  onSuccess: () => void;
}) {
  const [baixarDialogOpen, setBaixarDialogOpen] = React.useState(false);
  const [reverterDialogOpen, setReverterDialogOpen] = React.useState(false);
  const [visualizarDialogOpen, setVisualizarDialogOpen] = React.useState(false);

  const estaBaixado = !!expediente.baixado_em;

  return (
    <TooltipProvider>
      <div className="flex items-center justify-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setVisualizarDialogOpen(true)}>
              <Eye className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>Visualizar Expediente</p></TooltipContent>
        </Tooltip>
        {!estaBaixado ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setBaixarDialogOpen(true)}>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Baixar Expediente</p></TooltipContent>
          </Tooltip>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setReverterDialogOpen(true)}>
                <Undo2 className="h-4 w-4 text-amber-600" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Reverter Baixa</p></TooltipContent>
          </Tooltip>
        )}
      </div>
      <ExpedienteVisualizarDialog open={visualizarDialogOpen} onOpenChange={setVisualizarDialogOpen} expediente={expediente} usuarios={usuarios} tiposExpedientes={tiposExpedientes} />
      <ExpedientesBaixarDialog open={baixarDialogOpen} onOpenChange={setBaixarDialogOpen} expediente={expediente} onSuccess={onSuccess} />
      <ExpedientesReverterBaixaDialog open={reverterDialogOpen} onOpenChange={setReverterDialogOpen} expediente={expediente} onSuccess={onSuccess} />
    </TooltipProvider>
  );
}

// Componente PrazoCell - extraído para evitar violação de hooks
function PrazoCell({
  expediente,
  onSuccess
}: {
  expediente: PendenteManifestacao;
  onSuccess: () => void;
}) {
  const dataInicio = expediente.data_ciencia_parte;
  const dataFim = expediente.data_prazo_legal_parte;
  const diasUteis = calcularDiasUteis(dataInicio, dataFim);
  const [openPrazo, setOpenPrazo] = React.useState(false);
  const [isSavingPrazo, setIsSavingPrazo] = React.useState(false);
  const [dataPrazoStr, setDataPrazoStr] = React.useState<string>('');

  const handleSalvarPrazo = async () => {
    setIsSavingPrazo(true);
    try {
      const iso = dataPrazoStr ? new Date(dataPrazoStr).toISOString() : '';
      const response = await fetch(`/api/pendentes-manifestacao/${expediente.id}/prazo-legal`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataPrazoLegal: iso }),
      });
      if (!response.ok) {
        const ed = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(ed.error || 'Erro ao atualizar prazo legal');
      }
      setOpenPrazo(false);
      setDataPrazoStr('');
      onSuccess();
    } finally {
      setIsSavingPrazo(false);
    }
  };

  return (
    <div className="min-h-10 flex flex-col items-center justify-center gap-2 py-2">
      <div className="text-sm"><span className="font-semibold">Início:</span> {formatarData(dataInicio)}</div>
      <div className="text-sm"><span className="font-semibold">Fim:</span> {formatarData(dataFim)}</div>
      {diasUteis !== null && (
        <Badge className={`${getCorBadgeDias(diasUteis)} text-sm font-medium mt-1 px-3 py-1`}>
          {diasUteis} {diasUteis === 1 ? 'dia' : 'dias'}
        </Badge>
      )}
      {!expediente.baixado_em && !dataFim && (
        <Button size="sm" variant="outline" onClick={() => setOpenPrazo(true)}>Definir Data</Button>
      )}
      <Dialog open={openPrazo} onOpenChange={setOpenPrazo}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Definir Prazo Legal</DialogTitle>
            <DialogDescription>Defina a data de fim do prazo. A data de início será preenchida automaticamente com a data de criação do expediente.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Data de Início (automática)</Label>
              <Input
                type="text"
                value={expediente.created_at ? formatarData(expediente.created_at) : '-'}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">Data de criação do expediente</p>
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-medium">Data de Fim *</Label>
              <input type="date" className="border rounded p-2 w-full" value={dataPrazoStr} onChange={(e) => setDataPrazoStr(e.target.value)} aria-label="Data de fim do prazo" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenPrazo(false)} disabled={isSavingPrazo}>Cancelar</Button>
            <Button onClick={handleSalvarPrazo} disabled={isSavingPrazo || !dataPrazoStr}>{isSavingPrazo ? 'Salvando...' : 'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Componente ObservacoesCell - extraído para evitar violação de hooks
function ObservacoesCell({
  expediente,
  onSuccess
}: {
  expediente: PendenteManifestacao;
  onSuccess: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [valor, setValor] = React.useState<string>(expediente.observacoes || '');

  React.useEffect(() => { setValor(expediente.observacoes || ''); }, [expediente.observacoes]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const observacoes = valor.trim() || null;
      const response = await fetch(`/api/pendentes-manifestacao/${expediente.id}/observacoes`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ observacoes }) });
      if (!response.ok) {
        const ed = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(ed.error || 'Erro ao atualizar observações');
      }
      setOpen(false);
      onSuccess();
    } finally { setIsLoading(false); }
  };

  return (
    <div className="relative min-h-10 max-w-[300px] group">
      <div className="w-full min-h-10 flex items-start gap-2 pr-8 py-2">
        <div className="flex flex-col items-start justify-start gap-1.5 flex-1">
          <div className="text-xs text-muted-foreground w-full wrap-break-word whitespace-pre-wrap leading-relaxed indent-0 text-justify">{expediente.observacoes || '-'}</div>
        </div>
      </div>
      <Button size="sm" variant="ghost" className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-1 right-1" title="Editar observações" onClick={() => setOpen(true)}>
        <Pencil className="h-3 w-3" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[min(92vw,25rem)] sm:max-w-[min(92vw,37.5rem)]">
          <DialogHeader>
            <DialogTitle>Editar Observações</DialogTitle>
            <DialogDescription>Adicionar observações do expediente</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="observacoes-exp">Observações</Label>
              <Textarea id="observacoes-exp" value={valor} onChange={(e) => setValor(e.target.value)} disabled={isLoading} className="min-h-[250px] resize-y" />
              <p className="text-xs text-muted-foreground">{valor.length} caracteres</p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>Cancelar</Button>
            <Button type="button" onClick={handleSave} disabled={isLoading}>{isLoading ? 'Salvando...' : 'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Função para criar colunas
function criarColunas(
  onSuccess: () => void,
  usuarios: Usuario[],
  tiposExpedientes: Array<{ id: number; tipo_expediente: string }>,
  onPrazoSort: (field: 'data_ciencia_parte' | 'data_prazo_legal_parte', direction: 'asc' | 'desc') => void,
  onProcessoSort: (field: 'trt' | 'grau' | 'descricao_orgao_julgador' | 'classe_judicial', direction: 'asc' | 'desc') => void,
  onResponsavelSort: (direction: 'asc' | 'desc') => void,
  onParteClick: (processoId: number | null, polo: 'ATIVO' | 'PASSIVO', nome: string) => void,
  isLoadingTipos?: boolean
): ColumnDef<PendenteManifestacao>[] {
  return [
    {
      id: 'tipo_descricao',
      header: () => <div className="flex items-center justify-center"><div className="text-sm font-medium">Tipo e Descrição</div></div>,
      enableSorting: false,
      size: 300,
      cell: ({ row }) => <TipoDescricaoCell expediente={row.original} onSuccess={onSuccess} tiposExpedientes={tiposExpedientes} isLoadingTipos={isLoadingTipos} />,
    },
    {
      id: 'prazo',
      header: () => <PrazoColumnHeader onSort={onPrazoSort} />,
      enableSorting: false,
      size: 170,
      cell: ({ row }) => <PrazoCell expediente={row.original} onSuccess={onSuccess} />,
    },
    {
      id: 'processo_partes',
      header: () => <ProcessoColumnHeader onSort={onProcessoSort} />,
      enableSorting: false,
      size: 520,
      cell: ({ row }) => {
        const trt = row.original.trt;
        const grau = row.original.grau;
        const classeJudicial = row.original.classe_judicial || '';
        const numeroProcesso = row.original.numero_processo;
        const processoId = row.original.processo_id;
        const parteAutora = row.original.nome_parte_autora || '-';
        const parteRe = row.original.nome_parte_re || '-';
        const orgaoJulgador = row.original.descricao_orgao_julgador || '-';

        return (
          <TooltipProvider>
            <div className="min-h-10 flex flex-col items-start justify-center gap-1.5 max-w-[520px]">
              {/* Primeira linha: TRT e Grau */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge variant="outline" className={`${getTRTColorClass(trt)} w-fit text-xs`}>{trt}</Badge>
                <Badge variant="outline" className={`${getGrauColorClass(grau)} w-fit text-xs`}>{formatarGrau(grau)}</Badge>
              </div>
              {/* Segunda linha: Classe judicial + Número do processo + Olho */}
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium whitespace-nowrap flex items-center gap-1">
                  {classeJudicial && `${classeJudicial} `}
                  {numeroProcesso}
                  {processoId && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link href={`/processos/${processoId}`} className="inline-flex items-center hover:text-primary transition-colors ml-1">
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent><p>Ver timeline do processo</p></TooltipContent>
                    </Tooltip>
                  )}
                </span>
              </div>
              <Badge
                variant="outline"
                className={`${getParteAutoraColorClass()} block whitespace-nowrap max-w-full overflow-hidden text-ellipsis text-left ${processoId && parteAutora !== '-' ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                onClick={() => onParteClick(processoId, 'ATIVO', parteAutora)}
              >
                {parteAutora}
              </Badge>
              <Badge
                variant="outline"
                className={`${getParteReColorClass()} block whitespace-nowrap max-w-full overflow-hidden text-ellipsis text-left ${processoId && parteRe !== '-' ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                onClick={() => onParteClick(processoId, 'PASSIVO', parteRe)}
              >
                {parteRe}
              </Badge>
              <div className="text-xs text-muted-foreground max-w-full truncate">{orgaoJulgador}</div>
            </div>
          </TooltipProvider>
        );
      },
    },
    {
      id: 'observacoes',
      header: () => <div className="flex items-center justify-center"><div className="text-sm font-medium">Observações</div></div>,
      enableSorting: false,
      size: 300,
      cell: ({ row }) => <ObservacoesCell expediente={row.original} onSuccess={onSuccess} />,
    },
    {
      accessorKey: 'responsavel_id',
      header: () => <ResponsavelColumnHeader onSort={onResponsavelSort} />,
      size: 160,
      cell: ({ row }) => <div className="min-h-10 flex items-center justify-center"><ResponsavelCell expediente={row.original} onSuccess={onSuccess} usuarios={usuarios} /></div>,
    },
    {
      id: 'acoes',
      header: () => <div className="flex items-center justify-center"><div className="text-sm font-medium">Ações</div></div>,
      cell: ({ row }) => <AcoesExpediente expediente={row.original} usuarios={usuarios} tiposExpedientes={tiposExpedientes} onSuccess={onSuccess} />,
    },
  ];
}

export function ExpedientesContent({ viewMode }: ExpedientesContentProps) {
  const [busca, setBusca] = React.useState('');
  const [pagina, setPagina] = React.useState(0);
  const [limite, setLimite] = React.useState(50);
  const [ordenarPor, setOrdenarPor] = React.useState<
    'data_prazo_legal_parte' | 'data_ciencia_parte' | 'numero_processo' | 'nome_parte_autora' | 'nome_parte_re' | 'trt' | 'grau' | 'descricao_orgao_julgador' | 'classe_judicial' | 'tipo_expediente_id' | 'responsavel_id' | null
  >('data_prazo_legal_parte');
  const [ordem, setOrdem] = React.useState<'asc' | 'desc'>('asc');
  const [statusBaixa, setStatusBaixa] = React.useState<'pendente' | 'baixado' | 'todos'>('pendente');
  const [statusPrazo, setStatusPrazo] = React.useState<'no_prazo' | 'vencido' | 'todos'>('no_prazo');
  const [filtros, setFiltros] = React.useState<ExpedientesFilters>({});
  const [semanaAtual, setSemanaAtual] = React.useState(new Date());
  const [mesAtual, setMesAtual] = React.useState(new Date());
  const [anoAtual, setAnoAtual] = React.useState(new Date());
  const [novoExpedienteOpen, setNovoExpedienteOpen] = React.useState(false);
  const [selectedFilterIds, setSelectedFilterIds] = React.useState<string[]>(['baixado_false']);
  const [isSearching, setIsSearching] = React.useState(false);
  const [parteDialog, setParteDialog] = React.useState<{
    open: boolean;
    processoId: number | null;
    polo: 'ATIVO' | 'PASSIVO';
    nome: string;
  }>({ open: false, processoId: null, polo: 'ATIVO', nome: '' });

  // Handler para abrir dialog de parte
  const handleParteClick = React.useCallback((
    processoId: number | null,
    polo: 'ATIVO' | 'PASSIVO',
    nome: string
  ) => {
    if (!processoId || nome === '-') return; // Não abrir se não há processo ou parte
    setParteDialog({ open: true, processoId, polo, nome });
  }, []);

  // Buscar permissões e ID do usuário logado
  const { usuarioId: currentUserId, isSuperAdmin } = useMinhasPermissoes();

  const buscaDebounced = useDebounce(busca, 500);

  const { inicioSemana, fimSemana } = React.useMemo(() => {
    const date = new Date(semanaAtual);
    date.setHours(0, 0, 0, 0);
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const inicio = new Date(date);
    inicio.setDate(date.getDate() + diff);
    const fim = new Date(inicio);
    fim.setDate(fim.getDate() + 4);
    fim.setHours(23, 59, 59, 999);
    return { inicioSemana: inicio, fimSemana: fim };
  }, [semanaAtual]);

  const params = React.useMemo(() => {
    const { responsavel_id, ...filtrosSemResponsavel } = filtros;
    const responsavelIdFinal = viewMode === 'tabela'
      ? responsavel_id
      : (!isSuperAdmin && currentUserId ? currentUserId : responsavel_id);

    return {
      pagina: pagina + 1,
      limite: viewMode === 'semana' ? 100 : limite,
      busca: buscaDebounced || undefined,
      ordenar_por: ordenarPor || undefined,
      ordem,
      baixado: statusBaixa === 'baixado' ? true : statusBaixa === 'pendente' ? false : undefined,
      // Na visualização de semana, não filtrar por prazo_vencido para carregar todos (vencidos, no prazo e sem data)
      // As abas "Vencidos" e "Sem Data" fazem a filtragem local
      prazo_vencido: viewMode === 'semana' ? undefined : (viewMode === 'tabela' ? undefined : (statusPrazo === 'vencido' ? true : statusPrazo === 'no_prazo' ? false : undefined)),
      responsavel_id: responsavelIdFinal,
      ...filtrosSemResponsavel,
      data_prazo_legal_inicio: viewMode === 'semana' ? inicioSemana.toISOString() : filtros.data_prazo_legal_inicio,
      data_prazo_legal_fim: viewMode === 'semana' ? fimSemana.toISOString() : filtros.data_prazo_legal_fim,
    };
  }, [pagina, limite, buscaDebounced, ordenarPor, ordem, statusBaixa, statusPrazo, filtros, isSuperAdmin, currentUserId, viewMode, inicioSemana, fimSemana]);

  const { expedientes, paginacao, isLoading, error, refetch } = usePendentes(params);

  // Busca global (sem faixa de data) usada para preencher abas "Vencidos" e "Sem Data" na visão semanal
  const paramsEspeciaisSemana = React.useMemo(() => {
    const { responsavel_id, data_prazo_legal_inicio: _ini, data_prazo_legal_fim: _fim, ...filtrosRestantes } = filtros;
    const responsavelIdFinal = viewMode === 'tabela'
      ? responsavel_id
      : (!isSuperAdmin && currentUserId ? currentUserId : responsavel_id);

    return {
      pagina: 1,
      limite: 100,
      busca: buscaDebounced || undefined,
      ordenar_por: ordenarPor || undefined,
      ordem,
      baixado: statusBaixa === 'baixado' ? true : statusBaixa === 'pendente' ? false : undefined,
      // Não aplicamos filtro de prazo_vencido aqui para trazer tudo e filtrar localmente
      prazo_vencido: undefined,
      responsavel_id: responsavelIdFinal,
      ...filtrosRestantes,
      data_prazo_legal_inicio: undefined,
      data_prazo_legal_fim: undefined,
    };
  }, [buscaDebounced, ordenarPor, ordem, statusBaixa, filtros, isSuperAdmin, currentUserId, viewMode]);

  const { expedientes: expedientesEspeciais, isLoading: isLoadingEspeciais } = usePendentes(
    viewMode === 'semana' ? paramsEspeciaisSemana : params
  );

  const { usuarios: usuariosLista } = useUsuarios({ ativo: true, limite: 100 });
  const { tiposExpedientes, isLoading: isLoadingTipos } = useTiposExpedientes({ limite: 100 });

  const handleSuccess = React.useCallback(() => { refetch(); }, [refetch]);

  const handleSortingChange = React.useCallback((columnId: string | null, direction: 'asc' | 'desc' | null) => {
    if (columnId && direction) {
      setOrdenarPor(columnId as typeof ordenarPor);
      setOrdem(direction);
    } else if (columnId && direction === null) {
      setOrdenarPor(columnId as typeof ordenarPor);
      setOrdem(columnId === 'data_prazo_legal_parte' ? 'asc' : 'desc');
    } else {
      setOrdenarPor(null);
      setOrdem('asc');
    }
  }, []);

  const handlePrazoSort = React.useCallback((field: 'data_ciencia_parte' | 'data_prazo_legal_parte', direction: 'asc' | 'desc') => {
    handleSortingChange(field, direction);
  }, [handleSortingChange]);

  const handleTipoExpedienteSort = React.useCallback((direction: 'asc' | 'desc') => {
    setOrdenarPor('tipo_expediente_id');
    setOrdem(direction);
  }, []);

  const handleProcessoSort = React.useCallback((field: 'trt' | 'grau' | 'descricao_orgao_julgador' | 'classe_judicial', direction: 'asc' | 'desc') => {
    handleSortingChange(field, direction);
  }, [handleSortingChange]);

  const handlePartesSort = React.useCallback((field: 'nome_parte_autora' | 'nome_parte_re', direction: 'asc' | 'desc') => {
    handleSortingChange(field, direction);
  }, [handleSortingChange]);

  const handleResponsavelSort = React.useCallback((direction: 'asc' | 'desc') => {
    setOrdenarPor('responsavel_id');
    setOrdem(direction);
  }, []);

  const colunas = React.useMemo(
    () => criarColunas(handleSuccess, usuariosLista, tiposExpedientes, handlePrazoSort, handleProcessoSort, handleResponsavelSort, handleParteClick, isLoadingTipos),
    [handleSuccess, usuariosLista, tiposExpedientes, handlePrazoSort, handleProcessoSort, handleResponsavelSort, handleParteClick, isLoadingTipos]
  );

  const navegarSemana = React.useCallback((direcao: 'anterior' | 'proxima') => {
    const novaSemana = new Date(semanaAtual);
    novaSemana.setDate(novaSemana.getDate() + (direcao === 'proxima' ? 7 : -7));
    setSemanaAtual(novaSemana);
  }, [semanaAtual]);

  const voltarSemanaAtual = React.useCallback(() => { setSemanaAtual(new Date()); }, []);

  const navegarMes = React.useCallback((direcao: 'anterior' | 'proxima') => {
    const novoMes = new Date(mesAtual);
    novoMes.setMonth(novoMes.getMonth() + (direcao === 'proxima' ? 1 : -1));
    setMesAtual(novoMes);
  }, [mesAtual]);

  const voltarMesAtual = React.useCallback(() => { setMesAtual(new Date()); }, []);

  const navegarAno = React.useCallback((direcao: 'anterior' | 'proxima') => {
    const novoAno = new Date(anoAtual);
    novoAno.setFullYear(novoAno.getFullYear() + (direcao === 'proxima' ? 1 : -1));
    setAnoAtual(novoAno);
  }, [anoAtual]);

  const voltarAnoAtual = React.useCallback(() => { setAnoAtual(new Date()); }, []);

  const handleFilterIdsChange = React.useCallback((ids: string[]) => {
    setSelectedFilterIds(ids);
    const parsed = parseExpedientesFilters(ids);

    // Atualizar status de baixa baseado nos filtros selecionados
    const hasBaixadoFilter = ids.some(id => id.startsWith('baixado_'));
    if (hasBaixadoFilter && parsed.baixado !== undefined) {
      setStatusBaixa(parsed.baixado ? 'baixado' : 'pendente');
    } else {
      // Nenhum filtro de baixado selecionado ou "Todos" selecionado - mostrar todos
      setStatusBaixa('todos');
    }

    // Atualizar status de prazo baseado nos filtros selecionados
    const hasPrazoFilter = ids.some(id => id.startsWith('prazo_vencido_'));
    if (hasPrazoFilter && parsed.prazo_vencido !== undefined) {
      setStatusPrazo(parsed.prazo_vencido ? 'vencido' : 'no_prazo');
    } else {
      // Nenhum filtro de prazo selecionado ou "Todos" selecionado - mostrar todos
      setStatusPrazo('todos');
    }

    const newFiltros: ExpedientesFilters = {};
    if (parsed.trt) newFiltros.trt = parsed.trt;
    if (parsed.grau) newFiltros.grau = parsed.grau;
    if (parsed.responsavel_id) newFiltros.responsavel_id = parsed.responsavel_id;
    if (parsed.tipo_expediente_id) newFiltros.tipo_expediente_id = parsed.tipo_expediente_id;
    if (parsed.sem_tipo) newFiltros.sem_tipo = parsed.sem_tipo;
    if (parsed.segredo_justica) newFiltros.segredo_justica = parsed.segredo_justica;
    if (parsed.juizo_digital) newFiltros.juizo_digital = parsed.juizo_digital;
    if (parsed.sem_responsavel) newFiltros.sem_responsavel = parsed.sem_responsavel;
    setFiltros(newFiltros);
    setPagina(0);
  }, []);

  const formatarDataCabecalho = (data: Date) => {
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Contador de expedientes da semana (apenas dias úteis, excluindo vencidos e sem data)
  const contadorExpedientesSemana = React.useMemo(() => {
    if (viewMode !== 'semana' || !expedientes) return 0;
    return expedientes.filter((e) => {
      // Apenas expedientes com data de prazo
      if (!e.data_prazo_legal_parte) return false;
      // Excluir vencidos
      if (e.prazo_vencido === true) return false;
      // Verificar se está dentro da semana atual
      const data = new Date(e.data_prazo_legal_parte);
      const dataLocal = new Date(data.getFullYear(), data.getMonth(), data.getDate());
      return dataLocal >= inicioSemana && dataLocal <= fimSemana;
    }).length;
  }, [viewMode, expedientes, inicioSemana, fimSemana]);

  const formatarPeriodo = React.useMemo(() => {
    if (viewMode === 'semana') {
      return `${formatarDataCabecalho(inicioSemana)} - ${formatarDataCabecalho(fimSemana)}`;
    } else if (viewMode === 'mes') {
      return mesAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(' De ', ' de ');
    } else if (viewMode === 'ano') {
      return anoAtual.getFullYear().toString();
    }
    return '';
  }, [viewMode, inicioSemana, fimSemana, mesAtual, anoAtual]);

  const filterOptions = React.useMemo(() => buildExpedientesFilterOptions(usuariosLista, tiposExpedientes), [usuariosLista, tiposExpedientes]);
  const filterGroups = React.useMemo(() => buildExpedientesFilterGroups(usuariosLista, tiposExpedientes), [usuariosLista, tiposExpedientes]);

  React.useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => setIsSearching(false), 300);
    return () => clearTimeout(timer);
  }, [buscaDebounced]);

  return (
    <div className="space-y-4">
      {/* Linha 1: TableToolbar com botões de filtro individuais */}
      <div className="flex items-center gap-4">
        <TableToolbar
          searchValue={busca}
          onSearchChange={(value: string) => { setBusca(value); setPagina(0); }}
          isSearching={isSearching}
          searchPlaceholder="Buscar expedientes..."
          filterOptions={filterOptions}
          filterGroups={filterGroups}
          selectedFilters={selectedFilterIds}
          onFiltersChange={handleFilterIdsChange}
          onNewClick={() => setNovoExpedienteOpen(true)}
          newButtonTooltip="Novo expediente manual"
          filterButtonsMode="buttons"
        />
      </div>

      {/* Linha 2: Controles de navegação temporal (apenas para visualizações de calendário) */}
      {viewMode !== 'tabela' && (
        <div className="flex items-center justify-start gap-4 pt-2">
          <ButtonGroup>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                if (viewMode === 'semana') navegarSemana('anterior');
                if (viewMode === 'mes') navegarMes('anterior');
                if (viewMode === 'ano') navegarAno('anterior');
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <ButtonGroupText className="whitespace-nowrap capitalize min-w-32 text-center text-xs font-normal">
              {formatarPeriodo}
            </ButtonGroupText>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                if (viewMode === 'semana') navegarSemana('proxima');
                if (viewMode === 'mes') navegarMes('proxima');
                if (viewMode === 'ano') navegarAno('proxima');
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    if (viewMode === 'semana') voltarSemanaAtual();
                    if (viewMode === 'mes') voltarMesAtual();
                    if (viewMode === 'ano') voltarAnoAtual();
                  }}
                  aria-label="Voltar para período atual"
                  className="bg-muted hover:bg-muted/80"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="px-2 py-1 text-xs">
                {viewMode === 'semana' && 'Semana Atual'}
                {viewMode === 'mes' && 'Mês Atual'}
                {viewMode === 'ano' && 'Ano Atual'}
              </TooltipContent>
            </Tooltip>
          </ButtonGroup>
          {viewMode === 'semana' && (
            <div className="inline-flex items-center h-9 rounded-md border border-input bg-primary/10 px-3 text-sm font-medium text-primary shrink-0">
              {contadorExpedientesSemana} expedientes
            </div>
          )}
        </div>
      )}

      {/* Conteúdo baseado no modo de visualização */}
      {viewMode === 'tabela' && (
        <DataTable
          data={expedientes}
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
          sorting={{
            columnId: ordenarPor,
            direction: ordem,
            onSortingChange: handleSortingChange,
          }}
          isLoading={isLoading}
          error={error}
          emptyMessage="Nenhum expediente encontrado."
        />
      )}

      {viewMode === 'semana' && (
        <ExpedientesVisualizacaoSemana
          expedientes={expedientes}
          expedientesEspeciais={expedientesEspeciais}
          isLoading={isLoading}
          isLoadingEspeciais={isLoadingEspeciais}
          onRefresh={refetch}
          usuarios={usuariosLista}
          tiposExpedientes={tiposExpedientes}
          semanaAtual={semanaAtual}
          onTipoExpedienteSort={handleTipoExpedienteSort}
          onPrazoSort={handlePrazoSort}
          onProcessoSort={handleProcessoSort}
          onPartesSort={handlePartesSort}
          onResponsavelSort={handleResponsavelSort}
        />
      )}

      {viewMode === 'mes' && (
        <ExpedientesVisualizacaoMes
          expedientes={expedientes}
          isLoading={isLoading}
          mesAtual={mesAtual}
          onMesAtualChange={setMesAtual}
        />
      )}

      {viewMode === 'ano' && (
        <ExpedientesVisualizacaoAno
          expedientes={expedientes}
          isLoading={isLoading}
          anoAtual={anoAtual}
          onAnoAtualChange={setAnoAtual}
        />
      )}

      <NovoExpedienteDialog
        open={novoExpedienteOpen}
        onOpenChange={setNovoExpedienteOpen}
        onSuccess={handleSuccess}
      />

      <ParteDetalheDialog
        open={parteDialog.open}
        onOpenChange={(open) => setParteDialog(prev => ({ ...prev, open }))}
        processoId={parteDialog.processoId}
        polo={parteDialog.polo}
        nomeExibido={parteDialog.nome}
      />
    </div>
  );
}
