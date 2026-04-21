/**
 * Financeiro Actions — Tipos compartilhados (sem "use server").
 *
 * Centraliza as interfaces/types que antes viviam dentro de arquivos de
 * Server Actions do módulo financeiro. Next.js 16 proíbe exports
 * não-async-function em arquivos "use server".
 */

import type { PeriodoDRE, DRE } from "../domain/dre";
import type { FluxoCaixaService } from "../services/fluxo-caixa";

// ============================================================================
// DRE (dre.ts)
// ============================================================================

export interface GerarDREParams {
  dataInicio: string;
  dataFim: string;
  tipo?: PeriodoDRE;
  incluirComparativo?: boolean;
  incluirOrcado?: boolean;
}

export interface DREResult {
  dre: DRE;
  comparativo?: {
    periodoAnterior?: DRE;
    orcado?: DRE;
    variacoes?: Record<string, number>;
    variacoesOrcado?: Record<string, number>;
  };
  geradoEm: string;
}

export interface EvolucaoDREItem {
  mes: number;
  mesNome: string;
  ano: number;
  receitaLiquida: number;
  lucroOperacional: number;
  lucroLiquido: number;
  margemLiquida: number;
}

// ============================================================================
// Relatórios (relatorios.ts)
// ============================================================================

export interface RelatorioFiltros {
  dataInicio: string;
  dataFim: string;
  tipo?: "receita" | "despesa" | "todos";
  contaBancariaId?: number;
  centroCustoId?: number;
  planoContaId?: number;
  agruparPor?: "dia" | "semana" | "mes" | "categoria" | "conta";
}

export interface RelatorioExportacao {
  content: string;
  filename: string;
  contentType: string;
}

// ============================================================================
// Obrigações (obrigacoes.ts)
// ============================================================================

export interface AlertaObrigacao {
  tipo: "vencida" | "inconsistencia" | "repasse_pendente" | "sincronizacao";
  nivel: "erro" | "aviso" | "info";
  mensagem: string;
  parcelaId?: number;
  acordoId?: number;
  valor?: number;
  dataVencimento?: string;
}

export interface ResumoObrigacoesFinanceiro {
  totalVencidas: number;
  valorTotalVencido: number;
  totalPendentes: number;
  valorTotalPendente: number;
  totalRepassesPendentes: number;
  valorRepassesPendentes: number;
}

export interface ObterResumoObrigacoesResult {
  alertas: AlertaObrigacao[];
  resumo: ResumoObrigacoesFinanceiro;
}

// ============================================================================
// Lançamentos (lancamentos.ts)
// ============================================================================

import type { Lancamento, ResumoVencimentos } from "../types/lancamentos";

export interface ListarLancamentosResult {
  dados: Lancamento[];
  meta: {
    total: number;
    pagina: number;
    limite: number;
    totalPaginas: number;
  };
  resumo: ResumoVencimentos;
}

// ============================================================================
// Fluxo de Caixa (fluxo-caixa.ts)
// ============================================================================

export interface FluxoCaixaFiltros {
  dataInicio?: string;
  dataFim?: string;
  contaBancariaId?: number;
  centroCustoId?: number;
  incluirProjetado?: boolean;
}

export interface FluxoCaixaDashboard {
  saldoAtual: number;
  entradasMes: number;
  saidasMes: number;
  saldoProjetado: number;
  alertas: { tipo: "perigo" | "atencao" | "ok"; mensagem: string }[];
}

export interface FluxoCaixaResumoSegmento {
  receitas: number;
  despesas: number;
  saldo: number;
}

export interface FluxoCaixaResumo {
  realizado: FluxoCaixaResumoSegmento;
  projetado: FluxoCaixaResumoSegmento;
  total: FluxoCaixaResumoSegmento;
}

export type IndicadoresSaude = Awaited<ReturnType<typeof FluxoCaixaService.getIndicadoresSaude>>;
export type FluxoCaixaAlerta = Awaited<ReturnType<typeof FluxoCaixaService.getAlertasCaixa>>[number];
export type FluxoCaixaResumoDashboard = Awaited<ReturnType<typeof FluxoCaixaService.getResumoDashboard>>;
export type ContaBancariaResumo = Awaited<ReturnType<typeof FluxoCaixaService.listarContasBancarias>>[number];
export type CentroCustoResumo = Awaited<ReturnType<typeof FluxoCaixaService.listarCentrosCusto>>[number];

// ============================================================================
// Orçamentos (orcamentos.ts)
// ============================================================================

import type {
  PeriodoOrcamento,
  StatusOrcamento,
  AnaliseOrcamentariaItem,
  ResumoOrcamentario,
  AlertaDesvio,
  ProjecaoItem,
} from "../domain/orcamentos";

export interface ListarOrcamentosFilters {
  pagina?: number;
  limite?: number;
  busca?: string;
  ano?: number;
  periodo?: PeriodoOrcamento;
  status?: StatusOrcamento | StatusOrcamento[];
  ordenarPor?: "nome" | "ano" | "periodo" | "status" | "data_inicio" | "created_at";
  ordem?: "asc" | "desc";
}

export interface AnaliseOrcamentariaOptions {
  incluirResumo?: boolean;
  incluirAlertas?: boolean;
  incluirEvolucao?: boolean;
}

export interface AnaliseOrcamentariaUI {
  itens: AnaliseOrcamentariaItem[];
  resumo: ResumoOrcamentario | null;
  alertas: AlertaDesvio[] | null;
  evolucao: ProjecaoItem[] | null;
}

// ============================================================================
// Dashboard (dashboard.ts) — re-export from services
// ============================================================================

export type {
  DashboardFinanceiroData,
  FluxoCaixaProjetadoItem,
} from "../services/dashboard";
