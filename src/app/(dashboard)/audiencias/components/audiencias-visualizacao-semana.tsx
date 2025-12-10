'use client';

// Componente de visualização de audiências por semana com tabs de dias

import * as React from 'react';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Pencil, FileText, Check, PlusCircle, Loader2, Scale, Plus } from 'lucide-react';
import { PdfViewerDialog } from '@/app/(dashboard)/expedientes/components/pdf-viewer-dialog';
import { EditarEnderecoDialog } from './editar-endereco-dialog';
import { EditarObservacoesDialog } from './editar-observacoes-dialog';
import { NovoExpedienteDialog } from '@/app/(dashboard)/expedientes/components/novo-expediente-dialog';
import { NovaObrigacaoDialog } from '@/app/(dashboard)/acordos-condenacoes/components/nova-obrigacao-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { ColumnDef } from '@tanstack/react-table';
import type { Audiencia, ModalidadeAudiencia } from '@/backend/types/audiencias/types';
import type { Usuario } from '@/backend/usuarios/services/persistence/usuario-persistence.service';

/**
 * Formata apenas hora ISO para formato brasileiro (HH:mmh)
 */
const formatarHora = (dataISO: string | null): string => {
  if (!dataISO) return '-';
  try {
    const data = new Date(dataISO);
    return data.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }) + 'h';
  } catch {
    return '-';
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
  };
  return trtColors[trt] || 'bg-gray-100 text-gray-800 border-gray-200';
};

/**
 * Retorna a classe CSS de cor para badge do grau
 */
const getGrauColorClass = (grau: 'primeiro_grau' | 'segundo_grau' | 'tribunal_superior'): string => {
  const grauColors: Record<string, string> = {
    'primeiro_grau': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'segundo_grau': 'bg-amber-100 text-amber-800 border-amber-200',
    'tribunal_superior': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  };
  return grauColors[grau] || 'bg-gray-100 text-gray-800 border-gray-200';
};

/**
 * Retorna a classe CSS de cor para badge da Parte Autora
 */
const getParteAutoraColorClass = (): string => {
  return 'bg-blue-100 text-blue-800 border-blue-200';
};

/**
 * Retorna a classe CSS de cor para badge da Parte Ré
 */
const getParteReColorClass = (): string => {
  return 'bg-red-100 text-red-800 border-red-200';
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

/**
 * Retorna a classe CSS de cor para badge de modalidade
 */
const getModalidadeColorClass = (modalidade: ModalidadeAudiencia | null): string => {
  const modalidadeColors: Record<string, string> = {
    virtual: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800',
    presencial: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800',
    hibrida: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-800',
  };
  return modalidade ? modalidadeColors[modalidade] || 'bg-gray-100 text-gray-800 border-gray-200' : 'bg-gray-100 text-gray-800 border-gray-200';
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
 * Extrai a chave do arquivo de uma URL do Backblaze
 */
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
 * Componente para célula de hora com botão de ata
 */
function HoraCell({ audiencia }: { audiencia: Audiencia }) {
  const [openAta, setOpenAta] = React.useState(false);
  const fileKey = extractKeyFromBackblazeUrl(audiencia.url_ata_audiencia);
  const canOpenAta = audiencia.status === 'F' && fileKey !== null;

  return (
    <div className="min-h-10 flex flex-col items-center justify-center text-sm font-medium gap-1">
      {/* Badge de modalidade no topo, centralizado - só renderiza se houver modalidade */}
      {audiencia.modalidade && (
        <Badge variant="outline" className={`${getModalidadeColorClass(audiencia.modalidade)} text-xs mb-2`}>
          {formatarModalidade(audiencia.modalidade)}
        </Badge>
      )}
      {formatarHora(audiencia.data_inicio)}
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
      <PdfViewerDialog open={openAta} onOpenChange={setOpenAta} fileKey={fileKey} documentTitle={`Ata da audiência ${audiencia.numero_processo}`} />
    </div>
  );
}

/**
 * Componente para célula de detalhes com dialogs de edição
 */
function DetalhesCell({ audiencia, onSuccess }: { audiencia: Audiencia; onSuccess: () => void }) {
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
        headers: {
          'Content-Type': 'application/json',
        },
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
  const dadosIniciaisExpediente = {
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
                    onClick={() => setIsDialogOpen(true)}
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
                    onClick={() => setIsDialogOpen(true)}
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
              onClick={() => setIsDialogOpen(true)}
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
              onClick={() => setIsDialogOpen(true)}
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
          {isDesignada ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleMarcarRealizada}
                  disabled={isMarkingRealizada}
                  className="h-8 w-8 rounded-full bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 flex items-center justify-center transition-colors disabled:opacity-50"
                  title="Marcar como realizada"
                >
                  {isMarkingRealizada ? (
                    <Loader2 className="h-4 w-4 animate-spin text-green-700 dark:text-green-300" />
                  ) : (
                    <Check className="h-4 w-4 text-green-700 dark:text-green-300" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Marcar como realizada</p>
              </TooltipContent>
            </Tooltip>
          ) : audiencia.status === 'F' ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <Check className="h-4 w-4 text-green-700 dark:text-green-300" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Audiência realizada</p>
              </TooltipContent>
            </Tooltip>
          ) : null}
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

      <EditarEnderecoDialog audiencia={audiencia} open={isDialogOpen} onOpenChange={setIsDialogOpen} onSuccess={onSuccess} />

      {/* Dialog de criar expediente */}
      <NovoExpedienteDialog
        open={isExpedienteDialogOpen}
        onOpenChange={setIsExpedienteDialogOpen}
        onSuccess={() => {
          setIsExpedienteDialogOpen(false);
          onSuccess();
        }}
        dadosIniciais={dadosIniciaisExpediente}
      />

      {/* Dialog de criar obrigação */}
      <NovaObrigacaoDialog
        open={isObrigacaoDialogOpen}
        onOpenChange={setIsObrigacaoDialogOpen}
        onSuccess={() => {
          setIsObrigacaoDialogOpen(false);
          onSuccess();
        }}
        dadosIniciais={dadosIniciaisExpediente}
      />
    </div>
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
        {audiencia.observacoes ? (
          <span className="text-sm whitespace-pre-wrap wrap-break-word w-full">
            {audiencia.observacoes}
          </span>
        ) : null}
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
  usuarios: Usuario[];
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
 * Define as colunas da tabela de audiências para visualização semanal
 */
function criarColunasSemanais(onSuccess: () => void, usuarios: Usuario[]): ColumnDef<Audiencia>[] {
  return [
    {
      accessorKey: 'data_inicio',
      header: () => (
        <div className="relative flex items-center justify-center w-full text-center after:absolute after:-right-3 after:top-[20%] after:h-[60%] after:w-px after:bg-border">
          <div className="text-sm font-medium text-center">Hora</div>
        </div>
      ),
      size: 80,
      meta: { align: 'left' },
      cell: ({ row }) => <HoraCell audiencia={row.original as Audiencia} />,
    },
    {
      id: 'processo',
      header: () => (
        <div className="relative flex items-center justify-center w-full text-center after:absolute after:-right-3 after:top-[20%] after:h-[60%] after:w-px after:bg-border">
          <div className="text-sm font-medium text-center">Processo</div>
        </div>
      ),
      meta: { align: 'left' },
      cell: ({ row }) => {
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
              <Badge variant="outline" className={`${getTRTColorClass(trt)} text-xs shrink-0`}>
                {trt}
              </Badge>
              <Badge variant="outline" className={`${getGrauColorClass(grau)} text-xs shrink-0`}>
                {formatarGrau(grau)}
              </Badge>
            </div>
            <div className="text-sm font-medium whitespace-nowrap">
              {classeJudicial && `${classeJudicial} `}{numeroProcesso}
            </div>
            {/* Órgão julgador (vara) */}
            {orgaoJulgador && orgaoJulgador !== '-' && (
              <div className="text-xs text-muted-foreground">
                {orgaoJulgador}
              </div>
            )}

            {/* Espaçamento entre dados do processo e partes */}
            {(parteAutora || parteRe) && <div className="h-1" />}

            {/* Partes */}
            {(parteAutora || parteRe) && (
              <div className="flex flex-col gap-1 w-full">
                {parteAutora && (
                  <Badge variant="outline" className={`${getParteAutoraColorClass()} text-left justify-start inline-flex w-fit min-w-0 max-w-full`}>
                    <span className="whitespace-nowrap overflow-hidden text-ellipsis block">{parteAutora}</span>
                  </Badge>
                )}
                {parteRe && (
                  <Badge variant="outline" className={`${getParteReColorClass()} text-left justify-start inline-flex w-fit min-w-0 max-w-full`}>
                    <span className="whitespace-nowrap overflow-hidden text-ellipsis block">{parteRe}</span>
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
      header: () => (
        <div className="relative flex items-center justify-center w-full text-center after:absolute after:-right-3 after:top-[20%] after:h-[60%] after:w-px after:bg-border">
          <div className="text-sm font-medium text-center">Detalhes</div>
        </div>
      ),
      meta: { align: 'left' },
      cell: ({ row }) => <DetalhesCell audiencia={row.original} onSuccess={onSuccess} />,
    },
    {
      accessorKey: 'observacoes',
      header: () => (
        <div className="relative flex items-center justify-center w-full text-center after:absolute after:-right-3 after:top-[20%] after:h-[60%] after:w-px after:bg-border">
          <div className="text-sm font-medium text-center">Observações</div>
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
      header: () => (
        <div className="flex items-center justify-center w-full text-center">
          <div className="text-sm font-medium text-center">Responsável</div>
        </div>
      ),
      meta: { align: 'left' },
      cell: ({ row }) => (
        <div className="min-h-10 flex items-center justify-center">
          <ResponsavelCell audiencia={row.original} onSuccess={onSuccess} usuarios={usuarios} />
        </div>
      ),
    },
  ];
}

interface AudienciasVisualizacaoSemanaProps {
  audiencias: Audiencia[];
  isLoading: boolean;
  semanaAtual: Date;
  usuarios: Usuario[];
  onRefresh: () => void;
}

export function AudienciasVisualizacaoSemana({ audiencias, isLoading, semanaAtual, usuarios, onRefresh }: AudienciasVisualizacaoSemanaProps) {
  const [diaAtivo, setDiaAtivo] = React.useState<string>('segunda');

  // Calcular início e fim da semana
  const inicioSemana = React.useMemo(() => {
    const date = new Date(semanaAtual);
    // Normalizar para meia-noite para comparação correta
    date.setHours(0, 0, 0, 0);
    const day = date.getDay();
    // Calcular diferença para segunda-feira (1 = segunda, 0 = domingo)
    const diff = day === 0 ? -6 : 1 - day;
    const inicio = new Date(date);
    inicio.setDate(date.getDate() + diff);
    return inicio;
  }, [semanaAtual]);

  const fimSemana = React.useMemo(() => {
    const date = new Date(inicioSemana);
    date.setDate(date.getDate() + 4); // Até sexta-feira
    date.setHours(23, 59, 59, 999); // Fim do dia
    return date;
  }, [inicioSemana]);

  // Filtrar audiências por dia da semana, verificando se pertencem à semana atual
  const audienciasPorDia = React.useMemo(() => {
    const dias = {
      segunda: [] as Audiencia[],
      terca: [] as Audiencia[],
      quarta: [] as Audiencia[],
      quinta: [] as Audiencia[],
      sexta: [] as Audiencia[],
    };

    // Normalizar início e fim da semana para comparação apenas por data
    const inicioNormalizado = new Date(inicioSemana);
    inicioNormalizado.setHours(0, 0, 0, 0);

    const fimNormalizado = new Date(fimSemana);
    fimNormalizado.setHours(23, 59, 59, 999);

    audiencias.forEach((audiencia) => {
      const dataAudiencia = new Date(audiencia.data_inicio);

      // Normalizar data da audiência para comparação apenas por dia
      const dataAudienciaNormalizada = new Date(dataAudiencia);
      dataAudienciaNormalizada.setHours(0, 0, 0, 0);

      // Verificar se a audiência está dentro da semana atual (segunda a sexta)
      if (dataAudienciaNormalizada < inicioNormalizado || dataAudienciaNormalizada > fimNormalizado) {
        return; // Pular audiências fora da semana atual
      }

      const diaSemana = dataAudiencia.getDay();

      // Agrupar por dia da semana (1 = segunda, 5 = sexta)
      if (diaSemana === 1) dias.segunda.push(audiencia);
      else if (diaSemana === 2) dias.terca.push(audiencia);
      else if (diaSemana === 3) dias.quarta.push(audiencia);
      else if (diaSemana === 4) dias.quinta.push(audiencia);
      else if (diaSemana === 5) dias.sexta.push(audiencia);
    });

    // Ordenar audiências por horário em cada dia
    Object.values(dias).forEach((audienciasDia) => {
      audienciasDia.sort((a, b) => {
        const dataA = new Date(a.data_inicio).getTime();
        const dataB = new Date(b.data_inicio).getTime();
        return dataA - dataB;
      });
    });

    return dias;
  }, [audiencias, inicioSemana, fimSemana]);

  const colunas = React.useMemo(() => criarColunasSemanais(onRefresh, usuarios), [onRefresh, usuarios]);

  // Calcular datas de cada dia da semana
  const datasDiasSemana = React.useMemo(() => {
    const datas: Record<string, Date> = {};
    for (let i = 0; i < 5; i++) {
      const data = new Date(inicioSemana);
      data.setDate(inicioSemana.getDate() + i);
      const diaNome = ['segunda', 'terca', 'quarta', 'quinta', 'sexta'][i];
      datas[diaNome] = data;
    }
    return datas;
  }, [inicioSemana]);

  const formatarDataTab = (data: Date) => {
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  const formatarDataCompleta = (data: Date) => {
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <Tabs value={diaAtivo} onValueChange={setDiaAtivo} className="gap-0">
      <TabsList className="bg-background justify-start rounded-t-lg rounded-b-none border-b p-0 w-full">
        <TabsTrigger
          value="segunda"
          className="relative bg-muted/50 border-b-border dark:data-[state=active]:bg-background data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:border-b-background h-full rounded-none rounded-t border border-transparent data-[state=active]:-mb-0.5 data-[state=active]:shadow-none dark:border-b-0 dark:data-[state=active]:-mb-0.5 px-4 py-4 after:absolute after:right-0 after:top-[25%] after:h-[50%] after:w-px after:bg-border data-[state=active]:after:opacity-0"
        >
          <span className="text-sm font-medium text-center whitespace-normal">Segunda - {formatarDataTab(datasDiasSemana.segunda)}</span>
          <Badge className="ml-2 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">{audienciasPorDia.segunda.filter(a => a.status !== 'C').length}</Badge>
        </TabsTrigger>
        <TabsTrigger
          value="terca"
          className="relative bg-muted/50 border-b-border dark:data-[state=active]:bg-background data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:border-b-background h-full rounded-none rounded-t border border-transparent data-[state=active]:-mb-0.5 data-[state=active]:shadow-none dark:border-b-0 dark:data-[state=active]:-mb-0.5 px-4 py-4 after:absolute after:right-0 after:top-[25%] after:h-[50%] after:w-px after:bg-border data-[state=active]:after:opacity-0"
        >
          <span className="text-sm font-medium text-center whitespace-normal">Terça - {formatarDataTab(datasDiasSemana.terca)}</span>
          <Badge className="ml-2 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">{audienciasPorDia.terca.filter(a => a.status !== 'C').length}</Badge>
        </TabsTrigger>
        <TabsTrigger
          value="quarta"
          className="relative bg-muted/50 border-b-border dark:data-[state=active]:bg-background data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:border-b-background h-full rounded-none rounded-t border border-transparent data-[state=active]:-mb-0.5 data-[state=active]:shadow-none dark:border-b-0 dark:data-[state=active]:-mb-0.5 px-4 py-4 after:absolute after:right-0 after:top-[25%] after:h-[50%] after:w-px after:bg-border data-[state=active]:after:opacity-0"
        >
          <span className="text-sm font-medium text-center whitespace-normal">Quarta - {formatarDataTab(datasDiasSemana.quarta)}</span>
          <Badge className="ml-2 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">{audienciasPorDia.quarta.filter(a => a.status !== 'C').length}</Badge>
        </TabsTrigger>
        <TabsTrigger
          value="quinta"
          className="relative bg-muted/50 border-b-border dark:data-[state=active]:bg-background data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:border-b-background h-full rounded-none rounded-t border border-transparent data-[state=active]:-mb-0.5 data-[state=active]:shadow-none dark:border-b-0 dark:data-[state=active]:-mb-0.5 px-4 py-4 after:absolute after:right-0 after:top-[25%] after:h-[50%] after:w-px after:bg-border data-[state=active]:after:opacity-0"
        >
          <span className="text-sm font-medium text-center whitespace-normal">Quinta - {formatarDataTab(datasDiasSemana.quinta)}</span>
          <Badge className="ml-2 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">{audienciasPorDia.quinta.filter(a => a.status !== 'C').length}</Badge>
        </TabsTrigger>
        <TabsTrigger
          value="sexta"
          className="relative bg-muted/50 border-b-border dark:data-[state=active]:bg-background data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:border-b-background h-full rounded-none rounded-t border border-transparent data-[state=active]:-mb-0.5 data-[state=active]:shadow-none dark:border-b-0 dark:data-[state=active]:-mb-0.5 px-4 py-4"
        >
          <span className="text-sm font-medium text-center whitespace-normal">Sexta - {formatarDataTab(datasDiasSemana.sexta)}</span>
          <Badge className="ml-2 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">{audienciasPorDia.sexta.filter(a => a.status !== 'C').length}</Badge>
        </TabsTrigger>
      </TabsList>

      {Object.entries(audienciasPorDia).map(([dia, audienciasDia]) => {
        const dataDia = datasDiasSemana[dia];
        const nomeDiaCompleto = {
          segunda: 'Segunda-feira',
          terca: 'Terça-feira',
          quarta: 'Quarta-feira',
          quinta: 'Quinta-feira',
          sexta: 'Sexta-feira',
        }[dia];

        return (
          <TabsContent key={dia} value={dia} className="mt-0">
            <div className="rounded-b-lg border border-t-0 bg-card text-card-foreground shadow-sm">
              <DataTable
                data={audienciasDia}
                columns={colunas}
                isLoading={isLoading}
                emptyMessage={`Nenhuma audiência agendada para ${nomeDiaCompleto}, ${formatarDataCompleta(dataDia)}.`}
                hideTableBorder={true}
                hideColumnBorders={true}
              />
            </div>
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
