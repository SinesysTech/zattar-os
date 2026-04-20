'use client';

import { create } from 'zustand';
import type {
  ComunicacaoItem,
  ConsultarComunicacoesParams,
  MeioComunicacao,
  RateLimitStatus,
} from '@/app/(authenticated)/comunica-cnj/domain';

export interface PesquisaFiltros {
  siglaTribunal?: string;
  numeroOab?: string;
  ufOab?: string;
  nomeParte?: string;
  nomeAdvogado?: string;
  numeroProcesso?: string;
  meio?: MeioComunicacao;
  dataInicio?: string;
  dataFim?: string;
}

interface PesquisaState {
  termo: string;
  filtros: PesquisaFiltros;
  resultados: ComunicacaoItem[];
  paginaAtual: number;
  totalPaginas: number;
  total: number;
  rateLimit: RateLimitStatus | null;

  isBuscando: boolean;
  erro: string | null;
  jaBuscou: boolean;

  setTermo: (termo: string) => void;
  setFiltros: (filtros: Partial<PesquisaFiltros>) => void;
  limparFiltros: () => void;
  resetarBusca: () => void;

  setResultados: (params: {
    comunicacoes: ComunicacaoItem[];
    pagina: number;
    totalPaginas: number;
    total: number;
    rateLimit: RateLimitStatus;
  }) => void;
  setIsBuscando: (v: boolean) => void;
  setErro: (erro: string | null) => void;
}

export const usePesquisaStore = create<PesquisaState>((set) => ({
  termo: '',
  filtros: {},
  resultados: [],
  paginaAtual: 1,
  totalPaginas: 0,
  total: 0,
  rateLimit: null,
  isBuscando: false,
  erro: null,
  jaBuscou: false,

  setTermo: (termo) => set({ termo }),
  setFiltros: (filtros) =>
    set((state) => ({ filtros: { ...state.filtros, ...filtros } })),
  limparFiltros: () => set({ filtros: {} }),
  resetarBusca: () =>
    set({
      termo: '',
      filtros: {},
      resultados: [],
      paginaAtual: 1,
      totalPaginas: 0,
      total: 0,
      erro: null,
      jaBuscou: false,
    }),

  setResultados: ({ comunicacoes, pagina, totalPaginas, total, rateLimit }) =>
    set({
      resultados: comunicacoes,
      paginaAtual: pagina,
      totalPaginas,
      total,
      rateLimit,
      jaBuscou: true,
      erro: null,
    }),
  setIsBuscando: (isBuscando) => set({ isBuscando }),
  setErro: (erro) => set({ erro, isBuscando: false }),
}));

/**
 * Monta os params da API CNJ a partir do termo + filtros salvos.
 * Heurística do termo: se for só dígitos longos → numeroProcesso;
 * se parecer OAB (dígitos curtos) → numeroOab;
 * senão → nomeParte.
 */
export function montarParams(
  termo: string,
  filtros: PesquisaFiltros,
  pagina: number = 1,
): ConsultarComunicacoesParams {
  const params: ConsultarComunicacoesParams = {
    ...filtros,
    pagina,
    itensPorPagina: 100,
  };

  const termoLimpo = termo.trim();
  if (termoLimpo) {
    const soDigitos = termoLimpo.replace(/\D/g, '');
    if (soDigitos.length >= 15) {
      params.numeroProcesso = termoLimpo;
    } else if (/^\d{2,7}$/.test(soDigitos) && soDigitos.length >= 2) {
      params.numeroOab = soDigitos;
    } else {
      params.nomeParte = termoLimpo;
    }
  }

  return params;
}
