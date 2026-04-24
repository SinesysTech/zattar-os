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
}

/**
 * Motivo diagnóstico quando `hidratacao` retorna null em um pacote 'ativo'.
 * Exposto para aparecer apenas em desenvolvimento, facilitando triagem quando
 * um link recém-gerado leva à tela "Pacote indisponível".
 */
export type MotivoHidratacaoBloqueada =
  | 'contrato_nao_encontrado'
  | 'contrato_sem_cliente'
  | 'contrato_sem_segmento'
  | 'segmento_sem_formulario_contrato'
  | 'formulario_nao_encontrado';

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

  /** Preenchido só quando hidratacao === null por inconsistência da config. */
  motivoHidratacaoBloqueada?: MotivoHidratacaoBloqueada;

  /** IDs relevantes p/ diagnóstico em dev (contrato, segmento, formulário). */
  debugContexto?: {
    contratoId: number | null;
    segmentoId: number | null;
    formularioId: number | null;
  };
}

/**
 * A coluna `metadados_seguranca` é `TEXT` no banco guardando JSON como string
 * (ex: `'["ip","user_agent"]'`). O schema canônico (ver production_schema.sql
 * linha 4678) é `text DEFAULT '["ip","user_agent"]'::text`. Interpretamos aqui
 * para devolver uma lista tipada ao wizard, que espera `MetadadoSeguranca[]`.
 */
function parseMetadadosSeguranca(raw: unknown): string[] | null {
  if (raw == null) return null;
  if (Array.isArray(raw)) return raw.filter((x): x is string => typeof x === 'string');
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : null;
    } catch {
      return null;
    }
  }
  return null;
}

async function carregarFormularioCompleto(
  formularioId: number,
): Promise<PacoteWizardFormulario | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('assinatura_digital_formularios')
    .select(
      'id, formulario_uuid, nome, slug, segmento_id, ativo, foto_necessaria, geolocation_necessaria, metadados_seguranca, form_schema',
    )
    .eq('id', formularioId)
    .maybeSingle();

  if (error) {
    console.warn('[pacote.service] carregarFormularioCompleto: erro no select', {
      formularioId,
      message: error.message,
      code: error.code,
    });
    return null;
  }
  if (!data) {
    console.warn('[pacote.service] carregarFormularioCompleto: linha inexistente', { formularioId });
    return null;
  }
  if (data.ativo === false) {
    console.warn('[pacote.service] carregarFormularioCompleto: formulário existe mas está inativo', {
      formularioId,
      nome: data.nome,
    });
  }

  return {
    id: data.id,
    formulario_uuid: data.formulario_uuid,
    nome: data.nome,
    slug: data.slug,
    segmento_id: data.segmento_id,
    foto_necessaria: data.foto_necessaria ?? true,
    geolocation_necessaria: data.geolocation_necessaria ?? false,
    metadados_seguranca: parseMetadadosSeguranca(data.metadados_seguranca),
    form_schema: data.form_schema ?? null,
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
  if (!base) {
    console.warn('[pacote.service] lerPacoteParaWizard: token não encontrado', token.slice(0, 12));
    return null;
  }

  if (base.status_efetivo !== 'ativo') {
    return { ...base, hidratacao: null };
  }

  const contratoId = base.pacote.contrato_id;
  const formularioId = base.pacote.formulario_id;

  const dadosContrato = await carregarDadosContrato(contratoId);
  if (!dadosContrato) {
    console.warn('[pacote.service] hidratação abortada — contrato não encontrado', { contratoId });
    return {
      ...base,
      hidratacao: null,
      motivoHidratacaoBloqueada: 'contrato_nao_encontrado',
      debugContexto: { contratoId, segmentoId: null, formularioId },
    };
  }
  if (!dadosContrato.cliente) {
    console.warn('[pacote.service] hidratação abortada — contrato sem cliente', { contratoId });
    return {
      ...base,
      hidratacao: null,
      motivoHidratacaoBloqueada: 'contrato_sem_cliente',
      debugContexto: { contratoId, segmentoId: dadosContrato.contrato.segmento_id, formularioId },
    };
  }
  if (dadosContrato.contrato.segmento_id == null) {
    console.warn('[pacote.service] hidratação abortada — contrato sem segmento', { contratoId });
    return {
      ...base,
      hidratacao: null,
      motivoHidratacaoBloqueada: 'contrato_sem_segmento',
      debugContexto: { contratoId, segmentoId: null, formularioId },
    };
  }

  const segmentoId = dadosContrato.contrato.segmento_id;
  const [pacoteTemplates, formulario] = await Promise.all([
    carregarPacoteContratacaoPorSegmento(segmentoId),
    carregarFormularioCompleto(formularioId),
  ]);

  if (!pacoteTemplates) {
    console.warn('[pacote.service] hidratação abortada — nenhum formulário tipo contrato ativo no segmento', {
      contratoId,
      segmentoId,
      formularioId,
    });
    return {
      ...base,
      hidratacao: null,
      motivoHidratacaoBloqueada: 'segmento_sem_formulario_contrato',
      debugContexto: { contratoId, segmentoId, formularioId },
    };
  }
  if (!formulario) {
    console.warn('[pacote.service] hidratação abortada — formulário do pacote não encontrado', {
      contratoId,
      segmentoId,
      formularioId,
    });
    return {
      ...base,
      hidratacao: null,
      motivoHidratacaoBloqueada: 'formulario_nao_encontrado',
      debugContexto: { contratoId, segmentoId, formularioId },
    };
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
