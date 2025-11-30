/**
 * Utilitários para formatar dados de processos para consumo pelo Agente IA
 * Remove campos de sistema, formata datas e traduz códigos para texto legível
 */

import type {
  ProcessoClienteCpfRow,
  ProcessoRespostaIA,
  InstanciaProcessoIA,
  TimelineItemIA,
  UltimaMovimentacaoIA,
  TimelineStatus,
} from '@/backend/types/acervo/processos-cliente-cpf.types';
import {
  TRT_NOMES,
  TIPO_PARTE_NOMES,
  CLASSE_JUDICIAL_NOMES,
} from '@/backend/types/acervo/processos-cliente-cpf.types';
import type { TimelineItemEnriquecido } from '@/backend/types/pje-trt/timeline';

// ============================================================================
// Formatação de Dados
// ============================================================================

/**
 * Formata CPF para exibição (123.456.789-01)
 */
export function formatarCpf(cpf: string): string {
  const cpfLimpo = cpf.replace(/\D/g, '');
  if (cpfLimpo.length !== 11) return cpf;

  return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Formata data para DD/MM/YYYY
 */
export function formatarData(data: string | Date | null): string | null {
  if (!data) return null;

  const dateObj = typeof data === 'string' ? new Date(data) : data;
  if (isNaN(dateObj.getTime())) return null;

  const dia = dateObj.getDate().toString().padStart(2, '0');
  const mes = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const ano = dateObj.getFullYear();

  return `${dia}/${mes}/${ano}`;
}

/**
 * Formata data e hora para DD/MM/YYYY às HH:mm
 */
export function formatarDataHora(data: string | Date | null): string | null {
  if (!data) return null;

  const dateObj = typeof data === 'string' ? new Date(data) : data;
  if (isNaN(dateObj.getTime())) return null;

  const dataFormatada = formatarData(dateObj);
  const hora = dateObj.getHours().toString().padStart(2, '0');
  const minuto = dateObj.getMinutes().toString().padStart(2, '0');

  return `${dataFormatada} às ${hora}:${minuto}`;
}

/**
 * Traduz código do TRT para nome completo
 */
export function traduzirTrt(trt: string): string {
  // Normalizar: TRT3 ou trt3 -> TRT3
  const trtNormalizado = trt.toUpperCase().replace('TRT', 'TRT');
  return TRT_NOMES[trtNormalizado] || trt;
}

/**
 * Traduz tipo_parte para texto amigável
 */
export function traduzirTipoParte(tipoParte: string): string {
  return TIPO_PARTE_NOMES[tipoParte] || tipoParte;
}

/**
 * Traduz classe_judicial para texto amigável
 */
export function traduzirClasseJudicial(classe: string): string {
  return CLASSE_JUDICIAL_NOMES[classe] || classe;
}

// ============================================================================
// Formatação de Timeline
// ============================================================================

/**
 * Formata um item da timeline para resposta da IA
 *
 * O TimelineItemEnriquecido tem:
 * - data: string (ISO 8601)
 * - titulo: string (descrição do movimento/documento)
 * - documento: boolean (true = documento, false = movimento)
 * - tipo?: string (tipo do documento, se for documento)
 */
export function formatarItemTimeline(
  item: TimelineItemEnriquecido
): TimelineItemIA {
  // Para documentos, usar 'tipo' se disponível; para movimentos, usar 'titulo'
  const evento = item.documento
    ? item.tipo || 'Documento'
    : 'Movimento';

  return {
    data: formatarData(item.data) || 'Data não informada',
    evento,
    descricao: item.titulo || '',
    tem_documento: item.documento,
  };
}

/**
 * Formata a timeline completa, ordenando do mais recente para o mais antigo
 * e limitando a quantidade de itens
 */
export function formatarTimeline(
  timeline: TimelineItemEnriquecido[] | null | undefined,
  limite: number = 20
): TimelineItemIA[] {
  if (!timeline || timeline.length === 0) {
    return [];
  }

  // Ordenar do mais recente para o mais antigo
  const ordenada = [...timeline].sort((a, b) => {
    const dataA = new Date(a.data).getTime();
    const dataB = new Date(b.data).getTime();
    return dataB - dataA;
  });

  // Limitar e formatar
  return ordenada.slice(0, limite).map(formatarItemTimeline);
}

/**
 * Extrai a última movimentação da timeline
 */
export function extrairUltimaMovimentacao(
  timeline: TimelineItemIA[]
): UltimaMovimentacaoIA | null {
  if (timeline.length === 0) return null;

  const ultima = timeline[0]; // Já está ordenada do mais recente
  return {
    data: ultima.data,
    evento: ultima.evento,
  };
}

// ============================================================================
// Agrupamento de Processos
// ============================================================================

/**
 * Agrupa registros por numero_processo (mesmo processo pode ter múltiplas instâncias)
 */
export interface ProcessoAgrupado {
  numero_processo: string;
  trt: string;
  classe_judicial: string;
  nome_parte_autora: string;
  nome_parte_re: string;
  segredo_justica: boolean;
  tipo_parte: string;
  polo: string;
  instancias: {
    primeiro_grau: ProcessoClienteCpfRow | null;
    segundo_grau: ProcessoClienteCpfRow | null;
  };
}

/**
 * Agrupa processos por numero_processo
 */
export function agruparProcessosPorNumero(
  processos: ProcessoClienteCpfRow[]
): ProcessoAgrupado[] {
  const mapa = new Map<string, ProcessoAgrupado>();

  for (const processo of processos) {
    const key = processo.numero_processo;

    if (!mapa.has(key)) {
      mapa.set(key, {
        numero_processo: processo.numero_processo,
        trt: processo.trt,
        classe_judicial: processo.classe_judicial,
        nome_parte_autora: processo.nome_parte_autora,
        nome_parte_re: processo.nome_parte_re,
        segredo_justica: processo.segredo_justica,
        tipo_parte: processo.tipo_parte,
        polo: processo.polo,
        instancias: {
          primeiro_grau: null,
          segundo_grau: null,
        },
      });
    }

    const agrupado = mapa.get(key)!;

    if (processo.grau === 'primeiro_grau') {
      agrupado.instancias.primeiro_grau = processo;
    } else if (processo.grau === 'segundo_grau') {
      agrupado.instancias.segundo_grau = processo;
    }
  }

  return Array.from(mapa.values());
}

// ============================================================================
// Formatação Final para API
// ============================================================================

/**
 * Formata uma instância do processo para a resposta
 */
export function formatarInstancia(
  instancia: ProcessoClienteCpfRow | null
): InstanciaProcessoIA | null {
  if (!instancia) return null;

  return {
    vara: instancia.descricao_orgao_julgador,
    data_inicio: formatarData(instancia.data_autuacao) || 'Não informada',
    proxima_audiencia: formatarDataHora(instancia.data_proxima_audiencia),
  };
}

/**
 * Opções adicionais para formatação do processo
 */
export interface FormatarProcessoOpcoes {
  timelineStatus?: TimelineStatus;
  timelineMensagem?: string;
}

/**
 * Formata um processo agrupado com suas timelines para a resposta da API
 */
export function formatarProcessoParaIA(
  agrupado: ProcessoAgrupado,
  timelinePrimeiroGrau: TimelineItemIA[],
  timelineSegundoGrau: TimelineItemIA[],
  opcoes?: FormatarProcessoOpcoes
): ProcessoRespostaIA {
  // Combinar timelines e ordenar
  const timelineCombinada = [...timelinePrimeiroGrau, ...timelineSegundoGrau]
    .sort((a, b) => {
      // Converter DD/MM/YYYY para Date para ordenação
      const parseData = (str: string) => {
        const [dia, mes, ano] = str.split('/').map(Number);
        return new Date(ano, mes - 1, dia).getTime();
      };
      return parseData(b.data) - parseData(a.data);
    })
    .slice(0, 30); // Limitar a 30 itens no total

  // Determinar parte contrária (inverso do polo do cliente)
  const parteContraria = agrupado.polo === 'ATIVO'
    ? agrupado.nome_parte_re
    : agrupado.nome_parte_autora;

  // Determinar status da timeline
  // Se foi passado explicitamente, usar. Caso contrário, inferir pela presença de timeline
  const timelineStatus: TimelineStatus = opcoes?.timelineStatus
    ?? (timelineCombinada.length > 0 ? 'disponivel' : 'indisponivel');

  const resultado: ProcessoRespostaIA = {
    numero: agrupado.numero_processo,
    tipo: traduzirClasseJudicial(agrupado.classe_judicial),
    papel_cliente: traduzirTipoParte(agrupado.tipo_parte),
    parte_contraria: parteContraria,
    tribunal: traduzirTrt(agrupado.trt),
    sigilo: agrupado.segredo_justica,
    instancias: {
      primeiro_grau: formatarInstancia(agrupado.instancias.primeiro_grau),
      segundo_grau: formatarInstancia(agrupado.instancias.segundo_grau),
    },
    timeline: timelineCombinada,
    timeline_status: timelineStatus,
    ultima_movimentacao: extrairUltimaMovimentacao(timelineCombinada),
  };

  // Adicionar mensagem apenas se não disponível
  if (opcoes?.timelineMensagem && timelineStatus !== 'disponivel') {
    resultado.timeline_mensagem = opcoes.timelineMensagem;
  }

  return resultado;
}
