import { compareTwoStrings } from 'string-similarity';
import type {
  TransacaoBancariaImportada,
  SugestaoConciliacao,
  ConciliarAutomaticaDTO,
  ConciliacaoResult,
} from '@/backend/types/financeiro/conciliacao-bancaria.types';
import type { LancamentoFinanceiroResumo } from '@/backend/types/financeiro/conciliacao-bancaria.types';
import {
  SCORE_CONCILIACAO_AUTOMATICA,
  SCORE_MINIMO_SUGESTOES,
  JANELA_DIAS_BUSCA_CANDIDATOS,
  MAX_SUGESTOES,
} from '@/backend/types/financeiro/conciliacao-bancaria.types';
import {
  buscarLancamentosCandidatos,
  conciliarAutomaticamentePersistence,
  listarTransacoesImportadas,
  salvarSugestoesConciliacao,
} from '../persistence/conciliacao-bancaria-persistence.service';
import { deletePattern } from '@/backend/utils/redis/cache-utils';

const DIAS_MAX_BUSCA = 30;

interface LancamentoFinanceiro extends LancamentoFinanceiroResumo {
  contaBancariaId?: number | null;
  status?: string;
}

const diferencaDias = (dataA: string, dataB: string): number => {
  const a = new Date(dataA);
  const b = new Date(dataB);
  const diffMs = Math.abs(a.getTime() - b.getTime());
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

const calcularScore = (
  transacao: TransacaoBancariaImportada,
  lancamento: LancamentoFinanceiro
) => {
  const valorDiffPercent = Math.abs(transacao.valor - Number(lancamento.valor)) / (transacao.valor || 1);
  let valorScore = 0;
  if (valorDiffPercent === 0) {
    valorScore = 40;
  } else if (valorDiffPercent < 0.05) {
    const escala = 1 - valorDiffPercent / 0.05; // 1 a 0
    valorScore = 20 + escala * 20;
  }

  const dias = diferencaDias(transacao.dataTransacao, lancamento.dataLancamento);
  let dataScore = 0;
  if (dias === 0) {
    dataScore = 30;
  } else if (dias <= JANELA_DIAS_BUSCA_CANDIDATOS) {
    const escala = 1 - dias / JANELA_DIAS_BUSCA_CANDIDATOS;
    dataScore = 10 + escala * 20;
  }

  const descricaoScoreRaw = compareTwoStrings(
    (transacao.descricao || '').toLowerCase(),
    (lancamento.descricao || '').toLowerCase()
  );
  const descricaoScore = Math.round(descricaoScoreRaw * 30);

  const total = Math.min(100, valorScore + dataScore + descricaoScore);

  const diferencas: string[] = [];
  if (valorScore < 40) {
    diferencas.push('Valor pr\u00f3ximo mas diferente');
  }
  if (dataScore < 30) {
    diferencas.push(`Data difere em ${dias} dia(s)`);
  }
  if (descricaoScore < 30) {
    diferencas.push('Descri\u00e7\u00e3o diferente');
  }

  let motivo = 'Similaridade calculada';
  if (valorScore === 40 && dataScore === 30) {
    motivo = 'Valor e data exatos';
  } else if (valorScore === 40) {
    motivo = 'Valor exato';
  } else if (dataScore === 30) {
    motivo = 'Data exata';
  }

  return {
    total,
    detalhesScore: {
      valorScore: Math.round(valorScore),
      dataScore: Math.round(dataScore),
      descricaoScore,
    },
    motivo,
    diferencas,
  };
};

export const buscarSugestoesConciliacao = (
  transacao: TransacaoBancariaImportada,
  lancamentos: LancamentoFinanceiro[],
  scoreMinimo = SCORE_MINIMO_SUGESTOES
): SugestaoConciliacao[] => {
  const candidatos = lancamentos
    .filter((l) => {
      const tipoCompat = transacao.tipoTransacao === 'credito' ? l.tipo === 'receita' : l.tipo === 'despesa';
      const dias = diferencaDias(transacao.dataTransacao, l.dataLancamento);
      return tipoCompat && dias <= DIAS_MAX_BUSCA && l.status === 'confirmado';
    })
    .map((lancamento) => {
      const scoreInfo = calcularScore(transacao, lancamento);
      return {
        lancamentoId: lancamento.id,
        lancamento,
        score: scoreInfo.total,
        motivo: scoreInfo.motivo,
        diferencas: scoreInfo.diferencas,
        detalhesScore: scoreInfo.detalhesScore,
      };
    })
    .filter((s) => s.score >= scoreMinimo)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_SUGESTOES);

  return candidatos;
};

export const conciliarAutomaticamente = async (
  params: ConciliarAutomaticaDTO
): Promise<ConciliacaoResult[]> => {
  const scoreMinimo = params.scoreMinimo ?? SCORE_MINIMO_SUGESTOES;

  const transacoes = await listarTransacoesImportadas({
    pagina: 1,
    limite: 500,
    contaBancariaId: params.contaBancariaId,
    dataInicio: params.dataInicio,
    dataFim: params.dataFim,
    statusConciliacao: 'pendente',
  });

  const resultados: ConciliacaoResult[] = [];

  for (const transacao of transacoes.items) {
    const lancamentos = await buscarLancamentosCandidatos(transacao);
    const sugestoes = buscarSugestoesConciliacao(transacao, lancamentos, scoreMinimo);
    const melhor = sugestoes[0];

    if (melhor && melhor.score >= SCORE_CONCILIACAO_AUTOMATICA) {
      const conciliacao = await conciliarAutomaticamentePersistence(
        transacao.id,
        melhor.lancamentoId,
        melhor.score
      );

      resultados.push({
        transacaoId: transacao.id,
        conciliada: true,
        score: melhor.score,
        lancamentoId: melhor.lancamentoId,
        tipoConciliacao: conciliacao.tipoConciliacao,
      });
    } else if (sugestoes.length > 0 && transacao.conciliacao?.id) {
      await salvarSugestoesConciliacao(transacao.conciliacao.id, sugestoes);
      resultados.push({
        transacaoId: transacao.id,
        conciliada: false,
        score: melhor?.score ?? null,
        lancamentoId: melhor?.lancamentoId ?? null,
        tipoConciliacao: null,
        motivo: 'Sugest\u00f5es registradas para revis\u00e3o manual',
      });
    } else {
      resultados.push({
        transacaoId: transacao.id,
        conciliada: false,
        score: null,
        lancamentoId: null,
        tipoConciliacao: null,
        motivo: 'Nenhuma sugest\u00e3o encontrada',
      });
    }
  }

  // Invalida caches ap\u00f3s execu\u00e7\u00e3o
  await deletePattern('conciliacao:*');

  return resultados;
};
