import { createServiceClient } from '@/lib/supabase/service-client';
import { randomBytes } from 'crypto';
import { createDocumentoFromUploadedPdf } from './documentos.service';
import type { TemplateBasico } from './data.service';
import {
  carregarDadosContrato,
  carregarPacoteContratacaoPorSegmento,
  carregarTemplatesPorUuids,
  type SegmentoDoFormulario,
} from './documentos-contratacao.service';
import { contratoParaInputData, type InputDataMapeado } from './mapeamento-contrato-input-data';

const DURACAO_PACOTE_DIAS = Number(process.env.PACOTE_DURACAO_DIAS ?? 7);

function gerarTokenCompartilhado(): string {
  return randomBytes(32).toString('hex');
}

export interface CriarPacoteInput {
  contratoId: number;
  formularioId: number;
  templatesComPdfs: Array<{ template: TemplateBasico; pdfBuffer: Buffer; titulo: string }>;
  clienteDadosSnapshot: { nome: string; cpf: string | null; email: string | null };
  userId: number | null;
  overrides?: Record<string, string>;
}

export interface CriarPacoteResult {
  status: 'criado' | 'reaproveitado';
  token: string;
  expiraEm: string;
  quantidadeDocs: number;
}

export async function criarPacote(input: CriarPacoteInput): Promise<CriarPacoteResult> {
  const supabase = createServiceClient();

  // 1. Check for existing active pacote
  const { data: existente } = await supabase
    .from('assinatura_digital_pacotes')
    .select('id, token_compartilhado, expira_em')
    .eq('contrato_id', input.contratoId)
    .eq('status', 'ativo')
    .gt('expira_em', new Date().toISOString())
    .maybeSingle();

  if (existente) {
    const { count } = await supabase
      .from('assinatura_digital_pacote_documentos')
      .select('id', { count: 'exact', head: true })
      .eq('pacote_id', existente.id);
    return {
      status: 'reaproveitado',
      token: existente.token_compartilhado,
      expiraEm: existente.expira_em,
      quantidadeDocs: count ?? 0,
    };
  }

  // 2. Create pacote
  const token = gerarTokenCompartilhado();
  const expiraEm = new Date();
  expiraEm.setDate(expiraEm.getDate() + DURACAO_PACOTE_DIAS);

  const { data: pacote, error: pacoteErr } = await supabase
    .from('assinatura_digital_pacotes')
    .insert({
      token_compartilhado: token,
      contrato_id: input.contratoId,
      formulario_id: input.formularioId,
      status: 'ativo',
      criado_por: input.userId,
      expira_em: expiraEm.toISOString(),
    })
    .select('id, token_compartilhado, expira_em')
    .single();

  if (pacoteErr || !pacote) {
    throw new Error(`Falha ao criar pacote: ${pacoteErr?.message ?? 'desconhecido'}`);
  }

  // 3. For each template: create document + assinante + junction row
  for (let i = 0; i < input.templatesComPdfs.length; i++) {
    const { pdfBuffer, titulo } = input.templatesComPdfs[i];

    const doc = await createDocumentoFromUploadedPdf({
      titulo,
      selfie_habilitada: false,
      pdfBuffer,
      created_by: input.userId,
      assinantes: [
        {
          assinante_tipo: 'cliente',
          dados_snapshot: input.clienteDadosSnapshot as unknown as Record<string, unknown>,
        },
      ],
    });

    // Link document to contrato (contrato_id isn't part of create schema)
    await supabase
      .from('assinatura_digital_documentos')
      .update({ contrato_id: input.contratoId })
      .eq('id', doc.documento.id);

    // Insert junction row
    await supabase.from('assinatura_digital_pacote_documentos').insert({
      pacote_id: pacote.id,
      documento_id: doc.documento.id,
      ordem: i + 1,
    });
  }

  return {
    status: 'criado',
    token: pacote.token_compartilhado,
    expiraEm: pacote.expira_em,
    quantidadeDocs: input.templatesComPdfs.length,
  };
}

import type {
  Pacote,
  PacoteComDocumentos,
  DocumentoNoPacote,
  PacoteStatus,
} from '../types/pacote';

export async function lerPacotePorToken(
  token: string,
): Promise<PacoteComDocumentos | null> {
  const supabase = createServiceClient();

  const { data: pacote, error } = await supabase
    .from('assinatura_digital_pacotes')
    .select('*')
    .eq('token_compartilhado', token)
    .maybeSingle();

  if (error || !pacote) return null;

  const { data: join } = await supabase
    .from('assinatura_digital_pacote_documentos')
    .select(`
      ordem,
      documento:assinatura_digital_documentos!documento_id (
        id, documento_uuid, titulo, status,
        assinantes:assinatura_digital_documento_assinantes ( id, token, concluido_em )
      )
    `)
    .eq('pacote_id', pacote.id)
    .order('ordem', { ascending: true });

  const documentos: DocumentoNoPacote[] = (join ?? []).map((row: Record<string, unknown>) => {
    const docRaw = row.documento;
    const doc = (Array.isArray(docRaw) ? docRaw[0] : docRaw) as
      | {
          id: number;
          documento_uuid: string;
          titulo: string | null;
          status: string;
          assinantes: Array<{ id: number; token: string; concluido_em: string | null }> | null;
        }
      | null
      | undefined;
    const assinantes = doc?.assinantes ?? [];
    const primeiro = assinantes[0];
    return {
      id: doc?.id ?? 0,
      documento_uuid: doc?.documento_uuid ?? '',
      titulo: doc?.titulo ?? null,
      status: doc?.status ?? 'pendente',
      ordem: row.ordem as number,
      token_assinante: primeiro?.token ?? '',
      assinado_em: primeiro?.concluido_em ?? null,
    };
  });

  const agora = new Date();
  let status_efetivo: PacoteStatus = pacote.status as PacoteStatus;
  if (new Date(pacote.expira_em).getTime() < agora.getTime()) {
    status_efetivo = 'expirado';
  } else if (
    documentos.length > 0 &&
    documentos.every((d) => d.assinado_em !== null)
  ) {
    status_efetivo = 'concluido';
  }

  return {
    pacote: pacote as Pacote,
    documentos,
    status_efetivo,
  };
}

// ---------------------------------------------------------------------------
// Hidratação completa para o wizard público
// ---------------------------------------------------------------------------

export interface PacoteWizardFormulario {
  id: number;
  formulario_uuid: string;
  nome: string;
  slug: string;
  segmento_id: number;
  foto_necessaria: boolean;
  geolocation_necessaria: boolean;
  metadados_seguranca: string[] | null;
  form_schema: unknown | null;
  termos_html: string | null;
}

export interface PacoteParaWizard {
  pacote: Pacote;
  status_efetivo: PacoteStatus;
  documentos: DocumentoNoPacote[];

  /** Dados hidratáveis — presentes apenas quando status_efetivo === 'ativo'. */
  hidratacao: {
    contrato: { id: number; segmento_id: number; cliente_id: number };
    inputData: InputDataMapeado;
    segmento: SegmentoDoFormulario;
    formulario: PacoteWizardFormulario;
    templates: TemplateBasico[];
    templateUuids: string[];
  } | null;
}

async function carregarFormularioCompleto(
  formularioId: number,
): Promise<PacoteWizardFormulario | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('assinatura_digital_formularios')
    .select(
      'id, formulario_uuid, nome, slug, segmento_id, foto_necessaria, geolocation_necessaria, metadados_seguranca, form_schema, termos_html',
    )
    .eq('id', formularioId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    formulario_uuid: data.formulario_uuid,
    nome: data.nome,
    slug: data.slug,
    segmento_id: data.segmento_id,
    foto_necessaria: data.foto_necessaria ?? true,
    geolocation_necessaria: data.geolocation_necessaria ?? false,
    metadados_seguranca: data.metadados_seguranca ?? null,
    form_schema: data.form_schema ?? null,
    termos_html: data.termos_html ?? null,
  };
}

/**
 * Leitura enriquecida do pacote para abrir o wizard público a partir do Step
 * de Visualização. Compõe `lerPacotePorToken` com os loaders de contrato,
 * pacote de templates e formulário completo, e devolve um shape pronto para
 * hidratar o `useFormularioStore` no client.
 *
 * Se o pacote não está ativo (expirado, cancelado ou já concluído), retorna
 * sem o payload de hidratação — o roteador server-side deve redirecionar
 * para os estados terminais.
 */
export async function lerPacoteParaWizard(
  token: string,
): Promise<PacoteParaWizard | null> {
  const base = await lerPacotePorToken(token);
  if (!base) return null;

  if (base.status_efetivo !== 'ativo') {
    return { ...base, hidratacao: null };
  }

  const contratoId = base.pacote.contrato_id;
  const formularioId = base.pacote.formulario_id;

  const dadosContrato = await carregarDadosContrato(contratoId);
  if (!dadosContrato || !dadosContrato.cliente || dadosContrato.contrato.segmento_id == null) {
    return { ...base, hidratacao: null };
  }

  const segmentoId = dadosContrato.contrato.segmento_id;
  const [pacoteTemplates, formulario] = await Promise.all([
    carregarPacoteContratacaoPorSegmento(segmentoId),
    carregarFormularioCompleto(formularioId),
  ]);

  if (!pacoteTemplates || !formulario) {
    return { ...base, hidratacao: null };
  }

  const templates = await carregarTemplatesPorUuids(pacoteTemplates.templateUuidsUnificados);
  const inputData = contratoParaInputData(dadosContrato);

  return {
    ...base,
    hidratacao: {
      contrato: {
        id: dadosContrato.contrato.id,
        segmento_id: segmentoId,
        cliente_id: dadosContrato.contrato.cliente_id,
      },
      inputData,
      segmento: pacoteTemplates.segmento,
      formulario,
      templates,
      templateUuids: pacoteTemplates.templateUuidsUnificados,
    },
  };
}
