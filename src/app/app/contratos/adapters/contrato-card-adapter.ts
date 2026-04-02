/**
 * Contratos > Contrato Card Adapter
 *
 * Mapeia cada entidade Contrato (com nomes já resolvidos) para a interface
 * ContratoCardData, usada pelos componentes de listagem e kanban do dashboard.
 *
 * USO:
 *   const card = contratoToCardData(contrato, nomes, segmentos);
 */

import type { Contrato } from '../domain';
import { TIPO_CONTRATO_LABELS, TIPO_COBRANCA_LABELS } from '../domain';

// =============================================================================
// INTERFACE DE SAÍDA
// =============================================================================

export interface ContratoCardData {
  id: number;
  /** Nome do cliente principal do contrato */
  cliente: string;
  /** Tipo de pessoa do cliente inferido pelo nome */
  clienteTipo: 'pf' | 'pj';
  /** Nome da parte contrária, se houver */
  parteContraria?: string;
  /** Label do tipo de contrato (ex: "Ajuizamento") */
  tipo: string;
  /** Label do tipo de cobrança (ex: "Pró-Êxito") */
  cobranca: string;
  /** Nome do segmento (ex: "Trabalhista") */
  segmento: string;
  /** Status do contrato (StatusContrato) */
  status: string;
  /** Valor financeiro — 0 até integração com módulo financeiro */
  valor: number;
  /** Data de cadastro formatada (ISO string) */
  cadastradoEm: string;
  /** Nome do responsável */
  responsavel: string;
  /** Dias desde a última mudança de estágio (ou desde criação) */
  diasNoEstagio: number;
  /** Quantidade de processos vinculados ao contrato */
  processosVinculados: number;
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Infere se uma entidade é PJ a partir de indicadores comuns no nome.
 * Fallback: 'pf'.
 */
function inferirClienteTipo(nome: string): 'pf' | 'pj' {
  if (!nome) return 'pf';
  const nomeMaiusculo = nome.toUpperCase();
  const indicadoresPJ = [
    'LTDA',
    'S/A',
    'S.A',
    'ME ',
    'EPP',
    'EIRELI',
    'S/C',
    'S.C',
    'ASSOCIACAO',
    'ASSOCIAÇÃO',
    'FUNDACAO',
    'FUNDAÇÃO',
    'COOPERATIVA',
    'CIA',
    'INC',
    'CORP',
  ];
  for (const indicador of indicadoresPJ) {
    if (nomeMaiusculo.includes(indicador)) return 'pj';
  }
  return 'pf';
}

/**
 * Calcula dias desde a última entrada no statusHistorico (ou desde createdAt).
 */
function calcularDiasNoEstagio(contrato: Contrato): number {
  try {
    let referencia: string | null = null;

    if (contrato.statusHistorico && contrato.statusHistorico.length > 0) {
      // statusHistorico pode vir em ordem descendente (changed_at DESC) — pegar o mais recente
      const ordenado = [...contrato.statusHistorico].sort(
        (a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime(),
      );
      referencia = ordenado[0]?.changedAt ?? null;
    }

    if (!referencia) {
      referencia = contrato.createdAt;
    }

    const dataReferencia = new Date(referencia);
    if (isNaN(dataReferencia.getTime())) return 0;

    const agora = new Date();
    const diffMs = agora.getTime() - dataReferencia.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  } catch {
    return 0;
  }
}

// =============================================================================
// ADAPTER PRINCIPAL
// =============================================================================

/**
 * Mapeia um Contrato com nomes resolvidos para ContratoCardData.
 *
 * @param contrato - Objeto Contrato retornado pelo repositório
 * @param nomes - Maps de ID → nome para clientes, partes contrárias e usuários
 * @param segmentos - Map de segmentoId → nome do segmento
 */
export function contratoToCardData(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contrato: any,
  nomes: {
    clientes: Map<number, string>;
    partesContrarias: Map<number, string>;
    usuarios: Map<number, string>;
  },
  segmentos: Map<number, string>,
): ContratoCardData {
  const c = contrato as Contrato;

  // ── Cliente ──────────────────────────────────────────────────────────────
  let clienteNome =
    nomes.clientes.get(c.clienteId) ?? `Cliente #${c.clienteId}`;

  // Fallback: tentar achar parte com papel 'autora' no array de partes
  if (!nomes.clientes.has(c.clienteId) && Array.isArray(c.partes)) {
    const parteAutora = c.partes.find(
      (p: { papelContratual: string; nomeSnapshot: string | null }) =>
        p.papelContratual === 'autora' && p.nomeSnapshot,
    );
    if (parteAutora?.nomeSnapshot) {
      clienteNome = parteAutora.nomeSnapshot;
    }
  }

  const clienteTipo = inferirClienteTipo(clienteNome);

  // ── Parte Contrária ───────────────────────────────────────────────────────
  let parteContraria: string | undefined;

  if (Array.isArray(c.partes)) {
    const parteRe = c.partes.find(
      (p: { papelContratual: string; tipoEntidade: string; entidadeId: number; nomeSnapshot: string | null }) =>
        p.papelContratual === 're',
    );

    if (parteRe) {
      if (parteRe.tipoEntidade === 'parte_contraria') {
        parteContraria =
          nomes.partesContrarias.get(parteRe.entidadeId) ??
          parteRe.nomeSnapshot ??
          `Parte Contrária #${parteRe.entidadeId}`;
      } else if (parteRe.tipoEntidade === 'cliente') {
        parteContraria =
          nomes.clientes.get(parteRe.entidadeId) ??
          parteRe.nomeSnapshot ??
          `Cliente #${parteRe.entidadeId}`;
      }
    }
  }

  // ── Tipo e Cobrança ───────────────────────────────────────────────────────
  const tipo = TIPO_CONTRATO_LABELS[c.tipoContrato] ?? c.tipoContrato ?? '--';
  const cobranca = TIPO_COBRANCA_LABELS[c.tipoCobranca] ?? c.tipoCobranca ?? '--';

  // ── Segmento ─────────────────────────────────────────────────────────────
  const segmento =
    c.segmentoId != null
      ? (segmentos.get(c.segmentoId) ?? `Segmento #${c.segmentoId}`)
      : '--';

  // ── Responsável ───────────────────────────────────────────────────────────
  const responsavel =
    c.responsavelId != null
      ? (nomes.usuarios.get(c.responsavelId) ?? `Usuário #${c.responsavelId}`)
      : '--';

  // ── Métricas ──────────────────────────────────────────────────────────────
  const diasNoEstagio = calcularDiasNoEstagio(c);
  const processosVinculados = Array.isArray(c.processos) ? c.processos.length : 0;

  return {
    id: c.id,
    cliente: clienteNome,
    clienteTipo,
    parteContraria,
    tipo,
    cobranca,
    segmento,
    status: c.status,
    valor: 0, // sem integração financeira ainda
    cadastradoEm: c.cadastradoEm ?? c.createdAt ?? '',
    responsavel,
    diasNoEstagio,
    processosVinculados,
  };
}
