import { randomUUID } from 'crypto';
import { createServiceClient } from '@/backend/utils/supabase/service-client';
import { generateSimplePdf } from './pdf.service';
import { storePdf, storePhotoImage, storeSignatureImage } from './storage.service';
import type {
  FinalizePayload,
  FinalizeResult,
  ListSessoesParams,
  ListSessoesResult,
  PreviewPayload,
  PreviewResult,
} from '@/backend/types/formsign-signature/types';

function buildProtocol(): string {
  const now = new Date();
  const ts = now.toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
  const rand = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `FS-${ts}-${rand}`;
}

async function insertAssinaturaRecord(payload: FinalizePayload, pdfUrl: string, assinaturaUrl?: string, fotoUrl?: string) {
  const supabase = createServiceClient();
  const protocolo = buildProtocol();
  const sessao_uuid = payload.sessao_id || randomUUID();
  const { data, error } = await supabase
    .from('formsign_assinaturas')
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
  const pdfBuffer = await generateSimplePdf({
    clienteId: payload.cliente_id,
    acaoId: payload.acao_id,
    templateId: payload.template_id,
    fotoBase64: payload.foto_base64 || undefined,
    preview: true,
  });

  const stored = await storePdf(pdfBuffer);
  return { pdf_url: stored.url };
}

export async function finalizeSignature(payload: FinalizePayload): Promise<FinalizeResult> {
  if (!payload.assinatura_base64) {
    throw new Error('assinatura_base64 é obrigatória');
  }

  const assinaturaStored = await storeSignatureImage(payload.assinatura_base64);
  const fotoStored = payload.foto_base64 ? await storePhotoImage(payload.foto_base64) : undefined;

  const pdfBuffer = await generateSimplePdf({
    clienteId: payload.cliente_id,
    acaoId: payload.acao_id,
    templateId: payload.template_id,
    preview: false,
    assinaturaBase64: payload.assinatura_base64,
    fotoBase64: payload.foto_base64 || undefined,
    metadata: {
      segmento_id: payload.segmento_id,
      formulario_id: payload.formulario_id,
      ip_address: payload.ip_address,
      user_agent: payload.user_agent,
      latitude: payload.latitude,
      longitude: payload.longitude,
      geolocation_accuracy: payload.geolocation_accuracy,
      geolocation_timestamp: payload.geolocation_timestamp,
    },
  });

  const pdfStored = await storePdf(pdfBuffer);
  const record = await insertAssinaturaRecord(payload, pdfStored.url, assinaturaStored.url, fotoStored?.url);

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
