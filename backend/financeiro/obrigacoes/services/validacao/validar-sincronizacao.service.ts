/**
 * Serviço de Validação para Sincronização de Obrigações
 * Valida regras de negócio antes da sincronização entre acordos e sistema financeiro
 *
 * Validações implementadas:
 * - Existência de entidades (acordo, parcela, lançamento)
 * - Estados permitidos para sincronização
 * - Integridade de dados (valores, datas)
 * - Configurações necessárias (conta contábil padrão)
 */

import { createServiceClient } from '@/backend/utils/supabase/service-client';

// ============================================================================
// Types de Validação
// ============================================================================

export type TipoValidacao =
  | 'acordo_existe'
  | 'acordo_status_valido'
  | 'parcela_existe'
  | 'parcela_status_valido'
  | 'valores_validos'
  | 'datas_validas'
  | 'conta_contabil_existe'
  | 'lancamento_pode_ser_criado'
  | 'lancamento_pode_ser_atualizado'
  | 'usuario_autorizado';

export type SeveridadeValidacao = 'erro' | 'aviso' | 'info';

export interface ResultadoValidacao {
  tipo: TipoValidacao;
  valido: boolean;
  severidade: SeveridadeValidacao;
  mensagem: string;
  detalhes?: Record<string, unknown>;
}

export interface ValidacaoCompleta {
  valido: boolean;
  podeProsseguir: boolean;
  erros: ResultadoValidacao[];
  avisos: ResultadoValidacao[];
  info: ResultadoValidacao[];
  totalValidacoes: number;
  tempoValidacao: number;
}

export interface ValidarSincronizacaoParams {
  acordoId?: number;
  parcelaId?: number;
  forcar?: boolean;
  validarPermissoes?: boolean;
  usuarioId?: string;
}

// ============================================================================
// Funções de Validação Individuais
// ============================================================================

/**
 * Valida se o acordo existe e retorna seus dados
 */
const validarAcordoExiste = async (
  acordoId: number
): Promise<ResultadoValidacao & { dados?: Record<string, unknown> }> => {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('acordos_condenacoes')
    .select('id, tipo, direcao, valor_total, numero_parcelas, status, created_by, processo_id')
    .eq('id', acordoId)
    .single();

  if (error || !data) {
    return {
      tipo: 'acordo_existe',
      valido: false,
      severidade: 'erro',
      mensagem: `Acordo ${acordoId} não encontrado no sistema`,
    };
  }

  return {
    tipo: 'acordo_existe',
    valido: true,
    severidade: 'info',
    mensagem: `Acordo ${acordoId} encontrado (${data.tipo} - ${data.direcao})`,
    dados: data,
  };
};

/**
 * Valida se o status do acordo permite sincronização
 */
const validarAcordoStatus = (
  status: string,
  forcar: boolean = false
): ResultadoValidacao => {
  const statusBloqueados = ['cancelado'];
  const statusAlerta = ['pago_total'];

  if (statusBloqueados.includes(status)) {
    return {
      tipo: 'acordo_status_valido',
      valido: false,
      severidade: 'erro',
      mensagem: `Acordo com status "${status}" não pode ser sincronizado`,
      detalhes: { status, bloqueado: true },
    };
  }

  if (statusAlerta.includes(status) && !forcar) {
    return {
      tipo: 'acordo_status_valido',
      valido: true,
      severidade: 'aviso',
      mensagem: `Acordo já está ${status}. Sincronização pode sobrescrever dados existentes`,
      detalhes: { status, alertar: true },
    };
  }

  return {
    tipo: 'acordo_status_valido',
    valido: true,
    severidade: 'info',
    mensagem: `Status "${status}" permite sincronização`,
    detalhes: { status },
  };
};

/**
 * Valida se a parcela existe e retorna seus dados
 */
const validarParcelaExiste = async (
  parcelaId: number
): Promise<ResultadoValidacao & { dados?: Record<string, unknown> }> => {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('parcelas_acordos_condenacoes')
    .select(`
      id,
      acordo_condenacao_id,
      numero_parcela,
      valor_bruto_credito_principal,
      honorarios_sucumbenciais,
      honorarios_contratuais,
      data_vencimento,
      data_efetivacao,
      status,
      forma_pagamento
    `)
    .eq('id', parcelaId)
    .single();

  if (error || !data) {
    return {
      tipo: 'parcela_existe',
      valido: false,
      severidade: 'erro',
      mensagem: `Parcela ${parcelaId} não encontrada`,
    };
  }

  return {
    tipo: 'parcela_existe',
    valido: true,
    severidade: 'info',
    mensagem: `Parcela ${parcelaId} encontrada (${data.numero_parcela})`,
    dados: data,
  };
};

/**
 * Valida se o status da parcela permite sincronização
 */
const validarParcelaStatus = (
  status: string,
  forcar: boolean = false
): ResultadoValidacao => {
  const statusSincronizaveis = ['recebida', 'paga'];
  const statusPendentes = ['pendente', 'atrasado'];

  if (statusSincronizaveis.includes(status)) {
    return {
      tipo: 'parcela_status_valido',
      valido: true,
      severidade: 'info',
      mensagem: `Parcela com status "${status}" está pronta para sincronização`,
      detalhes: { status, pronta: true },
    };
  }

  if (statusPendentes.includes(status)) {
    if (forcar) {
      return {
        tipo: 'parcela_status_valido',
        valido: true,
        severidade: 'aviso',
        mensagem: `Parcela ainda está "${status}" - sincronização forçada criará lançamento pendente`,
        detalhes: { status, forcado: true },
      };
    }

    return {
      tipo: 'parcela_status_valido',
      valido: true,
      severidade: 'info',
      mensagem: `Parcela "${status}" será ignorada (não efetivada)`,
      detalhes: { status, ignorar: true },
    };
  }

  // Status inesperado
  return {
    tipo: 'parcela_status_valido',
    valido: false,
    severidade: 'erro',
    mensagem: `Status de parcela "${status}" não reconhecido`,
    detalhes: { status },
  };
};

/**
 * Valida se os valores da parcela são válidos para sincronização
 */
const validarValoresParcela = (
  valorPrincipal: number,
  honorariosSucumbenciais: number | null,
  honorariosContratuais: number | null
): ResultadoValidacao => {
  const erros: string[] = [];

  if (valorPrincipal <= 0) {
    erros.push('Valor principal deve ser maior que zero');
  }

  if (honorariosSucumbenciais !== null && honorariosSucumbenciais < 0) {
    erros.push('Honorários sucumbenciais não podem ser negativos');
  }

  if (honorariosContratuais !== null && honorariosContratuais < 0) {
    erros.push('Honorários contratuais não podem ser negativos');
  }

  const valorTotal = valorPrincipal + (honorariosSucumbenciais || 0);
  if (valorTotal <= 0) {
    erros.push('Valor total para sincronização deve ser maior que zero');
  }

  if (erros.length > 0) {
    return {
      tipo: 'valores_validos',
      valido: false,
      severidade: 'erro',
      mensagem: erros.join('; '),
      detalhes: { valorPrincipal, honorariosSucumbenciais, honorariosContratuais, valorTotal },
    };
  }

  return {
    tipo: 'valores_validos',
    valido: true,
    severidade: 'info',
    mensagem: `Valores válidos (total: ${valorTotal.toFixed(2)})`,
    detalhes: { valorPrincipal, honorariosSucumbenciais, honorariosContratuais, valorTotal },
  };
};

/**
 * Valida se as datas são válidas e consistentes
 */
const validarDatasParcela = (
  dataVencimento: string,
  dataEfetivacao: string | null
): ResultadoValidacao => {
  const avisos: string[] = [];

  // Verificar se data de vencimento é válida
  const vencimento = new Date(dataVencimento);
  if (isNaN(vencimento.getTime())) {
    return {
      tipo: 'datas_validas',
      valido: false,
      severidade: 'erro',
      mensagem: 'Data de vencimento inválida',
      detalhes: { dataVencimento },
    };
  }

  // Verificar se efetivação é anterior ao vencimento (aviso, não erro)
  if (dataEfetivacao) {
    const efetivacao = new Date(dataEfetivacao);
    if (isNaN(efetivacao.getTime())) {
      return {
        tipo: 'datas_validas',
        valido: false,
        severidade: 'erro',
        mensagem: 'Data de efetivação inválida',
        detalhes: { dataVencimento, dataEfetivacao },
      };
    }

    // Efetivação muito antes do vencimento pode ser erro de cadastro
    const diasAntecipacao = Math.floor((vencimento.getTime() - efetivacao.getTime()) / (1000 * 60 * 60 * 24));
    if (diasAntecipacao > 365) {
      avisos.push(`Efetivação ${diasAntecipacao} dias antes do vencimento`);
    }
  }

  // Vencimento muito no futuro
  const hoje = new Date();
  const diasFuturo = Math.floor((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
  if (diasFuturo > 3650) { // 10 anos
    avisos.push('Data de vencimento muito distante (> 10 anos)');
  }

  if (avisos.length > 0) {
    return {
      tipo: 'datas_validas',
      valido: true,
      severidade: 'aviso',
      mensagem: avisos.join('; '),
      detalhes: { dataVencimento, dataEfetivacao },
    };
  }

  return {
    tipo: 'datas_validas',
    valido: true,
    severidade: 'info',
    mensagem: 'Datas válidas',
    detalhes: { dataVencimento, dataEfetivacao },
  };
};

/**
 * Valida se existe conta contábil padrão para o tipo de lançamento
 */
const validarContaContabil = async (
  tipoLancamento: 'receita' | 'despesa'
): Promise<ResultadoValidacao> => {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('plano_contas')
    .select('id, codigo, nome')
    .eq('tipo_conta', tipoLancamento)
    .eq('aceita_lancamento', true)
    .eq('ativo', true)
    .order('codigo', { ascending: true })
    .limit(1)
    .single();

  if (error || !data) {
    return {
      tipo: 'conta_contabil_existe',
      valido: false,
      severidade: 'erro',
      mensagem: `Nenhuma conta contábil padrão ativa para ${tipoLancamento}. Configure uma conta que aceite lançamentos.`,
      detalhes: { tipoLancamento },
    };
  }

  return {
    tipo: 'conta_contabil_existe',
    valido: true,
    severidade: 'info',
    mensagem: `Conta contábil padrão: ${data.codigo} - ${data.nome}`,
    detalhes: { contaId: data.id, codigo: data.codigo, nome: data.nome },
  };
};

/**
 * Valida se lançamento já existe (para decidir entre criar/atualizar)
 */
const validarLancamentoExistente = async (
  parcelaId: number,
  forcar: boolean = false
): Promise<ResultadoValidacao & { lancamentoId?: number }> => {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('lancamentos_financeiros')
    .select('id, status, valor')
    .eq('parcela_id', parcelaId)
    .single();

  if (error || !data) {
    return {
      tipo: 'lancamento_pode_ser_criado',
      valido: true,
      severidade: 'info',
      mensagem: 'Nenhum lançamento vinculado - será criado novo',
    };
  }

  // Lançamento existe
  const statusBloqueados = ['estornado', 'cancelado'];

  if (statusBloqueados.includes(data.status) && !forcar) {
    return {
      tipo: 'lancamento_pode_ser_atualizado',
      valido: false,
      severidade: 'erro',
      mensagem: `Lançamento ${data.id} está ${data.status}. Use forçar=true para recriar.`,
      detalhes: { lancamentoId: data.id, status: data.status },
      lancamentoId: data.id,
    };
  }

  if (forcar) {
    return {
      tipo: 'lancamento_pode_ser_atualizado',
      valido: true,
      severidade: 'aviso',
      mensagem: `Lançamento ${data.id} será atualizado (forçado)`,
      detalhes: { lancamentoId: data.id, status: data.status },
      lancamentoId: data.id,
    };
  }

  return {
    tipo: 'lancamento_pode_ser_atualizado',
    valido: true,
    severidade: 'info',
    mensagem: `Lançamento ${data.id} já existe - será ignorado`,
    detalhes: { lancamentoId: data.id, status: data.status, ignorar: true },
    lancamentoId: data.id,
  };
};

// ============================================================================
// Funções de Validação Compostas
// ============================================================================

/**
 * Executa validação completa antes de sincronizar uma parcela
 */
export const validarSincronizacaoParcela = async (
  parcelaId: number,
  forcar: boolean = false
): Promise<ValidacaoCompleta> => {
  const inicio = Date.now();
  const resultados: ResultadoValidacao[] = [];

  // 1. Validar parcela existe
  const parcelaResult = await validarParcelaExiste(parcelaId);
  resultados.push(parcelaResult);

  if (!parcelaResult.valido) {
    return criarResultadoValidacao(resultados, Date.now() - inicio);
  }

  const parcela = parcelaResult.dados as {
    acordo_condenacao_id: number;
    valor_bruto_credito_principal: number;
    honorarios_sucumbenciais: number | null;
    honorarios_contratuais: number | null;
    data_vencimento: string;
    data_efetivacao: string | null;
    status: string;
  };

  // 2. Validar acordo existe
  const acordoResult = await validarAcordoExiste(parcela.acordo_condenacao_id);
  resultados.push(acordoResult);

  if (!acordoResult.valido) {
    return criarResultadoValidacao(resultados, Date.now() - inicio);
  }

  const acordo = acordoResult.dados as { status: string; direcao: 'recebimento' | 'pagamento' };

  // 3. Validar status do acordo
  const acordoStatusResult = validarAcordoStatus(acordo.status, forcar);
  resultados.push(acordoStatusResult);

  if (!acordoStatusResult.valido) {
    return criarResultadoValidacao(resultados, Date.now() - inicio);
  }

  // 4. Validar status da parcela
  const parcelaStatusResult = validarParcelaStatus(parcela.status, forcar);
  resultados.push(parcelaStatusResult);

  // 5. Validar valores
  const valoresResult = validarValoresParcela(
    parcela.valor_bruto_credito_principal,
    parcela.honorarios_sucumbenciais,
    parcela.honorarios_contratuais
  );
  resultados.push(valoresResult);

  // 6. Validar datas
  const datasResult = validarDatasParcela(parcela.data_vencimento, parcela.data_efetivacao);
  resultados.push(datasResult);

  // 7. Validar conta contábil
  const tipoLancamento = acordo.direcao === 'recebimento' ? 'receita' : 'despesa';
  const contaResult = await validarContaContabil(tipoLancamento);
  resultados.push(contaResult);

  // 8. Validar lançamento existente
  const lancamentoResult = await validarLancamentoExistente(parcelaId, forcar);
  resultados.push(lancamentoResult);

  return criarResultadoValidacao(resultados, Date.now() - inicio);
};

/**
 * Executa validação completa antes de sincronizar um acordo inteiro
 */
export const validarSincronizacaoAcordo = async (
  acordoId: number,
  forcar: boolean = false
): Promise<ValidacaoCompleta> => {
  const inicio = Date.now();
  const resultados: ResultadoValidacao[] = [];

  // 1. Validar acordo existe
  const acordoResult = await validarAcordoExiste(acordoId);
  resultados.push(acordoResult);

  if (!acordoResult.valido) {
    return criarResultadoValidacao(resultados, Date.now() - inicio);
  }

  const acordo = acordoResult.dados as { status: string; direcao: 'recebimento' | 'pagamento'; numero_parcelas: number };

  // 2. Validar status do acordo
  const acordoStatusResult = validarAcordoStatus(acordo.status, forcar);
  resultados.push(acordoStatusResult);

  if (!acordoStatusResult.valido) {
    return criarResultadoValidacao(resultados, Date.now() - inicio);
  }

  // 3. Validar conta contábil
  const tipoLancamento = acordo.direcao === 'recebimento' ? 'receita' : 'despesa';
  const contaResult = await validarContaContabil(tipoLancamento);
  resultados.push(contaResult);

  // 4. Verificar parcelas existentes
  const supabase = createServiceClient();
  const { data: parcelas, error: parcelasError } = await supabase
    .from('parcelas_acordos_condenacoes')
    .select('id')
    .eq('acordo_condenacao_id', acordoId);

  if (parcelasError) {
    resultados.push({
      tipo: 'parcela_existe',
      valido: false,
      severidade: 'erro',
      mensagem: `Erro ao buscar parcelas: ${parcelasError.message}`,
    });
    return criarResultadoValidacao(resultados, Date.now() - inicio);
  }

  if (!parcelas || parcelas.length === 0) {
    resultados.push({
      tipo: 'parcela_existe',
      valido: true,
      severidade: 'aviso',
      mensagem: 'Acordo não possui parcelas cadastradas',
      detalhes: { totalParcelas: 0 },
    });
  } else {
    resultados.push({
      tipo: 'parcela_existe',
      valido: true,
      severidade: 'info',
      mensagem: `${parcelas.length} parcela(s) encontrada(s)`,
      detalhes: { totalParcelas: parcelas.length },
    });
  }

  return criarResultadoValidacao(resultados, Date.now() - inicio);
};

// ============================================================================
// Helpers
// ============================================================================

/**
 * Agrupa resultados e cria objeto final de validação
 */
const criarResultadoValidacao = (
  resultados: ResultadoValidacao[],
  tempoValidacao: number
): ValidacaoCompleta => {
  const erros = resultados.filter(r => r.severidade === 'erro');
  const avisos = resultados.filter(r => r.severidade === 'aviso');
  const info = resultados.filter(r => r.severidade === 'info');

  const todosValidos = erros.filter(e => !e.valido).length === 0;
  const temErrosCriticos = erros.some(e => !e.valido);

  return {
    valido: todosValidos,
    podeProsseguir: !temErrosCriticos,
    erros,
    avisos,
    info,
    totalValidacoes: resultados.length,
    tempoValidacao,
  };
};

/**
 * Formata resultado de validação para log
 */
export const formatarResultadoValidacao = (resultado: ValidacaoCompleta): string => {
  const linhas: string[] = [];

  linhas.push(`=== Validação de Sincronização ===`);
  linhas.push(`Resultado: ${resultado.valido ? 'VÁLIDO' : 'INVÁLIDO'}`);
  linhas.push(`Pode prosseguir: ${resultado.podeProsseguir ? 'SIM' : 'NÃO'}`);
  linhas.push(`Total validações: ${resultado.totalValidacoes}`);
  linhas.push(`Tempo: ${resultado.tempoValidacao}ms`);

  if (resultado.erros.length > 0) {
    linhas.push(`\nERROS (${resultado.erros.length}):`);
    resultado.erros.forEach(e => linhas.push(`  [${e.tipo}] ${e.mensagem}`));
  }

  if (resultado.avisos.length > 0) {
    linhas.push(`\nAVISOS (${resultado.avisos.length}):`);
    resultado.avisos.forEach(a => linhas.push(`  [${a.tipo}] ${a.mensagem}`));
  }

  return linhas.join('\n');
};
