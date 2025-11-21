'use client';

// Página de audiências - Lista audiências agendadas

import * as React from 'react';
import Image from 'next/image';
import { useDebounce } from '@/hooks/use-debounce';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { ButtonGroup, ButtonGroupText } from '@/components/ui/button-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar, CalendarDays, CalendarRange, ChevronLeft, ChevronRight, Copy, List, Pencil, Plus, RotateCcw } from 'lucide-react';
import { AudienciasVisualizacaoSemana } from './components/audiencias-visualizacao-semana';
import { AudienciasVisualizacaoMes } from './components/audiencias-visualizacao-mes';
import { AudienciasVisualizacaoAno } from './components/audiencias-visualizacao-ano';
import { NovaAudienciaDialog } from './components/nova-audiencia-dialog';
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
 * Componente para editar URL da audiência virtual
 */
function UrlVirtualCell({ audiencia, onSuccess }: { audiencia: Audiencia; onSuccess: () => void }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [url, setUrl] = React.useState(audiencia.url_audiencia_virtual || '');
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setUrl(audiencia.url_audiencia_virtual || '');
    setError(null);
  }, [audiencia.url_audiencia_virtual]);

  React.useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isOpen]);

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const urlToSave = url.trim() || null;

      // Validar URL se fornecida
      if (urlToSave) {
        try {
          new URL(urlToSave);
        } catch {
          setError('URL inválida. Use o formato: https://exemplo.com');
          setIsLoading(false);
          return;
        }
      }

      const response = await fetch(`/api/audiencias/${audiencia.id}/url-virtual`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ urlAudienciaVirtual: urlToSave }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || 'Erro ao atualizar URL');
      }

      setIsOpen(false);
      onSuccess();
    } catch (error) {
      console.error('Erro ao atualizar URL:', error);
      setError(error instanceof Error ? error.message : 'Erro ao salvar URL');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setUrl(audiencia.url_audiencia_virtual || '');
    setError(null);
    setIsOpen(false);
  };

  const handleCopyUrl = async () => {
    if (!audiencia.url_audiencia_virtual) return;
    try {
      await navigator.clipboard.writeText(audiencia.url_audiencia_virtual);
    } catch (error) {
      console.error('Erro ao copiar URL:', error);
    }
  };

  const plataforma = detectarPlataforma(audiencia.url_audiencia_virtual);
  const logoPath = getLogoPlataforma(plataforma);

  return (
    <div className="relative group h-full w-full min-h-[60px] flex items-center justify-center p-2">
      {audiencia.url_audiencia_virtual ? (
        <>
          {logoPath ? (
            <a
              href={audiencia.url_audiencia_virtual}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Acessar audiência virtual via ${plataforma}`}
              className="hover:opacity-70 transition-opacity flex items-center justify-center"
            >
              <Image
                src={logoPath}
                alt={plataforma || 'Plataforma de vídeo'}
                width={80}
                height={30}
                className="object-contain"
              />
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
          <div className="absolute bottom-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopyUrl}
              className="h-5 w-5 p-0 bg-gray-100 hover:bg-gray-200 shadow-sm"
              title="Copiar URL"
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Popover open={isOpen} onOpenChange={setIsOpen}>
              <PopoverTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-5 w-5 p-0 bg-gray-100 hover:bg-gray-200 shadow-sm"
                  title="Editar URL"
                  disabled={isLoading}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[350px]" align="start">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label htmlFor="url-input" className="text-sm font-medium">
                      URL da Audiência Virtual
                    </label>
                    <Input
                      ref={inputRef}
                      id="url-input"
                      value={url}
                      onChange={(e) => {
                        setUrl(e.target.value);
                        setError(null);
                      }}
                      placeholder="https://meet.google.com/..."
                      disabled={isLoading}
                      className="h-9 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSave();
                        if (e.key === 'Escape') handleCancel();
                      }}
                    />
                    {error && (
                      <p className="text-xs text-red-600">{error}</p>
                    )}
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancel}
                      disabled={isLoading}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Salvando...' : 'Salvar'}
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </>
      ) : (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-1 right-1"
              title="Adicionar URL"
              disabled={isLoading}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[350px]" align="start">
            <div className="space-y-3">
              <div className="space-y-1">
                <label htmlFor="url-input" className="text-sm font-medium">
                  URL da Audiência Virtual
                </label>
                <Input
                  ref={inputRef}
                  id="url-input"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setError(null);
                  }}
                  placeholder="https://meet.google.com/..."
                  disabled={isLoading}
                  className="h-9 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave();
                    if (e.key === 'Escape') handleCancel();
                  }}
                />
                {error && (
                  <p className="text-xs text-red-600">{error}</p>
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isLoading}
                >
                  {isLoading ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

/**
 * Componente para editar observações da audiência
 */
function ObservacoesCell({ audiencia, onSuccess }: { audiencia: Audiencia; onSuccess: () => void }) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [observacoes, setObservacoes] = React.useState(audiencia.observacoes || '');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    setObservacoes(audiencia.observacoes || '');
  }, [audiencia.observacoes]);

  React.useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const observacoesToSave = observacoes.trim() || null;

      const response = await fetch(`/api/audiencias/${audiencia.id}/observacoes`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ observacoes: observacoesToSave }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || 'Erro ao atualizar observações');
      }

      setIsEditing(false);
      onSuccess();
    } catch (error) {
      console.error('Erro ao atualizar observações:', error);
      onSuccess();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setObservacoes(audiencia.observacoes || '');
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="relative h-full w-full min-h-[60px] p-2">
        <textarea
          ref={textareaRef}
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Digite as observações..."
          disabled={isLoading}
          className="w-full h-full min-h-[60px] resize-none border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          onKeyDown={(e) => {
            if (e.key === 'Escape') handleCancel();
          }}
        />
        <div className="absolute bottom-2 right-2 flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSave}
            disabled={isLoading}
            className="h-5 w-5 p-0 bg-green-100 hover:bg-green-200 shadow-sm"
            title="Salvar"
          >
            <span className="text-green-700 text-xs font-bold">✓</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancel}
            disabled={isLoading}
            className="h-5 w-5 p-0 bg-red-100 hover:bg-red-200 shadow-sm"
            title="Cancelar"
          >
            <span className="text-red-700 text-xs font-bold">✕</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group h-full w-full min-h-[60px] flex items-start justify-start p-2">
      <span className="text-sm whitespace-pre-wrap wrap-break-word w-full">
        {audiencia.observacoes || '-'}
      </span>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setIsEditing(true)}
        className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-1 right-1"
        title="Editar observações"
      >
        <Pencil className="h-3 w-3" />
      </Button>
    </div>
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
      onSuccess();
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
        <PopoverContent className="w-[250px] p-2">
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
  usuarios: Array<{ id: number; nomeExibicao: string }>
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
      // Sorting customizado que ordena apenas por data (ignora hora)
      sortingFn: (rowA, rowB) => {
        const dataA = normalizarDataParaComparacao(rowA.original.data_inicio);
        const dataB = normalizarDataParaComparacao(rowB.original.data_inicio);
        return dataA - dataB;
      },
      cell: ({ row }) => {
        const dataInicio = row.getValue('data_inicio') as string | null;
        return (
          <div className="min-h-10 flex flex-col items-center justify-center text-sm gap-1">
            <div className="font-medium">{formatarData(dataInicio)}</div>
            <div className="text-sm font-medium">{formatarHora(dataInicio)}h</div>
          </div>
        );
      },
    },
    {
      id: 'processo',
      header: () => (
        <div className="flex items-center justify-start">
          <div className="text-sm font-medium">Processo</div>
        </div>
      ),
      enableSorting: false,
      size: 250,
      cell: ({ row }) => {
        const classeJudicial = row.original.classe_judicial || '';
        const numeroProcesso = row.original.numero_processo;
        const trt = row.original.trt;
        const grau = row.original.grau;
        const orgaoJulgador = row.original.orgao_julgador_descricao || '-';

        return (
          <div className="min-h-10 flex flex-col items-start justify-center gap-1.5 max-w-[250px]">
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
            <div className="text-xs text-muted-foreground max-w-full truncate">
              {orgaoJulgador}
            </div>
          </div>
        );
      },
    },
    {
      id: 'partes',
      header: () => (
        <div className="flex items-center justify-start">
          <div className="text-sm font-medium">Partes</div>
        </div>
      ),
      enableSorting: false,
      size: 250,
      cell: ({ row }) => {
        const parteAutora = row.original.polo_ativo_nome || '-';
        const parteRe = row.original.polo_passivo_nome || '-';

        return (
          <div className="min-h-10 flex flex-col items-start justify-center gap-1.5 max-w-[250px]">
            <Badge variant="outline" className={`${getParteAutoraColorClass()} block whitespace-nowrap max-w-full overflow-hidden text-ellipsis text-left`}>
              {parteAutora}
            </Badge>
            <Badge variant="outline" className={`${getParteReColorClass()} block whitespace-nowrap max-w-full overflow-hidden text-ellipsis text-left`}>
              {parteRe}
            </Badge>
          </div>
        );
      },
    },
    {
      id: 'tipo_local',
      header: () => (
        <div className="flex items-center justify-start">
          <div className="text-sm font-medium">Tipo/Local</div>
        </div>
      ),
      enableSorting: false,
      size: 280,
      cell: ({ row }) => {
        const tipo = row.original.tipo_descricao || '-';
        const isVirtual = row.original.tipo_is_virtual;
        const sala = row.original.sala_audiencia_nome || '-';

        return (
          <div className="min-h-10 flex flex-col items-start justify-center gap-1 max-w-[280px]">
            <div className="flex items-start gap-2">
              <span className="text-sm text-left">{tipo}</span>
              {isVirtual && (
                <Badge variant="outline" className="text-xs">
                  Virtual
                </Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground truncate max-w-full text-left">
              {sala}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'url_audiencia_virtual',
      header: () => (
        <div className="flex items-center justify-start">
          <div className="text-sm font-medium">Endereço</div>
        </div>
      ),
      enableSorting: false,
      size: 120,
      cell: ({ row }) => (
        <div className="h-full w-full">
          <UrlVirtualCell audiencia={row.original} onSuccess={onSuccess} />
        </div>
      ),
    },
    {
      accessorKey: 'observacoes',
      header: () => (
        <div className="flex items-center justify-start">
          <div className="text-sm font-medium">Observações</div>
        </div>
      ),
      enableSorting: false,
      size: 250,
      cell: ({ row }) => (
        <div className="h-full w-full">
          <ObservacoesCell audiencia={row.original} onSuccess={onSuccess} />
        </div>
      ),
    },
    {
      accessorKey: 'responsavel_id',
      header: () => (
        <div className="flex items-center justify-center">
          <div className="text-sm font-medium">Responsável</div>
        </div>
      ),
      size: 160,
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
    'data_inicio' | 'numero_processo' | 'polo_ativo_nome' | 'polo_passivo_nome' | null
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

  // Parâmetros para buscar audiências
  const params = React.useMemo(
    () => ({
      pagina: pagina + 1, // API usa 1-indexed
      limite,
      busca: buscaDebounced || undefined,
      ordenar_por: ordenarPor || undefined,
      ordem,
      ...filtros, // Spread dos filtros avançados (inclui status agora)
    }),
    [pagina, limite, buscaDebounced, ordenarPor, ordem, filtros]
  );

  const { audiencias: audienciasRaw, paginacao, isLoading, error, refetch } = useAudiencias(params);

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

  const colunas = React.useMemo(
    () => criarColunas(handleSuccess, usuarios),
    [handleSuccess, usuarios]
  );

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
    });
  };

  return (
    <Tabs value={visualizacao} onValueChange={(value) => setVisualizacao(value as typeof visualizacao)}>
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
            </TabsTrigger>
            <TabsTrigger value="mes" aria-label="Visualização Mensal">
              <Calendar className="h-4 w-4" />
              <span>Mês</span>
            </TabsTrigger>
            <TabsTrigger value="ano" aria-label="Visualização Anual">
              <CalendarDays className="h-4 w-4" />
              <span>Ano</span>
            </TabsTrigger>
            <TabsTrigger value="tabela" aria-label="Visualização em Lista">
              <List className="h-4 w-4" />
              <span>Lista</span>
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
              <ButtonGroupText className="whitespace-nowrap capitalize min-w-40 text-center text-xs font-normal">
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
    </Tabs>
  );
}