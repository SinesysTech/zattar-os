'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import { Heading, Text } from '@/components/ui/typography';
import {
  SearchHero,
  SearchQuickFilters,
  SearchShortcuts,
  SearchStats,
  SearchResults,
} from './components/pesquisa';
import { ComunicaCnjSubnav } from './components/shared/comunica-cnj-subnav';
import { actionConsultarComunicacoes } from './actions/comunica-cnj-actions';
import {
  usePesquisaStore,
  montarParams,
} from './components/hooks/use-pesquisa-store';

/**
 * Client da página raiz `/comunica-cnj` — Pesquisa ao vivo na API CNJ.
 *
 * Layout padrão ouro (ver AssinaturaDigital/Audiências):
 *  1. Heading do módulo ("Diário Oficial") + subtítulo
 *  2. Subnav (Pesquisa | Capturadas)
 *  3. Bloco de busca centralizado
 *  4. Quick filters + atalhos + stats (antes da primeira busca)
 *  5. Resultados
 */
export function PesquisaClient() {
  const termo = usePesquisaStore((s) => s.termo);
  const filtros = usePesquisaStore((s) => s.filtros);
  const jaBuscou = usePesquisaStore((s) => s.jaBuscou);
  const setIsBuscando = usePesquisaStore((s) => s.setIsBuscando);
  const setErro = usePesquisaStore((s) => s.setErro);
  const setResultados = usePesquisaStore((s) => s.setResultados);

  const executarBusca = useCallback(async () => {
    const params = montarParams(termo, filtros, 1);

    const temFiltro =
      termo.trim().length > 0 ||
      Boolean(params.siglaTribunal) ||
      Boolean(params.numeroOab) ||
      Boolean(params.nomeParte) ||
      Boolean(params.nomeAdvogado) ||
      Boolean(params.numeroProcesso) ||
      Boolean(params.orgaoId) ||
      Boolean(params.dataInicio) ||
      Boolean(params.dataFim) ||
      Boolean(params.meio);

    if (!temFiltro) {
      toast.info('Informe ao menos um termo ou filtro para pesquisar.');
      return;
    }

    setIsBuscando(true);
    setErro(null);

    try {
      const result = await actionConsultarComunicacoes(params);
      if (!result.success || !result.data) {
        setErro(result.error ?? 'Erro ao consultar Comunica CNJ.');
        return;
      }
      setResultados({
        comunicacoes: result.data.comunicacoes,
        pagina: result.data.paginacao.pagina,
        totalPaginas: result.data.paginacao.totalPaginas,
        total: result.data.paginacao.total,
        rateLimit: result.data.rateLimit,
      });
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro desconhecido.');
    } finally {
      setIsBuscando(false);
    }
  }, [termo, filtros, setIsBuscando, setErro, setResultados]);

  return (
    <div className="flex flex-col gap-5 px-6 py-6">
      {/* Header do módulo */}
      <div>
        <Heading level="page">Diário Oficial</Heading>
        <Text variant="caption" className="mt-0.5 text-muted-foreground">
          Pesquise comunicações processuais oficiais publicadas no Comunica CNJ.
        </Text>
      </div>

      {/* Abas */}
      <ComunicaCnjSubnav active="pesquisa" />

      {/* Busca */}
      <div className="py-6">
        <SearchHero onBuscar={executarBusca} />
        <div className="mt-4">
          <SearchQuickFilters />
        </div>
      </div>

      {/* Atalhos + stats antes da primeira busca */}
      {!jaBuscou && (
        <div className="flex flex-col gap-6">
          <SearchShortcuts onAfterApply={executarBusca} />
          <SearchStats />
        </div>
      )}

      <SearchResults />
    </div>
  );
}
