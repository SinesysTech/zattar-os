
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/app/_lib/hooks/use-debounce';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { ClientOnlyTabs, TabsList, TabsTrigger } from '@/components/ui/client-only-tabs';
import { buildObrigacoesFilterOptions, buildObrigacoesFilterGroups, parseObrigacoesFilters, ObrigacoesFilters } from './obrigacoes-toolbar-filters';
import { NovaObrigacaoDialog } from '../acordos/nova-obrigacao-dialog';
import { AcordosList } from '../acordos/acordos-list';
import { AcordosCondenacoesPaginado } from '../../types';

export type ObrigacoesVisualizacao = 'tabela' | 'semana' | 'mes' | 'ano' | 'lista';

interface ObrigacoesContentProps {
  initialData?: AcordosCondenacoesPaginado;
  visualizacao?: ObrigacoesVisualizacao;
}

export function ObrigacoesContent({ visualizacao = 'lista' }: ObrigacoesContentProps) {
  const router = useRouter();
  const [busca, setBusca] = React.useState('');
  const [filtros, setFiltros] = React.useState<ObrigacoesFilters>({});
  const [selectedFilterIds, setSelectedFilterIds] = React.useState<string[]>([]);
  const [novaObrigacaoOpen, setNovaObrigacaoOpen] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const buscaDebounced = useDebounce(busca, 500);
  const isSearching = busca !== buscaDebounced;

  const filterOptions = React.useMemo(() => buildObrigacoesFilterOptions(), []);
  const filterGroups = React.useMemo(() => buildObrigacoesFilterGroups(), []);

  const handleFilterIdsChange = React.useCallback((newSelectedIds: string[]) => {
    setSelectedFilterIds(newSelectedIds);
    setFiltros(parseObrigacoesFilters(newSelectedIds));
  }, []);

  const handleSuccess = () => setRefreshKey(k => k + 1);

  const renderConteudo = () => {
      // Simplified: only list supported for now fully.
      if (visualizacao === 'lista' || visualizacao === 'tabela') {
          return <AcordosList busca={buscaDebounced} filtros={filtros} refreshKey={refreshKey} />;
      }
      return <div className="text-center py-12 text-muted-foreground">Visualização {visualizacao} em desenvolvimento</div>;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <TableToolbar
            searchValue={busca}
            onSearchChange={setBusca}
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

      <div className="flex items-center gap-4 pt-2">
        <ClientOnlyTabs value={visualizacao} onValueChange={(val) => {
            if (val === 'lista') router.push('/acordos-condenacoes/lista');
            else router.push(`/acordos-condenacoes/${val}`);
        }}>
            <TabsList>
                <TabsTrigger value="semana">Semana</TabsTrigger>
                <TabsTrigger value="mes">Mês</TabsTrigger>
                <TabsTrigger value="ano">Ano</TabsTrigger>
                <TabsTrigger value="lista">Lista</TabsTrigger>
            </TabsList>
        </ClientOnlyTabs>
      </div>

      {renderConteudo()}

      <NovaObrigacaoDialog 
        open={novaObrigacaoOpen} 
        onOpenChange={setNovaObrigacaoOpen}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
