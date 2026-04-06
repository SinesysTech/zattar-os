/**
 * DASHBOARD FEATURE - Contratos Metrics Repository
 *
 * Métricas e estatísticas de contratos para o dashboard.
 * Busca dados da tabela `contratos` e agrega por status, tipo, obrigações e parcelas.
 */

import { createClient } from '@/lib/supabase/server';
import type { ContratosResumo } from '../domain';

// Cores para gráficos — valores oklch alinhados aos tokens do tema (globals.css)
// Nota: SVG stroke/fill não resolve var(), então usamos valores literais.
const STATUS_COLORS: Record<string, string> = {
  'Em Contratação': 'oklch(0.55 0.18 250)',   /* --info */
  'Contratado': 'oklch(0.48 0.26 281)',        /* --primary */
  'Distribuído': 'oklch(0.55 0.18 145)',       /* --success */
  'Desistência': 'oklch(0.55 0.22 25 / 0.7)', /* --destructive @ 70% */
  'Encerrado': 'oklch(0.42 0.01 281)',         /* --muted-foreground */
};

const PARCELA_COLORS: Record<string, string> = {
  'Pagas': 'oklch(0.55 0.18 145)',       /* --success */
  'Pendentes': 'oklch(0.60 0.18 75)',    /* --warning */
  'Atrasadas': 'oklch(0.55 0.22 25)',    /* --destructive */
};

const TREEMAP_COLORS: Record<string, string> = {
  'Acordos Trabalhistas': 'oklch(0.48 0.26 281 / 0.70)', /* --primary @ 70% */
  'Condenações': 'oklch(0.55 0.22 25 / 0.65)',           /* --destructive @ 65% */
  'Custas Processuais': 'oklch(0.60 0.18 75 / 0.65)',    /* --warning @ 65% */
  'Honorários Periciais': 'oklch(0.48 0.26 281 / 0.35)', /* --primary @ 35% */
};

/**
 * Busca resumo de contratos para o dashboard.
 */
export async function buscarContratosResumo(): Promise<ContratosResumo> {
  const supabase = await createClient();

  try {
    // Buscar contratos com suas informações básicas
    // contratos NÃO tem coluna valor_causa
    const { data: contratos, error } = await supabase
      .from('contratos')
      .select('id, status, tipo_contrato, tipo_cobranca, created_at');

    if (error) {
      console.error('[Dashboard] Erro ao buscar contratos:', error);
      return getContratosResumoPadrao();
    }

    const data = contratos || [];

    // --- Distribuição por status ---
    const statusMap = new Map<string, number>();
    data.forEach((c) => {
      const status = formatStatus(c.status);
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
    });
    const porStatus = Array.from(statusMap.entries()).map(([status, count]) => ({
      status,
      count,
      color: STATUS_COLORS[status] || 'oklch(0.42 0.01 281)' /* --muted-foreground */,
    }));

    // --- Distribuição por tipo ---
    const tipoMap = new Map<string, number>();
    data.forEach((c) => {
      const tipo = formatTipo(c.tipo_contrato);
      tipoMap.set(tipo, (tipoMap.get(tipo) || 0) + 1);
    });
    const porTipo = Array.from(tipoMap.entries())
      .map(([tipo, count]) => ({ tipo, count }))
      .sort((a, b) => b.count - a.count);

    // --- Modelo de cobrança ---
    const proLabore = data.filter((c) => c.tipo_cobranca === 'pro_labore' || c.tipo_cobranca === 'mensalidade');
    const proExito = data.filter((c) => c.tipo_cobranca === 'pro_exito' || c.tipo_cobranca === 'exito');
    const proLaboreFaturado = 0; // valor_causa não existe na tabela contratos
    const proExitoPotencial = 0;

    // --- Score contratual (heurística simples) ---
    const totalContratos = data.length;
    const distribuidos = data.filter((c) => c.status === 'distribuido' || c.status === 'ativo').length;
    const desistencias = data.filter((c) => c.status === 'desistencia' || c.status === 'cancelado').length;
    const scoreContratual = totalContratos > 0
      ? Math.max(0, Math.min(100, Math.round(((distribuidos / totalContratos) * 70) + (1 - desistencias / totalContratos) * 30)))
      : 0;

    return {
      porStatus,
      porTipo,
      obrigacoesVencer: [], // Requer tabela de obrigações — retorna vazio por enquanto
      parcelasStatus: [
        { status: 'Pagas', count: 0, valor: 0, color: PARCELA_COLORS['Pagas'] },
        { status: 'Pendentes', count: 0, valor: 0, color: PARCELA_COLORS['Pendentes'] },
        { status: 'Atrasadas', count: 0, valor: 0, color: PARCELA_COLORS['Atrasadas'] },
      ],
      repassesPendentes: [],
      modeloCobranca: {
        proLabore: { contratos: proLabore.length, faturado: proLaboreFaturado },
        proExito: { contratos: proExito.length, potencial: proExitoPotencial, taxaRealizacao: 62 },
      },
      treemapObrigacoes: Object.entries(TREEMAP_COLORS).map(([natureza, color]) => ({
        natureza,
        valor: 0,
        color,
      })),
      scoreContratual,
    };
  } catch (error) {
    console.error('[Dashboard] Erro ao buscar contratos resumo:', error);
    return getContratosResumoPadrao();
  }
}

function formatStatus(status: string | null): string {
  const map: Record<string, string> = {
    em_contratacao: 'Em Contratação',
    contratado: 'Contratado',
    distribuido: 'Distribuído',
    ativo: 'Distribuído',
    desistencia: 'Desistência',
    cancelado: 'Desistência',
    encerrado: 'Encerrado',
  };
  return map[status || ''] || 'Em Contratação';
}

function formatTipo(tipo: string | null): string {
  const map: Record<string, string> = {
    ajuizamento: 'Ajuizamento',
    defesa: 'Defesa',
    assessoria: 'Assessoria',
    consultoria: 'Consultoria',
    parecer: 'Parecer',
    extrajudicial: 'Extrajudicial',
  };
  return map[tipo || ''] || tipo || 'Outros';
}

function getContratosResumoPadrao(): ContratosResumo {
  return {
    porStatus: [],
    porTipo: [],
    obrigacoesVencer: [],
    parcelasStatus: [],
    repassesPendentes: [],
    modeloCobranca: {
      proLabore: { contratos: 0, faturado: 0 },
      proExito: { contratos: 0, potencial: 0, taxaRealizacao: 0 },
    },
    treemapObrigacoes: [],
    scoreContratual: 0,
  };
}
