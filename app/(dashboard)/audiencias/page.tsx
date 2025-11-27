'use client';

// Página de audiências - Lista audiências agendadas

import * as React from 'react';
import Image from 'next/image';
import { useDebounce } from '@/app/_lib/hooks/use-debounce';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { ClientOnlyTabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/client-only-tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { ButtonGroup, ButtonGroupText } from '@/components/ui/button-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar, CalendarDays, CalendarRange, ChevronLeft, ChevronRight, Copy, List, Pencil, RotateCcw, FileText } from 'lucide-react';
import { PdfViewerDialog } from '@/app/(dashboard)/expedientes/components/pdf-viewer-dialog';
import { AudienciasVisualizacaoSemana } from './components/audiencias-visualizacao-semana';
import { AudienciasVisualizacaoMes } from './components/audiencias-visualizacao-mes';
import { AudienciasVisualizacaoAno } from './components/audiencias-visualizacao-ano';
import { NovaAudienciaDialog } from './components/nova-audiencia-dialog';
import { EditarEnderecoDialog } from './components/editar-endereco-dialog';
import { EditarObservacoesDialog } from './components/editar-observacoes-dialog';
import { useAudiencias } from '@/app/_lib/hooks/use-audiencias';
import { useUsuarios } from '@/app/_lib/hooks/use-usuarios';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { buildAudienciasFilterOptions, buildAudienciasFilterGroups, parseAudienciasFilters } from './components/audiencias-toolbar-filters';
import type { ColumnDef } from '@tanstack/react-table';
import type { Audiencia } from '@/backend/types/audiencias/types';
import type { AudienciasFilters } from '@/app/_lib/types/audiencias';


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
    // Criar nova data apenas com ano, mês e dia (zerar horas)
    const dataNormalizada = new Date(data.getFullYear(), data.getMonth(), data.getDate());
    return dataNormalizada.getTime();
  } catch {
    return 0;
  }
};

/**
 * Formata o grau para exibição
 */
const formatarGrau = (grau: 'primeiro_grau' | 'segundo_grau'): string => {
  return grau === 'primeiro_grau' ? '1º Grau' : '2º Grau';
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

/**
 * Retorna a classe CSS de cor para badge do grau
 */
const getGrauColorClass = (grau: 'primeiro_grau' | 'segundo_grau'): string => {
  const grauColors: Record<string, string> = {
    'primeiro_grau': 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-200 dark:border-emerald-800',
    'segundo_grau': 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-800',
  };

  return grauColors[grau] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-800';
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
 * Detecta qual plataforma de videoconferência baseado na URL
 */
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

/**
 * Retorna o caminho da logo para a plataforma
 */
const getLogoPlataforma = (plataforma: PlataformaVideo): string | null => {
  const logos: Record<string, string> = {
    zoom: '/Zoom_Logo.png',
    meet: '/meet_logo.png',
    webex: '/webex_logo.png',
  };
  return plataforma ? logos[plataforma] : null;
};

/**
 * Componente de header com popover para ordenação da coluna Processo
 */
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
          <Button
            variant="ghost"
            size="sm"
            className="h-8 data-[state=open]:bg-accent"
          >
            <span className="text-sm font-medium">Processo</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="ml-1 h-4 w-4"
            >
              <path d="m7 15 5 5 5-5" />
              <path d="m7 9 5-5 5 5" />
            </svg>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[min(92vw,13.75rem)] p-2" align="start">
          <div className="space-y-1">
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              Ordenar por Tribunal
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => {
                onSort('trt', 'asc');
                setIsOpen(false);
              }}
            >
              ↑ Crescente
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => {
                onSort('trt', 'desc');
                setIsOpen(false);
              }}
            >
              ↓ Decrescente
            </Button>
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">
              Ordenar por Grau
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => {
                onSort('grau', 'asc');
                setIsOpen(false);
              }}
            >
              ↑ Crescente
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => {
                onSort('grau', 'desc');
                setIsOpen(false);
              }}
            >
              ↓ Decrescente
            </Button>
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">
              Ordenar por Órgão Julgador
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => {
                onSort('orgao_julgador_descricao', 'asc');
                setIsOpen(false);
              }}
            >
              ↑ Crescente
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => {
                onSort('orgao_julgador_descricao', 'desc');
                setIsOpen(false);
              }}
            >
              ↓ Decrescente
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

/**
 * Componente de header com popover para ordenação da coluna Partes
 */

/**
 * Componente de header com ordenação simples para coluna Responsável
 */
function ResponsavelColumnHeader({
  onSort,
}: {
  onSort: (direction: 'asc' | 'desc') => void;
}) {
  const [currentDirection, setCurrentDirection] = React.useState<'asc' | 'desc'>('asc');

  const handleClick = () => {
    const newDirection = currentDirection === 'asc' ? 'desc' : 'asc';
    setCurrentDirection(newDirection);
    onSort(newDirection);
  };

  return (
    <div className="flex items-center justify-center">
      <Button
        variant="ghost"
        size="sm"
        className="h-8 hover:bg-accent"
        onClick={handleClick}
      >
        <span className="text-sm font-medium">Responsável</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="ml-1 h-4 w-4"
        >
          {currentDirection === 'asc' ? (
            <path d="m7 15 5 5 5-5" />
          ) : (
            <path d="m7 9 5-5 5 5" />
          )}
        </svg>
      </Button>
    </div>
  );
}

/**
 * Componente para exibir e editar endereço da audiência (URL virtual ou endereço físico)
 */
  function EnderecoCell({ audiencia, onSuccess }: { audiencia: Audiencia; onSuccess: () => void }) {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const handleCopyText = async (text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Erro ao copiar:', error);
    }
  };

  const plataforma = detectarPlataforma(audiencia.url_audiencia_virtual);
  const logoPath = getLogoPlataforma(plataforma);

  // Exibir endereço atual
  const renderEnderecoAtual = () => {
    if (audiencia.url_audiencia_virtual) {
      return (
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleCopyText(audiencia.url_audiencia_virtual!)}
            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Copiar Endereço"
          >
            <Copy className="h-3 w-3" />
          </Button>
          {logoPath ? (
            <a
              href={audiencia.url_audiencia_virtual}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Acessar audiência virtual via ${plataforma}`}
              className="hover:opacity-70 transition-opacity flex items-center justify-center"
            >
              <Image src={logoPath} alt={plataforma || 'Plataforma de vídeo'} width={80} height={30} className="object-contain" />
            </a>
          ) : (
            <a
              href={audiencia.url_audiencia_virtual}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Acessar audiência virtual"
              className="text-xs text-blue-600 hover:underline truncate max-w-[100px]"
            >
              {audiencia.url_audiencia_virtual}
            </a>
          )}
        </div>
      );
    } else if (audiencia.endereco_presencial) {
      const enderecoStr = [
        audiencia.endereco_presencial.logradouro,
        audiencia.endereco_presencial.numero,
        audiencia.endereco_presencial.complemento,
        audiencia.endereco_presencial.bairro,
        audiencia.endereco_presencial.cidade,
        audiencia.endereco_presencial.estado,
        audiencia.endereco_presencial.pais,
        audiencia.endereco_presencial.cep
      ].filter(Boolean).join(', ');

      return (
        <div className="flex items-center gap-1 w-full">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleCopyText(enderecoStr)}
            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Copiar Endereço"
          >
            <Copy className="h-3 w-3" />
          </Button>
          <span className="text-sm whitespace-pre-wrap wrap-break-word w-full">
            {enderecoStr || '-'}
          </span>
        </div>
      );
    } else {
      return <span className="text-sm text-muted-foreground">-</span>;
    }
  };

  return (
    <>
      <div className="relative group h-full w-full min-h-[60px] flex items-center justify-center p-2">
        {renderEnderecoAtual()}
        <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsDialogOpen(true)}
            className="h-5 w-5 p-0"
            title="Editar Endereço"
          >
            <Pencil className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <EditarEnderecoDialog
        audiencia={audiencia}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={onSuccess}
      />
    </>
  );
}

/**
 * Componente para exibir e editar observações da audiência
 */
function ObservacoesCell({ audiencia, onSuccess }: { audiencia: Audiencia; onSuccess: () => void }) {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  return (
    <>
      <div className="relative group h-full w-full min-h-[60px] flex items-start justify-start p-2">
        <span className="text-sm whitespace-pre-wrap wrap-break-word w-full">
          {audiencia.observacoes || '-'}
        </span>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsDialogOpen(true)}
          className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-1 right-1"
          title="Editar observações"
        >
          <Pencil className="h-3 w-3" />
        </Button>
      </div>
      <EditarObservacoesDialog
        audiencia={audiencia}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={onSuccess}
      />
    </>
  );
}

/**
 * Componente para atribuir responsável a uma audiência
 */
function ResponsavelCell({
  audiencia,
  onSuccess,
  usuarios
}: {
  audiencia: Audiencia;
  onSuccess: () => void;
  usuarios: Array<{ id: number; nomeExibicao: string }>;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSelect = async (value: string) => {
    setIsLoading(true);
    try {
      const responsavelId = value === 'null' || value === '' ? null : parseInt(value, 10);

      const response = await fetch(`/api/audiencias/${audiencia.id}/responsavel`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
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
      // Não chamar onSuccess() em caso de erro para evitar falsa impressão de sucesso
    } finally {
      setIsLoading(false);
    }
  };

  const responsavelAtual = usuarios.find(u => u.id === audiencia.responsavel_id);

  return (
    <div className="relative group h-full w-full min-h-[60px] flex items-center justify-center p-2">
      <span className="text-sm">
        {responsavelAtual ? responsavelAtual.nomeExibicao : 'Sem responsável'}
      </span>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-1 right-1"
            title="Editar responsável"
            disabled={isLoading}
          >
            <Pencil className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[min(92vw,15.625rem)] p-2">
          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => handleSelect('null')}
              disabled={isLoading}
            >
              Sem responsável
            </Button>
            {usuarios.map((usuario) => (
              <Button
                key={usuario.id}
                variant="ghost"
                className="w-full justify-start text-sm"
                onClick={() => handleSelect(usuario.id.toString())}
                disabled={isLoading}
              >
                {usuario.nomeExibicao}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

/**
 * Define as colunas da tabela de audiências
 */
function criarColunas(
  onSuccess: () => void,
  usuarios: Array<{ id: number; nomeExibicao: string }>,
  onProcessoSort: (field: 'trt' | 'grau' | 'orgao_julgador_descricao', direction: 'asc' | 'desc') => void,
  onResponsavelSort: (direction: 'asc' | 'desc') => void
): ColumnDef<Audiencia>[] {
  return [
    {
      accessorKey: 'data_inicio',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Data/Hora" />
        </div>
      ),
      enableSorting: true,
      size: 140,
      meta: { align: 'left' },
      // Sorting customizado que ordena apenas por data (ignora hora)
      sortingFn: (rowA, rowB) => {
        const dataA = normalizarDataParaComparacao(rowA.original.data_inicio);
        const dataB = normalizarDataParaComparacao(rowB.original.data_inicio);
        return dataA - dataB;
      },
      cell: ({ row }) => {
        const dataInicio = row.getValue('data_inicio') as string | null;
        const audiencia = row.original as Audiencia;
        const [openAta, setOpenAta] = React.useState(false);
        const fileKey = extractKeyFromBackblazeUrl(audiencia.url_ata_audiencia);
        const canOpenAta = audiencia.status === 'F' && fileKey !== null;
        return (
          <div className="min-h-10 flex flex-col items-center justify-center text-sm gap-1">
            <div className="font-medium">{formatarData(dataInicio)}</div>
            <div className="text-sm font-medium">{formatarHora(dataInicio)}h</div>
            {canOpenAta && (
              <button
                className="h-6 w-6 flex items-center justify-center rounded"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenAta(true);
                }}
                title="Ver Ata de Audiência"
              >
                <FileText className="h-4 w-4 text-primary" />
              </button>
            )}
            <PdfViewerDialog
              open={openAta}
              onOpenChange={setOpenAta}
              fileKey={fileKey}
              documentTitle={`Ata da audiência ${audiencia.numero_processo}`}
            />
          </div>
        );
      },
    },
    {
      id: 'processo',
      header: () => <ProcessoColumnHeader onSort={onProcessoSort} />,
      enableSorting: false,
      size: 320,
      meta: { align: 'left' },
      cell: ({ row }) => {
        const classeJudicial = row.original.classe_judicial || '';
        const numeroProcesso = row.original.numero_processo;
        const trt = row.original.trt;
        const grau = row.original.grau;
        const orgaoJulgador = row.original.orgao_julgador_descricao || '-';
        const parteAutora = row.original.polo_ativo_nome || '-';
        const parteRe = row.original.polo_passivo_nome || '-';

        return (
          <div className="min-h-10 flex flex-col items-start justify-center gap-1.5 max-w-[300px] overflow-hidden">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant="outline" className={`${getTRTColorClass(trt)} w-fit text-xs`}>
                {trt}
              </Badge>
              <Badge variant="outline" className={`${getGrauColorClass(grau)} w-fit text-xs`}>
                {formatarGrau(grau)}
              </Badge>
            </div>
            <div className="text-sm font-medium whitespace-nowrap">
              {classeJudicial && `${classeJudicial} `}{numeroProcesso}
            </div>
            <div className="flex flex-col gap-1 w-full max-w-full">
              <Badge variant="outline" className={`${getParteAutoraColorClass()} max-w-full text-left truncate`}>
                {parteAutora}
              </Badge>
              <Badge variant="outline" className={`${getParteReColorClass()} max-w-full text-left truncate`}>
                {parteRe}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground w-full truncate">
              {orgaoJulgador}
            </div>
          </div>
        );
      },
    },
    {
      id: 'detalhes',
      header: () => (
        <div className="flex items-center justify-center">
          <div className="text-sm font-medium">Detalhes</div>
        </div>
      ),
      enableSorting: false,
      size: 260,
      meta: { align: 'left' },
      cell: ({ row }) => {
        const tipo = row.original.tipo_descricao || '-';
        const sala = row.original.sala_audiencia_nome || '-';
        const audiencia = row.original;
        const [isDialogOpen, setIsDialogOpen] = React.useState(false);
        const plataforma = detectarPlataforma(audiencia.url_audiencia_virtual);
        const logoPath = getLogoPlataforma(plataforma);
        const fileKey = extractKeyFromBackblazeUrl(audiencia.url_ata_audiencia);
        const canOpenAta = audiencia.status === 'F' && fileKey !== null;

        return (
          <div className="min-h-10 flex flex-col items-start justify-center gap-1.5 max-w-[240px] overflow-hidden">
            <div className="text-sm text-left truncate w-full">{tipo}</div>
            <div className="text-xs text-muted-foreground truncate w-full text-left">{sala}</div>
            <div className="relative group h-full w-full min-h-[60px] flex items-center justify-between p-2">
              <div className="flex-1 flex items-center justify-start overflow-hidden">
                {audiencia.url_audiencia_virtual ? (
                  logoPath ? (
                    <a href={audiencia.url_audiencia_virtual} target="_blank" rel="noopener noreferrer" aria-label={`Acessar audiência virtual`} className="hover:opacity-70 transition-opacity flex items-center justify-center">
                      <Image src={logoPath} alt={plataforma || 'Plataforma de vídeo'} width={80} height={30} className="object-contain" />
                    </a>
                  ) : (
                    <a href={audiencia.url_audiencia_virtual} target="_blank" rel="noopener noreferrer" aria-label="Acessar audiência virtual" className="text-xs text-blue-600 hover:underline truncate max-w-full">
                      {audiencia.url_audiencia_virtual}
                    </a>
                  )
                ) : audiencia.endereco_presencial ? (
                  <span className="text-sm line-clamp-3 w-full break-words">
                    {[audiencia.endereco_presencial.logradouro, audiencia.endereco_presencial.numero, audiencia.endereco_presencial.complemento, audiencia.endereco_presencial.bairro, audiencia.endereco_presencial.cidade, audiencia.endereco_presencial.estado, audiencia.endereco_presencial.pais, audiencia.endereco_presencial.cep].filter(Boolean).join(', ') || '-'}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </div>
              <div className="absolute bottom-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {audiencia.url_audiencia_virtual && (
                  <Button size="sm" variant="ghost" onClick={async () => { if (!audiencia.url_audiencia_virtual) return; try { await navigator.clipboard.writeText(audiencia.url_audiencia_virtual); } catch {} }} className="h-5 w-5 p-0" title="Copiar URL">
                    <Copy className="h-3 w-3" />
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => setIsDialogOpen(true)} className="h-5 w-5 p-0" title="Editar Endereço">
                  <Pencil className="h-3 w-3" />
                </Button>
              </div>
              <EditarEnderecoDialog audiencia={audiencia} open={isDialogOpen} onOpenChange={setIsDialogOpen} onSuccess={onSuccess} />
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'observacoes',
      header: () => (
        <div className="flex items-center justify-center">
          <div className="text-sm font-medium">Observações</div>
        </div>
      ),
      enableSorting: false,
      size: 250,
      meta: { align: 'left' },
      cell: ({ row }) => (
        <div className="h-full w-full">
          <ObservacoesCell audiencia={row.original} onSuccess={onSuccess} />
        </div>
      ),
    },
    {
      accessorKey: 'responsavel_id',
      header: () => <ResponsavelColumnHeader onSort={onResponsavelSort} />,
      enableSorting: false,
      meta: { align: 'left' },
      cell: ({ row }) => (
        <div className="min-h-10 flex items-center justify-center">
          <ResponsavelCell audiencia={row.original} onSuccess={onSuccess} usuarios={usuarios} />
        </div>
      ),
    },
  ];
}

export default function AudienciasPage() {
  const [busca, setBusca] = React.useState('');
  const [pagina, setPagina] = React.useState(0);
  const [limite, setLimite] = React.useState(50);
  const [ordenarPor, setOrdenarPor] = React.useState<
    | 'data_inicio'
    | 'numero_processo'
    | 'polo_ativo_nome'
    | 'polo_passivo_nome'
    | 'trt'
    | 'grau'
    | 'orgao_julgador_descricao'
    | 'tipo_descricao'
    | 'sala_audiencia_nome'
    | 'responsavel_id'
    | null
  >('data_inicio');
  const [ordem, setOrdem] = React.useState<'asc' | 'desc'>('asc');
  const [filtros, setFiltros] = React.useState<AudienciasFilters>({});
  const [visualizacao, setVisualizacao] = React.useState<'tabela' | 'semana' | 'mes' | 'ano'>('semana');
  const [novaAudienciaOpen, setNovaAudienciaOpen] = React.useState(false);

  // Usar null como valor inicial para evitar hydration mismatch
  // O valor real será definido no useEffect apenas no cliente
  const [semanaAtual, setSemanaAtual] = React.useState<Date | null>(null);
  const [mesAtual, setMesAtual] = React.useState<Date | null>(null);
  const [anoAtual, setAnoAtual] = React.useState<number | null>(null);
  const [selectedFilterIds, setSelectedFilterIds] = React.useState<string[]>([]);

  // Inicializar datas apenas no cliente para evitar hydration mismatch
  React.useEffect(() => {
    const agora = new Date();
    setSemanaAtual(agora);
    setMesAtual(agora);
    setAnoAtual(agora.getFullYear());
  }, []);

  // Debounce da busca
  const buscaDebounced = useDebounce(busca, 500);
  const isSearching = busca !== buscaDebounced;

  // Verifica se as datas foram inicializadas (evita busca antes do useEffect)
  const datasInicializadas = semanaAtual !== null && mesAtual !== null && anoAtual !== null;

  // Calcular filtros de data baseados na visualização selecionada
  const filtrosData = React.useMemo(() => {
    // Na visualização de lista, não aplicamos filtros de data automáticos
    if (visualizacao === 'tabela') {
      return {};
    }

    // Na visualização de semana, filtrar pela semana selecionada
    if (visualizacao === 'semana' && semanaAtual) {
      const date = new Date(semanaAtual);
      date.setHours(0, 0, 0, 0);
      const day = date.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      const inicio = new Date(date);
      inicio.setDate(date.getDate() + diff);
      const fim = new Date(inicio);
      fim.setDate(fim.getDate() + 6); // Até domingo (0 + 6 = 6 dias após segunda)
      fim.setHours(23, 59, 59, 999);

      return {
        data_inicio_inicio: inicio.toISOString(),
        data_inicio_fim: fim.toISOString(),
      };
    }

    // Na visualização de mês, filtrar pelo mês selecionado
    if (visualizacao === 'mes' && mesAtual) {
      const ano = mesAtual.getFullYear();
      const mes = mesAtual.getMonth();
      const inicio = new Date(ano, mes, 1);
      const fim = new Date(ano, mes + 1, 0, 23, 59, 59, 999);

      return {
        data_inicio_inicio: inicio.toISOString(),
        data_inicio_fim: fim.toISOString(),
      };
    }

    // Na visualização de ano, filtrar pelo ano selecionado
    if (visualizacao === 'ano' && anoAtual !== null) {
      const inicio = new Date(anoAtual, 0, 1);
      const fim = new Date(anoAtual, 11, 31, 23, 59, 59, 999);

      return {
        data_inicio_inicio: inicio.toISOString(),
        data_inicio_fim: fim.toISOString(),
      };
    }

    return {};
  }, [visualizacao, semanaAtual, mesAtual, anoAtual]);

  // Parâmetros para buscar audiências
  const params = React.useMemo(
    () => ({
      pagina: pagina + 1, // API usa 1-indexed
      limite: visualizacao === 'tabela' ? limite : 1000, // Limite maior para visualizações de calendário
      busca: buscaDebounced || undefined,
      ordenar_por: ordenarPor || undefined,
      ordem,
      ...filtros, // Spread dos filtros avançados (inclui status agora)
      ...filtrosData, // Filtros de data baseados na visualização
    }),
    [pagina, limite, buscaDebounced, ordenarPor, ordem, filtros, filtrosData, visualizacao]
  );

  // Só busca quando as datas estão inicializadas (para visualizações de calendário)
  // ou quando é visualização de lista (que não depende das datas)
  const podesBuscar = visualizacao === 'tabela' || datasInicializadas;
  const { audiencias: audienciasRaw, paginacao, isLoading, error, refetch } = useAudiencias(params, { enabled: podesBuscar });

  // Buscar usuários uma única vez para compartilhar entre todas as células
  const { usuarios } = useUsuarios({ ativo: true, limite: 100 });

  // Ordenar por data normalizada quando ordenar por data_inicio
  const audiencias = React.useMemo(() => {
    if (!audienciasRaw || ordenarPor !== 'data_inicio') {
      return audienciasRaw;
    }

    // Ordenar por data normalizada (ignorando hora)
    const audienciasOrdenadas = [...audienciasRaw].sort((a, b) => {
      const dataA = normalizarDataParaComparacao(a.data_inicio);
      const dataB = normalizarDataParaComparacao(b.data_inicio);
      return ordem === 'asc' ? dataA - dataB : dataB - dataA;
    });

    return audienciasOrdenadas;
  }, [audienciasRaw, ordenarPor, ordem]);

  const handleSuccess = React.useCallback(() => {
    refetch();
  }, [refetch]);

  const handleSortingChange = React.useCallback(
    (columnId: string | null, direction: 'asc' | 'desc' | null) => {
      if (columnId && direction) {
        setOrdenarPor(columnId as typeof ordenarPor);
        setOrdem(direction);
      } else {
        setOrdenarPor(null);
        setOrdem('asc');
      }
    },
    []
  );

  // Callbacks para sorting de cada coluna
  const handleProcessoSort = React.useCallback(
    (field: 'trt' | 'grau' | 'orgao_julgador_descricao', direction: 'asc' | 'desc') => {
      handleSortingChange(field, direction);
    },
    [handleSortingChange]
  );

  

  const handleResponsavelSort = React.useCallback(
    (direction: 'asc' | 'desc') => {
      setOrdenarPor('responsavel_id');
      setOrdem(direction);
    },
    []
  );

  const colunas = React.useMemo(
    () =>
      criarColunas(
        handleSuccess,
        usuarios,
        handleProcessoSort,
        handleResponsavelSort
      ),
    [handleSuccess, usuarios, handleProcessoSort, handleResponsavelSort]
  );

  // Gerar opções de filtro
  const filterOptions = React.useMemo(() => buildAudienciasFilterOptions(usuarios), [usuarios]);
  const filterGroups = React.useMemo(() => buildAudienciasFilterGroups(usuarios), [usuarios]);

  // Converter IDs selecionados para filtros
  const handleFilterIdsChange = React.useCallback((newSelectedIds: string[]) => {
    setSelectedFilterIds(newSelectedIds);
    const newFilters = parseAudienciasFilters(newSelectedIds);
    setFiltros(newFilters);
    setPagina(0);
  }, []);

  // Funções para navegação de semana
  const navegarSemana = React.useCallback((direcao: 'anterior' | 'proxima') => {
    setSemanaAtual(prev => {
      if (!prev) return new Date();
      const novaSemana = new Date(prev);
      novaSemana.setDate(novaSemana.getDate() + (direcao === 'proxima' ? 7 : -7));
      return novaSemana;
    });
  }, []);

  const voltarSemanaAtual = React.useCallback(() => {
    setSemanaAtual(new Date());
  }, []);

  // Funções para navegação de mês
  const navegarMes = React.useCallback((direcao: 'anterior' | 'proximo') => {
    setMesAtual(prev => {
      if (!prev) return new Date();
      const novoMes = new Date(prev);
      novoMes.setMonth(novoMes.getMonth() + (direcao === 'proximo' ? 1 : -1));
      return novoMes;
    });
  }, []);

  const voltarMesAtual = React.useCallback(() => {
    setMesAtual(new Date());
  }, []);

  // Funções para navegação de ano
  const navegarAno = React.useCallback((direcao: 'anterior' | 'proximo') => {
    setAnoAtual(prev => {
      if (prev === null) return new Date().getFullYear();
      return direcao === 'proximo' ? prev + 1 : prev - 1;
    });
  }, []);

  const voltarAnoAtual = React.useCallback(() => {
    setAnoAtual(new Date().getFullYear());
  }, []);

  // Calcular início e fim da semana para exibição
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
      fim.setHours(23, 59, 59, 999);
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
    fim.setHours(23, 59, 59, 999);

    return { inicioSemana: inicio, fimSemana: fim };
  }, [semanaAtual]);

  const formatarDataCabecalho = (data: Date) => {
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatarMesAno = (data: Date | null) => {
    if (!data) return '...';
    return data.toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric',
    }).replace(' De ', ' de ');
  };

  // Contagem de audiências não canceladas nos dados retornados
  const audienciasSemCanceladas = React.useMemo(() => {
    return (audiencias || []).filter((a) => a.status !== 'C');
  }, [audiencias]);

  // Contador da visualização ativa (usa total da paginação ou contagem local)
  // Cada visualização mostra apenas seu próprio contador quando ativa
  const contadorAtivo = React.useMemo(() => {
    // Se não temos paginação ainda, conta localmente
    if (!paginacao) return audienciasSemCanceladas.length;
    // Usa o total da API (já filtrado pelo período da visualização)
    return paginacao.total;
  }, [paginacao, audienciasSemCanceladas.length]);

  return (
    <ClientOnlyTabs value={visualizacao} onValueChange={(value) => setVisualizacao(value as typeof visualizacao)}>
      <div className="space-y-4">
        {/* Barra de busca, filtros e tabs de visualização */}
        <div className="flex items-center gap-4 pb-6">
          <TableToolbar
            searchValue={busca}
            onSearchChange={(value) => {
              setBusca(value);
              setPagina(0);
            }}
            isSearching={isSearching}
            searchPlaceholder="Buscar audiências..."
            filterOptions={filterOptions}
            filterGroups={filterGroups}
            selectedFilters={selectedFilterIds}
            onFiltersChange={handleFilterIdsChange}
            onNewClick={() => setNovaAudienciaOpen(true)}
            newButtonTooltip="Nova audiência"
          />

          {/* Tabs de visualização */}
          <TabsList>
            <TabsTrigger value="semana" aria-label="Visualização Semanal">
              <CalendarRange className="h-4 w-4" />
              <span>Semana</span>
              {visualizacao === 'semana' && <Badge variant="secondary" className="ml-2">{contadorAtivo}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="mes" aria-label="Visualização Mensal">
              <Calendar className="h-4 w-4" />
              <span>Mês</span>
              {visualizacao === 'mes' && <Badge variant="secondary" className="ml-2">{contadorAtivo}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="ano" aria-label="Visualização Anual">
              <CalendarDays className="h-4 w-4" />
              <span>Ano</span>
              {visualizacao === 'ano' && <Badge variant="secondary" className="ml-2">{contadorAtivo}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="tabela" aria-label="Visualização em Lista">
              <List className="h-4 w-4" />
              <span>Lista</span>
              {visualizacao === 'tabela' && <Badge variant="secondary" className="ml-2">{contadorAtivo}</Badge>}
            </TabsTrigger>
          </TabsList>

          {/* Controles de navegação e rollback - aparecem apenas quando não é visualização de lista */}
          {visualizacao !== 'tabela' && (
            <ButtonGroup>
              {/* Botão Anterior */}
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

              {/* Indicador de período atual */}
              <ButtonGroupText className="whitespace-nowrap capitalize min-w-32 text-center text-xs font-normal">
                {visualizacao === 'semana' && `${formatarDataCabecalho(inicioSemana)} - ${formatarDataCabecalho(fimSemana)}`}
                {visualizacao === 'mes' && formatarMesAno(mesAtual)}
                {visualizacao === 'ano' && (anoAtual ?? '...')}
              </ButtonGroupText>

              {/* Botão Próximo */}
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

              {/* Botão Rollback (Voltar para atual) */}
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
        </div>

        <TabsContent value="tabela">
          {/* Tabela */}
          <DataTable
            data={audiencias}
            columns={colunas}
            pagination={
              paginacao
                ? {
                  pageIndex: paginacao.pagina - 1, // Converter para 0-indexed
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
            emptyMessage="Nenhuma audiência encontrada."
          />
        </TabsContent>

        <TabsContent value="semana">
          {semanaAtual && (
            <AudienciasVisualizacaoSemana
              audiencias={audiencias}
              isLoading={isLoading}
              semanaAtual={semanaAtual as Date}
              usuarios={usuarios}
              onRefresh={refetch}
            />
          )}
        </TabsContent>

        <TabsContent value="mes">
          {mesAtual && (
            <AudienciasVisualizacaoMes
              audiencias={audiencias}
              isLoading={isLoading}
              mesAtual={mesAtual as Date}
            />
          )}
        </TabsContent>

        <TabsContent value="ano">
          {anoAtual !== null && (
            <AudienciasVisualizacaoAno
              audiencias={audiencias}
              isLoading={isLoading}
              anoAtual={anoAtual as number}
            />
          )}
        </TabsContent>
      </div>

      {/* Dialog para criar nova audiência */}
      <NovaAudienciaDialog
        open={novaAudienciaOpen}
        onOpenChange={setNovaAudienciaOpen}
        onSuccess={handleSuccess}
      />
    </ClientOnlyTabs>
  );
}
