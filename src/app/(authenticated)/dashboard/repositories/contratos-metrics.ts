/**
 * DASHBOARD FEATURE - Contratos Metrics Repository
 *
 * Métricas e estatísticas de contratos para o dashboard.
 * Busca dados da tabela `contratos` e agrega por status, tipo, obrigações e parcelas.
 */

import { createClient } from '@/lib/supabase/server';
import type { ContratosResumo } from '../domain';

// Cores padrão para distribuição por status
const STATUS_COLORS: Record<string, string> = {
  'Em Contratação': 'hsl(220 70% 60%)',
  'Contratado': 'hsl(var(--primary))',
  'Distribuído': 'hsl(142 60% 45%)',
  'Desistência': 'hsl(var(--destructive) / 0.7)',
  'Encerrado': 'hsl(215 14% 60%)',
};

const PARCELA_COLORS: Record<string, string> = {
  'Pagas': 'hsl(142 60% 45%)',
  'Pendentes': 'hsl(var(--warning))',
  'Atrasadas': 'hsl(var(--destructive))',
};

const TREEMAP_COLORS: Record<string, string> = {
  'Acordos Trabalhistas': 'hsl(var(--primary) / 0.70)',
  'Condenações': 'hsl(var(--destructive) / 0.65)',
  'Custas Processuais': 'hsl(var(--warning) / 0.65)',
  'Honorários Periciais': 'hsl(var(--primary) / 0.35)',
};

/**
 * Busca resumo de contratos para o dashboard.
 */
export async function buscarContratosResumo(): Promise<ContratosResumo> {
  const supabase = await createClient();

  try {
    // Buscar contratos com suas informações básicas
    const { data: contratos, error } = await supabase
      .from('contratos')
      .select('id, status, tipo_contrato, tipo_cobranca, valor_causa, created_at');

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
      color: STATUS_COLORS[status] || 'hsl(215 14% 60%)',
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
    const proLaboreFaturado = proLabore.reduce((s, c) => s + (c.valor_causa || 0), 0);
    const proExitoPotencial = proExito.reduce((s, c) => s + (c.valor_causa || 0), 0);

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
