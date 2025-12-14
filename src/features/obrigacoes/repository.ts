import { createServiceClient } from "@/lib/supabase/service-client";
import {
  AcordoComParcelas,
  AcordoCondenacao,
  AcordosCondenacoesPaginado,
  AtualizarAcordoParams,
  AtualizarParcelaParams,
  CriarAcordoComParcelasParams,
  DirecaoPagamento,
  FiltrosRepasses,
  FormaDistribuicao,
  FormaPagamento,
  ListarAcordosParams,
  Parcela,
  RepassePendente,
  StatusAcordo,
  StatusParcela,
  StatusRepasse,
  TipoObrigacao,
} from "./types";

// --- Types Mappers ---

interface AcordoDB {
  id: number;
  processo_id: number;
  tipo: TipoObrigacao;
  direcao: DirecaoPagamento;
  valor_total: number;
  data_vencimento_primeira_parcela: string;
  status: StatusAcordo;
  numero_parcelas: number;
  forma_distribuicao: FormaDistribuicao | null;
  percentual_escritorio: number;
  percentual_cliente: number;
  honorarios_sucumbenciais_total: number;
  created_at: string;
  updated_at: string;
  created_by: string;
}

interface ParcelaDB {
  id: number;
  acordo_condenacao_id: number;
  numero_parcela: number;
  valor_bruto_credito_principal: number;
  honorarios_contratuais: number;
  honorarios_sucumbenciais: number;
  valor_repasse_cliente: number;
  data_vencimento: string;
  data_efetivacao: string | null;
  status: StatusParcela;
  forma_pagamento: FormaPagamento | null;
  status_repasse: StatusRepasse;
  editado_manualmente: boolean;
  arquivo_declaracao_prestacao_contas: string | null;
  data_declaracao_anexada: string | null;
  arquivo_comprovante_repasse: string | null;
  data_repasse: string | null;
  usuario_repasse_id: number | null;
  created_at: string;
  updated_at: string;
  dados_pagamento: Record<string, unknown> | null;
}

interface RepassePendenteDB {
  parcela_id: number;
  acordo_condenacao_id: number;
  numero_parcela: number;
  valor_bruto_credito_principal: number;
  valor_repasse_cliente: number;
  status_repasse: StatusRepasse;
  data_efetivacao: string;
  arquivo_declaracao_prestacao_contas: string | null;
  data_declaracao_anexada: string | null;
  processo_id: number;
  tipo: TipoObrigacao;
  acordo_valor_total: number;
  percentual_cliente: number;
  acordo_numero_parcelas: number;
}

interface AcervoDB {
  id: number;
  trt: string;
  grau: number;
  numero_processo: string;
  classe_judicial: string;
  descricao_orgao_julgador: string;
  nome_parte_autora: string;
  nome_parte_re: string;
}

function mapAcordo(db: AcordoDB): AcordoCondenacao {
  return {
    id: db.id,
    processoId: db.processo_id,
    tipo: db.tipo,
    direcao: db.direcao,
    valorTotal: db.valor_total,
    dataVencimentoPrimeiraParcela: db.data_vencimento_primeira_parcela,
    status: db.status,
    numeroParcelas: db.numero_parcelas,
    formaDistribuicao: db.forma_distribuicao,
    percentualEscritorio: db.percentual_escritorio || 0,
    percentualCliente: db.percentual_cliente || 0,
    honorariosSucumbenciaisTotal: db.honorarios_sucumbenciais_total || 0,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
    createdBy: db.created_by,
  };
}

function mapParcela(db: ParcelaDB): Parcela {
  return {
    id: db.id,
    acordoCondenacaoId: db.acordo_condenacao_id,
    numeroParcela: db.numero_parcela,
    valorBrutoCreditoPrincipal: db.valor_bruto_credito_principal,
    honorariosContratuais: db.honorarios_contratuais || 0,
    honorariosSucumbenciais: db.honorarios_sucumbenciais || 0,
    valorRepasseCliente: db.valor_repasse_cliente,
    dataVencimento: db.data_vencimento,
    dataEfetivacao: db.data_efetivacao,
    status: db.status,
    formaPagamento: db.forma_pagamento,
    statusRepasse: db.status_repasse,
    editadoManualmente: db.editado_manualmente,
    declaracaoPrestacaoContasUrl: db.arquivo_declaracao_prestacao_contas,
    dataDeclaracaoAnexada: db.data_declaracao_anexada,
    comprovanteRepasseUrl: db.arquivo_comprovante_repasse,
    dataRepasse: db.data_repasse,
    usuarioRepasseId: db.usuario_repasse_id,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
    dadosPagamento: db.dados_pagamento,
  };
}

function mapRepassePendente(db: RepassePendenteDB): RepassePendente {
  return {
    parcelaId: db.parcela_id,
    acordoCondenacaoId: db.acordo_condenacao_id,
    numeroParcela: db.numero_parcela,
    valorBrutoCreditoPrincipal: Number(db.valor_bruto_credito_principal),
    valorRepasseCliente: Number(db.valor_repasse_cliente),
    statusRepasse: db.status_repasse,
    dataEfetivacao: db.data_efetivacao,
    arquivoDeclaracaoPrestacaoContas: db.arquivo_declaracao_prestacao_contas,
    dataDeclaracaoAnexada: db.data_declaracao_anexada,
    processoId: db.processo_id,
    tipo: db.tipo,
    acordoValorTotal: Number(db.acordo_valor_total),
    percentualCliente: Number(db.percentual_cliente),
    acordoNumeroParcelas: db.acordo_numero_parcelas,
  };
}

// --- Acordos Repository ---

export async function criarAcordo(
  params: Omit<
    CriarAcordoComParcelasParams,
    "formaPagamentoPadrao" | "intervaloEntreParcelas"
  > & { createdBy?: string }
) {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("acordos_condenacoes")
    .insert({
      processo_id: params.processoId,
      tipo: params.tipo,
      direcao: params.direcao,
      valor_total: params.valorTotal,
      data_vencimento_primeira_parcela: params.dataVencimentoPrimeiraParcela,
      numero_parcelas: params.numeroParcelas,
      forma_distribuicao: params.formaDistribuicao || null,
      percentual_escritorio: params.percentualEscritorio || 30.0,
      honorarios_sucumbenciais_total: params.honorariosSucumbenciaisTotal || 0,
      created_by: params.createdBy || null,
    })
    .select()
    .single();

  if (error) throw error;
  return mapAcordo(data);
}

interface AcordoJoinResult extends AcordoDB {
  parcelas?: ParcelaDB[];
  acervo?: AcervoDB;
}

export async function listarAcordos(
  params: ListarAcordosParams
): Promise<AcordosCondenacoesPaginado> {
  const supabase = createServiceClient();
  const pagina = params.pagina || 1;
  const limite = params.limite || 50;
  const offset = (pagina - 1) * limite;

  let query = supabase.from("acordos_condenacoes").select(
    `
      *,
      parcelas(*),
      acervo!acordos_condenacoes_processo_id_fkey (
        id, trt, grau, numero_processo, classe_judicial, 
        descricao_orgao_julgador, nome_parte_autora, nome_parte_re
      )
    `,
    { count: "exact" }
  );

  if (params.processoId) query = query.eq("processo_id", params.processoId);
  if (params.tipo) query = query.eq("tipo", params.tipo);
  if (params.direcao) query = query.eq("direcao", params.direcao);
  if (params.status) query = query.eq("status", params.status);
  if (params.dataInicio)
    query = query.gte("data_vencimento_primeira_parcela", params.dataInicio);
  if (params.dataFim)
    query = query.lte("data_vencimento_primeira_parcela", params.dataFim);

  // Busca textual em número do processo e nomes de partes
  if (params.busca) {
    query = query.or(
      `acervo.numero_processo.ilike.%${params.busca}%,acervo.nome_parte_autora.ilike.%${params.busca}%,acervo.nome_parte_re.ilike.%${params.busca}%`
    );
  }

  query = query
    .order("created_at", { ascending: false })
    .range(offset, offset + limite - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  const acordos = ((data as unknown as AcordoJoinResult[]) || []).map(
    (item) => {
      const acordo = mapAcordo(item);
      const parcelas = (item.parcelas || []).map(mapParcela);
      const parcelasPagas = parcelas.filter((p: Parcela) =>
        ["recebida", "paga"].includes(p.status)
      ).length;

      // Processo mapping
      const processo = item.acervo
        ? {
            id: item.acervo.id,
            trt: item.acervo.trt,
            grau: item.acervo.grau.toString(), // Ensure string if DB returns number or string
            numero_processo: item.acervo.numero_processo,
            classe_judicial: item.acervo.classe_judicial,
            descricao_orgao_julgador: item.acervo.descricao_orgao_julgador,
            nome_parte_autora: item.acervo.nome_parte_autora,
            nome_parte_re: item.acervo.nome_parte_re,
          }
        : null;

      return {
        ...acordo,
        parcelas,
        totalParcelas: parcelas.length,
        parcelasPagas,
        parcelasPendentes: parcelas.length - parcelasPagas,
        processo,
      };
    }
  );

  return {
    acordos,
    total: count || 0,
    pagina,
    limite,
    totalPaginas: Math.ceil((count || 0) / limite),
  };
}

/**
 * Helper para Portal do Cliente: lista acordos de múltiplos processos (sem paginação).
 *
 * Mantém o mesmo shape de `AcordoComParcelas` usado em `listarAcordos`.
 */
export async function listarAcordosPorProcessoIds(
  processoIds: number[]
): Promise<AcordoComParcelas[]> {
  if (!processoIds || processoIds.length === 0) return [];

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("acordos_condenacoes")
    .select(
      `
      *,
      parcelas(*),
      acervo!acordos_condenacoes_processo_id_fkey (
        id, trt, grau, numero_processo, classe_judicial, 
        descricao_orgao_julgador, nome_parte_autora, nome_parte_re
      )
    `
    )
    .in("processo_id", processoIds)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return ((data as unknown as AcordoJoinResult[]) || []).map((item) => {
    const acordo = mapAcordo(item);
    const parcelas = (item.parcelas || []).map(mapParcela);
    const parcelasPagas = parcelas.filter((p: Parcela) =>
      ["recebida", "paga"].includes(p.status)
    ).length;

    const processo = item.acervo
      ? {
          id: item.acervo.id,
          trt: item.acervo.trt,
          grau: item.acervo.grau.toString(),
          numero_processo: item.acervo.numero_processo,
          classe_judicial: item.acervo.classe_judicial,
          descricao_orgao_julgador: item.acervo.descricao_orgao_julgador,
          nome_parte_autora: item.acervo.nome_parte_autora,
          nome_parte_re: item.acervo.nome_parte_re,
        }
      : null;

    return {
      ...acordo,
      parcelas,
      totalParcelas: parcelas.length,
      parcelasPagas,
      parcelasPendentes: parcelas.length - parcelasPagas,
      processo,
    };
  });
}

export async function buscarAcordoPorId(
  id: number
): Promise<AcordoComParcelas | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("acordos_condenacoes")
    .select(
      `
      *,
      parcelas(*),
      acervo!acordos_condenacoes_processo_id_fkey (*)
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  // Cast specific for single result
  const item = data as unknown as AcordoJoinResult;

  const acordo = mapAcordo(item);
  const parcelas = (item.parcelas || []).map(mapParcela);
  // Sort parcelas by number
  parcelas.sort((a: Parcela, b: Parcela) => a.numeroParcela - b.numeroParcela);

  const parcelasPagas = parcelas.filter((p: Parcela) =>
    ["recebida", "paga"].includes(p.status)
  ).length;

  return {
    ...acordo,
    parcelas,
    totalParcelas: parcelas.length,
    parcelasPagas,
    parcelasPendentes: parcelas.length - parcelasPagas,
    processo: item.acervo
      ? {
          id: item.acervo.id,
          trt: item.acervo.trt,
          grau: item.acervo.grau.toString(),
          numero_processo: item.acervo.numero_processo,
          classe_judicial: item.acervo.classe_judicial,
          descricao_orgao_julgador: item.acervo.descricao_orgao_julgador,
          nome_parte_autora: item.acervo.nome_parte_autora,
          nome_parte_re: item.acervo.nome_parte_re,
        }
      : null,
  };
}

export async function atualizarAcordo(
  id: number,
  dados: AtualizarAcordoParams
) {
  const supabase = createServiceClient();
  const updateData: Record<string, unknown> = {};
  if (dados.valorTotal !== undefined) updateData.valor_total = dados.valorTotal;
  if (dados.dataVencimentoPrimeiraParcela)
    updateData.data_vencimento_primeira_parcela =
      dados.dataVencimentoPrimeiraParcela;
  if (dados.percentualEscritorio !== undefined)
    updateData.percentual_escritorio = dados.percentualEscritorio;
  if (dados.honorariosSucumbenciaisTotal !== undefined)
    updateData.honorarios_sucumbenciais_total =
      dados.honorariosSucumbenciaisTotal;
  if (dados.formaDistribuicao !== undefined)
    updateData.forma_distribuicao = dados.formaDistribuicao;
  if (dados.status) updateData.status = dados.status;

  const { data, error } = await supabase
    .from("acordos_condenacoes")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return mapAcordo(data);
}

export async function deletarAcordo(id: number) {
  const supabase = createServiceClient();

  // Check for paid parcels
  const { data: parcelas } = await supabase
    .from("parcelas")
    .select("status")
    .eq("acordo_condenacao_id", id);

  if (
    parcelas &&
    parcelas.some((p: { status: string }) =>
      ["recebida", "paga"].includes(p.status)
    )
  ) {
    throw new Error(
      "Não é possível deletar acordo com parcelas já pagas/recebidas"
    );
  }

  const { error } = await supabase
    .from("acordos_condenacoes")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// --- Parcelas Repository ---

export async function criarParcelas(parcelas: Partial<Parcela>[]) {
  const supabase = createServiceClient();

  const parcelasInsert = parcelas.map((p) => ({
    acordo_condenacao_id: p.acordoCondenacaoId,
    numero_parcela: p.numeroParcela,
    valor_bruto_credito_principal: p.valorBrutoCreditoPrincipal,
    honorarios_sucumbenciais: p.honorariosSucumbenciais || 0,
    data_vencimento: p.dataVencimento,
    forma_pagamento: p.formaPagamento,
    editado_manualmente: p.editadoManualmente || false,
  }));

  const { data, error } = await supabase
    .from("parcelas")
    .insert(parcelasInsert)
    .select();
  if (error) throw error;
  return (data || []).map(mapParcela);
}

export async function buscarParcelaPorId(id: number): Promise<Parcela | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("parcelas")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return mapParcela(data);
}

export async function atualizarParcela(
  id: number,
  dados: AtualizarParcelaParams
) {
  const supabase = createServiceClient();
  const updateData: Record<string, unknown> = {};

  if (dados.valorBrutoCreditoPrincipal !== undefined)
    updateData.valor_bruto_credito_principal = dados.valorBrutoCreditoPrincipal;
  if (dados.honorariosSucumbenciais !== undefined)
    updateData.honorarios_sucumbenciais = dados.honorariosSucumbenciais;
  if (dados.dataVencimento) updateData.data_vencimento = dados.dataVencimento;
  if (dados.formaPagamento) updateData.forma_pagamento = dados.formaPagamento;
  if (dados.status) updateData.status = dados.status;

  const { data, error } = await supabase
    .from("parcelas")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return mapParcela(data);
}

export async function marcarParcelaComoRecebida(
  id: number,
  dados: { dataEfetivacao: string; valor?: number }
) {
  const supabase = createServiceClient();
  const updateData: Record<string, unknown> = {
    status: "recebida",
    data_efetivacao: dados.dataEfetivacao,
  };

  // Se um valorRecebido foi fornecido e difere do previsto, atualizar valor_bruto_credito_principal
  if (dados.valor !== undefined) {
    updateData.valor_bruto_credito_principal = dados.valor;
  }

  const { data, error } = await supabase
    .from("parcelas")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return mapParcela(data);
}

export async function deletarParcelasDoAcordo(acordoId: number) {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("parcelas")
    .delete()
    .eq("acordo_condenacao_id", acordoId);
  if (error) throw error;
}

export async function buscarParcelasPorAcordo(
  acordoId: number
): Promise<Parcela[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("parcelas")
    .select("*")
    .eq("acordo_condenacao_id", acordoId)
    .order("numero_parcela");

  if (error) throw error;
  return (data || []).map(mapParcela);
}

// --- Repasses Repository ---

export async function listarRepassesPendentes(
  filtros: FiltrosRepasses = {}
): Promise<RepassePendente[]> {
  const supabase = createServiceClient();
  let query = supabase.from("repasses_pendentes").select("*");

  if (filtros.statusRepasse)
    query = query.eq("status_repasse", filtros.statusRepasse);
  if (filtros.processoId) query = query.eq("processo_id", filtros.processoId);
  if (filtros.dataInicio)
    query = query.gte("data_efetivacao", filtros.dataInicio);
  if (filtros.dataFim) query = query.lte("data_efetivacao", filtros.dataFim);
  if (filtros.valorMinimo !== undefined)
    query = query.gte("valor_repasse_cliente", filtros.valorMinimo);
  if (filtros.valorMaximo !== undefined)
    query = query.lte("valor_repasse_cliente", filtros.valorMaximo);

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map(mapRepassePendente);
}

export async function anexarDeclaracaoPrestacaoContas(
  parcelaId: number,
  url: string
) {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("parcelas")
    .update({
      arquivo_declaracao_prestacao_contas: url,
      data_declaracao_anexada: new Date().toISOString(),
      status_repasse: "pendente_transferencia",
    })
    .eq("id", parcelaId);

  if (error) throw error;
}

export async function registrarRepasse(
  parcelaId: number,
  dados: { arquivoComprovantePath: string; usuarioRepasseId: number }
) {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("parcelas")
    .update({
      arquivo_comprovante_repasse: dados.arquivoComprovantePath,
      data_repasse: new Date().toISOString(),
      usuario_repasse_id: dados.usuarioRepasseId,
      status_repasse: "repassado",
    })
    .eq("id", parcelaId);

  if (error) throw error;
}

export const ObrigacoesRepository = {
  criarAcordo,
  listarAcordos,
  buscarAcordoPorId,
  atualizarAcordo,
  deletarAcordo,
  criarParcelas,
  buscarParcelaPorId,
  atualizarParcela,
  marcarParcelaComoRecebida,
  deletarParcelasDoAcordo,
  buscarParcelasPorAcordo,
  listarRepassesPendentes,
  anexarDeclaracaoPrestacaoContas,
  registrarRepasse,
};
