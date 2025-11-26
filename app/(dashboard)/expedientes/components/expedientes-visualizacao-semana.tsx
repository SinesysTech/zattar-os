'use client';

// Componente de visualização de expedientes por semana com tabs de dias

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Undo2, Loader2, Eye, Pencil, FileText, ChevronsUpDown } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ExpedientesBaixarDialog } from './expedientes-baixar-dialog';
import { ExpedientesReverterBaixaDialog } from './expedientes-reverter-baixa-dialog';
import { ExpedienteVisualizarDialog } from './expediente-visualizar-dialog';
import { PdfViewerDialog } from './pdf-viewer-dialog';
import type { ColumnDef } from '@tanstack/react-table';
import type { PendenteManifestacao } from '@/backend/types/pendentes/types';
import type { Usuario } from '@/backend/usuarios/services/persistence/usuario-persistence.service';

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
const getGrauColorClass = (grau: 'primeiro_grau' | 'segundo_grau'): string => {
  const grauColors: Record<string, string> = {
    'primeiro_grau': 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-200 dark:border-emerald-800',
    'segundo_grau': 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-800',
  };
  return grauColors[grau] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-800';
};

/**
 * Formata o grau para exibição
 */
const formatarGrau = (grau: 'primeiro_grau' | 'segundo_grau'): string => {
  return grau === 'primeiro_grau' ? '1º Grau' : '2º Grau';
};

/**
 * Retorna a classe CSS de cor para badge do tipo de expediente
 * Rotaciona entre cores disponíveis baseado no ID do tipo
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

  // Rotacionar cores baseado no ID
  const index = (tipoId - 1) % colors.length;
  return colors[index];
};

/**
 * Feriados nacionais brasileiros fixos (formato MM-DD)
 */
const feriadosNacionaisFixos = [
  '01-01', // Ano Novo
  '04-21', // Tiradentes
  '05-01', // Dia do Trabalho
  '09-07', // Independência do Brasil
  '10-12', // Nossa Senhora Aparecida
  '11-02', // Finados
  '11-15', // Proclamação da República
  '12-25', // Natal
];

/**
 * Verifica se uma data é feriado nacional fixo
 */
const ehFeriadoNacional = (data: Date): boolean => {
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  const dataFormatada = `${mes}-${dia}`;
  return feriadosNacionaisFixos.includes(dataFormatada);
};

/**
 * Verifica se uma data é dia útil (não é fim de semana nem feriado)
 */
const ehDiaUtil = (data: Date): boolean => {
  const diaSemana = data.getDay();
  // 0 = Domingo, 6 = Sábado
  if (diaSemana === 0 || diaSemana === 6) return false;
  if (ehFeriadoNacional(data)) return false;
  return true;
};

/**
 * Calcula a diferença em dias ÚTEIS entre duas datas
 * (exclui finais de semana e feriados nacionais)
 * A contagem começa no PRÓXIMO dia útil após a data de ciência
 */
const calcularDiasUteis = (dataInicio: string | null, dataFim: string | null): number | null => {
  if (!dataInicio || !dataFim) return null;
  try {
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);

    // Avançar para o próximo dia após a data de ciência
    const dataAtual = new Date(inicio);
    dataAtual.setDate(dataAtual.getDate() + 1);

    // Encontrar o próximo dia útil
    while (!ehDiaUtil(dataAtual)) {
      dataAtual.setDate(dataAtual.getDate() + 1);
    }

    let diasUteis = 0;

    // Percorre dia por dia até a data fim, contando apenas dias úteis
    while (dataAtual <= fim) {
      if (ehDiaUtil(dataAtual)) {
        diasUteis++;
      }
      dataAtual.setDate(dataAtual.getDate() + 1);
    }

    return diasUteis;
  } catch {
    return null;
  }
};

/**
 * Retorna a classe CSS de cor do badge baseado na quantidade de dias úteis
 */
const getCorBadgeDias = (dias: number): string => {
  switch (dias) {
    case 3:
      return 'bg-green-600 text-white hover:bg-green-700 border-0';
    case 5:
      return 'bg-orange-600 text-white hover:bg-orange-700 border-0';
    case 8:
      return 'bg-blue-600 text-white hover:bg-blue-700 border-0';
    default:
      return 'bg-purple-600 text-white hover:bg-purple-700 border-0';
  }
};

/**
 * Componente para editar tipo e descrição de um expediente
 */
function TipoDescricaoCell({
  expediente,
  onSuccess,
  tiposExpedientes
}: {
  expediente: PendenteManifestacao;
  onSuccess: () => void;
  tiposExpedientes: Array<{ id: number; tipo_expediente: string }>;
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

  // Sincronizar estado quando expediente mudar
  React.useEffect(() => {
    setTipoSelecionado(expediente.tipo_expediente_id?.toString() || 'null');
    setDescricao(expediente.descricao_arquivos || '');
  }, [expediente.tipo_expediente_id, expediente.descricao_arquivos]);

  const temDocumento = !!expediente.arquivo_key;

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const tipoExpedienteId = tipoSelecionado === 'null' ? null : parseInt(tipoSelecionado, 10);
      const descricaoArquivos = descricao.trim() || null;

      const response = await fetch(`/api/pendentes-manifestacao/${expediente.id}/tipo-descricao`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tipoExpedienteId,
          descricaoArquivos,
        }),
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

  return (
    <>
      <div className="relative w-full group">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex flex-col gap-1 text-left hover:opacity-80 transition-opacity cursor-pointer w-full pr-6"
            >
              <Badge
                variant="outline"
                className={`text-xs w-fit ${expediente.tipo_expediente_id ? getTipoExpedienteColorClass(expediente.tipo_expediente_id) : ''}`}
              >
                {tipoNome}
              </Badge>
              <div className="text-xs text-muted-foreground w-full wrap-break-word whitespace-pre-wrap leading-relaxed text-justify">
                {descricaoExibicao}
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Expediente</label>
                <Select
                  value={tipoSelecionado}
                  onValueChange={setTipoSelecionado}
                  disabled={isLoading || tiposExpedientes.length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o tipo">
                      {tipoSelecionado === 'null'
                        ? 'Sem tipo'
                        : tiposExpedientes.find(t => t.id.toString() === tipoSelecionado)?.tipo_expediente || 'Selecione o tipo'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="null">Sem tipo</SelectItem>
                    {tiposExpedientes.length > 0 ? (
                      tiposExpedientes.map((tipo) => (
                        <SelectItem key={tipo.id} value={tipo.id.toString()}>
                          {tipo.tipo_expediente}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        Carregando tipos...
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Descrição / Arquivos</label>
                <Textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Digite a descrição ou referência aos arquivos..."
                  disabled={isLoading}
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Botão de visualização do documento - posicionado no canto inferior direito */}
        {temDocumento && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsPdfViewerOpen(true);
            }}
            className="absolute bottom-1 right-1 p-1 hover:bg-accent rounded-md transition-colors z-10 opacity-0 group-hover:opacity-100"
            title="Visualizar documento"
          >
            <FileText className="h-3.5 w-3.5 text-primary" />
          </button>
        )}
      </div>

      {/* Modal de visualização do PDF */}
      <PdfViewerDialog
        open={isPdfViewerOpen}
        onOpenChange={setIsPdfViewerOpen}
        fileKey={expediente.arquivo_key}
        documentTitle={`Documento - ${expediente.numero_processo}`}
      />
    </>
  );
}

/**
 * Componente para atribuir responsável a um expediente
 */
function ResponsavelCell({
  expediente,
  onSuccess,
  usuarios
}: {
  expediente: PendenteManifestacao;
  onSuccess: () => void;
  usuarios: Usuario[];
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSelect = async (value: string) => {
    setIsLoading(true);
    try {
      const responsavelId = value === 'null' || value === '' ? null : parseInt(value, 10);

      const response = await fetch(`/api/pendentes-manifestacao/${expediente.id}/responsavel`, {
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
      // Não chamar onSuccess em caso de falha para evitar refresh indevido
    } finally {
      setIsLoading(false);
    }
  };

  const responsavelAtual = usuarios.find(u => u.id === expediente.responsavel_id);

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
 * Componente de ações para cada expediente
 */
function AcoesExpediente({ 
  expediente, 
  usuarios, 
  tiposExpedientes 
}: { 
  expediente: PendenteManifestacao;
  usuarios: Usuario[];
  tiposExpedientes: Array<{ id: number; tipo_expediente: string }>;
}) {
  const [baixarDialogOpen, setBaixarDialogOpen] = React.useState(false);
  const [reverterDialogOpen, setReverterDialogOpen] = React.useState(false);
  const [visualizarDialogOpen, setVisualizarDialogOpen] = React.useState(false);

  const handleSuccess = () => {
    window.location.reload();
  };

  const estaBaixado = !!expediente.baixado_em;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setVisualizarDialogOpen(true)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Visualizar Expediente</p>
          </TooltipContent>
        </Tooltip>
        {!estaBaixado ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setBaixarDialogOpen(true)}
              >
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Baixar Expediente</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setReverterDialogOpen(true)}
              >
                <Undo2 className="h-4 w-4 text-amber-600" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Reverter Baixa</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      <ExpedienteVisualizarDialog
        open={visualizarDialogOpen}
        onOpenChange={setVisualizarDialogOpen}
        expediente={expediente}
        usuarios={usuarios}
        tiposExpedientes={tiposExpedientes}
      />

      <ExpedientesBaixarDialog
        open={baixarDialogOpen}
        onOpenChange={setBaixarDialogOpen}
        expediente={expediente}
        onSuccess={handleSuccess}
      />

      <ExpedientesReverterBaixaDialog
        open={reverterDialogOpen}
        onOpenChange={setReverterDialogOpen}
        expediente={expediente}
        onSuccess={handleSuccess}
      />
    </TooltipProvider>
  );
}

/**
 * Componente de header para a coluna Tipo e Descrição com ordenação direta
 */
function TipoExpedienteColumnHeader({
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
    <div className="relative flex items-center justify-center w-full after:absolute after:-right-3 after:top-[20%] after:h-[60%] after:w-px after:bg-border">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 hover:bg-accent"
        onClick={handleClick}
      >
        <span className="text-sm font-medium">Tipo e Descrição</span>
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
    </div>
  );
}

/**
 * Componente de header para a coluna Prazo com opções de ordenação
 */
function PrazoColumnHeader({
  onSort,
}: {
  onSort: (field: 'data_ciencia_parte' | 'data_prazo_legal_parte', direction: 'asc' | 'desc') => void;
}) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative flex items-center justify-center w-full after:absolute after:-right-3 after:top-[20%] after:h-[60%] after:w-px after:bg-border">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 data-[state=open]:bg-accent"
          >
            <span className="text-sm font-medium">Prazo</span>
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
        <PopoverContent className="w-[200px] p-2" align="center">
          <div className="space-y-1">
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              Ordenar por Data de Início
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => {
                onSort('data_ciencia_parte', 'asc');
                setIsOpen(false);
              }}
            >
              ↑ Crescente
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => {
                onSort('data_ciencia_parte', 'desc');
                setIsOpen(false);
              }}
            >
              ↓ Decrescente
            </Button>
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">
              Ordenar por Data de Fim
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => {
                onSort('data_prazo_legal_parte', 'asc');
                setIsOpen(false);
              }}
            >
              ↑ Crescente
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => {
                onSort('data_prazo_legal_parte', 'desc');
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
 * Componente de header para a coluna Processo com opções de ordenação
 */
function ProcessoColumnHeaderSemanal({
  onSort,
}: {
  onSort: (field: 'trt' | 'grau' | 'descricao_orgao_julgador' | 'classe_judicial', direction: 'asc' | 'desc') => void;
}) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative flex items-center justify-center w-full after:absolute after:-right-3 after:top-[20%] after:h-[60%] after:w-px after:bg-border">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 data-[state=open]:bg-accent"
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
        <PopoverContent className="w-[220px] p-2" align="center">
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
                onSort('descricao_orgao_julgador', 'asc');
                setIsOpen(false);
              }}
            >
              ↑ Crescente
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => {
                onSort('descricao_orgao_julgador', 'desc');
                setIsOpen(false);
              }}
            >
              ↓ Decrescente
            </Button>
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">
              Ordenar por Classe Judicial
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => {
                onSort('classe_judicial', 'asc');
                setIsOpen(false);
              }}
            >
              ↑ Crescente
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => {
                onSort('classe_judicial', 'desc');
                setIsOpen(false);
              }}
            >
              ↓ Decrescente
            </Button>
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">Ordenar por Partes</div>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => {
                (onSort as any)('nome_parte_autora', 'asc');
                setIsOpen(false);
              }}
            >
              Parte Autora ↑
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => {
                (onSort as any)('nome_parte_autora', 'desc');
                setIsOpen(false);
              }}
            >
              Parte Autora ↓
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => {
                (onSort as any)('nome_parte_re', 'asc');
                setIsOpen(false);
              }}
            >
              Parte Ré ↑
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => {
                (onSort as any)('nome_parte_re', 'desc');
                setIsOpen(false);
              }}
            >
              Parte Ré ↓
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

/**
 * Componente de header para a coluna Partes com opções de ordenação
 */
function PartesColumnHeader({
  onSort,
}: {
  onSort: (field: 'nome_parte_autora' | 'nome_parte_re', direction: 'asc' | 'desc') => void;
}) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative flex items-center justify-center w-full after:absolute after:-right-3 after:top-[20%] after:h-[60%] after:w-px after:bg-border">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 data-[state=open]:bg-accent"
          >
            <span className="text-sm font-medium">Partes</span>
            <ChevronsUpDown className="ml-1 h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-2" align="center">
          <div className="space-y-1">
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              Ordenar por Parte Autora
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => {
                onSort('nome_parte_autora', 'asc');
                setIsOpen(false);
              }}
            >
              ↑ Crescente
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => {
                onSort('nome_parte_autora', 'desc');
                setIsOpen(false);
              }}
            >
              ↓ Decrescente
            </Button>
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">
              Ordenar por Parte Ré
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => {
                onSort('nome_parte_re', 'asc');
                setIsOpen(false);
              }}
            >
              ↑ Crescente
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => {
                onSort('nome_parte_re', 'desc');
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
 * Componente de header para a coluna Responsável com ordenação direta
 */
function ResponsavelColumnHeaderSemanal({
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
    <div className="relative flex items-center justify-center w-full after:absolute after:-right-3 after:top-[20%] after:h-[60%] after:w-px after:bg-border">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 hover:bg-accent"
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
          <path d="m7 15 5 5 5-5" />
          <path d="m7 9 5-5 5 5" />
        </svg>
      </Button>
    </div>
  );
}

/**
 * Define as colunas da tabela de expedientes para visualização semanal
 */
function criarColunasSemanais(
  onSuccess: () => void,
  usuarios: Usuario[],
  tiposExpedientes: Array<{ id: number; tipo_expediente: string }>,
  onTipoExpedienteSort: (direction: 'asc' | 'desc') => void,
  onPrazoSort: (field: 'data_ciencia_parte' | 'data_prazo_legal_parte', direction: 'asc' | 'desc') => void,
  onProcessoSort: (field: 'trt' | 'grau' | 'descricao_orgao_julgador' | 'classe_judicial', direction: 'asc' | 'desc') => void,
  onPartesSort: (field: 'nome_parte_autora' | 'nome_parte_re', direction: 'asc' | 'desc') => void,
  onResponsavelSort: (direction: 'asc' | 'desc') => void
): ColumnDef<PendenteManifestacao>[] {
  const handleAcoes = (expediente: PendenteManifestacao) => (
    <AcoesExpediente 
      expediente={expediente} 
      usuarios={usuarios} 
      tiposExpedientes={tiposExpedientes} 
    />
  );
  return [
    {
      id: 'tipo_descricao',
      header: () => <TipoExpedienteColumnHeader onSort={onTipoExpedienteSort} />,
      enableSorting: false,
      size: 300,
      cell: ({ row }) => (
        <div className="min-h-10 flex items-start justify-start max-w-[300px]">
          <TipoDescricaoCell
            expediente={row.original}
            onSuccess={onSuccess}
            tiposExpedientes={tiposExpedientes}
          />
        </div>
      ),
    },
    {
      id: 'prazo',
      header: () => <PrazoColumnHeader onSort={onPrazoSort} />,
      enableSorting: false,
      size: 170,
      cell: ({ row }) => {
        const dataInicio = row.original.data_ciencia_parte;
        const dataFim = row.original.data_prazo_legal_parte;
        const diasUteis = calcularDiasUteis(dataInicio, dataFim);
        const [openPrazo, setOpenPrazo] = React.useState(false);
        const [isSavingPrazo, setIsSavingPrazo] = React.useState(false);
        const [dataPrazoStr, setDataPrazoStr] = React.useState<string>('');
        const handleSalvarPrazo = async () => {
          setIsSavingPrazo(true);
          try {
            const iso = dataPrazoStr ? new Date(dataPrazoStr).toISOString() : '';
            const response = await fetch(`/api/pendentes-manifestacao/${row.original.id}/prazo-legal`, {
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
            if (onSuccess) onSuccess();
          } finally {
            setIsSavingPrazo(false);
          }
        };

        return (
          <div className="min-h-10 flex flex-col items-center justify-center gap-2 py-2">
            <div className="text-sm">
              <span className="font-semibold">Início:</span> {formatarData(dataInicio)}
            </div>
            <div className="text-sm">
              <span className="font-semibold">Fim:</span> {formatarData(dataFim)}
            </div>
            {diasUteis !== null && (
              <Badge className={`${getCorBadgeDias(diasUteis)} text-sm font-medium mt-1 px-3 py-1`}>
                {diasUteis} {diasUteis === 1 ? 'dia' : 'dias'}
              </Badge>
            )}
            {!row.original.baixado_em && !dataFim && (
              <Button size="sm" variant="outline" onClick={() => setOpenPrazo(true)}>
                Definir Data
              </Button>
            )}
            <Dialog open={openPrazo} onOpenChange={setOpenPrazo}>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Definir Prazo Legal</DialogTitle>
                  <DialogDescription>Escolha a data de fim do prazo</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <input type="date" className="border rounded p-2 w-full" value={dataPrazoStr} onChange={(e) => setDataPrazoStr(e.target.value)} />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpenPrazo(false)} disabled={isSavingPrazo}>Cancelar</Button>
                  <Button onClick={handleSalvarPrazo} disabled={isSavingPrazo || !dataPrazoStr}>{isSavingPrazo ? 'Salvando...' : 'Salvar'}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        );
      },
    },
    {
      id: 'processo_partes',
      header: () => <ProcessoColumnHeaderSemanal onSort={onProcessoSort} />,
      enableSorting: false,
      size: 520,
      cell: ({ row }) => {
        const trt = row.original.trt;
        const grau = row.original.grau;
        const classeJudicial = row.original.classe_judicial || '';
        const numeroProcesso = row.original.numero_processo;
        const parteAutora = row.original.nome_parte_autora || '-';
        const parteRe = row.original.nome_parte_re || '-';
        const orgaoJulgador = row.original.descricao_orgao_julgador || '-';

        return (
          <div className="min-h-10 flex flex-col items-start justify-center gap-1.5 max-w-[520px]">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant="outline" className={`${getTRTColorClass(trt)} w-fit text-xs`}>{trt}</Badge>
              <Badge variant="outline" className={`${getGrauColorClass(grau)} w-fit text-xs`}>{formatarGrau(grau)}</Badge>
            </div>
            <div className="text-sm font-medium whitespace-nowrap">
              {classeJudicial && `${classeJudicial} `}{numeroProcesso}
            </div>
            <Badge variant="outline" className={`${getParteAutoraColorClass()} block whitespace-nowrap max-w-full overflow-hidden text-ellipsis text-left`}>
              {parteAutora}
            </Badge>
            <Badge variant="outline" className={`${getParteReColorClass()} block whitespace-nowrap max-w-full overflow-hidden text-ellipsis text-left`}>
              {parteRe}
            </Badge>
            <div className="text-xs text-muted-foreground max-w-full truncate">
              {orgaoJulgador}
            </div>
          </div>
        );
      },
    },
    {
      id: 'observacoes',
      header: () => (
        <div className="relative flex items-center justify-center w-full after:absolute after:-right-3 after:top-[20%] after:h-[60%] after:w-px after:bg-border">
          <div className="text-sm font-medium">Observações</div>
        </div>
      ),
      enableSorting: false,
      size: 300,
      cell: ({ row }) => {
        const expediente = row.original;
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
          <div className="relative w-full group">
            <button type="button" className="flex flex-col gap-1 text-left hover:opacity-80 transition-opacity cursor-pointer w-full pr-6">
              <div className="text-xs text-muted-foreground w-full wrap-break-word whitespace-pre-wrap leading-relaxed text-justify">
                {expediente.observacoes || '-'}
              </div>
            </button>
            <button type="button" onClick={() => setOpen(true)} className="absolute bottom-1 right-1 p-1 hover:bg-accent rounded-md transition-colors z-10 opacity-0 group-hover:opacity-100" title="Editar observações">
              <Pencil className="h-3.5 w-3.5 text-primary" />
            </button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogContent className="max-w-[min(92vw,31.25rem)]">
                <DialogHeader>
                  <DialogTitle>Editar Observações</DialogTitle>
                  <DialogDescription>Adicionar observações do expediente</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Observações</label>
                    <Textarea value={valor} onChange={(e) => setValor(e.target.value)} disabled={isLoading} rows={3} />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={isLoading}>Cancelar</Button>
                    <Button size="sm" onClick={handleSave} disabled={isLoading}>{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Salvar</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        );
      },
    },
    {
      accessorKey: 'responsavel_id',
      header: () => <ResponsavelColumnHeaderSemanal onSort={onResponsavelSort} />,
      size: 160,
      cell: ({ row }) => (
        <div className="min-h-10 flex items-center justify-center">
          <ResponsavelCell expediente={row.original} onSuccess={onSuccess} usuarios={usuarios} />
        </div>
      ),
    },
    {
      id: 'acoes',
      header: () => (
        <div className="flex items-center justify-center">
          <div className="text-sm font-medium">Ações</div>
        </div>
      ),
      cell: ({ row }) => {
        const expediente = row.original;
        return (
          <div className="min-h-10 flex items-center justify-center">
            {handleAcoes(expediente)}
          </div>
        );
      },
    },
  ];
}

interface ExpedientesVisualizacaoSemanaProps {
  expedientes: PendenteManifestacao[];
  isLoading: boolean;
  onRefresh?: () => void;
  usuarios: Usuario[];
  tiposExpedientes: Array<{ id: number; tipo_expediente: string }>;
  semanaAtual: Date;
  onTipoExpedienteSort: (direction: 'asc' | 'desc') => void;
  onPrazoSort: (field: 'data_ciencia_parte' | 'data_prazo_legal_parte', direction: 'asc' | 'desc') => void;
  onProcessoSort: (field: 'trt' | 'grau' | 'descricao_orgao_julgador' | 'classe_judicial', direction: 'asc' | 'desc') => void;
  onPartesSort: (field: 'nome_parte_autora' | 'nome_parte_re', direction: 'asc' | 'desc') => void;
  onResponsavelSort: (direction: 'asc' | 'desc') => void;
}

export function ExpedientesVisualizacaoSemana({ expedientes, isLoading, onRefresh, usuarios, tiposExpedientes, semanaAtual, onTipoExpedienteSort, onPrazoSort, onProcessoSort, onPartesSort, onResponsavelSort }: ExpedientesVisualizacaoSemanaProps) {
  const [diaAtivo, setDiaAtivo] = React.useState<string>('segunda');

  const handleSuccess = React.useCallback(() => {
    if (onRefresh) {
      onRefresh();
    }
  }, [onRefresh]);

  // Calcular início e fim da semana (normalizando para meia-noite)
  const inicioSemana = React.useMemo(() => {
    const date = new Date(semanaAtual);
    date.setHours(0, 0, 0, 0); // Normalizar para meia-noite
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Ajustar para segunda
    date.setDate(diff);
    return date;
  }, [semanaAtual]);

  const fimSemana = React.useMemo(() => {
    const date = new Date(inicioSemana);
    date.setDate(date.getDate() + 4); // Até sexta
    date.setHours(23, 59, 59, 999); // Final do dia de sexta
    return date;
  }, [inicioSemana]);

  // Filtrar expedientes por dia da semana (usando data de vencimento - prazo legal)
  const expedientesPorDia = React.useMemo(() => {
    const dias = {
      segunda: [] as PendenteManifestacao[],
      terca: [] as PendenteManifestacao[],
      quarta: [] as PendenteManifestacao[],
      quinta: [] as PendenteManifestacao[],
      sexta: [] as PendenteManifestacao[],
    };

    // Itens especiais: sem prazo e vencidos (pendentes)
    const semPrazoPendentes = expedientes.filter(
      (e) => !e.baixado_em && !e.data_prazo_legal_parte
    );
    const vencidosPendentes = expedientes.filter(
      (e) => !e.baixado_em && e.prazo_vencido === true
    );
    const pinnedIds = new Set<number>([
      ...semPrazoPendentes.map((e) => e.id),
      ...vencidosPendentes.map((e) => e.id),
    ]);

    expedientes.forEach((expediente) => {
      if (!expediente.data_prazo_legal_parte) return;

      // Criar data a partir do ISO string e normalizar para timezone local
      const data = new Date(expediente.data_prazo_legal_parte);

      // Extrair apenas a parte da data (ignorando timezone)
      const dataLocal = new Date(data.getFullYear(), data.getMonth(), data.getDate());

      // Verificar se o expediente está dentro da semana atual
      if (dataLocal >= inicioSemana && dataLocal <= fimSemana) {
        const diaSemana = dataLocal.getDay();

        if (diaSemana === 1) dias.segunda.push(expediente);
        else if (diaSemana === 2) dias.terca.push(expediente);
        else if (diaSemana === 3) dias.quarta.push(expediente);
        else if (diaSemana === 4) dias.quinta.push(expediente);
        else if (diaSemana === 5) dias.sexta.push(expediente);
      }
    });

    // Para cada dia: colocar sem prazo e vencidos pendentes no topo
    Object.keys(dias).forEach((dia) => {
      const listaDia: PendenteManifestacao[] = (dias as any)[dia];
      // Remover duplicados com pinned
      const restantes = listaDia.filter((e) => !pinnedIds.has(e.id));
      // Ordenar restantes por data de vencimento (crescentemente)
      restantes.sort((a: PendenteManifestacao, b: PendenteManifestacao) => {
        const dataA = a.data_prazo_legal_parte ? new Date(a.data_prazo_legal_parte).getTime() : 0;
        const dataB = b.data_prazo_legal_parte ? new Date(b.data_prazo_legal_parte).getTime() : 0;
        return dataA - dataB;
      });
      // Reconstituir lista do dia com pinned no topo
      (dias as any)[dia] = [...semPrazoPendentes, ...vencidosPendentes, ...restantes];
    });

    return dias;
  }, [expedientes, inicioSemana, fimSemana]);

  const colunas = React.useMemo(() => criarColunasSemanais(handleSuccess, usuarios, tiposExpedientes, onTipoExpedienteSort, onPrazoSort, onProcessoSort, onPartesSort, onResponsavelSort), [handleSuccess, usuarios, tiposExpedientes, onTipoExpedienteSort, onPrazoSort, onProcessoSort, onPartesSort, onResponsavelSort]);

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

  const temExpedientesNaSemana = React.useMemo(() => {
    return (
      expedientesPorDia.segunda.length +
      expedientesPorDia.terca.length +
      expedientesPorDia.quarta.length +
      expedientesPorDia.quinta.length +
      expedientesPorDia.sexta.length
    ) > 0;
  }, [expedientesPorDia]);

  if (!isLoading && !temExpedientesNaSemana) {
    return (
      <div className="mt-0">
        <DataTable
          data={expedientes}
          columns={colunas}
          isLoading={isLoading}
          error={null}
          emptyMessage="Nenhum expediente encontrado."
        />
      </div>
    );
  }

  return (
    <Tabs value={diaAtivo} onValueChange={setDiaAtivo} className="gap-0">
      <TabsList className="bg-background justify-start rounded-t-lg rounded-b-none border-b p-0 w-full">
        <TabsTrigger
          value="segunda"
          className="relative bg-muted/50 border-b-border dark:data-[state=active]:bg-background data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:border-b-background h-full rounded-none rounded-t border border-transparent data-[state=active]:-mb-0.5 data-[state=active]:shadow-none dark:border-b-0 dark:data-[state=active]:-mb-0.5 px-4 py-4 after:absolute after:right-0 after:top-[25%] after:h-[50%] after:w-px after:bg-border data-[state=active]:after:opacity-0"
        >
          <span className="text-sm font-medium text-center whitespace-normal">Segunda - {formatarDataTab(datasDiasSemana.segunda)}</span>
        </TabsTrigger>
        <TabsTrigger
          value="terca"
          className="relative bg-muted/50 border-b-border dark:data-[state=active]:bg-background data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:border-b-background h-full rounded-none rounded-t border border-transparent data-[state=active]:-mb-0.5 data-[state=active]:shadow-none dark:border-b-0 dark:data-[state=active]:-mb-0.5 px-4 py-4 after:absolute after:right-0 after:top-[25%] after:h-[50%] after:w-px after:bg-border data-[state=active]:after:opacity-0"
        >
          <span className="text-sm font-medium text-center whitespace-normal">Terça - {formatarDataTab(datasDiasSemana.terca)}</span>
        </TabsTrigger>
        <TabsTrigger
          value="quarta"
          className="relative bg-muted/50 border-b-border dark:data-[state=active]:bg-background data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:border-b-background h-full rounded-none rounded-t border border-transparent data-[state=active]:-mb-0.5 data-[state=active]:shadow-none dark:border-b-0 dark:data-[state=active]:-mb-0.5 px-4 py-4 after:absolute after:right-0 after:top-[25%] after:h-[50%] after:w-px after:bg-border data-[state=active]:after:opacity-0"
        >
          <span className="text-sm font-medium text-center whitespace-normal">Quarta - {formatarDataTab(datasDiasSemana.quarta)}</span>
        </TabsTrigger>
        <TabsTrigger
          value="quinta"
          className="relative bg-muted/50 border-b-border dark:data-[state=active]:bg-background data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:border-b-background h-full rounded-none rounded-t border border-transparent data-[state=active]:-mb-0.5 data-[state=active]:shadow-none dark:border-b-0 dark:data-[state=active]:-mb-0.5 px-4 py-4 after:absolute after:right-0 after:top-[25%] after:h-[50%] after:w-px after:bg-border data-[state=active]:after:opacity-0"
        >
          <span className="text-sm font-medium text-center whitespace-normal">Quinta - {formatarDataTab(datasDiasSemana.quinta)}</span>
        </TabsTrigger>
        <TabsTrigger
          value="sexta"
          className="relative bg-muted/50 border-b-border dark:data-[state=active]:bg-background data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:border-b-background h-full rounded-none rounded-t border border-transparent data-[state=active]:-mb-0.5 data-[state=active]:shadow-none dark:border-b-0 dark:data-[state=active]:-mb-0.5 px-4 py-4"
        >
          <span className="text-sm font-medium text-center whitespace-normal">Sexta - {formatarDataTab(datasDiasSemana.sexta)}</span>
        </TabsTrigger>
      </TabsList>

      {Object.entries(expedientesPorDia).map(([dia, expedientesDia]) => {
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
                data={expedientesDia}
                columns={colunas}
                isLoading={isLoading}
                emptyMessage={`Nenhum expediente com prazo para ${nomeDiaCompleto}, ${formatarDataCompleta(dataDia)}.`}
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
