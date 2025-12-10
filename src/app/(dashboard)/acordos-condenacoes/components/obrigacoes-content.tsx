'use client';

// Componente de conteúdo de obrigações - Compartilhado entre as diferentes visualizações

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/core/app/_lib/hooks/use-debounce';
import { Button } from '@/components/ui/button';
import { ButtonGroup, ButtonGroupText } from '@/components/ui/button-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { ClientOnlyTabs, TabsList, TabsTrigger } from '@/components/ui/client-only-tabs';
import { buildObrigacoesFilterOptions, buildObrigacoesFilterGroups, parseObrigacoesFilters } from './obrigacoes-toolbar-filters';
import { NovaObrigacaoDialog } from './nova-obrigacao-dialog';
import { AcordosCondenacoesList } from './acordos-condenacoes-list';
import type { ObrigacoesFilters } from './obrigacoes-toolbar-filters';

export type ObrigacoesVisualizacao = 'tabela' | 'semana' | 'mes' | 'ano' | 'lista';

interface ObrigacoesContentProps {
  visualizacao: ObrigacoesVisualizacao;
}

export function ObrigacoesContent({ visualizacao }: ObrigacoesContentProps) {
  const router = useRouter();
  const [busca, setBusca] = React.useState('');
  const [filtros, setFiltros] = React.useState<ObrigacoesFilters>({});
  const [selectedFilterIds, setSelectedFilterIds] = React.useState<string[]>([]);
  const [novaObrigacaoOpen, setNovaObrigacaoOpen] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);

  // Usar null como valor inicial para evitar hydration mismatch
  const [semanaAtual, setSemanaAtual] = React.useState<Date | null>(null);
  const [mesAtual, setMesAtual] = React.useState<Date | null>(null);
  const [anoAtual, setAnoAtual] = React.useState<number | null>(null);

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

  // Gerar opções de filtro
  const filterOptions = React.useMemo(() => buildObrigacoesFilterOptions(), []);
  const filterGroups = React.useMemo(() => buildObrigacoesFilterGroups(), []);

  // Converter IDs selecionados para filtros
  const handleFilterIdsChange = React.useCallback((newSelectedIds: string[]) => {
    setSelectedFilterIds(newSelectedIds);
    const newFilters = parseObrigacoesFilters(newSelectedIds);
    setFiltros(newFilters);
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

  const handleSuccess = React.useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);


  // Renderizar conteúdo baseado na visualização
  const renderConteudo = () => {
    switch (visualizacao) {
      case 'tabela':
      case 'lista':
        return (
          <AcordosCondenacoesList
            busca={buscaDebounced}
            filtros={filtros}
            refreshKey={refreshKey}
          />
        );
      case 'semana':
        return (
          <div className="text-center py-12 text-muted-foreground">
            Visualização semanal em desenvolvimento
          </div>
        );
      case 'mes':
        return (
          <div className="text-center py-12 text-muted-foreground">
            Visualização mensal em desenvolvimento
          </div>
        );
      case 'ano':
        return (
          <div className="text-center py-12 text-muted-foreground">
            Visualização anual em desenvolvimento
          </div>
        );
      default:
        return null;
    }
  };

  // Mapear 'tabela' para 'lista' para compatibilidade com rotas
  const visualizacaoTab = visualizacao === 'tabela' ? 'lista' : visualizacao;

  return (
    <div className="space-y-4">
      {/* Linha 1: Barra de busca e filtros */}
      <div className="flex justify-center">
        <TableToolbar
          searchValue={busca}
          onSearchChange={(value) => {
            setBusca(value);
          }}
          isSearching={isSearching}
          searchPlaceholder="Buscar obrigações..."
          filterOptions={filterOptions}
          filterGroups={filterGroups}
          selectedFilters={selectedFilterIds}
          onFiltersChange={handleFilterIdsChange}
          onNewClick={() => setNovaObrigacaoOpen(true)}
          newButtonTooltip="Nova obrigação"
          filterButtonsMode="buttons"
        />
      </div>

      {/* Linha 2: Tabs + Controles de navegação */}
      <div className="flex items-center gap-4 pt-2">
        <ClientOnlyTabs value={visualizacaoTab} onValueChange={(value) => {
          const route = value === 'lista' ? '/acordos-condenacoes/lista' : `/acordos-condenacoes/${value}`;
          router.push(route);
        }}>
          <TabsList>
            <TabsTrigger value="semana">Semana</TabsTrigger>
            <TabsTrigger value="mes">Mês</TabsTrigger>
            <TabsTrigger value="ano">Ano</TabsTrigger>
            <TabsTrigger value="lista">Lista</TabsTrigger>
          </TabsList>
        </ClientOnlyTabs>

        {visualizacao !== 'tabela' && visualizacao !== 'lista' && (
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
            <ButtonGroupText className="whitespace-nowrap capitalize min-w-40 text-center text-xs font-normal">
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
      </div>

      {/* Conteúdo */}
      {renderConteudo()}

      {/* Dialog para criar nova obrigação */}
      <NovaObrigacaoDialog
        open={novaObrigacaoOpen}
        onOpenChange={setNovaObrigacaoOpen}
        onSuccess={handleSuccess}
      />
    </div>
  );
}

