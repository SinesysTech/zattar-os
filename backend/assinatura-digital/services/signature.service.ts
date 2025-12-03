import { randomUUID } from 'crypto';
import { createServiceClient } from '@/backend/utils/supabase/service-client';
import { generatePdfFromTemplate } from './template-pdf.service';
import { storePdf, storePhotoImage, storeSignatureImage } from './storage.service';
import {
  getClienteBasico,
  getFormularioBasico,
  getSegmentoBasico,
  getTemplateBasico,
} from './data.service';
import type {
  FinalizePayload,
  FinalizeResult,
  ListSessoesParams,
  ListSessoesResult,
  PreviewPayload,
  PreviewResult,
} from '@/backend/types/assinatura-digital/types';

function buildProtocol(): string {
  const now = new Date();
  const ts = now.toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
  const rand = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `FS-${ts}-${rand}`;
}

async function insertAssinaturaRecord(
  payload: FinalizePayload,
  pdfUrl: string,
  protocolo: string,
  assinaturaUrl?: string,
  fotoUrl?: string
) {
  const supabase = createServiceClient();
  const sessao_uuid = payload.sessao_id || randomUUID();
  const { data, error } = await supabase
    .from('assinatura_digital_assinaturas')
    .insert({
      cliente_id: payload.cliente_id,
      acao_id: payload.acao_id,
      template_uuid: payload.template_id,
      segmento_id: payload.segmento_id,
      formulario_id: payload.formulario_id,
      sessao_uuid,
      assinatura_url: assinaturaUrl ?? null,
      foto_url: fotoUrl ?? null,
      pdf_url: pdfUrl,
      protocolo,
      ip_address: payload.ip_address ?? null,
      user_agent: payload.user_agent ?? null,
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,
      geolocation_accuracy: payload.geolocation_accuracy ?? null,
      geolocation_timestamp: payload.geolocation_timestamp ?? null,
      data_assinatura: new Date().toISOString(),
      status: 'concluida',
      enviado_sistema_externo: false,
    })
    .select('id, protocolo, pdf_url')
    .single();

  if (error) {
    throw new Error(`Erro ao registrar assinatura: ${error.message}`);
  }

  return data;
}

export async function generatePreview(payload: PreviewPayload): Promise<PreviewResult> {
  const [cliente, template] = await Promise.all([
    getClienteBasico(payload.cliente_id),
    getTemplateBasico(payload.template_id),
  ]);

  if (!cliente) {
    throw new Error('Cliente não encontrado');
  }
  if (!template || !template.ativo) {
    throw new Error('Template não encontrado ou inativo');
  }

  const dummySegmento = { id: 0, nome: 'Preview', slug: 'preview', ativo: true };
  const dummyFormulario = { id: 0, formulario_uuid: 'preview', nome: 'Preview', slug: 'preview', segmento_id: 0, ativo: true };

  const pdfBuffer = await generatePdfFromTemplate(
    template,
    {
      cliente,
      segmento: dummySegmento,
      formulario: dummyFormulario,
      protocolo: 'PREVIEW',
    },
    { acao_id: payload.acao_id },
    { fotoBase64: payload.foto_base64 || undefined }
  );

  const stored = await storePdf(pdfBuffer);
  return { pdf_url: stored.url };
}

export async function finalizeSignature(payload: FinalizePayload): Promise<FinalizeResult> {
  if (!payload.assinatura_base64) {
    throw new Error('assinatura_base64 é obrigatória');
  }

  const [cliente, template, formulario, segmento] = await Promise.all([
    getClienteBasico(payload.cliente_id),
    getTemplateBasico(payload.template_id),
    getFormularioBasico(payload.formulario_id),
    getSegmentoBasico(payload.segmento_id),
  ]);

  if (!cliente) {
    throw new Error('Cliente não encontrado');
  }
  if (!template || !template.ativo) {
    throw new Error('Template não encontrado ou inativo');
  }
  if (!formulario || !formulario.ativo) {
    throw new Error('Formulário não encontrado ou inativo');
  }
  if (!segmento || !segmento.ativo) {
    throw new Error('Segmento não encontrado ou inativo');
  }

  const assinaturaStored = await storeSignatureImage(payload.assinatura_base64);
  const fotoStored = payload.foto_base64 ? await storePhotoImage(payload.foto_base64) : undefined;

  const protocolo = buildProtocol();

  const pdfBuffer = await generatePdfFromTemplate(
    template,
    {
      cliente,
      segmento,
      formulario,
      protocolo,
      ip: payload.ip_address,
      user_agent: payload.user_agent,
    },
    {
      segmento_id: payload.segmento_id,
      formulario_id: payload.formulario_id,
      acao_id: payload.acao_id,
      latitude: payload.latitude,
      longitude: payload.longitude,
      geolocation_accuracy: payload.geolocation_accuracy,
      geolocation_timestamp: payload.geolocation_timestamp,
    },
    { assinaturaBase64: payload.assinatura_base64, fotoBase64: payload.foto_base64 || undefined }
  );

  const pdfStored = await storePdf(pdfBuffer);
  const record = await insertAssinaturaRecord(
    payload,
    pdfStored.url,
    protocolo,
    assinaturaStored.url,
    fotoStored?.url
  );

  return {
    assinatura_id: record.id,
    protocolo: record.protocolo,
    pdf_url: record.pdf_url,
  };
}

export async function listSessoes(params: ListSessoesParams = {}): Promise<ListSessoesResult> {
  const supabase = createServiceClient();
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from('formsign_sessoes_assinatura')
    .select('*', { count: 'exact' });

  if (params.status) {
    query = query.eq('status', params.status);
  }
  if (params.data_inicio) {
    query = query.gte('created_at', params.data_inicio);
  }
  if (params.data_fim) {
    query = query.lte('created_at', params.data_fim);
  }
  // search por sessao_uuid
  if (params.search) {
    const term = params.search.trim();
    query = query.ilike('sessao_uuid', `%${term}%`);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) {
    throw new Error(`Erro ao listar sessões: ${error.message}`);
  }

  return {
    sessoes: data || [],
    total: count ?? 0,
    page,
    pageSize,
  };
}