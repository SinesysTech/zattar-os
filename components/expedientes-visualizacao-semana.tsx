'use client';

// Componente de visualização de expedientes por semana com tabs de dias

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import type { PendenteManifestacao } from '@/backend/types/pendentes/types';

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
 * Define as colunas da tabela de expedientes para visualização semanal
 */
function criarColunasSemanais(): ColumnDef<PendenteManifestacao>[] {
  return [
    {
      accessorKey: 'data_ciencia_parte',
      header: () => <div className="text-sm font-medium">Ciência</div>,
      size: 100,
      cell: ({ row }) => (
        <div className="text-sm font-medium">
          {formatarData(row.getValue('data_ciencia_parte'))}
        </div>
      ),
    },
    {
      accessorKey: 'data_prazo_legal_parte',
      header: () => <div className="text-sm font-medium">Prazo</div>,
      size: 100,
      cell: ({ row }) => (
        <div className="text-sm font-medium">
          {formatarData(row.getValue('data_prazo_legal_parte'))}
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
        const orgaoJulgador = row.original.descricao_orgao_julgador || '-';

        return (
          <div className="flex flex-col gap-1">
            <div className="text-sm font-medium">
              {classeJudicial && `${classeJudicial} `}{numeroProcesso}
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
        const parteAutora = row.original.nome_parte_autora || '-';
        const parteRe = row.original.nome_parte_re || '-';

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
      id: 'status',
      header: () => <div className="text-sm font-medium">Status</div>,
      size: 120,
      cell: ({ row }) => {
        const prazoVencido = row.original.prazo_vencido;
        const baixadoEm = row.original.baixado_em;

        return (
          <div className="flex flex-col gap-1">
            <Badge variant={baixadoEm ? 'secondary' : 'default'} className="text-xs">
              {baixadoEm ? 'Baixado' : 'Pendente'}
            </Badge>
            <Badge variant={prazoVencido ? 'destructive' : 'default'} className="text-xs">
              {prazoVencido ? 'Vencido' : 'No Prazo'}
            </Badge>
          </div>
        );
      },
    },
  ];
}

interface ExpedientesVisualizacaoSemanaProps {
  expedientes: PendenteManifestacao[];
  isLoading: boolean;
}

export function ExpedientesVisualizacaoSemana({ expedientes, isLoading }: ExpedientesVisualizacaoSemanaProps) {
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
