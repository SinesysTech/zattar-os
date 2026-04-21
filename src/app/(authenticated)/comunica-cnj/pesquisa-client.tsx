'use client';

import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import {
  SearchHero,
  SearchQuickFilters,
  SearchShortcuts,
  SearchStats,
  SearchResults,
} from './components/pesquisa';
import { DiarioOficialPageNav } from './components/shared/diario-oficial-page-nav';
import { actionConsultarComunicacoes } from './actions/comunica-cnj-actions';
import {
  usePesquisaStore,
  montarParams,
} from './components/hooks/use-pesquisa-store';

/**
 * Client da página raiz `/comunica-cnj` — Pesquisa ao vivo na API CNJ.
 *
 * Layout canônico (ver AudienciasClient/AssinaturaDigital):
 *  1. DiarioOficialPageNav (heading + nav + action opcional)
 *  2. Bloco de busca (hero + quick filters)
 *  3. Atalhos + mini-stats (antes da primeira busca)
 *  4. Resultados (após busca)
 */
export function PesquisaClient() {
  const termo = usePesquisaStore((s) => s.termo);
  const filtros = usePesquisaStore((s) => s.filtros);
  const jaBuscou = usePesquisaStore((s) => s.jaBuscou);
  const total = usePesquisaStore((s) => s.total);
  const isBuscando = usePesquisaStore((s) => s.isBuscando);
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

  // Subtítulo dinâmico: antes da busca = descrição curta;
  // depois da busca = contador de resultados (padrão Audiências/Processos).
  const subtitle = useMemo(() => {
    if (isBuscando) return 'Consultando Comunica CNJ...';
    if (!jaBuscou) return 'Base pública do Comunica CNJ · consulta em tempo real';
    if (total === 0) return 'Nenhum resultado encontrado';
    return `${total.toLocaleString('pt-BR')} resultado${total === 1 ? '' : 's'}`;
  }, [isBuscando, jaBuscou, total]);

  return (
    <div className="space-y-5">
      <DiarioOficialPageNav active="pesquisa" subtitle={subtitle} />

      {/* Busca centralizada — hero de consulta à API pública */}
      <div className="py-4">
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
