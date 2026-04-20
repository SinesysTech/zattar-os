'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
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
 * Client component da página raiz `/comunica-cnj` — hero de busca
 * na API pública do Comunica CNJ. Orquestra SearchHero, SearchQuickFilters,
 * SearchShortcuts, SearchStats e SearchResults.
 *
 * Estado gerenciado em `usePesquisaStore` (zustand).
 * Busca ao vivo via `actionConsultarComunicacoes`.
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
    <div className="flex flex-col gap-6 px-6 py-6">
      <ComunicaCnjSubnav active="pesquisa" />

      <div className="flex flex-col gap-8 py-4">
        <SearchHero onBuscar={executarBusca} />
        <SearchQuickFilters />
      </div>

      {/* Atalhos + stats só antes da primeira busca (reduz ruído depois) */}
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
