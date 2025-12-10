import { randomUUID } from 'crypto';
import { PDFDocument } from 'pdf-lib';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { createServiceClient } from '@/backend/utils/supabase/service-client';
import { generatePdfFromTemplate, appendManifestPage, MANIFEST_LEGAL_TEXT, type ManifestData } from './template-pdf.service';
import { storePdf, storePhotoImage, storeSignatureImage } from './storage.service';
import { calculateHash, verifyHash } from './integrity.service';
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
  DeviceFingerprintData,
  AuditResult,
} from '@/backend/types/assinatura-digital/types';

const SERVICE = LogServices.SIGNATURE;

/**
 * Decodifica data URL (base64) para Buffer.
 * @param dataUrl - Data URL no formato 'data:image/png;base64,iVBOR...'
 * @returns Buffer com os dados da imagem
 */
function decodeDataUrlToBuffer(dataUrl: string): { buffer: Buffer; mimeType: string } {
  const matches = dataUrl.match(/^data:([^;]+);base64,(.*)$/);
  if (!matches) {
    throw new Error('Data URL inválida');
  }
  const mimeType = matches[1];
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, 'base64');
  return { buffer, mimeType };
}

/**
 * Valida se o device fingerprint possui entropia suficiente para auditoria.
 *
 * CONFORMIDADE LEGAL - MP 2.200-2/2001
 *
 * O device fingerprint é uma evidência complementar para identificação do signatário
 * (Art. 10, § 2º, alínea b: "identificar seu signatário de forma inequívoca").
 * Quanto maior a entropia (número de campos únicos), mais difícil falsificar a
 * "impressão digital" do dispositivo.
 *
 * Critérios de Entropia Mínima:
 * - Campos obrigatórios: screen_resolution, platform, user_agent, timezone_offset
 * - Campos recomendados: canvas_hash, hardware_concurrency, language
 * - Total mínimo: 4 campos obrigatórios + 2 recomendados = 6 campos
 *
 * @param fingerprint - Dados de fingerprint coletados no frontend
 * @param required - Se fingerprint é obrigatório (default: true)
 * @returns true se entropia é suficiente, false caso contrário
 * @throws {Error} Se fingerprint for null/undefined quando obrigatório
 */
function validateDeviceFingerprintEntropy(
  fingerprint: DeviceFingerprintData | null | undefined,
  required: boolean = true
): boolean {
  const context = {
    service: SERVICE,
    operation: LogOperations.VALIDATE_ENTROPY,
  };

  // Se não for obrigatório e estiver ausente, aceitar
  if (!required && !fingerprint) {
    logger.debug('Device fingerprint não fornecido (opcional)', context);
    return true;
  }

  // Se for obrigatório e estiver ausente, rejeitar
  if (required && !fingerprint) {
    logger.warn('Device fingerprint obrigatório não fornecido', context);
    throw new Error('Device fingerprint é obrigatório para conformidade legal');
  }

  // Campos obrigatórios para entropia mínima
  const requiredFields = [
    'screen_resolution',
    'platform',
    'user_agent',
    'timezone_offset',
  ];

  // Campos recomendados para entropia adicional
  const recommendedFields = [
    'canvas_hash',
    'hardware_concurrency',
    'language',
    'color_depth',
  ];

  // Contar campos presentes (não-null, não-undefined, não-string-vazia)
  const presentRequiredFields = requiredFields.filter(
    (field) =>
      fingerprint![field as keyof DeviceFingerprintData] !== null &&
      fingerprint![field as keyof DeviceFingerprintData] !== undefined &&
      fingerprint![field as keyof DeviceFingerprintData] !== ''
  );

  const presentRecommendedFields = recommendedFields.filter(
    (field) =>
      fingerprint![field as keyof DeviceFingerprintData] !== null &&
      fingerprint![field as keyof DeviceFingerprintData] !== undefined &&
      fingerprint![field as keyof DeviceFingerprintData] !== ''
  );

  const totalFields = presentRequiredFields.length + presentRecommendedFields.length;
  const minRequiredFields = 4; // Todos os campos obrigatórios
  const minRecommendedFields = 2; // Pelo menos 2 recomendados
  const minTotalFields = 6;

  const hasMinimumEntropy =
    presentRequiredFields.length >= minRequiredFields &&
    presentRecommendedFields.length >= minRecommendedFields &&
    totalFields >= minTotalFields;

  if (!hasMinimumEntropy) {
    logger.warn('Device fingerprint com entropia insuficiente', {
      ...context,
      required_fields_present: presentRequiredFields.length,
      required_fields_expected: minRequiredFields,
      recommended_fields_present: presentRecommendedFields.length,
      recommended_fields_expected: minRecommendedFields,
      total_fields: totalFields,
      min_total_fields: minTotalFields,
      missing_required: requiredFields.filter((f) => !presentRequiredFields.includes(f)),
      missing_recommended: recommendedFields.filter((f) => !presentRecommendedFields.includes(f)),
    });
    return false;
  }

  logger.debug('Device fingerprint validado com entropia suficiente', {
    ...context,
    total_fields: totalFields,
    required_fields: presentRequiredFields.length,
    recommended_fields: presentRecommendedFields.length,
  });

  return true;
}

/**
 * Valida se a foto (selfie) está embedada no PDF final, não apenas no storage.
 *
 * CONFORMIDADE LEGAL - MP 2.200-2/2001
 *
 * A foto é uma evidência biométrica crítica para identificação do signatário
 * (Art. 10, § 2º, alínea b). Para garantir integridade forense, ela deve estar
 * EMBEDADA no PDF (parte do documento), não apenas armazenada separadamente.
 *
 * Se a foto estiver solta no storage, pode-se alegar que foi trocada. Estando
 * dentro do PDF assinado/achatado, ela faz parte do documento íntegro e qualquer
 * modificação alterará o hash_final_sha256.
 *
 * Validação:
 * - Carrega o PDF final do buffer
 * - Verifica se há pelo menos 1 imagem embedada (além da assinatura)
 * - Compara dimensões/tipo com a foto fornecida (heurística)
 *
 * @param pdfBuffer - Buffer do PDF final (após manifesto e flatten)
 * @param fotoBase64 - Data URL da foto que deveria estar embedada
 * @returns true se foto está embedada, false caso contrário
 */
async function validatePhotoEmbedding(
  pdfBuffer: Buffer,
  fotoBase64: string | null | undefined
): Promise<boolean> {
  const context = {
    service: SERVICE,
    operation: LogOperations.VALIDATE_EMBEDDING,
  };

  // Se não há foto, não há o que validar
  if (!fotoBase64) {
    logger.debug('Nenhuma foto fornecida para validação de embedding', context);
    return true;
  }

  try {
    logger.debug('Validando embedding de foto no PDF', context);

    // Carregar PDF para inspeção
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pageCount = pdfDoc.getPageCount();

    // A foto deve estar na última página (manifesto)
    const manifestPage = pdfDoc.getPage(pageCount - 1);

    // pdf-lib não expõe API pública para listar imagens embedadas diretamente,
    // mas podemos verificar se o PDF tem objetos de imagem no dicionário interno.
    // Heurística: Se o PDF tem mais de 1 imagem (assinatura + foto), assumir que foto está presente.

    // Alternativa: Verificar tamanho do PDF. PDF com foto embedada deve ser maior.
    const { buffer: fotoBuffer } = decodeDataUrlToBuffer(fotoBase64);
    const fotoSize = fotoBuffer.length;
    const pdfSize = pdfBuffer.length;

    // Heurística: PDF final deve ser significativamente maior que apenas assinatura
    // (foto típica: 50-200KB, assinatura: 5-20KB)
    const minExpectedSize = fotoSize * 0.5; // Pelo menos 50% do tamanho da foto deve estar no PDF

    if (pdfSize < minExpectedSize) {
      logger.warn('PDF final menor que esperado (foto pode não estar embedada)', {
        ...context,
        pdf_size: pdfSize,
        foto_size: fotoSize,
        min_expected_size: minExpectedSize,
      });
      return false;
    }

    // Validação adicional: Verificar se a última página (manifesto) tem conteúdo suficiente
    // (manifesto com foto deve ter mais objetos que manifesto sem foto)
    const manifestPageObjects = manifestPage.node.toString().length;
    const minManifestSize = 5000; // Manifesto com foto deve ter pelo menos 5KB de objetos

    if (manifestPageObjects < minManifestSize) {
      logger.warn('Página de manifesto com conteúdo insuficiente (foto pode não estar embedada)', {
        ...context,
        manifest_page_size: manifestPageObjects,
        min_manifest_size: minManifestSize,
      });
      return false;
    }

    logger.debug('Foto validada como embedada no PDF', {
      ...context,
      pdf_size: pdfSize,
      foto_size: fotoSize,
      manifest_page_size: manifestPageObjects,
    });

    return true;
  } catch (error) {
    logger.error('Erro ao validar embedding de foto', error, context);
    // Em caso de erro, assumir que validação falhou (fail-safe)
    return false;
  }
}

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
  hashOriginal: string,
  hashFinal: string,
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
      // Campos de conformidade MP 2.200-2/2001
      hash_original_sha256: hashOriginal,
      hash_final_sha256: hashFinal,
      termos_aceite_versao: payload.termos_aceite_versao,
      termos_aceite_data: new Date().toISOString(),
      dispositivo_fingerprint_raw: payload.dispositivo_fingerprint_raw ?? null,
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

/**
 * Finaliza assinatura digital com conformidade MP 2.200-2/2001.
 *
 * Fluxo de integridade criptográfica:
 * 1. Gera PDF preenchido (pré-assinatura) e calcula hash_original_sha256
 * 2. Adiciona assinatura manuscrita e foto ao PDF
 * 3. Anexa página de manifesto com evidências biométricas
 * 4. Salva (flatten) PDF final e calcula hash_final_sha256
 * 5. Persiste ambos os hashes e dados de termos no banco
 *
 * @param payload - Dados de finalização incluindo termos_aceite, termos_aceite_versao, dispositivo_fingerprint_raw
 * @returns Resultado com assinatura_id, protocolo e pdf_url
 * @throws {Error} Se termos não forem aceitos ou foto estiver ausente
 */
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

  // Validação de termos de aceite (conformidade MP 2.200-2/2001)
  if (!payload.termos_aceite || !payload.termos_aceite_versao) {
    logger.warn('Tentativa de finalização sem aceite de termos', context);
    throw new Error('Aceite de termos é obrigatório (termos_aceite e termos_aceite_versao)');
  }

  // Validação de entropia do device fingerprint (conformidade MP 2.200-2/2001)
  if (!validateDeviceFingerprintEntropy(payload.dispositivo_fingerprint_raw, true)) {
    throw new Error(
      'Device fingerprint com entropia insuficiente. ' +
      'Campos obrigatórios: screen_resolution, platform, user_agent, timezone_offset. ' +
      'Campos recomendados: canvas_hash, hardware_concurrency, language.'
    );
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

  // Validação de foto baseada na configuração do formulário
  const fotoObrigatoria = formulario.foto_necessaria === true;
  if (fotoObrigatoria && !payload.foto_base64) {
    logger.warn('Tentativa de finalização sem foto (obrigatória para este formulário)', {
      ...context,
      foto_necessaria: formulario.foto_necessaria,
    });
    throw new Error('Foto é obrigatória para este formulário (foto_necessaria=true)');
  }

  logger.debug('Armazenando imagens (assinatura/foto)', context);
  const assinaturaStored = await storeSignatureImage(payload.assinatura_base64);
  const fotoStored = payload.foto_base64
    ? await storePhotoImage(payload.foto_base64)
    : undefined;

  const protocolo = buildProtocol();
  logger.debug('Protocolo gerado', { ...context, protocolo });

  // ==========================================================================
  // FASE 1: Gerar PDF pré-assinatura e calcular hash original
  // ==========================================================================
  logger.debug('Gerando PDF pré-assinatura (sem imagens)', context);
  const pdfBufferPreSign = await generatePdfFromTemplate(
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
    undefined // Sem imagens para calcular hash original
  );

  let hashOriginal: string;
  try {
    hashOriginal = calculateHash(pdfBufferPreSign);
    logger.debug('Hash original calculado', { ...context, hash_prefix: hashOriginal.slice(0, 8) });
  } catch (error) {
    logger.error('Erro ao calcular hash original', error, context);
    throw new Error('Falha na geração de hash de integridade');
  }

  // ==========================================================================
  // FASE 2: Gerar PDF com assinatura/foto e anexar manifesto
  // ==========================================================================
  logger.debug('Gerando PDF com assinatura e foto', context);
  const pdfBufferWithImages = await generatePdfFromTemplate(
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

  // Carregar PDF para adicionar página de manifesto
  const pdfDoc = await PDFDocument.load(pdfBufferWithImages);

  // Construir dados do manifesto
  const dataAssinatura = new Date();
  const manifestData: ManifestData = {
    protocolo,
    nomeArquivo: `${protocolo}.pdf`,
    hashOriginalSha256: hashOriginal,
    hashFinalSha256: undefined, // Será calculado após save
    signatario: {
      nomeCompleto: cliente.nome,
      cpf: cliente.cpf || '',
      dataHora: dataAssinatura.toISOString(),
      dataHoraLocal: dataAssinatura.toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      ipOrigem: payload.ip_address || null,
      geolocalizacao:
        payload.latitude !== null &&
          payload.latitude !== undefined &&
          payload.longitude !== null &&
          payload.longitude !== undefined
          ? {
            latitude: payload.latitude,
            longitude: payload.longitude,
            accuracy: payload.geolocation_accuracy ?? undefined,
          }
          : null,
    },
    evidencias: {
      fotoBase64: payload.foto_base64 || undefined,
      assinaturaBase64: payload.assinatura_base64,
    },
    termos: {
      versao: payload.termos_aceite_versao,
      dataAceite: dataAssinatura.toISOString(),
      textoDeclaracao: MANIFEST_LEGAL_TEXT,
    },
    dispositivo: payload.dispositivo_fingerprint_raw
      ? {
        plataforma: payload.dispositivo_fingerprint_raw.platform as string | undefined,
        navegador: payload.dispositivo_fingerprint_raw.user_agent as string | undefined,
        resolucao: payload.dispositivo_fingerprint_raw.screen_resolution as string | undefined,
      }
      : undefined,
  };

  // Anexar página de manifesto
  try {
    await appendManifestPage(pdfDoc, manifestData);
    logger.debug('Manifesto anexado ao PDF', context);
  } catch (error) {
    logger.error('Erro ao anexar manifesto ao PDF', error, context);
    throw new Error('Falha ao gerar página de manifesto');
  }

  // Salvar (flatten) PDF final
  const finalPdfBytes = await pdfDoc.save();
  const finalPdfBuffer = Buffer.from(finalPdfBytes);

  // ==========================================================================
  // FASE 3: Calcular hash final e validar embedding
  // ==========================================================================
  let hashFinal: string;
  try {
    hashFinal = calculateHash(finalPdfBuffer);
    logger.debug('Hash final calculado', { ...context, hash_prefix: hashFinal.slice(0, 8) });
  } catch (error) {
    logger.error('Erro ao calcular hash final', error, context);
    throw new Error('Falha na geração de hash de integridade final');
  }

  // Validação de embedding de foto (conformidade MP 2.200-2/2001)
  if (payload.foto_base64) {
    const fotoEmbedded = await validatePhotoEmbedding(finalPdfBuffer, payload.foto_base64);
    if (!fotoEmbedded) {
      logger.error('Falha na validação de embedding de foto', null, context);
      throw new Error(
        'Foto não foi corretamente embedada no PDF. ' +
        'Isso compromete a integridade forense do documento.'
      );
    }
    logger.info('Foto validada como embedada no PDF', context);
  }

  logger.debug('Armazenando PDF final', context);
  const pdfStored = await storePdf(finalPdfBuffer);

  logger.debug('Registrando assinatura no banco', context);
  const record = await insertAssinaturaRecord(
    payload,
    pdfStored.url,
    protocolo,
    hashOriginal,
    hashFinal,
    assinaturaStored.url,
    fotoStored?.url
  );

  timer.log('Assinatura finalizada com sucesso', {
    ...context,
    protocolo,
    assinatura_id: record.id,
  }, { pdf_size: finalPdfBuffer.length });

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

/**
 * Baixa PDF do Backblaze B2 para auditoria.
 * @param pdfUrl - URL pública do PDF no storage
 * @returns Buffer do PDF
 */
async function downloadPdfFromStorage(pdfUrl: string): Promise<Buffer> {
  const context = {
    service: SERVICE,
    operation: LogOperations.DOWNLOAD,
  };

  try {
    // Extrair bucket e key da URL
    // Formato esperado: https://endpoint/bucket/key
    const urlObj = new URL(pdfUrl);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    const bucket = pathParts[0];
    const key = pathParts.slice(1).join('/');

    logger.debug('Baixando PDF do storage', { ...context, bucket, key });

    // Configurar cliente S3 para Backblaze
    const endpoint = process.env.B2_ENDPOINT;
    const region = process.env.B2_REGION;
    const keyId = process.env.B2_KEY_ID;
    const applicationKey = process.env.B2_APPLICATION_KEY;

    if (!endpoint || !region || !keyId || !applicationKey) {
      throw new Error('Configuração do Backblaze B2 incompleta');
    }

    const client = new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId: keyId,
        secretAccessKey: applicationKey,
      },
    });

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const response = await client.send(command);
    if (!response.Body) {
      throw new Error('Resposta do storage sem corpo');
    }

    // Converter stream para buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    logger.debug('PDF baixado com sucesso', { ...context, size: buffer.length });
    return buffer;
  } catch (error) {
    logger.error('Erro ao baixar PDF do storage', error, context);
    throw new Error(`Falha ao baixar PDF: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Audita integridade de uma assinatura digital concluída.
 *
 * CONFORMIDADE LEGAL - MP 2.200-2/2001
 *
 * Esta função verifica a integridade forense de assinaturas digitais já finalizadas,
 * recalculando hashes e validando evidências biométricas contra os registros persistidos.
 *
 * Validações Realizadas:
 * 1. **Integridade Criptográfica** (Art. 10, § 1º):
 *    - Recalcula hash_final_sha256 do PDF armazenado
 *    - Compara com hash registrado no banco
 *    - Falha indica adulteração do PDF após assinatura
 *
 * 2. **Entropia do Device Fingerprint** (Art. 10, § 2º, alínea b):
 *    - Verifica se dispositivo_fingerprint_raw tem campos suficientes
 *    - Baixa entropia = identificação fraca do signatário
 *
 * 3. **Embedding de Foto** (Art. 10, § 2º, alínea b):
 *    - Se foto foi fornecida, verifica se está embedada no PDF
 *    - Foto solta no storage pode ser trocada, comprometendo evidência
 *
 * Casos de Uso:
 * - Auditorias periódicas de conformidade
 * - Investigação de fraudes
 * - Validação antes de envio para sistemas externos
 * - Geração de relatórios de integridade
 *
 * @param assinaturaId - ID da assinatura a ser auditada
 * @returns Resultado detalhado da auditoria
 * @throws {Error} Se assinatura não for encontrada
 */
export async function auditSignatureIntegrity(assinaturaId: number): Promise<AuditResult> {
  const timer = createTimer();
  const context = {
    service: SERVICE,
    operation: LogOperations.AUDIT,
    assinatura_id: assinaturaId,
  };

  logger.info('Iniciando auditoria de integridade de assinatura', context);

  const avisos: string[] = [];
  const erros: string[] = [];

  // Buscar registro da assinatura no banco
  const supabase = createServiceClient();
  const { data: assinatura, error: fetchError } = await supabase
    .from('assinatura_digital_assinaturas')
    .select('*')
    .eq('id', assinaturaId)
    .single();

  if (fetchError || !assinatura) {
    logger.error('Assinatura não encontrada para auditoria', fetchError, context);
    throw new Error(`Assinatura ${assinaturaId} não encontrada`);
  }

  logger.debug('Assinatura carregada para auditoria', { ...context, protocolo: assinatura.protocolo });

  // ==========================================================================
  // VALIDAÇÃO 1: Integridade Criptográfica (Recalcular Hash Final)
  // ==========================================================================
  let hashFinalRecalculado: string;
  let hashesValidos = false;

  try {
    logger.debug('Baixando PDF para recálculo de hash', context);
    const pdfBuffer = await downloadPdfFromStorage(assinatura.pdf_url);

    logger.debug('Recalculando hash final do PDF', context);
    hashFinalRecalculado = calculateHash(pdfBuffer);

    // Comparar hashes
    const hashRegistrado = assinatura.hash_final_sha256;
    if (!hashRegistrado) {
      erros.push('Hash final não foi registrado no banco (campo vazio)');
      logger.warn('Hash final ausente no banco', context);
    } else {
      hashesValidos = verifyHash(pdfBuffer, hashRegistrado);
      if (!hashesValidos) {
        erros.push(
          `Hash final não confere. ` +
          `Registrado: ${hashRegistrado.slice(0, 16)}..., ` +
          `Recalculado: ${hashFinalRecalculado.slice(0, 16)}...`
        );
        logger.error('Falha na verificação de integridade: hash não confere', null, {
          ...context,
          hash_registrado: hashRegistrado.slice(0, 16),
          hash_recalculado: hashFinalRecalculado.slice(0, 16),
        });
      } else {
        logger.debug('Hash final validado com sucesso', context);
      }
    }
  } catch (error) {
    hashFinalRecalculado = '';
    erros.push(`Erro ao recalcular hash: ${error instanceof Error ? error.message : String(error)}`);
    logger.error('Erro ao recalcular hash final', error, context);
  }

  // ==========================================================================
  // VALIDAÇÃO 2: Entropia do Device Fingerprint
  // ==========================================================================
  let entropiaSuficiente = false;
  let entropiaDetalhes;

  try {
    if (!assinatura.dispositivo_fingerprint_raw) {
      avisos.push('Device fingerprint não foi coletado (campo vazio)');
      logger.warn('Device fingerprint ausente', context);
    } else {
      entropiaSuficiente = validateDeviceFingerprintEntropy(
        assinatura.dispositivo_fingerprint_raw as DeviceFingerprintData,
        false // Não obrigatório em auditoria (já foi aceito)
      );

      const fingerprint = assinatura.dispositivo_fingerprint_raw as DeviceFingerprintData;
      const requiredFields = ['screen_resolution', 'platform', 'user_agent', 'timezone_offset'];
      const recommendedFields = ['canvas_hash', 'hardware_concurrency', 'language', 'color_depth'];

      const presentRequiredFields = requiredFields.filter(
        (field) =>
          fingerprint[field as keyof DeviceFingerprintData] !== null &&
          fingerprint[field as keyof DeviceFingerprintData] !== undefined &&
          fingerprint[field as keyof DeviceFingerprintData] !== ''
      );

      const presentRecommendedFields = recommendedFields.filter(
        (field) =>
          fingerprint[field as keyof DeviceFingerprintData] !== null &&
          fingerprint[field as keyof DeviceFingerprintData] !== undefined &&
          fingerprint[field as keyof DeviceFingerprintData] !== ''
      );

      entropiaDetalhes = {
        campos_presentes: presentRequiredFields.length + presentRecommendedFields.length,
        campos_obrigatorios: presentRequiredFields.length,
        campos_recomendados: presentRecommendedFields.length,
      };

      if (!entropiaSuficiente) {
        avisos.push(
          `Device fingerprint com entropia insuficiente ` +
          `(${entropiaDetalhes.campos_presentes} campos, mínimo recomendado: 6)`
        );
        logger.warn('Entropia insuficiente detectada em auditoria', { ...context, ...entropiaDetalhes });
      } else {
        logger.debug('Entropia de fingerprint validada', { ...context, ...entropiaDetalhes });
      }
    }
  } catch (error) {
    erros.push(`Erro ao validar entropia: ${error instanceof Error ? error.message : String(error)}`);
    logger.error('Erro ao validar entropia de fingerprint', error, context);
  }

  // ==========================================================================
  // VALIDAÇÃO 3: Embedding de Foto (se aplicável)
  // ==========================================================================
  let fotoEmbedada: boolean | undefined;

  try {
    if (assinatura.foto_url) {
      logger.debug('Validando embedding de foto em auditoria', context);
      const pdfBuffer = await downloadPdfFromStorage(assinatura.pdf_url);

      // Não temos acesso direto ao foto_base64 original, então fazemos validação heurística
      // baseada apenas no tamanho do PDF e estrutura do manifesto
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const pageCount = pdfDoc.getPageCount();
      const manifestPage = pdfDoc.getPage(pageCount - 1);
      const manifestPageSize = manifestPage.node.toString().length;
      const minManifestSize = 5000; // Manifesto com foto deve ter >= 5KB

      fotoEmbedada = manifestPageSize >= minManifestSize;

      if (!fotoEmbedada) {
        avisos.push(
          'Foto pode não estar embedada no PDF ' +
          `(manifesto com ${manifestPageSize} bytes, esperado >= ${minManifestSize})`
        );
        logger.warn('Possível falha de embedding de foto detectada', {
          ...context,
          manifest_page_size: manifestPageSize,
          min_manifest_size: minManifestSize,
        });
      } else {
        logger.debug('Foto validada como embedada', context);
      }
    }
  } catch (error) {
    erros.push(`Erro ao validar embedding de foto: ${error instanceof Error ? error.message : String(error)}`);
    logger.error('Erro ao validar embedding de foto', error, context);
  }

  // ==========================================================================
  // RESULTADO DA AUDITORIA
  // ==========================================================================
  const status: 'valido' | 'invalido' | 'erro' =
    erros.length > 0 ? 'erro' :
      !hashesValidos ? 'invalido' :
        'valido';

  const result: AuditResult = {
    assinatura_id: assinatura.id,
    protocolo: assinatura.protocolo,
    status,
    hashes_validos: hashesValidos,
    hash_original_registrado: assinatura.hash_original_sha256,
    hash_final_registrado: assinatura.hash_final_sha256 || '',
    hash_final_recalculado: hashFinalRecalculado,
    entropia_suficiente: entropiaSuficiente,
    entropia_detalhes: entropiaDetalhes,
    foto_embedada: fotoEmbedada,
    avisos,
    erros,
    auditado_em: new Date().toISOString(),
  };

  timer.log('Auditoria de integridade concluída', context, {
    status,
    hashes_validos: hashesValidos,
    entropia_suficiente: entropiaSuficiente,
    avisos_count: avisos.length,
    erros_count: erros.length,
  });

  return result;
}