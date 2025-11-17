'use client';

// Componente de visualização de audiências por semana com tabs de dias

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import type { Audiencia } from '@/backend/types/audiencias/types';

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
 * Define as colunas da tabela de audiências para visualização semanal
 */
function criarColunasSemanais(): ColumnDef<Audiencia>[] {
  return [
    {
      accessorKey: 'data_inicio',
      header: () => <div className="text-sm font-medium">Hora</div>,
      size: 80,
      cell: ({ row }) => (
        <div className="text-sm font-medium">
          {formatarHora(row.getValue('data_inicio'))}
        </div>
      ),
    },
    {
      id: 'processo',
      header: () => <div className="text-sm font-medium">Processo</div>,
      size: 300,
      cell: ({ row }) => {
        const classeJudicial = row.original.classe_judicial || '';
        const numeroProcesso = row.original.numero_processo;
        const trt = row.original.trt;
        const grau = row.original.grau;
        const orgaoJulgador = row.original.orgao_julgador_descricao || '-';

        return (
          <div className="flex flex-col gap-1">
            <div className="text-sm font-medium">
              {classeJudicial && `${classeJudicial} `}{numeroProcesso}
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              <Badge variant="outline" className={`${getTRTColorClass(trt)} text-xs`}>
                {trt}
              </Badge>
              <Badge variant="outline" className={`${getGrauColorClass(grau)} text-xs`}>
                {formatarGrau(grau)}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {orgaoJulgador}
            </div>
          </div>
        );
      },
    },
    {
      id: 'partes',
      header: () => <div className="text-sm font-medium">Partes</div>,
      size: 220,
      cell: ({ row }) => {
        const parteAutora = row.original.polo_ativo_nome || '-';
        const parteRe = row.original.polo_passivo_nome || '-';

        return (
          <div className="flex flex-col gap-1">
            <Badge variant="outline" className={`${getParteAutoraColorClass()} text-xs whitespace-nowrap truncate max-w-full`}>
              {parteAutora}
            </Badge>
            <Badge variant="outline" className={`${getParteReColorClass()} text-xs whitespace-nowrap truncate max-w-full`}>
              {parteRe}
            </Badge>
          </div>
        );
      },
    },
    {
      id: 'tipo_local',
      header: () => <div className="text-sm font-medium">Tipo/Local</div>,
      size: 180,
      cell: ({ row }) => {
        const tipo = row.original.tipo_descricao || '-';
        const isVirtual = row.original.tipo_is_virtual;
        const sala = row.original.sala_audiencia_nome || '-';

        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-sm">{tipo}</span>
              {isVirtual && (
                <Badge variant="outline" className="text-xs">Virtual</Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {sala}
            </div>
          </div>
        );
      },
    },
  ];
}

interface AudienciasVisualizacaoSemanaProps {
  audiencias: Audiencia[];
  isLoading: boolean;
}

export function AudienciasVisualizacaoSemana({ audiencias, isLoading }: AudienciasVisualizacaoSemanaProps) {
  const [semanaAtual, setSemanaAtual] = React.useState(new Date());
  const [diaAtivo, setDiaAtivo] = React.useState<string>('segunda');

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

  // Filtrar audiências por dia da semana
  const audienciasPorDia = React.useMemo(() => {
    const dias = {
      segunda: [] as Audiencia[],
      terca: [] as Audiencia[],
      quarta: [] as Audiencia[],
      quinta: [] as Audiencia[],
      sexta: [] as Audiencia[],
    };

    audiencias.forEach((audiencia) => {
      const data = new Date(audiencia.data_inicio);
      const diaSemana = data.getDay();

      if (diaSemana === 1) dias.segunda.push(audiencia);
      else if (diaSemana === 2) dias.terca.push(audiencia);
      else if (diaSemana === 3) dias.quarta.push(audiencia);
      else if (diaSemana === 4) dias.quinta.push(audiencia);
      else if (diaSemana === 5) dias.sexta.push(audiencia);
    });

    return dias;
  }, [audiencias]);

  const colunas = React.useMemo(() => criarColunasSemanais(), []);

  const formatarDataCabecalho = (data: Date) => {
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const navegarSemana = (direcao: 'anterior' | 'proxima') => {
    const novaSemana = new Date(semanaAtual);
    novaSemana.setDate(novaSemana.getDate() + (direcao === 'proxima' ? 7 : -7));
    setSemanaAtual(novaSemana);
  };

  return (
    <div className="space-y-4">
      {/* Navegação de semana */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navegarSemana('anterior')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm font-medium">
            {formatarDataCabecalho(inicioSemana)} - {formatarDataCabecalho(fimSemana)}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => navegarSemana('proxima')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button
          variant="outline"
          onClick={() => setSemanaAtual(new Date())}
        >
          Semana Atual
        </Button>
      </div>

      {/* Tabs de dias */}
      <Tabs value={diaAtivo} onValueChange={setDiaAtivo}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="segunda">Segunda</TabsTrigger>
          <TabsTrigger value="terca">Terça</TabsTrigger>
          <TabsTrigger value="quarta">Quarta</TabsTrigger>
          <TabsTrigger value="quinta">Quinta</TabsTrigger>
          <TabsTrigger value="sexta">Sexta</TabsTrigger>
        </TabsList>

        {Object.entries(audienciasPorDia).map(([dia, audienciasDia]) => (
          <TabsContent key={dia} value={dia}>
            <DataTable
              data={audienciasDia}
              columns={colunas}
              isLoading={isLoading}
              emptyMessage={`Nenhuma audiência agendada para ${dia}.`}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
