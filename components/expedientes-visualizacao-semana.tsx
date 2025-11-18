'use client';

// Componente de visualização de expedientes por semana com tabs de dias

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle2, Undo2, Loader2, Eye } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { ExpedientesBaixarDialog } from '@/components/expedientes-baixar-dialog';
import { ExpedientesReverterBaixaDialog } from '@/components/expedientes-reverter-baixa-dialog';
import { ExpedienteVisualizarDialog } from '@/components/expediente-visualizar-dialog';
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
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex flex-col gap-1 text-left hover:opacity-80 transition-opacity cursor-pointer"
        >
          <Badge variant="outline" className="text-xs w-fit">
            {tipoNome}
          </Badge>
          <div className="text-xs text-muted-foreground truncate">
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
  const [isLoading, setIsLoading] = React.useState(false);

  const handleChange = async (value: string) => {
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

      onSuccess();
    } catch (error) {
      console.error('Erro ao atribuir responsável:', error);
      onSuccess();
    } finally {
      setIsLoading(false);
    }
  };

  const responsavelAtual = usuarios.find(u => u.id === expediente.responsavel_id);

  return (
    <Select
      value={expediente.responsavel_id?.toString() || 'null'}
      onValueChange={handleChange}
      disabled={isLoading}
    >
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Sem responsável">
          {responsavelAtual ? responsavelAtual.nomeExibicao : 'Sem responsável'}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="null">Sem responsável</SelectItem>
        {usuarios.map((usuario) => (
          <SelectItem key={usuario.id} value={usuario.id.toString()}>
            {usuario.nomeExibicao}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
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
 * Define as colunas da tabela de expedientes para visualização semanal
 */
function criarColunasSemanais(
  onSuccess: () => void, 
  usuarios: Usuario[],
  tiposExpedientes: Array<{ id: number; tipo_expediente: string }>
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
      header: () => (
        <div className="flex items-center justify-start">
          <div className="text-sm font-medium">Tipo / Descrição</div>
        </div>
      ),
      size: 250,
      cell: ({ row }) => (
        <div className="min-h-[2.5rem] flex items-start justify-center max-w-[250px]">
          <TipoDescricaoCell
            expediente={row.original}
            onSuccess={onSuccess}
            tiposExpedientes={tiposExpedientes}
          />
        </div>
      ),
    },
    {
      accessorKey: 'data_ciencia_parte',
      header: () => (
        <div className="flex items-center justify-center">
          <div className="text-sm font-medium">Ciência</div>
        </div>
      ),
      size: 100,
      cell: ({ row }) => (
        <div className="min-h-[2.5rem] flex items-center justify-center text-sm font-medium">
          {formatarData(row.getValue('data_ciencia_parte'))}
        </div>
      ),
    },
    {
      accessorKey: 'data_prazo_legal_parte',
      header: () => (
        <div className="flex items-center justify-center">
          <div className="text-sm font-medium">Prazo</div>
        </div>
      ),
      size: 100,
      cell: ({ row }) => (
        <div className="min-h-[2.5rem] flex items-center justify-center text-sm font-medium">
          {formatarData(row.getValue('data_prazo_legal_parte'))}
        </div>
      ),
    },
    {
      id: 'processo',
      header: () => (
        <div className="flex items-center justify-start">
          <div className="text-sm font-medium">Processo</div>
        </div>
      ),
      size: 330,
      cell: ({ row }) => {
        const classeJudicial = row.original.classe_judicial || '';
        const numeroProcesso = row.original.numero_processo;
        const orgaoJulgador = row.original.descricao_orgao_julgador || '-';
        const trt = row.original.trt;
        const grau = row.original.grau;

        return (
          <div className="min-h-[2.5rem] flex flex-col items-start justify-center gap-1.5 max-w-[330px]">
            <div className="text-sm font-medium whitespace-nowrap">
              {classeJudicial && `${classeJudicial} `}{numeroProcesso}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant="outline" className={`${getTRTColorClass(trt)} w-fit text-xs`}>
                {trt}
              </Badge>
              <Badge variant="outline" className={`${getGrauColorClass(grau)} w-fit text-xs`}>
                {formatarGrau(grau)}
              </Badge>
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
      size: 220,
      cell: ({ row }) => {
        const parteAutora = row.original.nome_parte_autora || '-';
        const parteRe = row.original.nome_parte_re || '-';

        return (
          <div className="min-h-[2.5rem] flex flex-col items-start justify-center gap-1.5 max-w-[220px]">
            <Badge variant="outline" className={`${getParteAutoraColorClass()} whitespace-nowrap max-w-full truncate text-xs`}>
              {parteAutora}
            </Badge>
            <Badge variant="outline" className={`${getParteReColorClass()} whitespace-nowrap max-w-full truncate text-xs`}>
              {parteRe}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: 'responsavel_id',
      header: () => (
        <div className="flex items-center justify-center">
          <div className="text-sm font-medium">Responsável</div>
        </div>
      ),
      size: 220,
      cell: ({ row }) => (
        <div className="min-h-[2.5rem] flex items-center justify-center">
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
      size: 80,
      cell: ({ row }) => (
        <div className="min-h-[2.5rem] flex items-center justify-center">
          {handleAcoes(row.original)}
        </div>
      ),
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
}

export function ExpedientesVisualizacaoSemana({ expedientes, isLoading, onRefresh, usuarios, tiposExpedientes, semanaAtual }: ExpedientesVisualizacaoSemanaProps) {
  const [diaAtivo, setDiaAtivo] = React.useState<string>('segunda');

  const handleSuccess = React.useCallback(() => {
    if (onRefresh) {
      onRefresh();
    }
  }, [onRefresh]);

  // Calcular início e fim da semana
  const inicioSemana = React.useMemo(() => {
    const date = new Date(semanaAtual);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Ajustar para segunda
    return new Date(date.setDate(diff));
  }, [semanaAtual]);

  const fimSemana = React.useMemo(() => {
    const date = new Date(inicioSemana);
    date.setDate(date.getDate() + 4); // Até sexta
    return date;
  }, [inicioSemana]);

  // Filtrar expedientes por dia da semana (usando data de prazo legal)
  const expedientesPorDia = React.useMemo(() => {
    const dias = {
      segunda: [] as PendenteManifestacao[],
      terca: [] as PendenteManifestacao[],
      quarta: [] as PendenteManifestacao[],
      quinta: [] as PendenteManifestacao[],
      sexta: [] as PendenteManifestacao[],
    };

    expedientes.forEach((expediente) => {
      if (!expediente.data_prazo_legal_parte) return;

      const data = new Date(expediente.data_prazo_legal_parte);

      // Verificar se o expediente está dentro da semana atual
      if (data >= inicioSemana && data <= fimSemana) {
        const diaSemana = data.getDay();

        if (diaSemana === 1) dias.segunda.push(expediente);
        else if (diaSemana === 2) dias.terca.push(expediente);
        else if (diaSemana === 3) dias.quarta.push(expediente);
        else if (diaSemana === 4) dias.quinta.push(expediente);
        else if (diaSemana === 5) dias.sexta.push(expediente);
      }
    });

    return dias;
  }, [expedientes, inicioSemana, fimSemana]);

  const colunas = React.useMemo(() => criarColunasSemanais(handleSuccess, usuarios, tiposExpedientes), [handleSuccess, usuarios, tiposExpedientes]);

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

  return (
    <div className="space-y-4">
      {/* Tabs de dias */}
      <Tabs value={diaAtivo} onValueChange={setDiaAtivo}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="segunda">
            <span className="text-xs">Segunda - {formatarDataTab(datasDiasSemana.segunda)}</span>
          </TabsTrigger>
          <TabsTrigger value="terca">
            <span className="text-xs">Terça - {formatarDataTab(datasDiasSemana.terca)}</span>
          </TabsTrigger>
          <TabsTrigger value="quarta">
            <span className="text-xs">Quarta - {formatarDataTab(datasDiasSemana.quarta)}</span>
          </TabsTrigger>
          <TabsTrigger value="quinta">
            <span className="text-xs">Quinta - {formatarDataTab(datasDiasSemana.quinta)}</span>
          </TabsTrigger>
          <TabsTrigger value="sexta">
            <span className="text-xs">Sexta - {formatarDataTab(datasDiasSemana.sexta)}</span>
          </TabsTrigger>
        </TabsList>

        {Object.entries(expedientesPorDia).map(([dia, expedientesDia]) => (
          <TabsContent key={dia} value={dia}>
            <DataTable
              data={expedientesDia}
              columns={colunas}
              isLoading={isLoading}
              emptyMessage={`Nenhum expediente com prazo para ${dia}.`}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
