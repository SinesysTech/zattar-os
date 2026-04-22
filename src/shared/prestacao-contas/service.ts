import crypto, { randomUUID } from 'crypto';
import { createServiceClient } from '@/lib/supabase/service-client';
import {
  storePrestacaoContasPdf,
  storeSignatureImage,
} from '@/shared/assinatura-digital/services/storage.service';
import { buscarTemplatePrestacaoContas } from './services/template-lookup';
import { getEscritorioConfig } from './services/escritorio-config';
import { montarContexto } from './services/contexto-builder';
import { resolveTemplate } from './services/variable-resolver';
import { gerarPdfPrestacaoContas } from './services/pdf-generator';
import { upsertDadosBancarios } from './repository';
import { TOKEN_EXPIRES_DIAS } from './constants';
import type {
  DadosBancariosInput,
  DadosBancariosSnapshot,
  LinkPrestacaoContas,
} from './types';

// =============================================================================
// Criar link (admin action)
// =============================================================================

export async function criarLinkPrestacaoContas(
  parcelaId: number,
  criadoPorUsuarioId?: number,
): Promise<LinkPrestacaoContas> {
  const supabase = createServiceClient();

  const { data: parcela, error: parcelaErr } = await supabase
    .from('parcelas')
    .select(
      `
      id, numero_parcela, status, status_repasse, valor_repasse_cliente,
      acordo_condenacao_id,
      acordos_condenacao!inner(id, processo_id)
    `,
    )
    .eq('id', parcelaId)
    .single();

  if (parcelaErr || !parcela) throw new Error('Parcela não encontrada');
  if (parcela.status !== 'recebida') throw new Error('Parcela ainda não foi recebida');
  if (parcela.status_repasse !== 'pendente_declaracao')
    throw new Error('Parcela não está pendente de declaração');
  if (!parcela.valor_repasse_cliente || Number(parcela.valor_repasse_cliente) <= 0)
    throw new Error('Parcela sem valor de repasse ao cliente');

  // Se já tem link ativo (documento criado mas não concluído), retorna o existente
  const { data: parcelaFull } = await supabase
    .from('parcelas')
    .select('documento_assinatura_id' as never)
    .eq('id', parcelaId)
    .single();

  const docExistenteId = (parcelaFull as { documento_assinatura_id?: number | null })
    ?.documento_assinatura_id;

  if (docExistenteId) {
    const { data: doc } = await supabase
      .from('assinatura_digital_documentos')
      .select('id, status')
      .eq('id', docExistenteId)
      .single();

    if (doc && doc.status !== 'concluido' && doc.status !== 'cancelado') {
      const { data: ass } = await supabase
        .from('assinatura_digital_documento_assinantes')
        .select('token, expires_at')
        .eq('documento_id', doc.id)
        .eq('status', 'pendente')
        .limit(1)
        .maybeSingle();
      if (ass) {
        return {
          url: `/prestacao-contas/${ass.token}`,
          token: ass.token,
          expiresAt: ass.expires_at ?? '',
          documentoId: doc.id,
        };
      }
    }
  }

  // Relação processo → cliente via processo_partes (polo ATIVO, tipo_entidade=cliente)
  const acordo = (parcela as unknown as { acordos_condenacao: { processo_id: number } })
    .acordos_condenacao;
  const processoId = acordo.processo_id;

  const { data: parteCliente, error: parteErr } = await supabase
    .from('processo_partes')
    .select('entidade_id')
    .eq('processo_id', processoId)
    .eq('tipo_entidade', 'cliente')
    .eq('polo', 'ATIVO')
    .limit(1)
    .maybeSingle();

  if (parteErr || !parteCliente)
    throw new Error('Cliente do processo não encontrado em processo_partes');

  const template = await buscarTemplatePrestacaoContas();
  const expiresAt = new Date(
    Date.now() + TOKEN_EXPIRES_DIAS * 24 * 60 * 60 * 1000,
  ).toISOString();
  const token = randomUUID();

  const { data: documento, error: docErr } = await supabase
    .from('assinatura_digital_documentos')
    .insert({
      titulo: 'Declaração de Prestação de Contas',
      selfie_habilitada: false,
      pdf_original_url: template.arquivoOriginal,
      status: 'pronto',
      tipo_contexto: 'prestacao_contas',
      contexto_parcela_id: parcelaId,
      template_id: template.id,
      created_by: criadoPorUsuarioId ?? null,
    } as never)
    .select('id, documento_uuid')
    .single();

  if (docErr || !documento) throw docErr ?? new Error('Falha ao criar documento');

  const { error: assErr } = await supabase
    .from('assinatura_digital_documento_assinantes')
    .insert({
      documento_id: documento.id,
      assinante_tipo: 'cliente',
      assinante_entidade_id: parteCliente.entidade_id,
      token,
      status: 'pendente',
      expires_at: expiresAt,
      dados_confirmados: false,
    } as never);

  if (assErr) throw assErr;

  await supabase
    .from('parcelas')
    .update({
      documento_assinatura_id: documento.id,
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', parcelaId);

  return {
    url: `/prestacao-contas/${token}`,
    token,
    expiresAt,
    documentoId: documento.id,
  };
}

// =============================================================================
// Cancelar link ativo (admin)
// =============================================================================

export async function cancelarLinkPrestacaoContas(parcelaId: number): Promise<void> {
  const supabase = createServiceClient();

  const { data: parcela } = await supabase
    .from('parcelas')
    .select('documento_assinatura_id' as never)
    .eq('id', parcelaId)
    .single();

  const docId = (parcela as { documento_assinatura_id?: number | null })
    ?.documento_assinatura_id;
  if (!docId) throw new Error('Parcela sem documento de assinatura vinculado');

  const { data: doc } = await supabase
    .from('assinatura_digital_documentos')
    .select('id, status')
    .eq('id', docId)
    .single();

  if (!doc) throw new Error('Documento não encontrado');
  if (doc.status === 'concluido')
    throw new Error('Documento já foi assinado — não é possível cancelar');
  if (doc.status === 'cancelado')
    throw new Error('Documento já está cancelado');

  await supabase
    .from('assinatura_digital_documentos')
    .update({ status: 'cancelado', updated_at: new Date().toISOString() } as never)
    .eq('id', docId);

  // Desvincula da parcela para permitir gerar link novo depois
  await supabase
    .from('parcelas')
    .update({
      documento_assinatura_id: null,
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', parcelaId);
}

// =============================================================================
// Carregar contexto público (server component da rota /prestacao-contas/[token])
// =============================================================================

export interface ContextoPublico {
  token: string;
  parcelaId: number;
  clienteId: number;
  clienteNome: string;
  clienteCpf: string;
  documentoId: number;
  templateMarkdown: string;
  jaAssinado: boolean;
  linkExpirado: boolean;
}

export async function carregarContextoPublico(token: string): Promise<ContextoPublico> {
  const supabase = createServiceClient();

  const { data: ass, error } = await supabase
    .from('assinatura_digital_documento_assinantes')
    .select(
      `
      id, documento_id, assinante_entidade_id, status, expires_at
    `,
    )
    .eq('token', token)
    .single();

  if (error || !ass) throw new Error('Link inválido');

  const { data: documento, error: docErr } = await supabase
    .from('assinatura_digital_documentos')
    .select('id, contexto_parcela_id, template_id, tipo_contexto' as never)
    .eq('id', ass.documento_id)
    .single();

  if (docErr || !documento) throw new Error('Documento não encontrado');

  const docRow = documento as unknown as {
    id: number;
    contexto_parcela_id: number | null;
    template_id: number | null;
    tipo_contexto: string;
  };

  if (docRow.tipo_contexto !== 'prestacao_contas')
    throw new Error('Documento não é de prestação de contas');

  const linkExpirado = !!(ass.expires_at && new Date(ass.expires_at) < new Date());

  const clienteId = ass.assinante_entidade_id;
  if (!clienteId) throw new Error('Assinante sem cliente vinculado');

  const { data: cliente, error: cliErr } = await supabase
    .from('clientes')
    .select('id, nome, cpf')
    .eq('id', clienteId)
    .single();

  if (cliErr || !cliente) throw new Error('Cliente não encontrado');
  if (!cliente.cpf) throw new Error('Cliente sem CPF cadastrado');

  let templateMarkdown = '';
  if (docRow.template_id) {
    const { data: tpl } = await supabase
      .from('assinatura_digital_templates')
      .select('conteudo_markdown')
      .eq('id', docRow.template_id)
      .single();
    templateMarkdown = tpl?.conteudo_markdown ?? '';
  }
  if (!templateMarkdown) {
    const tpl = await buscarTemplatePrestacaoContas();
    templateMarkdown = tpl.conteudoMarkdown;
  }

  if (!docRow.contexto_parcela_id) throw new Error('Documento sem parcela vinculada');

  return {
    token,
    parcelaId: docRow.contexto_parcela_id,
    clienteId,
    clienteNome: cliente.nome,
    clienteCpf: cliente.cpf.replace(/\D/g, ''),
    documentoId: docRow.id,
    templateMarkdown,
    jaAssinado: ass.status === 'concluido',
    linkExpirado,
  };
}

// =============================================================================
// Finalizar prestação de contas (public action via token)
// =============================================================================

export interface FinalizarInput {
  token: string;
  cpfConfirmado: string;
  dadosBancarios: DadosBancariosInput;
  assinaturaBase64: string;
  termosAceiteVersao: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  geolocation?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  } | null;
  dispositivoFingerprint?: Record<string, unknown> | null;
}

export interface FinalizarOutput {
  pdfUrl: string;
  protocolo: string;
}

export async function finalizarPrestacaoContas(
  input: FinalizarInput,
): Promise<FinalizarOutput> {
  const supabase = createServiceClient();

  const ctx = await carregarContextoPublico(input.token);
  if (ctx.jaAssinado) throw new Error('Este link já foi assinado');
  if (ctx.linkExpirado) throw new Error('Link expirado');
  if (ctx.clienteCpf !== input.cpfConfirmado)
    throw new Error('CPF não confere com o cadastro');

  // Busca parcela + acordo + processo com joins
  const { data: parcelaFull, error: parcErr } = await supabase
    .from('parcelas')
    .select(
      `
      id, numero_parcela,
      valor_bruto_credito_principal, honorarios_contratuais, honorarios_sucumbenciais,
      data_efetivacao, acordo_condenacao_id,
      acordos_condenacao!inner(
        id, tipo, numero_parcelas, percentual_escritorio, processo_id
      )
    `,
    )
    .eq('id', ctx.parcelaId)
    .single();

  if (parcErr || !parcelaFull) throw new Error('Parcela não encontrada');

  const acordo = (parcelaFull as unknown as {
    acordos_condenacao: {
      id: number;
      tipo: string;
      numero_parcelas: number;
      percentual_escritorio: number;
      processo_id: number;
    };
  }).acordos_condenacao;

  const { data: processo } = await supabase
    .from('acervo')
    .select('id, numero_processo, descricao_orgao_julgador')
    .eq('id', acordo.processo_id)
    .single();

  if (!processo) throw new Error('Processo não encontrado');

  // 1) Persiste dados bancários (desativa conta anterior, cria nova ativa)
  const dadosBanc = await upsertDadosBancarios(
    ctx.clienteId,
    input.dadosBancarios,
    'prestacao_contas',
  );

  // 2) Monta contexto e resolve template
  const contexto = montarContexto({
    cliente: {
      id: ctx.clienteId,
      nome: ctx.clienteNome,
      cpf: ctx.clienteCpf,
    },
    parcela: {
      id: parcelaFull.id,
      numeroParcela: parcelaFull.numero_parcela,
      valorBrutoCreditoPrincipal: Number(parcelaFull.valor_bruto_credito_principal),
      honorariosContratuais: Number(parcelaFull.honorarios_contratuais ?? 0),
      honorariosSucumbenciais: Number(parcelaFull.honorarios_sucumbenciais ?? 0),
      dataEfetivacao:
        parcelaFull.data_efetivacao ?? new Date().toISOString().slice(0, 10),
    },
    acordo: {
      id: acordo.id,
      tipo: acordo.tipo,
      numeroParcelas: acordo.numero_parcelas,
      percentualEscritorio: acordo.percentual_escritorio,
    },
    processo: {
      id: processo.id,
      numero: processo.numero_processo,
      orgaoJulgador: processo.descricao_orgao_julgador ?? '',
    },
    dadosBancarios: input.dadosBancarios,
    escritorio: getEscritorioConfig(),
    dataAssinatura: new Date().toISOString().slice(0, 10),
  });

  const markdownResolvido = resolveTemplate(ctx.templateMarkdown, contexto);
  const hashOriginal = crypto
    .createHash('sha256')
    .update(markdownResolvido)
    .digest('hex');
  const protocolo = `PC-${ctx.parcelaId}-${Date.now().toString(36).toUpperCase()}`;

  // 3) Armazena imagem da assinatura (histórico) e gera PDF
  const assinaturaArmazenada = await storeSignatureImage(input.assinaturaBase64);
  const { buffer: pdfBuffer, hashFinal } = await gerarPdfPrestacaoContas({
    markdownResolvido,
    assinaturaPngBase64: input.assinaturaBase64,
    metadados: {
      protocolo,
      dataAssinatura: contexto.data_assinatura_extenso,
      clienteNome: ctx.clienteNome,
      clienteCpf: ctx.clienteCpf,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      geolocation: input.geolocation
        ? {
            latitude: input.geolocation.latitude,
            longitude: input.geolocation.longitude,
          }
        : null,
      hashOriginal,
      termosAceiteVersao: input.termosAceiteVersao,
    },
  });

  // 4) Busca documento_uuid para compor path B2 estável
  const { data: doc } = await supabase
    .from('assinatura_digital_documentos')
    .select('documento_uuid')
    .eq('id', ctx.documentoId)
    .single();
  const uuid = doc?.documento_uuid ?? randomUUID();

  const stored = await storePrestacaoContasPdf(pdfBuffer, ctx.parcelaId, uuid);

  // 5) Snapshot imutável
  const snapshot: DadosBancariosSnapshot = {
    ...input.dadosBancarios,
    capturadoEm: new Date().toISOString(),
    dadosBancariosClienteId: dadosBanc.id,
  };

  // 6) Atualiza parcela — transiciona statusRepasse para 'pendente_transferencia'
  const { error: parcUpErr } = await supabase
    .from('parcelas')
    .update({
      arquivo_declaracao_prestacao_contas: stored.url,
      data_declaracao_anexada: new Date().toISOString(),
      dados_bancarios_snapshot: snapshot,
      status_repasse: 'pendente_transferencia',
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', ctx.parcelaId);
  if (parcUpErr) throw parcUpErr;

  // 7) Atualiza documento (hash + status + URL final)
  await supabase
    .from('assinatura_digital_documentos')
    .update({
      status: 'concluido',
      pdf_final_url: stored.url,
      hash_final_sha256: hashFinal,
      hash_original_sha256: hashOriginal,
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', ctx.documentoId);

  // 8) Atualiza assinante com metadados de auditoria
  await supabase
    .from('assinatura_digital_documento_assinantes')
    .update({
      status: 'concluido',
      concluido_em: new Date().toISOString(),
      assinatura_url: assinaturaArmazenada.url,
      ip_address: input.ipAddress,
      user_agent: input.userAgent,
      geolocation: input.geolocation ?? null,
      dados_confirmados: true,
      dados_snapshot: { dadosBancarios: snapshot },
      termos_aceite_versao: input.termosAceiteVersao,
      termos_aceite_data: new Date().toISOString(),
      dispositivo_fingerprint_raw: input.dispositivoFingerprint ?? null,
      updated_at: new Date().toISOString(),
    } as never)
    .eq('token', input.token);

  return { pdfUrl: stored.url, protocolo };
}
