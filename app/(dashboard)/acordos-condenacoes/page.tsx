'use client';

// Página de obrigações - Lista acordos, condenações e custas processuais

import * as React from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ButtonGroup, ButtonGroupText } from '@/components/ui/button-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Calendar, CalendarDays, CalendarRange, ChevronLeft, ChevronRight, List, RotateCcw } from 'lucide-react';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { buildObrigacoesFilterOptions, buildObrigacoesFilterGroups, parseObrigacoesFilters } from './components/obrigacoes-toolbar-filters';
import { NovaObrigacaoDialog } from './components/nova-obrigacao-dialog';
import { AcordosCondenacoesList } from './components/acordos-condenacoes-list';
import type { ObrigacoesFilters } from './components/obrigacoes-toolbar-filters';

export default function ObrigacoesPage() {
  const [busca, setBusca] = React.useState('');
  const [filtros, setFiltros] = React.useState<ObrigacoesFilters>({});
  const [selectedFilterIds, setSelectedFilterIds] = React.useState<string[]>([]);
  const [visualizacao, setVisualizacao] = React.useState<'tabela' | 'semana' | 'mes' | 'ano'>('tabela');
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

  return (
    <Tabs value={visualizacao} onValueChange={(value) => setVisualizacao(value as typeof visualizacao)}>
      <div className="space-y-4">
        {/* Barra de busca, filtros e tabs de visualização */}
        <div className="flex items-center gap-4 pb-6">
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
          />

          {/* Tabs de visualização */}
          <TabsList>
            <TabsTrigger value="tabela" aria-label="Visualização em Lista">
              <List className="h-4 w-4" />
              <span>Lista</span>
            </TabsTrigger>
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
          {/* Lista */}
          <AcordosCondenacoesList
            busca={buscaDebounced}
            filtros={filtros}
            refreshKey={refreshKey}
          />
        </TabsContent>

        <TabsContent value="semana">
          <div className="text-center py-12 text-muted-foreground">
            Visualização semanal em desenvolvimento
          </div>
        </TabsContent>

        <TabsContent value="mes">
          <div className="text-center py-12 text-muted-foreground">
            Visualização mensal em desenvolvimento
          </div>
        </TabsContent>

        <TabsContent value="ano">
          <div className="text-center py-12 text-muted-foreground">
            Visualização anual em desenvolvimento
          </div>
        </TabsContent>
      </div>

      {/* Dialog para criar nova obrigação */}
      <NovaObrigacaoDialog
        open={novaObrigacaoOpen}
        onOpenChange={setNovaObrigacaoOpen}
        onSuccess={handleSuccess}
      />
    </Tabs>
  );
}
