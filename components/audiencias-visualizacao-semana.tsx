'use client';

// Componente de visualização de audiências por semana com tabs de dias

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ColumnDef } from '@tanstack/react-table';
import type { Audiencia } from '@/backend/types/audiencias/types';
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
  };
  return trtColors[trt] || 'bg-gray-100 text-gray-800 border-gray-200';
};

/**
 * Retorna a classe CSS de cor para badge do grau
 */
const getGrauColorClass = (grau: 'primeiro_grau' | 'segundo_grau'): string => {
  const grauColors: Record<string, string> = {
    'primeiro_grau': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'segundo_grau': 'bg-amber-100 text-amber-800 border-amber-200',
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
  const [isLoading, setIsLoading] = React.useState(false);

  const handleChange = async (value: string) => {
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
    <Select
      value={audiencia.responsavel_id?.toString() || 'null'}
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
 * Define as colunas da tabela de audiências para visualização semanal
 */
function criarColunasSemanais(onSuccess: () => void, usuarios: Usuario[]): ColumnDef<Audiencia>[] {
  return [
    {
      accessorKey: 'data_inicio',
      header: () => (
        <div className="flex items-center justify-center">
          <div className="text-sm font-medium">Hora</div>
        </div>
      ),
      size: 80,
      cell: ({ row }) => (
        <div className="min-h-[2.5rem] flex items-center justify-center text-sm font-medium">
          {formatarHora(row.getValue('data_inicio'))}
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
      size: 350,
      cell: ({ row }) => {
        const classeJudicial = row.original.classe_judicial || '';
        const numeroProcesso = row.original.numero_processo;
        const trt = row.original.trt;
        const grau = row.original.grau;
        const orgaoJulgador = row.original.orgao_julgador_descricao || '-';

        return (
          <div className="min-h-[2.5rem] flex flex-col items-start justify-center gap-1.5 max-w-[350px]">
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
      size: 250,
      cell: ({ row }) => {
        const parteAutora = row.original.polo_ativo_nome || '-';
        const parteRe = row.original.polo_passivo_nome || '-';

        return (
          <div className="min-h-[2.5rem] flex flex-col items-start justify-center gap-1.5 max-w-[250px]">
            <Badge variant="outline" className={`${getParteAutoraColorClass()} whitespace-nowrap max-w-full truncate`}>
              {parteAutora}
            </Badge>
            <Badge variant="outline" className={`${getParteReColorClass()} whitespace-nowrap max-w-full truncate`}>
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
      size: 200,
      cell: ({ row }) => {
        const tipo = row.original.tipo_descricao || '-';
        const isVirtual = row.original.tipo_is_virtual;
        const sala = row.original.sala_audiencia_nome || '-';

        return (
          <div className="min-h-[2.5rem] flex flex-col items-start justify-center gap-1 max-w-[200px]">
            <div className="flex items-center gap-2">
              <span className="text-sm">{tipo}</span>
              {isVirtual && (
                <Badge variant="outline" className="text-xs">
                  Virtual
                </Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground truncate max-w-full">
              {sala}
            </div>
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
            <TabsContent key={dia} value={dia}>
              <DataTable
                data={audienciasDia}
                columns={colunas}
                isLoading={isLoading}
                emptyMessage={`Nenhuma audiência agendada para ${nomeDiaCompleto}, ${formatarDataCompleta(dataDia)}.`}
              />
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
