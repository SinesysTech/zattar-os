'use client';

/**
 * Componente de conteúdo compartilhado para todas as visualizações de audiências
 * Contém a lógica de filtros, busca e navegação
 */

import * as React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { ClientOnlyTabs, TabsList, TabsTrigger } from '@/components/ui/client-only-tabs';
import { ResponsiveTable, ResponsiveTableColumn } from '@/components/ui/responsive-table';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { ButtonGroup, ButtonGroupText } from '@/components/ui/button-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronLeft, ChevronRight, Pencil, RotateCcw, FileText, Check, PlusCircle, Loader2, Scale, Plus } from 'lucide-react';
import { PdfViewerDialog } from '@/app/(dashboard)/expedientes/components/pdf-viewer-dialog';
import { AudienciasVisualizacaoSemana } from './audiencias-visualizacao-semana';
import { AudienciasVisualizacaoMes } from './audiencias-visualizacao-mes';
import { AudienciasVisualizacaoAno } from './audiencias-visualizacao-ano';
import { NovaAudienciaDialog } from './nova-audiencia-dialog';
import { EditarEnderecoDialog } from './editar-endereco-dialog';
import { EditarObservacoesDialog } from './editar-observacoes-dialog';
import { NovoExpedienteDialog } from '@/app/(dashboard)/expedientes/components/novo-expediente-dialog';
import { NovaObrigacaoDialog } from '@/app/(dashboard)/acordos-condenacoes/components/nova-obrigacao-dialog';
import { useAudiencias } from '@/lib/hooks/use-audiencias';
import { useUsuarios } from '@/lib/hooks/use-usuarios';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { buildAudienciasFilterOptions, buildAudienciasFilterGroups, parseAudienciasFilters } from './audiencias-toolbar-filters';
import type { Audiencia, ModalidadeAudiencia } from '@/backend/types/audiencias/types';
import type { AudienciasFilters } from '@/lib/types/audiencias';

export type VisualizacaoTipo = 'semana' | 'mes' | 'ano' | 'lista';

interface AudienciasContentProps {
  visualizacao: VisualizacaoTipo;
}

// Interface para dados iniciais de expedientes e obrigações
interface DadosIniciais {
  processo_id: number;
  trt: string;
  grau: string;
  numero_processo: string;
  polo_ativo_nome?: string;
  polo_passivo_nome?: string;
}

/**
 * Formata apenas data ISO para formato brasileiro (DD/MM/YYYY)
 */
const formatarData = (dataISO: string | null): string => {
  if (!dataISO) return '-';
  try {
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '-';
  }
};

/**
 * Formata apenas hora ISO para formato brasileiro (HH:mm)
 */
const formatarHora = (dataISO: string | null): string => {
  if (!dataISO) return '-';
  try {
    const data = new Date(dataISO);
    return data.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
};

/**
 * Normaliza data para comparação apenas por dia (ignora hora)
 */
const normalizarDataParaComparacao = (dataISO: string | null): number => {
  if (!dataISO) return 0;
  try {
    const data = new Date(dataISO);
    const dataNormalizada = new Date(data.getFullYear(), data.getMonth(), data.getDate());
    return dataNormalizada.getTime();
  } catch {
    return 0;
  }
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
    'TRT7': 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-800',
    'TRT8': 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900 dark:text-teal-200 dark:border-teal-800',
    'TRT9': 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-800',
    'TRT10': 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900 dark:text-cyan-200 dark:border-cyan-800',
    'TRT11': 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-200 dark:border-emerald-800',
    'TRT12': 'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900 dark:text-violet-200 dark:border-violet-800',
    'TRT13': 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900 dark:text-rose-200 dark:border-rose-800',
    'TRT14': 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-800',
    'TRT15': 'bg-lime-100 text-lime-800 border-lime-200 dark:bg-lime-900 dark:text-lime-200 dark:border-lime-800',
    'TRT16': 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900 dark:text-sky-200 dark:border-sky-800',
    'TRT17': 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200 dark:bg-fuchsia-900 dark:text-fuchsia-200 dark:border-fuchsia-800',
    'TRT18': 'bg-stone-100 text-stone-800 border-stone-200 dark:bg-stone-900 dark:text-stone-200 dark:border-stone-800',
    'TRT19': 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-800',
    'TRT20': 'bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-200 dark:border-zinc-800',
    'TRT21': 'bg-neutral-100 text-neutral-800 border-neutral-200 dark:bg-neutral-900 dark:text-neutral-200 dark:border-neutral-800',
    'TRT22': 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-800',
    'TRT23': 'bg-blue-200 text-blue-900 border-blue-300 dark:bg-blue-800 dark:text-blue-100 dark:border-blue-700',
    'TRT24': 'bg-green-200 text-green-900 border-green-300 dark:bg-green-800 dark:text-green-100 dark:border-green-700',
  };
  return trtColors[trt] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-800';
};

const getGrauColorClass = (grau: 'primeiro_grau' | 'segundo_grau' | 'tribunal_superior'): string => {
  const grauColors: Record<string, string> = {
    'primeiro_grau': 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-200 dark:border-emerald-800',
    'segundo_grau': 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-800',
    'tribunal_superior': 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900 dark:text-indigo-200 dark:border-indigo-800',
  };
  return grauColors[grau] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-800';
};

const getParteAutoraColorClass = (): string => {
  return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800';
};

const getParteReColorClass = (): string => {
  return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-800';
};

/**
 * Retorna a classe CSS de cor para badge de modalidade
 */
const getModalidadeColorClass = (modalidade: ModalidadeAudiencia | null): string => {
  const modalidadeColors: Record<string, string> = {
    virtual: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800',
    presencial: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800',
    hibrida: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-800',
  };
  return modalidade ? modalidadeColors[modalidade] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-800' : 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-800';
};

/**
 * Formata modalidade para exibição
 */
const formatarModalidade = (modalidade: ModalidadeAudiencia | null): string => {
  const modalidadeMap: Record<string, string> = {
    virtual: 'Virtual',
    presencial: 'Presencial',
    hibrida: 'Híbrida',
  };
  return modalidade ? modalidadeMap[modalidade] || modalidade : '-';
};

type PlataformaVideo = 'zoom' | 'meet' | 'webex' | null;

const detectarPlataforma = (url: string | null): PlataformaVideo => {
  if (!url) return null;
  const urlLower = url.toLowerCase();
  if (urlLower.includes('zoom')) return 'zoom';
  if (urlLower.includes('meet')) return 'meet';
  if (urlLower.includes('webex')) return 'webex';
  return null;
};

const extractKeyFromBackblazeUrl = (u: string | null): string | null => {
  if (!u) return null;
  try {
    const urlObj = new URL(u);
    const parts = urlObj.pathname.split('/').filter(Boolean);
    if (parts.length < 2) return null;
    return parts.slice(1).join('/');
  } catch {
    return null;
  }
};

const getLogoPlataforma = (plataforma: PlataformaVideo): string | null => {
  const logos: Record<string, string> = {
    zoom: '/Zoom_Logo.png',
    meet: '/meet_logo.png',
    webex: '/webex_logo.png',
  };
  return plataforma ? logos[plataforma] : null;
};

function ProcessoColumnHeader({
  onSort,
}: {
  onSort: (field: 'trt' | 'grau' | 'orgao_julgador_descricao', direction: 'asc' | 'desc') => void;
}) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="flex items-center justify-center">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 data-[state=open]:bg-accent">
            <span className="text-sm font-medium">Processo</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1 h-4 w-4">
              <path d="m7 15 5 5 5-5" />
              <path d="m7 9 5-5 5 5" />
            </svg>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[min(92vw,13.75rem)] p-2" align="start">
          <div className="space-y-1">
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Ordenar por Tribunal</div>
            <Button variant="ghost" className="w-full justify-start text-sm" onClick={() => { onSort('trt', 'asc'); setIsOpen(false); }}>↑ Crescente</Button>
            <Button variant="ghost" className="w-full justify-start text-sm" onClick={() => { onSort('trt', 'desc'); setIsOpen(false); }}>↓ Decrescente</Button>
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">Ordenar por Grau</div>
            <Button variant="ghost" className="w-full justify-start text-sm" onClick={() => { onSort('grau', 'asc'); setIsOpen(false); }}>↑ Crescente</Button>
            <Button variant="ghost" className="w-full justify-start text-sm" onClick={() => { onSort('grau', 'desc'); setIsOpen(false); }}>↓ Decrescente</Button>
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">Ordenar por Órgão Julgador</div>
            <Button variant="ghost" className="w-full justify-start text-sm" onClick={() => { onSort('orgao_julgador_descricao', 'asc'); setIsOpen(false); }}>↑ Crescente</Button>
            <Button variant="ghost" className="w-full justify-start text-sm" onClick={() => { onSort('orgao_julgador_descricao', 'desc'); setIsOpen(false); }}>↓ Decrescente</Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function ResponsavelColumnHeader({ onSort }: { onSort: (direction: 'asc' | 'desc') => void }) {
  const [currentDirection, setCurrentDirection] = React.useState<'asc' | 'desc'>('asc');
  const handleClick = () => {
    const newDirection = currentDirection === 'asc' ? 'desc' : 'asc';
    setCurrentDirection(newDirection);
    onSort(newDirection);
  };

  return (
    <div className="flex items-center justify-center">
      <Button variant="ghost" size="sm" className="h-8 hover:bg-accent" onClick={handleClick}>
        <span className="text-sm font-medium">Responsável</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1 h-4 w-4">
          {currentDirection === 'asc' ? <path d="m7 15 5 5 5-5" /> : <path d="m7 9 5-5 5 5" />}
        </svg>
      </Button>
    </div>
  );
}

function ObservacoesCell({ audiencia, onSuccess }: { audiencia: Audiencia; onSuccess: () => void }) {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  return (
    <>
      <div className="relative group h-full w-full min-h-[60px] flex items-start justify-start p-2">
        {audiencia.observacoes ? (
          <span className="text-sm whitespace-pre-wrap wrap-break-word w-full">{audiencia.observacoes}</span>
        ) : null}
        <Button size="sm" variant="ghost" onClick={() => setIsDialogOpen(true)} className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-1 right-1" title="Editar observações">
          <Pencil className="h-3 w-3" />
        </Button>
      </div>
      <EditarObservacoesDialog audiencia={audiencia} open={isDialogOpen} onOpenChange={setIsDialogOpen} onSuccess={onSuccess} />
    </>
  );
}

function ResponsavelCell({ audiencia, onSuccess, usuarios }: { audiencia: Audiencia; onSuccess: () => void; usuarios: Array<{ id: number; nomeExibicao: string }> }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSelect = async (value: string) => {
    setIsLoading(true);
    try {
      const responsavelId = value === 'null' || value === '' ? null : parseInt(value, 10);
      const response = await fetch(`/api/audiencias/${audiencia.id}/responsavel`, {
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

  const responsavelAtual = usuarios.find(u => u.id === audiencia.responsavel_id);

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

// Cell component for data/hora column
function DataHoraCell({ audiencia }: { audiencia: Audiencia }) {
  const [openAta, setOpenAta] = React.useState(false);
  const fileKey = extractKeyFromBackblazeUrl(audiencia.url_ata_audiencia);
  const canOpenAta = audiencia.status === 'F' && fileKey !== null;

  return (
    <div className="min-h-10 flex flex-col items-center justify-center text-sm gap-1">
      {/* Badge de modalidade no topo, centralizado - só renderiza se houver modalidade */}
      {audiencia.modalidade && (
        <Badge variant="outline" className={`${getModalidadeColorClass(audiencia.modalidade)} text-xs mb-2`}>
          {formatarModalidade(audiencia.modalidade)}
        </Badge>
      )}
      <div className="font-medium">{formatarData(audiencia.data_inicio)}</div>
      <div className="text-sm font-medium">{formatarHora(audiencia.data_inicio)}h</div>
      {canOpenAta && (
        <button className="h-6 w-6 flex items-center justify-center rounded" onClick={(e) => { e.stopPropagation(); setOpenAta(true); }} title="Ver Ata de Audiência">
          <FileText className="h-4 w-4 text-primary" />
        </button>
      )}
      <PdfViewerDialog open={openAta} onOpenChange={setOpenAta} fileKey={fileKey} documentTitle={`Ata da audiência ${audiencia.numero_processo}`} />
    </div>
  );
}

// Cell component for tipo/sala/ações column
function TipoSalaAcoesCell({ audiencia, onSuccess }: { audiencia: Audiencia; onSuccess: () => void }) {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isExpedienteDialogOpen, setIsExpedienteDialogOpen] = React.useState(false);
  const [isObrigacaoDialogOpen, setIsObrigacaoDialogOpen] = React.useState(false);
  const [isMarkingRealizada, setIsMarkingRealizada] = React.useState(false);

  const tipo = audiencia.tipo_descricao;
  const sala = audiencia.sala_audiencia_nome;
  const plataforma = detectarPlataforma(audiencia.url_audiencia_virtual);
  const logoPath = getLogoPlataforma(plataforma);

  const enderecoCompleto = audiencia.endereco_presencial
    ? [audiencia.endereco_presencial.logradouro, audiencia.endereco_presencial.numero, audiencia.endereco_presencial.complemento, audiencia.endereco_presencial.bairro, audiencia.endereco_presencial.cidade, audiencia.endereco_presencial.estado, audiencia.endereco_presencial.pais, audiencia.endereco_presencial.cep].filter(Boolean).join(', ') || null
    : null;
  const isHibrida = audiencia.modalidade === 'hibrida';
  const isDesignada = audiencia.status === 'M';

  // Marcar audiência como realizada
  const handleMarcarRealizada = async () => {
    setIsMarkingRealizada(true);
    try {
      const response = await fetch(`/api/audiencias/${audiencia.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'F' }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || 'Erro ao marcar como realizada');
      }
      onSuccess();
    } catch (error) {
      console.error('Erro ao marcar audiência como realizada:', error);
    } finally {
      setIsMarkingRealizada(false);
    }
  };

  // Dados iniciais para o dialog de expediente
  const expedienteInicial: DadosIniciais = {
    processo_id: audiencia.processo_id,
    trt: audiencia.trt,
    grau: audiencia.grau,
    numero_processo: audiencia.numero_processo,
    polo_ativo_nome: audiencia.polo_ativo_nome || undefined,
    polo_passivo_nome: audiencia.polo_passivo_nome || undefined,
  };

  // Dados iniciais para o dialog de obrigação
  const obrigacaoInicial: DadosIniciais = {
    processo_id: audiencia.processo_id,
    trt: audiencia.trt,
    grau: audiencia.grau,
    numero_processo: audiencia.numero_processo,
    polo_ativo_nome: audiencia.polo_ativo_nome || undefined,
    polo_passivo_nome: audiencia.polo_passivo_nome || undefined,
  };

  const [isMaisPopoverOpen, setIsMaisPopoverOpen] = React.useState(false);

  // Determinar quem comparece presencialmente em audiência híbrida
  const presencaHibridaTexto = isHibrida && audiencia.presenca_hibrida
    ? audiencia.presenca_hibrida === 'advogado'
      ? 'Advogado presencial, Cliente virtual'
      : 'Cliente presencial, Advogado virtual'
    : null;

  return (
    <div className="min-h-10 flex flex-col items-start justify-center h-full max-w-60">
      {/* Conteúdo principal com flex-grow para empurrar botões para baixo */}
      <div className="flex-1 flex flex-col items-start justify-start gap-4 w-full">
        {/* Seção 1: Tipo da audiência e Sala (conjunto) */}
        {(tipo || sala) && (
          <div className="flex flex-col items-start gap-1 w-full">
            {tipo && <div className="text-sm text-left w-full">{tipo}</div>}
            {sala && <div className="text-xs text-muted-foreground text-left w-full">{sala}</div>}
          </div>
        )}

        {/* Seção 2: Link virtual e/ou Endereço presencial */}
        {isHibrida ? (
          <>
            {/* Link virtual para híbrida */}
            {audiencia.url_audiencia_virtual && (
              <div className="flex flex-col items-start gap-1.5 w-full group/url relative">
                <div className="flex items-center gap-1.5 w-full">
                  {logoPath ? (
                    <a href={audiencia.url_audiencia_virtual} target="_blank" rel="noopener noreferrer" aria-label="Acessar audiência virtual" className="hover:opacity-70 transition-opacity flex items-center justify-center">
                      <Image src={logoPath} alt={plataforma || 'Plataforma de vídeo'} width={80} height={30} className="object-contain" />
                    </a>
                  ) : (
                    <a href={audiencia.url_audiencia_virtual} target="_blank" rel="noopener noreferrer" aria-label="Acessar audiência virtual" className="text-xs text-blue-600 hover:underline truncate max-w-full">
                      {audiencia.url_audiencia_virtual}
                    </a>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => { e.stopPropagation(); setIsDialogOpen(true); }}
                    className="h-5 w-5 p-0 opacity-0 group-hover/url:opacity-100 transition-opacity"
                    title="Editar endereço"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
                {presencaHibridaTexto && (
                  <div className="text-xs text-muted-foreground italic">{presencaHibridaTexto}</div>
                )}
              </div>
            )}
            {/* Endereço presencial para híbrida */}
            {enderecoCompleto && (
              <div className="flex flex-col items-start gap-1.5 w-full group/endereco relative">
                <div className="text-xs text-muted-foreground w-full flex items-start gap-1">
                  <div className="flex-1">
                    <span className="font-medium">Presencial: </span>
                    <span>{enderecoCompleto}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => { e.stopPropagation(); setIsDialogOpen(true); }}
                    className="h-5 w-5 p-0 opacity-0 group-hover/endereco:opacity-100 transition-opacity shrink-0"
                    title="Editar endereço"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : audiencia.url_audiencia_virtual ? (
          /* Link virtual para modalidade virtual */
          <div className="flex-1 flex items-center justify-start w-full group/url relative gap-1">
            {logoPath ? (
              <a href={audiencia.url_audiencia_virtual} target="_blank" rel="noopener noreferrer" aria-label="Acessar audiência virtual" className="hover:opacity-70 transition-opacity flex items-center justify-center">
                <Image src={logoPath} alt={plataforma || 'Plataforma de vídeo'} width={80} height={30} className="object-contain" />
              </a>
            ) : (
              <a href={audiencia.url_audiencia_virtual} target="_blank" rel="noopener noreferrer" aria-label="Acessar audiência virtual" className="text-xs text-blue-600 hover:underline truncate max-w-full">
                {audiencia.url_audiencia_virtual}
              </a>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => { e.stopPropagation(); setIsDialogOpen(true); }}
              className="h-5 w-5 p-0 opacity-0 group-hover/url:opacity-100 transition-opacity shrink-0"
              title="Editar endereço"
            >
              <Pencil className="h-3 w-3" />
            </Button>
          </div>
        ) : enderecoCompleto ? (
          /* Endereço presencial para modalidade presencial */
          <div className="w-full group/endereco relative flex items-start gap-1">
            <span className="text-sm whitespace-pre-wrap wrap-break-word flex-1">
              {enderecoCompleto}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => { e.stopPropagation(); setIsDialogOpen(true); }}
              className="h-5 w-5 p-0 opacity-0 group-hover/endereco:opacity-100 transition-opacity shrink-0"
              title="Editar endereço"
            >
              <Pencil className="h-3 w-3" />
            </Button>
          </div>
        ) : null}
      </div>

      {/* Botões de ação - alinhados ao bottom com espaçamento */}
      <div className="flex items-center gap-2 mt-3 pt-2">
        <TooltipProvider>
          {isDesignada && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleMarcarRealizada}
                  disabled={isMarkingRealizada}
                  className="h-8 w-8 rounded-full bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 flex items-center justify-center transition-colors disabled:opacity-50"
                  title="Marcar como realizada"
                >
                  {isMarkingRealizada ? <Loader2 className="h-4 w-4 animate-spin text-green-700 dark:text-green-300" /> : <Check className="h-4 w-4 text-green-700 dark:text-green-300" />}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Marcar como realizada</p>
              </TooltipContent>
            </Tooltip>
          )}
          <Popover open={isMaisPopoverOpen} onOpenChange={setIsMaisPopoverOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <button className="h-8 w-8 rounded-full bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 flex items-center justify-center transition-colors" aria-label="Criar expediente ou obrigação">
                    <Plus className="h-4 w-4 text-blue-700 dark:text-blue-300" />
                  </button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Criar expediente ou obrigação</p>
              </TooltipContent>
            </Tooltip>
            <PopoverContent className="w-48 p-2" align="start">
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMaisPopoverOpen(false);
                    setIsExpedienteDialogOpen(true);
                  }}
                >
                  <PlusCircle className="h-4 w-4" />
                  Expediente
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMaisPopoverOpen(false);
                    setIsObrigacaoDialogOpen(true);
                  }}
                >
                  <Scale className="h-4 w-4" />
                  Obrigação
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </TooltipProvider>
      </div>

      {/* Dialogs */}
      <EditarEnderecoDialog audiencia={audiencia} open={isDialogOpen} onOpenChange={setIsDialogOpen} onSuccess={onSuccess} />
      <NovoExpedienteDialog open={isExpedienteDialogOpen} onOpenChange={setIsExpedienteDialogOpen} onSuccess={onSuccess} dadosIniciais={expedienteInicial} />
      <NovaObrigacaoDialog open={isObrigacaoDialogOpen} onOpenChange={setIsObrigacaoDialogOpen} onSuccess={onSuccess} dadosIniciais={obrigacaoInicial} />
    </div>
  );
}

function criarColunas(
  onSuccess: () => void,
  usuarios: Array<{ id: number; nomeExibicao: string }>,
  onProcessoSort: (field: 'trt' | 'grau' | 'orgao_julgador_descricao', direction: 'asc' | 'desc') => void,
  onResponsavelSort: (direction: 'asc' | 'desc') => void
): ResponsiveTableColumn<Audiencia>[] {
  return [
    {
      accessorKey: 'data_inicio',
      header: () => (
        <div className="flex items-center justify-center">
          <div className="text-sm font-medium">Data/Hora</div>
        </div>
      ),
      enableSorting: true,
      size: 140,
      priority: 1,
      sticky: true,
      cardLabel: 'Data/Hora',
      meta: { align: 'left' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sortingFn: (rowA: any, rowB: any) => {
        const dataA = normalizarDataParaComparacao(rowA.original.data_inicio);
        const dataB = normalizarDataParaComparacao(rowB.original.data_inicio);
        return dataA - dataB;
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cell: ({ row }: any) => <DataHoraCell audiencia={row.original} />,
    },
    {
      id: 'processo',
      header: () => <ProcessoColumnHeader onSort={onProcessoSort} />,
      enableSorting: false,
      priority: 2,
      cardLabel: 'Processo',
      meta: { align: 'left' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cell: ({ row }: any) => {
        const classeJudicial = row.original.classe_judicial || '';
        const numeroProcesso = row.original.numero_processo;
        const trt = row.original.trt;
        const grau = row.original.grau;
        const orgaoJulgador = row.original.orgao_julgador_descricao;
        const parteAutora = row.original.nome_parte_autora;
        const parteRe = row.original.nome_parte_re;

        return (
          <div className="min-h-10 flex flex-col items-start justify-center gap-1.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant="outline" className={`${getTRTColorClass(trt)} text-xs shrink-0`}>{trt}</Badge>
              <Badge variant="outline" className={`${getGrauColorClass(grau)} text-xs shrink-0`}>{formatarGrau(grau)}</Badge>
            </div>
            <div className="text-sm font-medium whitespace-nowrap">{classeJudicial && `${classeJudicial} `}{numeroProcesso}</div>
            {/* Órgão julgador (vara) */}
            {orgaoJulgador && orgaoJulgador !== '-' && (
              <div className="text-xs text-muted-foreground">{orgaoJulgador}</div>
            )}

            {/* Espaçamento entre dados do processo e partes */}
            {(parteAutora || parteRe) && <div className="h-1" />}

            {/* Partes */}
            {(parteAutora || parteRe) && (
              <div className="flex flex-col gap-1 w-full">
                {parteAutora && (
                  <Badge variant="outline" className={`${getParteAutoraColorClass()} text-left justify-start w-fit min-w-0 max-w-full`}>
                    <span className="truncate">{parteAutora}</span>
                  </Badge>
                )}
                {parteRe && (
                  <Badge variant="outline" className={`${getParteReColorClass()} text-left justify-start w-fit min-w-0 max-w-full`}>
                    <span className="truncate">{parteRe}</span>
                  </Badge>
                )}
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: 'detalhes',
      header: () => <div className="flex items-center justify-center"><div className="text-sm font-medium">Detalhes</div></div>,
      enableSorting: false,
      size: 280,
      priority: 3,
      cardLabel: 'Detalhes',
      meta: { align: 'left' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cell: ({ row }: any) => <TipoSalaAcoesCell audiencia={row.original} onSuccess={onSuccess} />,
    },
    {
      id: 'observacoes',
      header: () => <div className="flex items-center justify-center"><div className="text-sm font-medium">Observações</div></div>,
      enableSorting: false,
      size: 250,
      priority: 5,
      cardLabel: 'Observações',
      meta: { align: 'left' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cell: ({ row }: any) => <div className="h-full w-full"><ObservacoesCell audiencia={row.original} onSuccess={onSuccess} /></div>,
    },
    {
      accessorKey: 'responsavel_id',
      header: () => <ResponsavelColumnHeader onSort={onResponsavelSort} />,
      enableSorting: false,
      priority: 4,
      cardLabel: 'Responsável',
      meta: { align: 'left' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cell: ({ row }: any) => <div className="min-h-10 flex items-center justify-center"><ResponsavelCell audiencia={row.original} onSuccess={onSuccess} usuarios={usuarios} /></div>,
    },
  ];
}

export function AudienciasContent({ visualizacao }: AudienciasContentProps) {
  const router = useRouter();
  const [busca, setBusca] = React.useState('');
  const [pagina, setPagina] = React.useState(0);
  const [limite, setLimite] = React.useState(50);
  const [ordenarPor, setOrdenarPor] = React.useState<
    | 'data_inicio' | 'numero_processo' | 'polo_ativo_nome' | 'polo_passivo_nome'
    | 'trt' | 'grau' | 'orgao_julgador_descricao' | 'tipo_descricao'
    | 'sala_audiencia_nome' | 'responsavel_id' | null
  >('data_inicio');
  const [ordem, setOrdem] = React.useState<'asc' | 'desc'>('asc');
  const [filtros, setFiltros] = React.useState<AudienciasFilters>({});
  const [novaAudienciaOpen, setNovaAudienciaOpen] = React.useState(false);

  const [semanaAtual, setSemanaAtual] = React.useState<Date | null>(null);
  const [mesAtual, setMesAtual] = React.useState<Date | null>(null);
  const [anoAtual, setAnoAtual] = React.useState<number | null>(null);
  const [selectedFilterIds, setSelectedFilterIds] = React.useState<string[]>([]);

  React.useEffect(() => {
    const agora = new Date();
    setSemanaAtual(agora);
    setMesAtual(agora);
    setAnoAtual(agora.getFullYear());
  }, []);

  const buscaDebounced = useDebounce(busca, 500);
  const isSearching = busca !== buscaDebounced;
  const datasInicializadas = semanaAtual !== null && mesAtual !== null && anoAtual !== null;

  const filtrosData = React.useMemo(() => {
    if (visualizacao === 'lista') return {};

    if (visualizacao === 'semana' && semanaAtual) {
      const date = new Date(semanaAtual);
      date.setHours(0, 0, 0, 0);
      const day = date.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      const inicio = new Date(date);
      inicio.setDate(date.getDate() + diff);
      const fim = new Date(inicio);
      fim.setDate(fim.getDate() + 4); // Segunda a Sexta (5 dias úteis)
      fim.setHours(23, 59, 59, 999);
      return { data_inicio_inicio: inicio.toISOString(), data_inicio_fim: fim.toISOString() };
    }

    if (visualizacao === 'mes' && mesAtual) {
      const ano = mesAtual.getFullYear();
      const mes = mesAtual.getMonth();
      const inicio = new Date(ano, mes, 1);
      const fim = new Date(ano, mes + 1, 0, 23, 59, 59, 999);
      return { data_inicio_inicio: inicio.toISOString(), data_inicio_fim: fim.toISOString() };
    }

    if (visualizacao === 'ano' && anoAtual !== null) {
      const inicio = new Date(anoAtual, 0, 1);
      const fim = new Date(anoAtual, 11, 31, 23, 59, 59, 999);
      return { data_inicio_inicio: inicio.toISOString(), data_inicio_fim: fim.toISOString() };
    }

    return {};
  }, [visualizacao, semanaAtual, mesAtual, anoAtual]);

  const params = React.useMemo(() => ({
    pagina: pagina + 1,
    limite: visualizacao === 'lista' ? limite : 1000,
    busca: buscaDebounced || undefined,
    ordenar_por: ordenarPor || undefined,
    ordem,
    ...filtros,
    ...filtrosData,
  }), [pagina, limite, buscaDebounced, ordenarPor, ordem, filtros, filtrosData, visualizacao]);

  const podesBuscar = visualizacao === 'lista' || datasInicializadas;
  const { audiencias: audienciasRaw, paginacao, isLoading, error, refetch } = useAudiencias(params, { enabled: podesBuscar });
  const { usuarios } = useUsuarios({ ativo: true, limite: 100 });

  const audiencias = React.useMemo(() => {
    if (!audienciasRaw || ordenarPor !== 'data_inicio') return audienciasRaw;
    const audienciasOrdenadas = [...audienciasRaw].sort((a, b) => {
      const dataA = normalizarDataParaComparacao(a.data_inicio);
      const dataB = normalizarDataParaComparacao(b.data_inicio);
      return ordem === 'asc' ? dataA - dataB : dataB - dataA;
    });
    return audienciasOrdenadas;
  }, [audienciasRaw, ordenarPor, ordem]);

  const handleSuccess = React.useCallback(() => { refetch(); }, [refetch]);

  const handleSortingChange = React.useCallback((columnId: string | null, direction: 'asc' | 'desc' | null) => {
    if (columnId && direction) {
      setOrdenarPor(columnId as typeof ordenarPor);
      setOrdem(direction);
    } else {
      setOrdenarPor(null);
      setOrdem('asc');
    }
  }, []);

  const handleProcessoSort = React.useCallback((field: 'trt' | 'grau' | 'orgao_julgador_descricao', direction: 'asc' | 'desc') => {
    handleSortingChange(field, direction);
  }, [handleSortingChange]);

  const handleResponsavelSort = React.useCallback((direction: 'asc' | 'desc') => {
    setOrdenarPor('responsavel_id');
    setOrdem(direction);
  }, []);

  const colunas = React.useMemo(() => criarColunas(handleSuccess, usuarios, handleProcessoSort, handleResponsavelSort), [handleSuccess, usuarios, handleProcessoSort, handleResponsavelSort]);

  const filterOptions = React.useMemo(() => buildAudienciasFilterOptions(usuarios), [usuarios]);
  const filterGroups = React.useMemo(() => buildAudienciasFilterGroups(usuarios), [usuarios]);

  const handleFilterIdsChange = React.useCallback((newSelectedIds: string[]) => {
    setSelectedFilterIds(newSelectedIds);
    const newFilters = parseAudienciasFilters(newSelectedIds);
    setFiltros(newFilters);
    setPagina(0);
  }, []);

  // Funções de navegação
  const navegarSemana = React.useCallback((direcao: 'anterior' | 'proxima') => {
    setSemanaAtual(prev => {
      if (!prev) return new Date();
      const novaSemana = new Date(prev);
      novaSemana.setDate(novaSemana.getDate() + (direcao === 'proxima' ? 7 : -7));
      return novaSemana;
    });
  }, []);

  const voltarSemanaAtual = React.useCallback(() => { setSemanaAtual(new Date()); }, []);

  const navegarMes = React.useCallback((direcao: 'anterior' | 'proximo') => {
    setMesAtual(prev => {
      if (!prev) return new Date();
      const novoMes = new Date(prev);
      novoMes.setMonth(novoMes.getMonth() + (direcao === 'proximo' ? 1 : -1));
      return novoMes;
    });
  }, []);

  const voltarMesAtual = React.useCallback(() => { setMesAtual(new Date()); }, []);

  const navegarAno = React.useCallback((direcao: 'anterior' | 'proximo') => {
    setAnoAtual(prev => {
      if (prev === null) return new Date().getFullYear();
      return direcao === 'proximo' ? prev + 1 : prev - 1;
    });
  }, []);

  const voltarAnoAtual = React.useCallback(() => { setAnoAtual(new Date().getFullYear()); }, []);

  const { inicioSemana, fimSemana } = React.useMemo(() => {
    if (!semanaAtual) {
      const agora = new Date();
      agora.setHours(0, 0, 0, 0);
      const day = agora.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      const inicio = new Date(agora);
      inicio.setDate(agora.getDate() + diff);
      const fim = new Date(inicio);
      fim.setDate(fim.getDate() + 4);
      return { inicioSemana: inicio, fimSemana: fim };
    }
    const date = new Date(semanaAtual);
    date.setHours(0, 0, 0, 0);
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const inicio = new Date(date);
    inicio.setDate(date.getDate() + diff);
    const fim = new Date(inicio);
    fim.setDate(fim.getDate() + 4);
    return { inicioSemana: inicio, fimSemana: fim };
  }, [semanaAtual]);

  const formatarDataCabecalho = (data: Date) => data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const formatarMesAno = (data: Date | null) => {
    if (!data) return '...';
    return data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(' De ', ' de ');
  };

  const audienciasSemCanceladas = React.useMemo(() => (audiencias || []).filter((a) => a.status !== 'C'), [audiencias]);
  const contadorAtivo = React.useMemo(() => paginacao ? paginacao.total : audienciasSemCanceladas.length, [paginacao, audienciasSemCanceladas.length]);

  return (
    <div className="space-y-4">
      {/* Linha 1: Busca e Filtros - Centralizada */}
      <div className="flex justify-center">
        <TableToolbar
          searchValue={busca}
          onSearchChange={(value) => { setBusca(value); setPagina(0); }}
          isSearching={isSearching}
          searchPlaceholder="Buscar audiências..."
          filterOptions={filterOptions}
          filterGroups={filterGroups}
          selectedFilters={selectedFilterIds}
          onFiltersChange={handleFilterIdsChange}
          filterButtonsMode="buttons"
          onNewClick={() => setNovaAudienciaOpen(true)}
          newButtonTooltip="Nova audiência"
        />
      </div>

      {/* Linha 2: Tabs + Controles de navegação + contador */}
      <div className="flex items-center gap-4 pt-2">
        <ClientOnlyTabs value={visualizacao} onValueChange={(value) => router.push(`/audiencias/${value}`)}>
          <TabsList>
            <TabsTrigger value="semana">Semana</TabsTrigger>
            <TabsTrigger value="mes">Mês</TabsTrigger>
            <TabsTrigger value="ano">Ano</TabsTrigger>
            <TabsTrigger value="lista">Lista</TabsTrigger>
          </TabsList>
        </ClientOnlyTabs>

        {visualizacao !== 'lista' && (
          <ButtonGroup>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                if (visualizacao === 'semana') navegarSemana('anterior');
                if (visualizacao === 'mes') navegarMes('anterior');
                if (visualizacao === 'ano') navegarAno('anterior');
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <ButtonGroupText className="whitespace-nowrap min-w-36 text-center text-sm font-normal flex items-center justify-center">
              {visualizacao === 'semana' && `${formatarDataCabecalho(inicioSemana)} - ${formatarDataCabecalho(fimSemana)}`}
              {visualizacao === 'mes' && formatarMesAno(mesAtual)}
              {visualizacao === 'ano' && (anoAtual ?? '...')}
            </ButtonGroupText>

            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                if (visualizacao === 'semana') navegarSemana('proxima');
                if (visualizacao === 'mes') navegarMes('proximo');
                if (visualizacao === 'ano') navegarAno('proximo');
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
                    if (visualizacao === 'semana') voltarSemanaAtual();
                    if (visualizacao === 'mes') voltarMesAtual();
                    if (visualizacao === 'ano') voltarAnoAtual();
                  }}
                  aria-label="Voltar para período atual"
                  className="bg-muted hover:bg-muted/80"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="px-2 py-1 text-xs">
                {visualizacao === 'semana' && 'Semana Atual'}
                {visualizacao === 'mes' && 'Mês Atual'}
                {visualizacao === 'ano' && 'Ano Atual'}
              </TooltipContent>
            </Tooltip>
          </ButtonGroup>
        )}
        <div className="inline-flex items-center h-9 rounded-md border border-input bg-primary/10 px-3 text-sm font-medium text-primary shrink-0">
          {contadorAtivo} audiências
        </div>
      </div>

      {/* Conteúdo da visualização */}
      {visualizacao === 'lista' && (
        <ResponsiveTable
          data={audiencias}
          columns={colunas}
          pagination={
            paginacao ? {
              pageIndex: paginacao.pagina - 1,
              pageSize: paginacao.limite,
              total: paginacao.total,
              totalPages: paginacao.totalPaginas,
              onPageChange: setPagina,
              onPageSizeChange: setLimite,
            } : undefined
          }
          sorting={{ columnId: ordenarPor, direction: ordem, onSortingChange: handleSortingChange }}
          isLoading={isLoading}
          error={error}
          mobileLayout="cards"
          stickyFirstColumn={true}
          emptyMessage="Nenhuma audiência encontrada."
        />
      )}

      {visualizacao === 'semana' && semanaAtual && (
        <AudienciasVisualizacaoSemana
          audiencias={audiencias}
          isLoading={isLoading}
          semanaAtual={semanaAtual}
          usuarios={usuarios}
          onRefresh={refetch}
        />
      )}

      {visualizacao === 'mes' && mesAtual && (
        <AudienciasVisualizacaoMes audiencias={audiencias} isLoading={isLoading} mesAtual={mesAtual} />
      )}

      {visualizacao === 'ano' && anoAtual !== null && (
        <AudienciasVisualizacaoAno audiencias={audiencias} isLoading={isLoading} anoAtual={anoAtual} />
      )}

      <NovaAudienciaDialog open={novaAudienciaOpen} onOpenChange={setNovaAudienciaOpen} onSuccess={handleSuccess} />
    </div>
  );
}
