/**
 * Serviço de Validação de Obrigações (integração com financeiro)
 *
 * Este serviço valida pré-condições antes de sincronizar parcelas/acordos
 * com lançamentos financeiros. Os testes unitários da pasta `tests/unit/financeiro`
 * definem o contrato esperado (tipos de validação, severidades e mensagens).
 */

import { createServiceClient } from '@/lib/supabase/service-client';
import type { PostgrestError } from '@supabase/supabase-js';

export type SeveridadeValidacao = 'erro' | 'aviso' | 'info';

export type TipoValidacao =
  | 'parcela_existe'
  | 'acordo_existe'
  | 'acordo_status_valido'
  | 'parcela_status_valido'
  | 'valores_validos'
  | 'conta_contabil_existe'
  | 'lancamento_pode_ser_criado'
  | 'lancamento_pode_ser_atualizado';

export interface ItemValidacao {
  tipo: TipoValidacao;
  valido: boolean;
  severidade: SeveridadeValidacao;
  mensagem: string;
  detalhes?: Record<string, unknown>;
}

export interface ResultadoValidacao {
  valido: boolean;
  podeProsseguir: boolean;
  erros: ItemValidacao[];
  avisos: ItemValidacao[];
  info: ItemValidacao[];
  totalValidacoes: number;
  tempoValidacao: number;
}

type ParcelaDb = {
  id: number;
  acordo_condenacao_id: number;
  numero_parcela: number;
  valor_bruto_credito_principal: number;
  honorarios_sucumbenciais: number | null;
  honorarios_contratuais: number | null;
  data_vencimento: string;
  data_efetivacao: string | null;
  status: string;
  forma_pagamento: string | null;
};

type AcordoDb = {
  id: number;
  tipo: string;
  direcao: string;
  valor_total: number;
  numero_parcelas: number;
  status: string;
  created_by: string | null;
  processo_id: number;
};

function nowMs(): number {
  // node/jest geralmente tem `performance`, mas garantimos fallback.
  const perf = globalThis.performance;
  if (perf && typeof perf.now === 'function') return perf.now();
  return Date.now();
}

function initResultado(): ResultadoValidacao {
  return {
    valido: true,
    podeProsseguir: true,
    erros: [],
    avisos: [],
    info: [],
    totalValidacoes: 0,
    tempoValidacao: 0,
  };
}

function pushItem(resultado: ResultadoValidacao, item: ItemValidacao): void {
  if (item.severidade === 'erro') resultado.erros.push(item);
  else if (item.severidade === 'aviso') resultado.avisos.push(item);
  else resultado.info.push(item);
}

function finalizeResultado(resultado: ResultadoValidacao, start: number): ResultadoValidacao {
  resultado.totalValidacoes = resultado.erros.length + resultado.avisos.length + resultado.info.length;
  resultado.valido = resultado.erros.length === 0;
  // Se houver erro, nunca pode prosseguir
  if (!resultado.valido) resultado.podeProsseguir = false;
  resultado.tempoValidacao = Math.max(0, Math.round(nowMs() - start));
  return resultado;
}

function codigoContaContabilPadrao(tipoLancamento: 'receita' | 'despesa'): string {
  // Mantém alinhado com `services/obrigacoes-integracao.ts`
  return tipoLancamento === 'receita' ? '4.1.01' : '3.1.01';
}

async function buscarContaContabilPadraoId(tipoLancamento: 'receita' | 'despesa'): Promise<number | null> {
  const supabase = createServiceClient();
  const codigo = codigoContaContabilPadrao(tipoLancamento);

  const { data, error } = await supabase
    .from('plano_contas')
    .select('id, codigo, nome')
    .eq('codigo', codigo)
    .order('id')
    .limit(1)
    .single();

  if (error || !data) return null;
  return (data as unknown as { id: number }).id;
}

type LancamentoExistenteRow = { id: number; status: string | null; valor: number | null };

async function buscarLancamentoExistente(
  parcelaId: number
): Promise<{ id: number; status?: string; valor?: number } | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('lancamentos_financeiros')
    .select('id, status, valor')
    .eq('parcela_id', parcelaId)
    .eq('origem', 'acordo_judicial')
    .single();

  // Supabase retorna PGRST116 quando não encontra
  if (error && (error as PostgrestError).code === 'PGRST116') return null;
  if (error || !data) return null;
  const row = data as unknown as LancamentoExistenteRow;
  return {
    id: row.id,
    status: row.status ?? undefined,
    valor: row.valor ?? undefined,
  };
}

/**
 * Valida pré-condições para sincronizar uma parcela.
 */
export async function validarSincronizacaoParcela(parcelaId: number, forcar: boolean = false): Promise<ResultadoValidacao> {
  const start = nowMs();
  const resultado = initResultado();

  const supabase = createServiceClient();

  // 1) Parcela existe?
  const { data: parcela, error: parcelaError } = await supabase
    .from('parcelas')
    .select('*')
    .eq('id', parcelaId)
    .single();

  if (parcelaError || !parcela) {
    pushItem(resultado, {
      tipo: 'parcela_existe',
      valido: false,
      severidade: 'erro',
      mensagem: 'Parcela não encontrada',
    });
    return finalizeResultado(resultado, start);
  }

  pushItem(resultado, {
    tipo: 'parcela_existe',
    valido: true,
    severidade: 'info',
    mensagem: 'Parcela encontrada',
  });

  const parcelaDb = parcela as ParcelaDb;

  // 2) Acordo existe?
  const { data: acordo, error: acordoError } = await supabase
    .from('acordos_condenacoes')
    .select('*')
    .eq('id', parcelaDb.acordo_condenacao_id)
    .single();

  if (acordoError || !acordo) {
    pushItem(resultado, {
      tipo: 'acordo_existe',
      valido: false,
      severidade: 'erro',
      mensagem: 'Acordo não encontrado',
    });
    return finalizeResultado(resultado, start);
  }

  pushItem(resultado, {
    tipo: 'acordo_existe',
    valido: true,
    severidade: 'info',
    mensagem: 'Acordo encontrado',
  });

  const acordoDb = acordo as AcordoDb;

  // 3) Status do acordo
  if (acordoDb.status === 'cancelado') {
    pushItem(resultado, {
      tipo: 'acordo_status_valido',
      valido: false,
      severidade: 'erro',
      mensagem: 'Acordo está cancelado',
    });
    return finalizeResultado(resultado, start);
  }

  if (acordoDb.status === 'pago_total') {
    pushItem(resultado, {
      tipo: 'acordo_status_valido',
      valido: true,
      severidade: 'aviso',
      mensagem: 'Acordo já está pago total',
    });
  } else {
    pushItem(resultado, {
      tipo: 'acordo_status_valido',
      valido: true,
      severidade: 'info',
      mensagem: 'Status do acordo permite sincronização',
    });
  }

  // 4) Status da parcela
  if (parcelaDb.status === 'pendente' && !forcar) {
    pushItem(resultado, {
      tipo: 'parcela_status_valido',
      valido: true,
      severidade: 'info',
      mensagem: 'Parcela pendente: sincronização não aplicável sem forçar',
      detalhes: { ignorar: true },
    });
    resultado.podeProsseguir = false;
    return finalizeResultado(resultado, start);
  }

  if (parcelaDb.status === 'pendente' && forcar) {
    pushItem(resultado, {
      tipo: 'parcela_status_valido',
      valido: true,
      severidade: 'aviso',
      mensagem: 'Parcela pendente: sincronização forçada',
      detalhes: { forcado: true },
    });
  } else {
    pushItem(resultado, {
      tipo: 'parcela_status_valido',
      valido: true,
      severidade: 'info',
      mensagem: 'Status da parcela permite sincronização',
    });
  }

  // 5) Valores
  if (!parcelaDb.valor_bruto_credito_principal || parcelaDb.valor_bruto_credito_principal <= 0) {
    pushItem(resultado, {
      tipo: 'valores_validos',
      valido: false,
      severidade: 'erro',
      mensagem: 'Valor principal inválido (zero ou negativo)',
    });
    return finalizeResultado(resultado, start);
  }

  pushItem(resultado, {
    tipo: 'valores_validos',
    valido: true,
    severidade: 'info',
    mensagem: 'Valores da parcela são válidos',
  });

  // 6) Conta contábil padrão
  const tipoLancamento: 'receita' | 'despesa' = acordoDb.direcao === 'recebimento' ? 'receita' : 'despesa';
  const contaContabilId = await buscarContaContabilPadraoId(tipoLancamento);

  if (!contaContabilId) {
    pushItem(resultado, {
      tipo: 'conta_contabil_existe',
      valido: false,
      severidade: 'erro',
      mensagem: 'Conta contábil padrão não configurada',
    });
    return finalizeResultado(resultado, start);
  }

  pushItem(resultado, {
    tipo: 'conta_contabil_existe',
    valido: true,
    severidade: 'info',
    mensagem: 'Conta contábil padrão encontrada',
  });

  // 7) Lançamento existente?
  const lancamento = await buscarLancamentoExistente(parcelaId);
  if (lancamento) {
    if (!forcar) {
      pushItem(resultado, {
        tipo: 'lancamento_pode_ser_atualizado',
        valido: true,
        severidade: 'info',
        mensagem: 'Lançamento já existe para esta parcela',
        detalhes: { ignorar: true, lancamentoId: lancamento.id },
      });
      resultado.podeProsseguir = false;
      return finalizeResultado(resultado, start);
    }

    pushItem(resultado, {
      tipo: 'lancamento_pode_ser_atualizado',
      valido: true,
      severidade: 'aviso',
      mensagem: 'Lançamento existente será atualizado (forçado)',
      detalhes: { atualizar: true, lancamentoId: lancamento.id },
    });
    return finalizeResultado(resultado, start);
  }

  pushItem(resultado, {
    tipo: 'lancamento_pode_ser_criado',
    valido: true,
    severidade: 'info',
    mensagem: 'Nenhum lançamento encontrado: será criado',
    detalhes: { criar: true },
  });

  return finalizeResultado(resultado, start);
}

/**
 * Valida pré-condições para sincronizar um acordo (todas as parcelas).
 */
export async function validarSincronizacaoAcordo(acordoId: number): Promise<ResultadoValidacao> {
  const start = nowMs();
  const resultado = initResultado();

  const supabase = createServiceClient();

  // 1) Acordo existe?
  const { data: acordo, error: acordoError } = await supabase
    .from('acordos_condenacoes')
    .select('*')
    .eq('id', acordoId)
    .single();

  if (acordoError || !acordo) {
    pushItem(resultado, {
      tipo: 'acordo_existe',
      valido: false,
      severidade: 'erro',
      mensagem: 'Acordo não encontrado',
    });
    return finalizeResultado(resultado, start);
  }

  pushItem(resultado, {
    tipo: 'acordo_existe',
    valido: true,
    severidade: 'info',
    mensagem: 'Acordo encontrado',
  });

  const acordoDb = acordo as AcordoDb;

  // 2) Status do acordo
  if (acordoDb.status === 'cancelado') {
    pushItem(resultado, {
      tipo: 'acordo_status_valido',
      valido: false,
      severidade: 'erro',
      mensagem: 'Acordo está cancelado',
    });
    return finalizeResultado(resultado, start);
  }

  pushItem(resultado, {
    tipo: 'acordo_status_valido',
    valido: true,
    severidade: 'info',
    mensagem: 'Status do acordo permite sincronização',
  });

  // 3) Conta contábil padrão
  const tipoLancamento: 'receita' | 'despesa' = acordoDb.direcao === 'recebimento' ? 'receita' : 'despesa';
  const contaContabilId = await buscarContaContabilPadraoId(tipoLancamento);

  if (!contaContabilId) {
    pushItem(resultado, {
      tipo: 'conta_contabil_existe',
      valido: false,
      severidade: 'erro',
      mensagem: 'Conta contábil padrão não configurada',
    });
    return finalizeResultado(resultado, start);
  }

  pushItem(resultado, {
    tipo: 'conta_contabil_existe',
    valido: true,
    severidade: 'info',
    mensagem: 'Conta contábil padrão encontrada',
  });

  // 4) Parcelas existem?
  const { data: parcelas, error: parcelasError } = await supabase
    .from('parcelas')
    .select('id')
    .eq('acordo_condenacao_id', acordoId);

  if (parcelasError) {
    // Se der erro aqui, consideramos como erro de validação de acordo existir/consistência.
    pushItem(resultado, {
      tipo: 'valores_validos',
      valido: false,
      severidade: 'erro',
      mensagem: 'Erro ao consultar parcelas do acordo',
    });
    return finalizeResultado(resultado, start);
  }

  if (!parcelas || parcelas.length === 0) {
    pushItem(resultado, {
      tipo: 'valores_validos',
      valido: true,
      severidade: 'aviso',
      mensagem: 'Acordo não possui parcelas para sincronizar',
    });
    resultado.podeProsseguir = true;
    return finalizeResultado(resultado, start);
  }

  pushItem(resultado, {
    tipo: 'valores_validos',
    valido: true,
    severidade: 'info',
    mensagem: `Acordo possui ${parcelas.length} parcelas`,
    detalhes: { totalParcelas: parcelas.length },
  });

  return finalizeResultado(resultado, start);
}

export function formatarResultadoValidacao(resultado: Pick<
  ResultadoValidacao,
  'valido' | 'podeProsseguir' | 'erros' | 'avisos' | 'info' | 'totalValidacoes' | 'tempoValidacao'
>): string {
  const linhas: string[] = [];

  linhas.push(`Status: ${resultado.valido ? 'VÁLIDO' : 'INVÁLIDO'}`);
  linhas.push(`Pode prosseguir: ${resultado.podeProsseguir ? 'SIM' : 'NÃO'}`);
  linhas.push(`Total validações: ${resultado.totalValidacoes}`);
  linhas.push(`Tempo: ${resultado.tempoValidacao}ms`);

  if (resultado.erros.length > 0) {
    linhas.push(`ERROS (${resultado.erros.length})`);
    for (const e of resultado.erros) linhas.push(`- ${e.mensagem}`);
  }

  if (resultado.avisos.length > 0) {
    linhas.push(`AVISOS (${resultado.avisos.length})`);
    for (const a of resultado.avisos) linhas.push(`- ${a.mensagem}`);
  }

  if (resultado.info.length > 0) {
    linhas.push(`INFO (${resultado.info.length})`);
    for (const i of resultado.info) linhas.push(`- ${i.mensagem}`);
  }

  return linhas.join('\n');
}


