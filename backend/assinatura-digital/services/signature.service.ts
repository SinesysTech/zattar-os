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
import { logger, createTimer, LogServices, LogOperations } from './logger';
import type {
  FinalizePayload,
  FinalizeResult,
  ListSessoesParams,
  ListSessoesResult,
  PreviewPayload,
  PreviewResult,
} from '@/backend/types/assinatura-digital/types';

const SERVICE = LogServices.SIGNATURE;

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
  const timer = createTimer();
  const context = {
    service: SERVICE,
    operation: LogOperations.PREVIEW,
    cliente_id: payload.cliente_id,
    template_id: payload.template_id,
  };

  logger.info('Gerando preview de assinatura', context);

  const [cliente, template] = await Promise.all([
    getClienteBasico(payload.cliente_id),
    getTemplateBasico(payload.template_id),
  ]);

  if (!cliente) {
    logger.warn('Cliente não encontrado para preview', context);
    throw new Error('Cliente não encontrado');
  }
  if (!template || !template.ativo) {
    logger.warn('Template não encontrado ou inativo para preview', { ...context, template_ativo: template?.ativo });
    throw new Error('Template não encontrado ou inativo');
  }

  const dummySegmento = { id: 0, nome: 'Preview', slug: 'preview', ativo: true };
  const dummyFormulario = { id: 0, formulario_uuid: 'preview', nome: 'Preview', slug: 'preview', segmento_id: 0, ativo: true };

  logger.debug('Gerando PDF de preview', context);
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

  logger.debug('Armazenando PDF de preview', context);
  const stored = await storePdf(pdfBuffer);

  timer.log('Preview gerado com sucesso', context, { pdf_size: pdfBuffer.length });
  return { pdf_url: stored.url };
}

export async function finalizeSignature(payload: FinalizePayload): Promise<FinalizeResult> {
  const timer = createTimer();
  const context = {
    service: SERVICE,
    operation: LogOperations.FINALIZE,
    cliente_id: payload.cliente_id,
    template_id: payload.template_id,
    segmento_id: payload.segmento_id,
    formulario_id: payload.formulario_id,
  };

  logger.info('Iniciando finalização de assinatura', context);

  if (!payload.assinatura_base64) {
    logger.warn('Tentativa de finalização sem assinatura', context);
    throw new Error('assinatura_base64 é obrigatória');
  }

  logger.debug('Buscando dados para finalização', context);
  const [cliente, template, formulario, segmento] = await Promise.all([
    getClienteBasico(payload.cliente_id),
    getTemplateBasico(payload.template_id),
    getFormularioBasico(payload.formulario_id),
    getSegmentoBasico(payload.segmento_id),
  ]);

  if (!cliente) {
    logger.warn('Cliente não encontrado para finalização', context);
    throw new Error('Cliente não encontrado');
  }
  if (!template || !template.ativo) {
    logger.warn('Template não encontrado ou inativo para finalização', context);
    throw new Error('Template não encontrado ou inativo');
  }
  if (!formulario || !formulario.ativo) {
    logger.warn('Formulário não encontrado ou inativo para finalização', context);
    throw new Error('Formulário não encontrado ou inativo');
  }
  if (!segmento || !segmento.ativo) {
    logger.warn('Segmento não encontrado ou inativo para finalização', context);
    throw new Error('Segmento não encontrado ou inativo');
  }

  logger.debug('Armazenando imagens (assinatura/foto)', context);
  const assinaturaStored = await storeSignatureImage(payload.assinatura_base64);
  const fotoStored = payload.foto_base64 ? await storePhotoImage(payload.foto_base64) : undefined;

  const protocolo = buildProtocol();
  logger.debug('Protocolo gerado', { ...context, protocolo });

  logger.debug('Gerando PDF final', context);
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

  logger.debug('Armazenando PDF final', context);
  const pdfStored = await storePdf(pdfBuffer);

  logger.debug('Registrando assinatura no banco', context);
  const record = await insertAssinaturaRecord(
    payload,
    pdfStored.url,
    protocolo,
    assinaturaStored.url,
    fotoStored?.url
  );

  timer.log('Assinatura finalizada com sucesso', {
    ...context,
    protocolo,
    assinatura_id: record.id,
  }, { pdf_size: pdfBuffer.length });

  return {
    assinatura_id: record.id,
    protocolo: record.protocolo,
    pdf_url: record.pdf_url,
  };
}

export async function listSessoes(params: ListSessoesParams = {}): Promise<ListSessoesResult> {
  const timer = createTimer();
  const context = { service: SERVICE, operation: LogOperations.LIST, params };

  logger.debug('Listando sessões de assinatura', context);

  const supabase = createServiceClient();
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from('assinatura_digital_sessoes_assinatura')
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
    logger.error('Erro ao listar sessões', error, context);
    throw new Error(`Erro ao listar sessões: ${error.message}`);
  }

  const result = {
    sessoes: data || [],
    total: count ?? 0,
    page,
    pageSize,
  };

  timer.log('Sessões listadas com sucesso', context, { count: result.total, page, pageSize });
  return result;
}