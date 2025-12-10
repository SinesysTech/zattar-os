'use client';

// Componente de visualização de expedientes por semana com tabs de dias

import * as React from 'react';
import { useRouter } from 'next/navigation'; // Adicionado para router.refresh()
import { ClientOnlyTabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/client-only-tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { FormDatePicker } from '@/components/ui/form-date-picker';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Undo2, Loader2, Eye, Pencil, FileText } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import Link from 'next/link';
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
import { Expediente, CodigoTribunal, GrauTribunal } from '@/core/expedientes/domain';
import { actionAtualizarExpediente } from '@/app/actions/expedientes'; // Adicionado para update de tipo/descrição e prazo

// Definindo interfaces locais para Usuario e TipoExpediente
interface Usuario {
  id: number;
  nomeExibicao: string;
}

interface TipoExpediente {
  id: number;
  tipoExpediente: string;
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
const getTRTColorClass = (trt: CodigoTribunal): string => {
  const trtColors: Record<CodigoTribunal, string> = {
    'TRT1': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800',
    'TRT2': 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800',
    'TRT3': 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-800',
    'TRT4': 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900 dark:text-pink-200 dark:border-pink-800',
    'TRT5': 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-800',
    'TRT6': 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900 dark:text-indigo-200 dark:border-indigo-800',
    'TRT7': 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900 dark:text-cyan-200 dark:border-cyan-800',
    'TRT8': 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900 dark:text-rose-200 dark:border-rose-800',
    'TRT9': 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900 dark:text-teal-200 dark:border-teal-800',
    'TRT10': 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-200 dark:border-emerald-800',
    'TRT11': 'bg-lime-100 text-lime-800 border-lime-200 dark:bg-lime-900 dark:text-lime-200 dark:border-lime-800',
    'TRT12': 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200 dark:bg-fuchsia-900 dark:text-fuchsia-200 dark:border-fuchsia-800',
    'TRT13': 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-800',
    'TRT14': 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-800',
    'TRT15': 'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900 dark:text-violet-200 dark:border-violet-800',
    'TRT16': 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-800',
    'TRT17': 'bg-blue-200 text-blue-900 border-blue-300 dark:bg-blue-800 dark:text-blue-100 dark:border-blue-700',
    'TRT18': 'bg-green-200 text-green-900 border-green-300 dark:bg-green-800 dark:text-green-100 dark:border-green-700',
    'TRT19': 'bg-purple-200 text-purple-900 border-purple-300 dark:bg-purple-800 dark:text-purple-100 dark:border-purple-700',
    'TRT20': 'bg-pink-200 text-pink-900 border-pink-300 dark:bg-pink-800 dark:text-pink-100 dark:border-pink-700',
    'TRT21': 'bg-yellow-200 text-yellow-900 border-yellow-300 dark:bg-yellow-800 dark:text-yellow-100 dark:border-yellow-700',
    'TRT22': 'bg-indigo-200 text-indigo-900 border-indigo-300 dark:bg-indigo-800 dark:text-indigo-100 dark:border-indigo-700',
    'TRT23': 'bg-teal-200 text-teal-900 border-teal-300 dark:bg-teal-800 dark:text-teal-100 dark:border-teal-700',
    'TRT24': 'bg-orange-200 text-orange-900 border-orange-300 dark:bg-orange-800 dark:text-orange-100 dark:border-orange-700',
  };
  return trtColors[trt] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-800';
};

const getGrauColorClass = (grau: GrauTribunal): string => {
  const grauColors: Record<GrauTribunal, string> = {
    [GrauTribunal.PRIMEIRO_GRAU]: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-200 dark:border-emerald-800',
    [GrauTribunal.TRIBUNAL_SUPERIOR]: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-800',
    [GrauTribunal.SEGUNDO_GRAU]: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-800',
  };
  return grauColors[grau] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-800';
};

const formatarGrau = (grau: GrauTribunal): string => {
  if (grau === GrauTribunal.PRIMEIRO_GRAU) return '1º Grau';
  if (grau === GrauTribunal.SEGUNDO_GRAU) return '2º Grau';
  if (grau === GrauTribunal.TRIBUNAL_SUPERIOR) return 'Tribunal Superior';
  return grau;
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
  expediente: Expediente;
  onSuccess: () => void;
  tiposExpedientes: TipoExpediente[];
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

  // Sincronizar estado quando expediente mudar
  React.useEffect(() => {
    setTipoSelecionado(expediente.tipoExpedienteId?.toString() || 'null');
    setDescricao(expediente.descricaoArquivos || '');
  }, [expediente.tipoExpedienteId, expediente.descricaoArquivos]);

  const temDocumento = !!expediente.arquivoKey;

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
      // Aqui você pode adicionar um estado de erro local para exibir na UI
    } finally {
      setIsLoading(false);
    }
  };

  const tipoExpediente = tiposExpedientes.find(t => t.id === expediente.tipoExpedienteId);
  const tipoNome = tipoExpediente ? tipoExpediente.tipoExpediente : 'Sem tipo';
  const descricaoExibicao = expediente.descricaoArquivos || '-';

  return (
    <>
      <div className="relative w-full group">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <div
              className="flex flex-col gap-1 text-left hover:opacity-80 transition-opacity cursor-pointer w-full pr-6"
            >
              {/* Badge de tipo seguido do ícone de documento */}
              <div className="flex items-center gap-1.5">
                <Badge
                  variant="outline"
                  className={`text-xs w-fit ${expediente.tipoExpedienteId ? getTipoExpedienteColorClass(expediente.tipoExpedienteId) : ''}`}
                >
                  {tipoNome}
                </Badge>
                {temDocumento && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPdfViewerOpen(true);
                    }}
                    className="p-1 hover:bg-accent rounded-md transition-colors"
                    title="Visualizar documento"
                  >
                    <FileText className="h-3.5 w-3.5 text-primary" />
                  </button>
                )}
              </div>
              <div className="text-xs text-muted-foreground w-full wrap-break-word whitespace-pre-wrap leading-relaxed text-justify">
                {descricaoExibicao}
              </div>
            </div>
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
                        : tiposExpedientes.find(t => t.id.toString() === tipoSelecionado)?.tipoExpediente || 'Selecione o tipo'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="null">Sem tipo</SelectItem>
                    {tiposExpedientes.length > 0 ? (
                      tiposExpedientes.map((tipo) => (
                        <SelectItem key={tipo.id} value={tipo.id.toString()}>
                          {tipo.tipoExpediente}
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
      </div>

      {/* Modal de visualização do PDF */}
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
 * Componente para atribuir responsável a um expediente
 */
function ResponsavelCell({
  expediente,
  onSuccess,
  usuarios
}: {
  expediente: Expediente;
  onSuccess: () => void;
  usuarios: Usuario[];
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSelect = async (value: string) => {
    setIsLoading(true);
    try {
      const responsavelId = value === 'null' || value === '' ? null : parseInt(value, 10);

      const formData = new FormData();
      if (responsavelId !== null) formData.append('responsavelId', responsavelId.toString());
      else formData.append('responsavelId', 'null'); // Explicitly send 'null' to clear

      const result = await actionAtualizarExpediente(expediente.id, null, formData);

      if (!result.success) {
        throw new Error(result.message || 'Erro ao atribuir responsável');
      }

      setIsOpen(false);
      onSuccess(); // Triggers router.refresh()
    } catch (error) {
      console.error('Erro ao atribuir responsável:', error);
      // TODO: Adicionar tratamento de erro na UI
    } finally {
      setIsLoading(false);
    }
  };

  const responsavelAtual = usuarios.find(u => u.id === expediente.responsavelId);

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
  tiposExpedientes,
  onSuccess,
}: {
  expediente: Expediente;
  usuarios: Usuario[];
  tiposExpedientes: TipoExpediente[];
  onSuccess: () => void;
}) {
  const [baixarDialogOpen, setBaixarDialogOpen] = React.useState(false);
  const [reverterDialogOpen, setReverterDialogOpen] = React.useState(false);
  const [visualizarDialogOpen, setVisualizarDialogOpen] = React.useState(false);

  const estaBaixado = !!expediente.baixadoEm;

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
        onSuccess={onSuccess}
      />

      <ExpedientesReverterBaixaDialog
        open={reverterDialogOpen}
        onOpenChange={setReverterDialogOpen}
        expediente={expediente}
        onSuccess={onSuccess}
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
  onSort: (field: 'dataCienciaParte' | 'dataPrazoLegalParte', direction: 'asc' | 'desc') => void;
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
                onSort('dataCienciaParte', 'asc');
                setIsOpen(false);
              }}
            >
              ↑ Crescente
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => {
                onSort('dataCienciaParte', 'desc');
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
                onSort('dataPrazoLegalParte', 'asc');
                setIsOpen(false);
              }}
            >
              ↑ Crescente
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => {
                onSort('dataPrazoLegalParte', 'desc');
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
  onPartesSort,
}: {
  onSort: (field: 'trt' | 'grau' | 'descricaoOrgaoJulgador' | 'classeJudicial', direction: 'asc' | 'desc') => void;
  onPartesSort: (field: 'nomeParteAutora' | 'nomeParteRe', direction: 'asc' | 'desc') => void;
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
                onSort('descricaoOrgaoJulgador', 'asc');
                setIsOpen(false);
              }}
            >
              ↑ Crescente
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => {
                onSort('descricaoOrgaoJulgador', 'desc');
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
                onSort('classeJudicial', 'asc');
                setIsOpen(false);
              }}
            >
              ↑ Crescente
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => {
                onSort('classeJudicial', 'desc');
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
                onPartesSort('nomeParteAutora', 'asc');
                setIsOpen(false);
              }}
            >
              Parte Autora ↑
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => {
                onPartesSort('nomeParteAutora', 'desc');
                setIsOpen(false);
              }}
            >
              Parte Autora ↓
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => {
                onPartesSort('nomeParteRe', 'asc');
                setIsOpen(false);
              }}
            >
              Parte Ré ↑
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => {
                onPartesSort('nomeParteRe', 'desc');
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
 * Componente de célula para a coluna Prazo
 */
function PrazoCell({
  expediente,
  onSuccess,
}: {
  expediente: Expediente;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [openPrazo, setOpenPrazo] = React.useState(false);
  const [isSavingPrazo, setIsSavingPrazo] = React.useState(false);
  const [dataPrazoStr, setDataPrazoStr] = React.useState<string>('');

  const handleSalvarPrazo = async () => {
    setIsSavingPrazo(true);
    try {
      const formData = new FormData();
      if (dataPrazoStr) {
        const isoDate = new Date(dataPrazoStr).toISOString();
        formData.append('dataPrazoLegalParte', isoDate);
      } else {
        formData.append('dataPrazoLegalParte', ''); // Clear if empty
      }
      
      const result = await actionAtualizarExpediente(expediente.id, null, formData);

      if (!result.success) {
        throw new Error(result.message || 'Erro ao atualizar prazo legal');
      }

      setOpenPrazo(false);
      setDataPrazoStr('');
      onSuccess(); // Triggers router.refresh()
    } catch (error) {
      console.error('Erro ao atualizar prazo legal:', error);
      // TODO: Adicionar tratamento de erro na UI
    } finally {
      setIsSavingPrazo(false);
    }
  };

  return (
    <div className="min-h-10 flex flex-col items-center justify-center gap-2 py-2">
      <div className="text-sm">
        <span className="font-semibold">Início:</span> {formatarData(expediente.dataCienciaParte)}
      </div>
      <div className="text-sm">
        <span className="font-semibold">Fim:</span> {formatarData(expediente.dataPrazoLegalParte)}
      </div>
      {expediente.dataCienciaParte && expediente.dataPrazoLegalParte && (
        <Badge className={`${getCorBadgeDias(calcularDiasUteis(expediente.dataCienciaParte, expediente.dataPrazoLegalParte) || 0)} text-sm font-medium mt-1 px-3 py-1`}>
          {calcularDiasUteis(expediente.dataCienciaParte, expediente.dataPrazoLegalParte)} {calcularDiasUteis(expediente.dataCienciaParte, expediente.dataPrazoLegalParte) === 1 ? 'dia' : 'dias'}
        </Badge>
      )}
      {!expediente.baixadoEm && !expediente.dataPrazoLegalParte && (
        <Button size="sm" variant="outline" onClick={() => setOpenPrazo(true)}>
          Definir Data
        </Button>
      )}
      <Dialog open={openPrazo} onOpenChange={setOpenPrazo}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Definir Prazo Legal</DialogTitle>
            <DialogDescription>Defina a data de fim do prazo. A data de início será preenchida automaticamente.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label htmlFor="prazo-inicio" className="text-sm font-medium">Data de Início (automática)</label>
              <input
                id="prazo-inicio"
                type="text"
                value={expediente.createdAt ? formatarData(expediente.createdAt) : '-'}
                disabled
                className="border rounded p-2 w-full bg-muted text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground">Data de criação do expediente</p>
            </div>
            <div className="space-y-1">
              <label htmlFor="prazo-fim" className="text-sm font-medium">Data de Fim *</label>
              <FormDatePicker id="prazo-fim" value={dataPrazoStr || undefined} onChange={(v) => setDataPrazoStr(v || '')} />
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

/**
 * Componente de célula para a coluna Observações
 */
function ObservacoesCell({
  expediente,
  onSuccess,
}: {
  expediente: Expediente;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [valor, setValor] = React.useState<string>(expediente.observacoes || '');

  React.useEffect(() => {
    setValor(expediente.observacoes || '');
  }, [expediente.observacoes]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const observacoes = valor.trim() || null;
      const formData = new FormData();
      if (observacoes !== null) formData.append('observacoes', observacoes);
      else formData.append('observacoes', 'null'); // Explicitly send 'null' to clear

      const result = await actionAtualizarExpediente(expediente.id, null, formData);

      if (!result.success) {
        throw new Error(result.message || 'Erro ao atualizar observações');
      }

      setOpen(false);
      onSuccess(); // Triggers router.refresh()
    } catch (error) {
      console.error('Erro ao atualizar observações:', error);
      // TODO: Adicionar tratamento de erro na UI
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full group">
      <button type="button" className="flex flex-col gap-1 text-left hover:opacity-80 transition-opacity cursor-pointer w-full pr-6">
        <div className="text-xs text-muted-foreground w-full wrap-break-word whitespace-pre-wrap leading-relaxed text-justify">
          {expediente.observacoes || '-'}
        </div>
      </button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="absolute bottom-1 right-1 p-1 hover:bg-accent rounded-md transition-colors z-10 opacity-0 group-hover:opacity-100"
        title="Editar observações"
      >
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
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>Cancelar</Button>
              <Button type="button" onClick={handleSave} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Define as colunas da tabela de expedientes para visualização semanal
 */
function criarColunasSemanais(
  onSuccess: () => void,
  usuarios: Usuario[],
  tiposExpedientes: TipoExpediente[],
  // onTipoExpedienteSort: (direction: 'asc' | 'desc') => void, // Removed sorting props
  // onPrazoSort: (field: 'dataCienciaParte' | 'dataPrazoLegalParte', direction: 'asc' | 'desc') => void, // Removed sorting props
  // onProcessoSort: (field: 'trt' | 'grau' | 'descricaoOrgaoJulgador' | 'classeJudicial', direction: 'asc' | 'desc') => void, // Removed sorting props
  // onPartesSort: (field: 'nomeParteAutora' | 'nomeParteRe', direction: 'asc' | 'desc') => void, // Removed sorting props
  // onResponsavelSort: (direction: 'asc' | 'desc') => void // Removed sorting props
): ColumnDef<Expediente>[] {
  const handleAcoes = (expediente: Expediente) => (
    <AcoesExpediente
      expediente={expediente}
      usuarios={usuarios}
      tiposExpedientes={tiposExpedientes}
      onSuccess={onSuccess}
    />
  );
  return [
    {
      id: 'tipo_descricao',
      header: 'Tipo e Descrição', // Simplified header
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
      header: 'Prazo', // Simplified header
      enableSorting: false,
      size: 170,
      cell: ({ row }) => <PrazoCell expediente={row.original} onSuccess={onSuccess} />,
    },
    {
      id: 'processo_partes',
      header: 'Processo e Partes', // Simplified header
      enableSorting: false,
      size: 520,
      cell: ({ row }) => {
        const trt = row.original.trt;
        const grau = row.original.grau;
        const classeJudicial = row.original.classeJudicial || '';
        const numeroProcesso = row.original.numeroProcesso;
        const processoId = row.original.processoId;
        const parteAutora = row.original.nomeParteAutora || '-';
        const parteRe = row.original.nomeParteRe || '-';
        const orgaoJulgador = row.original.descricaoOrgaoJulgador || '-';

        return (
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
                      <Link
                        href={`/processos/${processoId}`}
                        className="inline-flex items-center hover:text-primary transition-colors ml-1"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Ver timeline do processo</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </span>
            </div>
            {/* Terceira linha: Órgão julgador (vara) */}
            <div className="text-xs text-muted-foreground max-w-full truncate">
              {orgaoJulgador}
            </div>
            
            {/* Espaçamento entre dados do processo e partes */}
            <div className="h-1" />
            
            {/* Partes */}
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
      id: 'observacoes',
      header: 'Observações', // Simplified header
      enableSorting: false,
      size: 300,
      cell: ({ row }) => <ObservacoesCell expediente={row.original} onSuccess={onSuccess} />,
    },
    {
      accessorKey: 'responsavelId', // Changed to camelCase
      header: 'Responsável', // Simplified header
      size: 160,
      cell: ({ row }) => (
        <div className="min-h-10 flex items-center justify-center">
          <ResponsavelCell expediente={row.original} onSuccess={onSuccess} usuarios={usuarios} />
        </div>
      ),
    },
    {
      id: 'acoes',
      header: 'Ações', // Simplified header
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
  expedientes: Expediente[];
  isLoading: boolean;
  usuarios: Usuario[];
  tiposExpedientes: TipoExpediente[];
  semanaAtual: Date;
}

export function ExpedientesVisualizacaoSemana({ expedientes, expedientesEspeciais, isLoading, isLoadingEspeciais, onRefresh, usuarios, tiposExpedientes, semanaAtual, onTipoExpedienteSort, onPrazoSort, onProcessoSort, onPartesSort, onResponsavelSort }: ExpedientesVisualizacaoSemanaProps) {
  const [diaAtivo, setDiaAtivo] = React.useState<string>('vencidos');
  const isLoadingTabs = isLoading || !!isLoadingEspeciais;
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
    type DiaSemana = 'vencidos' | 'semData' | 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta';
    const dias: Record<DiaSemana, PendenteManifestacao[]> = {
      vencidos: [],
      semData: [],
      segunda: [],
      terca: [],
      quarta: [],
      quinta: [],
      sexta: [],
    };

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const baseEspecial = expedientesEspeciais ?? expedientes;

    dias.vencidos = baseEspecial.filter((e) => {
      if (e.baixado_em) return false;
      if (!e.data_prazo_legal_parte) return false;
      const prazoDate = new Date(e.data_prazo_legal_parte);
      prazoDate.setHours(0, 0, 0, 0);
      return prazoDate < hoje;
    });

    dias.semData = baseEspecial.filter(
      (e) => !e.baixado_em && !e.data_prazo_legal_parte
    );

    const idsEspeciais = new Set<number>([
      ...dias.vencidos.map((e) => e.id),
      ...dias.semData.map((e) => e.id),
    ]);

    expedientes.forEach((expediente) => {
      if (!expediente.data_prazo_legal_parte || idsEspeciais.has(expediente.id)) return;

      const data = new Date(expediente.data_prazo_legal_parte);
      const dataLocal = new Date(data.getFullYear(), data.getMonth(), data.getDate());

      if (dataLocal >= inicioSemana && dataLocal <= fimSemana) {
        const diaSemana = dataLocal.getDay();

        if (diaSemana === 1) dias.segunda.push(expediente);
        else if (diaSemana === 2) dias.terca.push(expediente);
        else if (diaSemana === 3) dias.quarta.push(expediente);
        else if (diaSemana === 4) dias.quinta.push(expediente);
        else if (diaSemana === 5) dias.sexta.push(expediente);
      }
    });

    ['segunda', 'terca', 'quarta', 'quinta', 'sexta'].forEach((dia) => {
      dias[dia as DiaSemana].sort((a, b) => {
        const dataA = a.data_prazo_legal_parte ? new Date(a.data_prazo_legal_parte).getTime() : 0;
        const dataB = b.data_prazo_legal_parte ? new Date(b.data_prazo_legal_parte).getTime() : 0;
        return dataA - dataB;
      });
    });

    return dias;
  }, [expedientes, expedientesEspeciais, inicioSemana, fimSemana]);

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
      expedientesPorDia.vencidos.length +
      expedientesPorDia.semData.length +
      expedientesPorDia.segunda.length +
      expedientesPorDia.terca.length +
      expedientesPorDia.quarta.length +
      expedientesPorDia.quinta.length +
      expedientesPorDia.sexta.length
    ) > 0;
  }, [expedientesPorDia]);

  if (!isLoadingTabs && !temExpedientesNaSemana) {
    return (
      <div className="mt-0">
        <DataTable
          data={expedientes}
          columns={colunas}
          isLoading={isLoadingTabs}
          error={null}
          emptyMessage="Nenhum expediente encontrado."
        />
      </div>
    );
  }

  return (
    <ClientOnlyTabs value={diaAtivo} onValueChange={setDiaAtivo} className="gap-0">
      <TabsList className="bg-background justify-start rounded-t-lg rounded-b-none border-b p-0 w-full">
        <TabsTrigger
          value="vencidos"
          className="relative bg-muted/50 border-b-border dark:data-[state=active]:bg-background data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:border-b-background h-full rounded-none rounded-t border border-transparent data-[state=active]:-mb-0.5 data-[state=active]:shadow-none dark:border-b-0 dark:data-[state=active]:-mb-0.5 px-4 py-4 after:absolute after:right-0 after:top-[25%] after:h-[50%] after:w-px after:bg-border data-[state=active]:after:opacity-0"
        >
          <span className="text-sm font-medium text-center whitespace-normal">Vencidos</span>
          <Badge className="ml-2 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
            {expedientesPorDia.vencidos.length}
          </Badge>
        </TabsTrigger>
        <TabsTrigger
          value="semData"
          className="relative bg-muted/50 border-b-border dark:data-[state=active]:bg-background data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:border-b-background h-full rounded-none rounded-t border border-transparent data-[state=active]:-mb-0.5 data-[state=active]:shadow-none dark:border-b-0 dark:data-[state=active]:-mb-0.5 px-4 py-4 after:absolute after:right-0 after:top-[25%] after:h-[50%] after:w-px after:bg-border data-[state=active]:after:opacity-0"
        >
          <span className="text-sm font-medium text-center whitespace-normal">Sem Data</span>
          <Badge className="ml-2 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
            {expedientesPorDia.semData.length}
          </Badge>
        </TabsTrigger>
        <TabsTrigger
          value="segunda"
          className="relative bg-muted/50 border-b-border dark:data-[state=active]:bg-background data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:border-b-background h-full rounded-none rounded-t border border-transparent data-[state=active]:-mb-0.5 data-[state=active]:shadow-none dark:border-b-0 dark:data-[state=active]:-mb-0.5 px-4 py-4 after:absolute after:right-0 after:top-[25%] after:h-[50%] after:w-px after:bg-border data-[state=active]:after:opacity-0"
        >
          <span className="text-sm font-medium text-center whitespace-normal">Segunda - {formatarDataTab(datasDiasSemana.segunda)}</span>
          <Badge className="ml-2 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
            {expedientesPorDia.segunda.length}
          </Badge>
        </TabsTrigger>
        <TabsTrigger
          value="terca"
          className="relative bg-muted/50 border-b-border dark:data-[state=active]:bg-background data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:border-b-background h-full rounded-none rounded-t border border-transparent data-[state=active]:-mb-0.5 data-[state=active]:shadow-none dark:border-b-0 dark:data-[state=active]:-mb-0.5 px-4 py-4 after:absolute after:right-0 after:top-[25%] after:h-[50%] after:w-px after:bg-border data-[state=active]:after:opacity-0"
        >
          <span className="text-sm font-medium text-center whitespace-normal">Terça - {formatarDataTab(datasDiasSemana.terca)}</span>
          <Badge className="ml-2 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
            {expedientesPorDia.terca.length}
          </Badge>
        </TabsTrigger>
        <TabsTrigger
          value="quarta"
          className="relative bg-muted/50 border-b-border dark:data-[state=active]:bg-background data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:border-b-background h-full rounded-none rounded-t border border-transparent data-[state=active]:-mb-0.5 data-[state=active]:shadow-none dark:border-b-0 dark:data-[state=active]:-mb-0.5 px-4 py-4 after:absolute after:right-0 after:top-[25%] after:h-[50%] after:w-px after:bg-border data-[state=active]:after:opacity-0"
        >
          <span className="text-sm font-medium text-center whitespace-normal">Quarta - {formatarDataTab(datasDiasSemana.quarta)}</span>
          <Badge className="ml-2 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
            {expedientesPorDia.quarta.length}
          </Badge>
        </TabsTrigger>
        <TabsTrigger
          value="quinta"
          className="relative bg-muted/50 border-b-border dark:data-[state=active]:bg-background data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:border-b-background h-full rounded-none rounded-t border border-transparent data-[state=active]:-mb-0.5 data-[state=active]:shadow-none dark:border-b-0 dark:data-[state=active]:-mb-0.5 px-4 py-4 after:absolute after:right-0 after:top-[25%] after:h-[50%] after:w-px after:bg-border data-[state=active]:after:opacity-0"
        >
          <span className="text-sm font-medium text-center whitespace-normal">Quinta - {formatarDataTab(datasDiasSemana.quinta)}</span>
          <Badge className="ml-2 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
            {expedientesPorDia.quinta.length}
          </Badge>
        </TabsTrigger>
        <TabsTrigger
          value="sexta"
          className="relative bg-muted/50 border-b-border dark:data-[state=active]:bg-background data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:border-b-background h-full rounded-none rounded-t border border-transparent data-[state=active]:-mb-0.5 data-[state=active]:shadow-none dark:border-b-0 dark:data-[state=active]:-mb-0.5 px-4 py-4"
        >
          <span className="text-sm font-medium text-center whitespace-normal">Sexta - {formatarDataTab(datasDiasSemana.sexta)}</span>
          <Badge className="ml-2 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
            {expedientesPorDia.sexta.length}
          </Badge>
        </TabsTrigger>
      </TabsList>

      {/* Aba Vencidos */}
      <TabsContent key="vencidos" value="vencidos" className="mt-0">
        <div className="rounded-b-lg border border-t-0 bg-card text-card-foreground shadow-sm">
          <DataTable
            data={expedientesPorDia.vencidos}
            columns={colunas}
            isLoading={isLoadingTabs}
            emptyMessage="Nenhum expediente vencido."
            hideTableBorder={true}
            hideColumnBorders={true}
          />
        </div>
      </TabsContent>

      {/* Aba Sem Data */}
      <TabsContent key="semData" value="semData" className="mt-0">
        <div className="rounded-b-lg border border-t-0 bg-card text-card-foreground shadow-sm">
          <DataTable
            data={expedientesPorDia.semData}
            columns={colunas}
            isLoading={isLoadingTabs}
            emptyMessage="Nenhum expediente sem data de prazo."
            hideTableBorder={true}
            hideColumnBorders={true}
          />
        </div>
      </TabsContent>

      {/* Abas dos dias da semana */}
      {(['segunda', 'terca', 'quarta', 'quinta', 'sexta'] as const).map((dia) => {
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
                data={expedientesPorDia[dia]}
                columns={colunas}
                isLoading={isLoadingTabs}
                emptyMessage={`Nenhum expediente com prazo para ${nomeDiaCompleto}, ${formatarDataCompleta(dataDia)}.`}
                hideTableBorder={true}
                hideColumnBorders={true}
              />
            </div>
          </TabsContent>
        );
      })}
    </ClientOnlyTabs>
  );
}
