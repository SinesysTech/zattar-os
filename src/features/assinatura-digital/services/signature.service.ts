/**
 * Serviço de Assinatura Digital Eletrônica Avançada
 *
 * CONFORMIDADE LEGAL - MP 2.200-2/2001
 *
 * Este módulo implementa assinatura eletrônica avançada conforme Art. 10, § 2º da
 * Medida Provisória 2.200-2/2001, garantindo:
 *
 * **a) Vinculação exclusiva ao signatário:**
 * - Coleta de device fingerprint (impressão digital do dispositivo)
 * - Captura de foto (evidência biométrica facial)
 * - Assinatura manuscrita digital
 * - Dados de geolocalização (GPS) e IP de origem
 *
 * **b) Identificação inequívoca do signatário:**
 * - Validação de entropia mínima do device fingerprint (6 campos)
 * - Embedding de foto no PDF final (não apenas storage externo)
 * - Aceite explícito de termos com versão e timestamp
 *
 * **c) Controle exclusivo pelo signatário:**
 * - Assinatura manuscrita capturada em tempo real
 * - Device fingerprint coletado no momento da assinatura
 * - Timestamp preciso de todas as evidências
 *
 * **d) Detecção de modificações posteriores:**
 * - Cadeia de hashes SHA-256:
 *   1. hash_original_sha256: PDF pré-assinatura (documento base)
 *   2. hash_final_sha256: PDF pós-manifesto e flatten (documento final)
 * - Qualquer alteração no PDF altera os hashes, tornando adulteração detectável
 * - Função de auditoria para recalcular e comparar hashes
 *
 * ## Cadeia de Custódia (Chain of Custody)
 *
 * 1. **Geração do PDF Base**
 *    - Template preenchido com dados do cliente
 *    - Hash original calculado (prova de integridade do documento base)
 *
 * 2. **Adição de Evidências Biométricas**
 *    - Assinatura manuscrita embedada no PDF
 *    - Foto (se fornecida) embedada no PDF
 *
 * 3. **Anexação do Manifesto de Assinatura**
 *    - Página final com todas as evidências e metadados:
 *      - Hashes (original e final)
 *      - Dados do signatário (nome, CPF, timestamp)
 *      - Dados do dispositivo (platform, navegador, resolução)
 *      - Geolocalização (latitude, longitude, precisão)
 *      - Termos aceitos (versão, data de aceite)
 *
 * 4. **Flatten e Hash Final**
 *    - PDF salvo de forma definitiva (flatten)
 *    - Hash final calculado (prova de integridade do documento completo)
 *
 * 5. **Persistência Dual**
 *    - PDF armazenado no storage (Backblaze B2)
 *    - Hashes, metadados e referências persistidos no banco (Supabase)
 *
 * ## Pontos de Validação
 *
 * Durante `finalizeSignature()`:
 * - Termos de aceite (obrigatório)
 * - Entropia do device fingerprint (fortemente recomendado)
 * - Embedding de foto no PDF (se fornecida)
 *
 * Durante `auditSignatureIntegrity()`:
 * - Recalcula hash_final_sha256 do PDF armazenado
 * - Compara com hash registrado no banco
 * - Valida entropia do fingerprint persistido
 * - Verifica embedding de foto (heurística)
 *
 * @module signature.service
 */

import { randomUUID } from "crypto";
import { PDFDocument } from "pdf-lib";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { createServiceClient } from "@/lib/supabase/service-client";
import {
  generatePdfFromTemplate,
  appendManifestPage,
  MANIFEST_LEGAL_TEXT,
  type ManifestData,
} from "./template-pdf.service";
import {
  storePdf,
  storePhotoImage,
  storeSignatureImage,
} from "./storage.service";
import { calculateHash, verifyHash } from "./integrity.service";
import {
  getClienteBasico,
  getFormularioBasico,
  getSegmentoBasico,
  getTemplateBasico,
} from "./data.service";
import { logger, createTimer, LogServices, LogOperations } from "./logger";
import type {
  FinalizePayload,
  FinalizeResult,
  ListSessoesParams,
  ListSessoesResult,
  PreviewPayload,
  PreviewResult,
  DeviceFingerprintData,
  AuditResult,
} from "../types/types";

const SERVICE = LogServices.SIGNATURE;

/**
 * Decodifica data URL (base64) para Buffer, com suporte a múltiplos formatos.
 *
 * Aceita tanto data URLs completas ('data:image/png;base64,iVBOR...')
 * quanto strings base64 puras (sem prefixo 'data:').
 *
 * @param dataUrlOrBase64 - Data URL completa ou string base64 pura
 * @returns Buffer com os dados da imagem e mimeType inferido
 * @throws {Error} Se a string for inválida ou não for base64 válido
 */
function decodeDataUrlToBuffer(dataUrlOrBase64: string): {
  buffer: Buffer;
  mimeType: string;
} {
  // Tentar match de data URL completa primeiro
  const dataUrlMatches = dataUrlOrBase64.match(/^data:([^;]+);base64,(.*)$/);
  if (dataUrlMatches) {
    const mimeType = dataUrlMatches[1];
    const base64Data = dataUrlMatches[2];
    const buffer = Buffer.from(base64Data, "base64");
    return { buffer, mimeType };
  }

  // Se não é data URL, assumir que é base64 puro
  // Validar que parece ser base64 válido (caracteres alfanuméricos + / e =)
  if (!/^[A-Za-z0-9+/]+=*$/.test(dataUrlOrBase64.trim())) {
    throw new Error(
      "Formato inválido: esperado data URL (data:image/...;base64,...) ou string base64 pura"
    );
  }

  try {
    const buffer = Buffer.from(dataUrlOrBase64, "base64");
    // Se conseguiu decodificar, inferir mimeType padrão baseado nos magic bytes
    const mimeType = inferMimeTypeFromBuffer(buffer);
    return { buffer, mimeType };
  } catch (error) {
    throw new Error(
      `Erro ao decodificar base64: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Infere o MIME type de um buffer baseado nos magic bytes (assinatura do arquivo).
 * @param buffer - Buffer da imagem
 * @returns MIME type inferido ou padrão 'image/jpeg'
 */
function inferMimeTypeFromBuffer(buffer: Buffer): string {
  // PNG: 89 50 4E 47
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }
  // JPEG: FF D8 FF
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }
  // WebP: 52 49 46 46 ... 57 45 42 50
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "image/webp";
  }
  // Padrão: assumir JPEG
  return "image/jpeg";
}

/**
 * Valida entropia do device fingerprint para conformidade legal.
 *
 * CONFORMIDADE LEGAL - MP 2.200-2/2001, Art. 10, § 2º, alínea (b)
 *
 * A alínea (b) exige que a assinatura "seja capaz de identificar seu signatário
 * de forma inequívoca". O device fingerprint complementa a identificação biométrica
 * (foto) ao criar uma "impressão digital" única do dispositivo usado na assinatura.
 *
 * Campos obrigatórios (mínimo 4):
 * - screen_resolution: Resolução da tela (ex: "1920x1080")
 * - platform: Plataforma do SO (ex: "Win32", "MacIntel")
 * - user_agent: String do navegador/SO
 * - timezone_offset: Fuso horário em minutos (ex: -180)
 *
 * Campos recomendados (mínimo 2 adicionais):
 * - canvas_hash: Hash SHA-256 do canvas fingerprint (alta entropia)
 * - hardware_concurrency: Número de núcleos de CPU
 * - language: Idioma do navegador (ex: "pt-BR")
 * - color_depth: Profundidade de cor da tela
 *
 * Total mínimo: 6 campos (4 obrigatórios + 2 recomendados)
 *
 * @param fingerprint - Dados do device fingerprint coletados no frontend
 * @throws {Error} Se entropia for insuficiente (< 6 campos)
 *
 * @example
 * const fingerprint = {
 *   screen_resolution: "1920x1080",
 *   platform: "Win32",
 *   user_agent: "Mozilla/5.0...",
 *   timezone_offset: -180,
 *   canvas_hash: "a3c5f1e2...",
 *   hardware_concurrency: 8,
 *   language: 'pt-BR',
 *   color_depth: 24
 * };
 * validateDeviceFingerprintEntropy(fingerprint); // OK (8 campos)
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
    logger.debug("Device fingerprint não fornecido (opcional)", context);
    return true;
  }

  // Se for obrigatório e estiver ausente, rejeitar
  if (required && !fingerprint) {
    logger.warn("Device fingerprint obrigatório não fornecido", context);
    throw new Error("Device fingerprint é obrigatório para conformidade legal");
  }

  // Campos obrigatórios para entropia mínima
  const requiredFields = [
    "screen_resolution",
    "platform",
    "user_agent",
    "timezone_offset",
  ];

  // Campos recomendados para entropia adicional
  const recommendedFields = [
    "canvas_hash",
    "hardware_concurrency",
    "language",
    "color_depth",
  ];

  // Contar campos presentes (não-null, não-undefined, não-string-vazia)
  const presentRequiredFields = requiredFields.filter(
    (field) =>
      fingerprint![field as keyof DeviceFingerprintData] !== null &&
      fingerprint![field as keyof DeviceFingerprintData] !== undefined &&
      fingerprint![field as keyof DeviceFingerprintData] !== ""
  );

  const presentRecommendedFields = recommendedFields.filter(
    (field) =>
      fingerprint![field as keyof DeviceFingerprintData] !== null &&
      fingerprint![field as keyof DeviceFingerprintData] !== undefined &&
      fingerprint![field as keyof DeviceFingerprintData] !== ""
  );

  const totalFields =
    presentRequiredFields.length + presentRecommendedFields.length;
  const minRequiredFields = 4; // Todos os campos obrigatórios
  const minRecommendedFields = 2; // Pelo menos 2 recomendados
  const minTotalFields = 6;

  const hasMinimumEntropy =
    presentRequiredFields.length >= minRequiredFields &&
    presentRecommendedFields.length >= minRecommendedFields &&
    totalFields >= minTotalFields;

  if (!hasMinimumEntropy) {
    logger.warn("Device fingerprint com entropia insuficiente", {
      ...context,
      required_fields_present: presentRequiredFields.length,
      required_fields_expected: minRequiredFields,
      recommended_fields_present: presentRecommendedFields.length,
      recommended_fields_expected: minRecommendedFields,
      total_fields: totalFields,
      min_total_fields: minTotalFields,
      missing_required: requiredFields.filter(
        (f) => !presentRequiredFields.includes(f)
      ),
      missing_recommended: recommendedFields.filter(
        (f) => !presentRecommendedFields.includes(f)
      ),
    });
    return false;
  }

  logger.debug("Device fingerprint validado com entropia suficiente", {
    ...context,
    total_fields: totalFields,
    required_fields: presentRequiredFields.length,
    recommended_fields: presentRecommendedFields.length,
  });

  return true;
}

/**
 * Valida que a foto biométrica está embedada no PDF final.
 *
 * CONFORMIDADE LEGAL - MP 2.200-2/2001, Art. 10, § 2º, alínea (b)
 *
 * A foto selfie é evidência biométrica crítica para identificação inequívoca
 * do signatário. Ela DEVE estar embedada diretamente no PDF (não apenas
 * armazenada separadamente no storage) para garantir integridade forense.
 *
 * Se a foto estiver apenas no storage (Backblaze B2), um atacante poderia
 * alegar que a foto foi substituída após a assinatura. Ao embedar a foto
 * no PDF e calcular o hash_final_sha256, qualquer alteração (incluindo
 * substituição da foto) seria detectada.
 *
 * Validação heurística (limitações do pdf-lib):
 * - Tamanho do PDF final deve ser >= 50% do tamanho da foto
 * - Página de manifesto deve ter >= 5KB de objetos (imagens embedadas)
 *
 * Nota: Esta é uma validação heurística, não determinística. Em auditorias
 * forenses, recomenda-se inspeção manual do PDF com ferramentas como
 * Adobe Acrobat ou pdfinfo.
 *
 * @param pdfBuffer - Buffer do PDF final (após flatten)
 * @param fotoBase64 - Data URL da foto que deveria estar embedada
 * @returns true se validação passar, false caso contrário
 *
 * @example
 * const pdfBuffer = await fs.readFile('documento-assinado.pdf');
 * const fotoBase64 = "data:image/jpeg;base64,...";
 * const isEmbedded = await validatePhotoEmbedding(pdfBuffer, fotoBase64);
 * if (!isEmbedded) {
 *   throw new Error('Foto não está embedada no PDF');
 * }
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
    logger.debug("Nenhuma foto fornecida para validação de embedding", context);
    return true;
  }

  try {
    logger.debug("Validando embedding de foto no PDF", context);

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
      logger.warn(
        "PDF final menor que esperado (foto pode não estar embedada)",
        {
          ...context,
          pdf_size: pdfSize,
          foto_size: fotoSize,
          min_expected_size: minExpectedSize,
        }
      );
      return false;
    }

    // Validação adicional: Verificar se a última página (manifesto) tem conteúdo suficiente
    // (manifesto com foto deve ter mais objetos que manifesto sem foto)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const manifestPageObjects = (manifestPage.node as any).toString().length;
    const minManifestSize = 5000; // Manifesto com foto deve ter pelo menos 5KB de objetos

    if (manifestPageObjects < minManifestSize) {
      logger.warn(
        "Página de manifesto com conteúdo insuficiente (foto pode não estar embedada)",
        {
          ...context,
          manifest_page_size: manifestPageObjects,
          min_manifest_size: minManifestSize,
        }
      );
      return false;
    }

    logger.debug("Foto validada como embedada no PDF", {
      ...context,
      pdf_size: pdfSize,
      foto_size: fotoSize,
      manifest_page_size: manifestPageObjects,
    });

    return true;
  } catch (error) {
    logger.error("Erro ao validar embedding de foto", error, context);
    // Em caso de erro, assumir que validação falhou (fail-safe)
    return false;
  }
}

function buildProtocol(): string {
  const now = new Date();
  const ts = now
    .toISOString()
    .replace(/[-:T.Z]/g, "")
    .slice(0, 14);
  const rand = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, "0");
  return `FS-${ts}-${rand}`;
}

/**
 * Persiste registro de assinatura no banco com todos os metadados.
 *
 * Campos críticos para conformidade legal:
 * - hash_original_sha256: Hash do PDF antes da assinatura (prova de conteúdo)
 * - hash_final_sha256: Hash do PDF após manifesto e flatten (prova de integridade)
 * - termos_aceite_versao: Versão dos termos aceitos (ex: "v1.0-MP2200-2")
 * - termos_aceite_data: Timestamp UTC do aceite (ISO 8601)
 * - dispositivo_fingerprint_raw: JSONB com dados do device (>= 6 campos)
 *
 * @param payload - Dados da assinatura a persistir
 * @param pdfUrl - URL do PDF final
 * @param protocolo - Protocolo da assinatura
 * @param hashOriginal - Hash do PDF original
 * @param hashFinal - Hash do PDF final
 * @param assinaturaUrl - URL da imagem da assinatura
 * @param fotoUrl - URL da foto do signatário
 * @returns Objeto com o ID, protocolo e URL do PDF da assinatura inserida.
 * @throws {Error} Se insert falhar
 */
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
    .from("assinatura_digital_assinaturas")
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
      status: "concluida",
      enviado_sistema_externo: false,
      // Campos de conformidade MP 2.200-2/2001
      hash_original_sha256: hashOriginal,
      hash_final_sha256: hashFinal,
      termos_aceite_versao: payload.termos_aceite_versao,
      termos_aceite_data: new Date().toISOString(),
      dispositivo_fingerprint_raw: payload.dispositivo_fingerprint_raw ?? null,
    })
    .select("id, protocolo, pdf_url")
    .single();

  if (error) {
    throw new Error(`Erro ao registrar assinatura: ${error.message}`);
  }

  return data;
}

export async function generatePreview(
  payload: PreviewPayload
): Promise<PreviewResult> {
  const timer = createTimer();
  const context = {
    service: SERVICE,
    operation: LogOperations.PREVIEW,
    cliente_id: payload.cliente_id,
    template_id: payload.template_id,
  };

  logger.info("Gerando preview de assinatura", context);

  const [cliente, template] = await Promise.all([
    getClienteBasico(payload.cliente_id),
    getTemplateBasico(payload.template_id),
  ]);

  if (!cliente) {
    logger.warn("Cliente não encontrado para preview", context);
    throw new Error("Cliente não encontrado");
  }
  if (!template || !template.ativo) {
    logger.warn("Template não encontrado ou inativo para preview", {
      ...context,
      template_ativo: template?.ativo,
    });
    throw new Error("Template não encontrado ou inativo");
  }

  const dummySegmento = {
    id: 0,
    nome: "Preview",
    slug: "preview",
    ativo: true,
  };
  const dummyFormulario = {
    id: 0,
    formulario_uuid: "preview",
    nome: "Preview",
    slug: "preview",
    segmento_id: 0,
    ativo: true,
  };

  // Extrair dados de parte contrária se disponível (only in FinalizePayload)
  const isFinalizePayload = 'parte_contraria_dados' in payload;
  const parteContrariaNome =
    isFinalizePayload &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (payload as any).parte_contraria_dados?.length > 0
      ? (payload as any).parte_contraria_dados[0].nome
      : undefined;

  logger.debug("Gerando PDF de preview", context);
  const pdfBuffer = await generatePdfFromTemplate(
    template,
    {
      cliente,
      segmento: dummySegmento,
      formulario: dummyFormulario,
      protocolo: "PREVIEW",
      parte_contraria: parteContrariaNome
        ? { nome: parteContrariaNome }
        : undefined,
    },
    { acao_id: payload.acao_id },
    { fotoBase64: payload.foto_base64 || undefined }
  );

  logger.debug("Armazenando PDF de preview", context);
  const stored = await storePdf(pdfBuffer);

  timer.log("Preview gerado com sucesso", context, {
    pdf_size: pdfBuffer.length,
  });
  return { pdf_url: stored.url };
}

/**
 * Finaliza assinatura digital com conformidade legal MP 2.200-2/2001.
 *
 * FLUXO COMPLETO DE FINALIZAÇÃO
 *
 * Este é o ponto central do módulo de assinatura digital. Implementa todas
 * as 4 alíneas do Art. 10, § 2º da MP 2.200-2/2001 para Assinatura Eletrônica
 * Avançada sem certificado ICP-Brasil.
 *
 * Etapas (ordem crítica para cadeia de custódia):
 *
 * 1. VALIDAÇÃO DE ENTRADA
 *    - Verifica aceite de termos (termos_aceite === true)
 *    - Valida entropia do device fingerprint (>= 6 campos)
 *    - Confirma presença de foto se formulário exigir
 *
 * 2. COLETA DE DADOS
 *    - Busca cliente, template, formulário, segmento no Supabase
 *    - Monta contexto completo para geração de PDF
 *
 * 3. ARMAZENAMENTO DE IMAGENS
 *    - Upload de assinatura manuscrita (PNG) para Backblaze B2
 *    - Upload de foto selfie (JPEG) para Backblaze B2
 *    - Gera URLs assinadas (expiration: 1 ano)
 *
 * 4. GERAÇÃO DE PDF PRÉ-ASSINATURA
 *    - Gera PDF preenchido com dados do formulário (SEM imagens)
 *    - Calcula hash_original_sha256 (prova de integridade do conteúdo)
 *
 * 5. MONTAGEM DO PDF FINAL
 *    - Recarrega PDF e insere imagens (assinatura + foto)
 *    - Anexa página de manifesto com todas as evidências
 *    - Flatten do PDF (trava edições, remove campos interativos)
 *    - Calcula hash_final_sha256 (prova de integridade do documento completo)
 *
 * 6. VALIDAÇÃO DE INTEGRIDADE
 *    - Verifica embedding da foto no PDF (heurística)
 *
 * 7. PERSISTÊNCIA
 *    - Upload do PDF final para Backblaze B2
 *    - Insert no banco com todos os metadados + hashes
 *    - Retorna protocolo + URLs para download
 *
 * CONFORMIDADE LEGAL - Mapeamento das Alíneas:
 *
 * - Alínea (a) - Associação unívoca: Device fingerprint + IP + geolocalização
 * - Alínea (b) - Identificação inequívoca: Foto selfie + CPF + dados pessoais
 * - Alínea (c) - Controle exclusivo: Captura em tempo real (webcam/canvas)
 * - Alínea (d) - Detecção de modificações: Dual hashing SHA-256 + flatten
 *
 * @param payload - Dados completos da assinatura (FinalizePayload)
 * @returns Objeto com protocolo, URLs dos PDFs, e metadados
 * @throws {Error} Se validação falhar ou ocorrer erro técnico
 *
 * @example
 * const result = await finalizeSignature({
 *   cliente_id: 123,
 *   formulario_id: 456,
 *   template_id: 789,
 *   assinatura_base64: "data:image/png;base64,...",
 *   foto_base64: "data:image/jpeg;base64,...",
 *   termos_aceite: true,
 *   termos_aceite_versao: "v1.0-MP2200-2",
 *   dispositivo_fingerprint_raw: { screen_resolution: "1920x1080", ... },
 *   // ... outros campos
 * });
 * console.log(result.protocolo); // "FS-20250110120000-A1B2C"
 */
export async function finalizeSignature(
  payload: FinalizePayload
): Promise<FinalizeResult> {
  const timer = createTimer();
  const context = {
    service: SERVICE,
    operation: LogOperations.FINALIZE,
    cliente_id: payload.cliente_id,
    template_id: payload.template_id,
    segmento_id: payload.segmento_id,
    formulario_id: payload.formulario_id,
  };

  logger.info("Iniciando finalização de assinatura", context);

  if (!payload.assinatura_base64) {
    logger.warn("Tentativa de finalização sem assinatura", context);
    throw new Error("assinatura_base64 é obrigatória");
  }

  // Validação de termos de aceite (conformidade MP 2.200-2/2001)
  if (!payload.termos_aceite || !payload.termos_aceite_versao) {
    logger.warn("Tentativa de finalização sem aceite de termos", context);
    throw new Error(
      "Aceite de termos é obrigatório (termos_aceite e termos_aceite_versao)"
    );
  }

  logger.info("Termos de aceite validados", {
    ...context,
    termos_versao: payload.termos_aceite_versao,
  });

  // Validação de entropia do device fingerprint (conformidade MP 2.200-2/2001)
  // IMPORTANTE: Device fingerprint é fortemente recomendado mas não obrigatório para
  // manter retrocompatibilidade. Assinaturas sem fingerprint ou com entropia baixa
  // terão menor robustez de evidência forense.
  const entropiaSuficiente = validateDeviceFingerprintEntropy(
    payload.dispositivo_fingerprint_raw,
    false // Não obrigatório, mas fortemente recomendado
  );

  if (!payload.dispositivo_fingerprint_raw) {
    logger.warn(
      "Assinatura sem device fingerprint - evidência de identificação do signatário reduzida (Art. 10, § 2º, alínea b, MP 2.200-2/2001)",
      {
        ...context,
        impacto:
          "Menor robustez forense - recomenda-se coletar fingerprint em futuras assinaturas",
      }
    );
  } else if (!entropiaSuficiente) {
    logger.warn(
      "Device fingerprint com entropia insuficiente - identificação do signatário pode ser questionável",
      {
        ...context,
        impacto:
          "Evidência biométrica fraca - recomenda-se coletar mais campos do dispositivo",
        campos_minimos:
          "screen_resolution, platform, user_agent, timezone_offset, canvas_hash, hardware_concurrency",
      }
    );
  } else {
    logger.info("Device fingerprint validado com entropia suficiente", {
      ...context,
      conformidade: "Evidência biométrica robusta coletada",
    });
  }

  logger.debug("Buscando dados para finalização", context);
  const [cliente, template, formulario, segmento] = await Promise.all([
    getClienteBasico(payload.cliente_id),
    getTemplateBasico(payload.template_id),
    getFormularioBasico(payload.formulario_id),
    getSegmentoBasico(payload.segmento_id),
  ]);

  if (!cliente) {
    logger.warn("Cliente não encontrado para finalização", context);
    throw new Error("Cliente não encontrado");
  }
  if (!template || !template.ativo) {
    logger.warn("Template não encontrado ou inativo para finalização", context);
    throw new Error("Template não encontrado ou inativo");
  }
  if (!formulario || !formulario.ativo) {
    logger.warn(
      "Formulário não encontrado ou inativo para finalização",
      context
    );
    throw new Error("Formulário não encontrado ou inativo");
  }
  if (!segmento || !segmento.ativo) {
    logger.warn("Segmento não encontrado ou inativo para finalização", context);
    throw new Error("Segmento não encontrado ou inativo");
  }

  // Validação de foto baseada na configuração do formulário
  const fotoObrigatoria = formulario.foto_necessaria === true;
  if (fotoObrigatoria && !payload.foto_base64) {
    logger.warn(
      "Tentativa de finalização sem foto (obrigatória para este formulário)",
      {
        ...context,
        foto_necessaria: formulario.foto_necessaria,
      }
    );
    throw new Error(
      "Foto é obrigatória para este formulário (foto_necessaria=true)"
    );
  }

  logger.debug("Armazenando imagens (assinatura/foto)", context);
  const assinaturaStored = await storeSignatureImage(payload.assinatura_base64);
  const fotoStored = payload.foto_base64
    ? await storePhotoImage(payload.foto_base64)
    : undefined;

  const protocolo = buildProtocol();
  logger.debug("Protocolo gerado", { ...context, protocolo });

  // Extrair dados de parte contrária se disponível
  const parteContrariaNome =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload.parte_contraria_dados && payload.parte_contraria_dados.length > 0
      ? payload.parte_contraria_dados[0].nome
      : undefined;

  // ==========================================================================
  // FASE 1: Gerar PDF pré-assinatura e calcular hash original
  // ==========================================================================
  // Preparar extras com dados completos do cliente se disponível
  const extras: Record<string, unknown> = {
    segmento_id: payload.segmento_id,
    formulario_id: payload.formulario_id,
    acao_id: payload.acao_id,
    latitude: payload.latitude,
    longitude: payload.longitude,
    geolocation_accuracy: payload.geolocation_accuracy,
    geolocation_timestamp: payload.geolocation_timestamp,
  };

  // Adicionar dados completos do cliente se disponível no payload
  if (payload.cliente_dados) {
    extras.cliente_dados = payload.cliente_dados;
    // Também adicionar campos individuais do cliente para facilitar acesso
    Object.entries(payload.cliente_dados).forEach(([key, value]) => {
      extras[`cliente.${key}`] = value;
    });
  }

  logger.debug("Gerando PDF pré-assinatura (sem imagens)", context);
  const pdfBufferPreSign = await generatePdfFromTemplate(
    template,
    {
      cliente,
      segmento,
      formulario,
      protocolo,
      ip: payload.ip_address,
      user_agent: payload.user_agent,
      parte_contraria: parteContrariaNome
        ? { nome: parteContrariaNome }
        : undefined,
    },
    extras,
    undefined // Sem imagens para calcular hash original
  );

  let hashOriginal: string;
  try {
    hashOriginal = calculateHash(pdfBufferPreSign);
    logger.debug("Hash original calculado", {
      ...context,
      hash_prefix: hashOriginal.slice(0, 8),
    });
  } catch (error) {
    logger.error("Erro ao calcular hash original", error, context);
    throw new Error("Falha na geração de hash de integridade");
  }

  // ==========================================================================
  // FASE 2: Gerar PDF com assinatura/foto e anexar manifesto
  // ==========================================================================
  logger.debug("Gerando PDF com assinatura e foto", context);
  const pdfBufferWithImages = await generatePdfFromTemplate(
    template,
    {
      cliente,
      segmento,
      formulario,
      protocolo,
      ip: payload.ip_address,
      user_agent: payload.user_agent,
      parte_contraria: parteContrariaNome
        ? { nome: parteContrariaNome }
        : undefined,
    },
    extras,
    {
      assinaturaBase64: payload.assinatura_base64,
      fotoBase64: payload.foto_base64 || undefined,
    }
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
      cpf: cliente.cpf || "",
      dataHora: dataAssinatura.toISOString(),
      dataHoraLocal: dataAssinatura.toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
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
          plataforma: payload.dispositivo_fingerprint_raw.platform as
            | string
            | undefined,
          navegador: payload.dispositivo_fingerprint_raw.user_agent as
            | string
            | undefined,
          resolucao: payload.dispositivo_fingerprint_raw.screen_resolution as
            | string
            | undefined,
        }
      : undefined,
  };

  // Anexar página de manifesto
  try {
    await appendManifestPage(pdfDoc, manifestData);
    logger.debug("Manifesto anexado ao PDF", context);
  } catch (error) {
    logger.error("Erro ao anexar manifesto ao PDF", error, context);
    throw new Error("Falha ao gerar página de manifesto");
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
    logger.debug("Hash final calculado", {
      ...context,
      hash_prefix: hashFinal.slice(0, 8),
    });
  } catch (error) {
    logger.error("Erro ao calcular hash final", error, context);
    throw new Error("Falha na geração de hash de integridade final");
  }

  // Validação de embedding de foto (conformidade MP 2.200-2/2001)
  if (payload.foto_base64) {
    const fotoEmbedded = await validatePhotoEmbedding(
      finalPdfBuffer,
      payload.foto_base64
    );
    if (!fotoEmbedded) {
      logger.warn(
        "AVISO DE INTEGRIDADE: Validação de embedding de foto falhou (heurística). " +
          "A assinatura prosseguirá, mas a integridade forense da foto pode ser questionada. " +
          "Recomenda-se auditoria manual do PDF final.",
        {
          ...context,
          cause:
            "A validação heurística (tamanho do PDF vs. tamanho da foto) não foi satisfeita.",
        }
      );
    } else {
      logger.info("Foto validada como embedada no PDF", context);
    }
  }

  logger.debug("Armazenando PDF final", context);
  const pdfStored = await storePdf(finalPdfBuffer);

  logger.debug("Registrando assinatura no banco", context);
  const record = await insertAssinaturaRecord(
    payload,
    pdfStored.url,
    protocolo,
    hashOriginal,
    hashFinal,
    assinaturaStored.url,
    fotoStored?.url
  );

  timer.log(
    "Assinatura finalizada com sucesso",
    {
      ...context,
      protocolo,
      assinatura_id: record.id,
    },
    { pdf_size: finalPdfBuffer.length }
  );

  return {
    assinatura_id: record.id,
    protocolo: record.protocolo,
    pdf_url: record.pdf_url,
  };
}

export async function listSessoes(
  params: ListSessoesParams = {}
): Promise<ListSessoesResult> {
  const timer = createTimer();
  const context = { service: SERVICE, operation: LogOperations.LIST, params };

  logger.debug("Listando sessões de assinatura", context);

  const supabase = createServiceClient();
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from("assinatura_digital_sessoes_assinatura")
    .select("*", { count: "exact" });

  if (params.status) {
    query = query.eq("status", params.status);
  }
  if (params.data_inicio) {
    query = query.gte("created_at", params.data_inicio);
  }
  if (params.data_fim) {
    query = query.lte("created_at", params.data_fim);
  }
  // search por sessao_uuid
  if (params.search) {
    const term = params.search.trim();
    query = query.ilike("sessao_uuid", `%${term}%`);
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) {
    logger.error("Erro ao listar sessões", error, context);
    throw new Error(`Erro ao listar sessões: ${error.message}`);
  }

  const result = {
    sessoes: data || [],
    total: count ?? 0,
    page,
    pageSize,
  };

  timer.log("Sessões listadas com sucesso", context, {
    count: result.total,
    page,
    pageSize,
  });
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
    const pathParts = urlObj.pathname.split("/").filter(Boolean);
    const bucket = pathParts[0];
    const key = pathParts.slice(1).join("/");

    logger.debug("Baixando PDF do storage", { ...context, bucket, key });

    // Configurar cliente S3 para Backblaze
    const endpoint = process.env.B2_ENDPOINT;
    const region = process.env.B2_REGION;
    const keyId = process.env.B2_ACCESS_KEY_ID;
    const applicationKey = process.env.B2_SECRET_ACCESS_KEY;

    if (!endpoint || !region || !keyId || !applicationKey) {
      throw new Error(
        "Configuração do Backblaze B2 incompleta. Verifique as variáveis de ambiente B2_ENDPOINT, B2_REGION, B2_ACCESS_KEY_ID, e B2_SECRET_ACCESS_KEY."
      );
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
      throw new Error("Resposta do storage sem corpo");
    }

    // Converter stream para buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    logger.debug("PDF baixado com sucesso", {
      ...context,
      size: buffer.length,
    });
    return buffer;
  } catch (error) {
    logger.error("Erro ao baixar PDF do storage", error, context);
    throw new Error(
      `Falha ao baixar PDF: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Realiza auditoria forense completa de uma assinatura digital.
 *
 * PROCEDIMENTO DE AUDITORIA - MP 2.200-2/2001
 *
 * Esta função implementa verificação independente de integridade documental,
 * essencial para contestações judiciais ou auditorias de compliance.
 *
 * Verificações realizadas:
 *
 * 1. INTEGRIDADE DO HASH (crítico)
 *    - Baixa PDF do storage (Backblaze B2)
 *    - Recalcula hash SHA-256 do PDF atual
 *    - Compara com hash_final_sha256 armazenado no banco
 *    - Usa crypto.timingSafeEqual() para evitar timing attacks
 *    - Resultado: VÁLIDO (hashes batem) ou INVÁLIDO (documento adulterado)
 *
 * 2. ENTROPIA DO DEVICE FINGERPRINT (recomendado)
 *    - Valida que fingerprint tem >= 6 campos (4 obrigatórios + 2 recomendados)
 *    - Aviso se entropia for insuficiente (não bloqueia auditoria)
 *
 * 3. EMBEDDING DA FOTO (heurístico)
 *    - Verifica que foto está embedada no PDF (não apenas no storage)
 *    - Usa heurística de tamanho (PDF >= 50% foto + manifesto >= 5KB)
 *    - Aviso se validação falhar (não bloqueia auditoria)
 *
 * Status de retorno:
 * - "valido": Todas as verificações críticas passaram
 * - "invalido": Hash divergente (documento adulterado)
 * - "erro": Falha técnica (PDF não encontrado, erro de download, etc.)
 *
 * @param assinaturaId - ID da assinatura a auditar
 * @returns Objeto AuditResult com status, verificações, avisos, e erros
 *
 * @example
 * // Auditoria de rotina
 * const result = await auditSignatureIntegrity(12345);
 * if (result.status === 'invalido') {
 *   console.error('ALERTA: Documento adulterado!', result.erros);
 * }
 *
 * @example
 * // Perícia judicial
 * const sessoes = await listSessoes({ protocolo: 'FS-20250110120000-A1B2C' });
 * const auditoria = await auditSignatureIntegrity(sessoes[0].id);
 * // Exportar auditoria.verificacoes para laudo pericial
 */
export async function auditSignatureIntegrity(
  assinaturaId: number
): Promise<AuditResult> {
  const timer = createTimer();
  const context = {
    service: SERVICE,
    operation: LogOperations.AUDIT,
    assinatura_id: assinaturaId,
  };

  logger.info("Iniciando auditoria de integridade de assinatura", context);

  const avisos: string[] = [];
  const erros: string[] = [];

  // Buscar registro da assinatura no banco
  const supabase = createServiceClient();
  const { data: assinatura, error: fetchError } = await supabase
    .from("assinatura_digital_assinaturas")
    .select("*")
    .eq("id", assinaturaId)
    .single();

  if (fetchError || !assinatura) {
    logger.error(
      "Assinatura não encontrada para auditoria",
      fetchError,
      context
    );
    throw new Error(`Assinatura ${assinaturaId} não encontrada`);
  }

  logger.debug("Assinatura carregada para auditoria", {
    ...context,
    protocolo: assinatura.protocolo,
  });

  // ==========================================================================
  // VALIDAÇÃO 1: Integridade Criptográfica (Recalcular Hash Final)
  // ==========================================================================
  let hashFinalRecalculado: string;
  let hashesValidos = false;

  try {
    logger.debug("Baixando PDF para recálculo de hash", context);
    const pdfBuffer = await downloadPdfFromStorage(assinatura.pdf_url);

    logger.debug("Recalculando hash final do PDF", context);
    hashFinalRecalculado = calculateHash(pdfBuffer);

    // Comparar hashes usando VERIFY_HASH operation
    const hashRegistrado = assinatura.hash_final_sha256;
    if (!hashRegistrado) {
      erros.push("Hash final não foi registrado no banco (campo vazio)");
      logger.warn("Hash final ausente no banco", context);
    } else {
      const verifyContext = {
        ...context,
        operation: LogOperations.VERIFY_HASH,
      };
      logger.debug("Verificando integridade do hash", verifyContext);
      hashesValidos = verifyHash(pdfBuffer, hashRegistrado);
      if (!hashesValidos) {
        avisos.push(
          `ALERTA DE INTEGRIDADE: Hash final não confere. ` +
            `Registrado: ${hashRegistrado.slice(0, 16)}..., ` +
            `Recalculado: ${hashFinalRecalculado.slice(0, 16)}...`
        );
        logger.warn("Falha na verificação de integridade: hash não confere", {
          ...verifyContext,
          hash_registrado: hashRegistrado.slice(0, 16),
          hash_recalculado: hashFinalRecalculado.slice(0, 16),
        });
      } else {
        logger.info(
          "Hash final validado com sucesso - documento íntegro",
          verifyContext
        );
      }
    }
  } catch (error) {
    hashFinalRecalculado = "";
    erros.push(
      `Erro ao recalcular hash: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    logger.error("Erro ao recalcular hash final", error, context);
  }

  // ==========================================================================
  // VALIDAÇÃO 2: Entropia do Device Fingerprint
  // ==========================================================================
  let entropiaSuficiente = false;
  let entropiaDetalhes;

  try {
    if (!assinatura.dispositivo_fingerprint_raw) {
      avisos.push("Device fingerprint não foi coletado (campo vazio)");
      logger.warn("Device fingerprint ausente", context);
    } else {
      entropiaSuficiente = validateDeviceFingerprintEntropy(
        assinatura.dispositivo_fingerprint_raw as DeviceFingerprintData,
        false // Não obrigatório em auditoria (já foi aceito)
      );

      const fingerprint =
        assinatura.dispositivo_fingerprint_raw as DeviceFingerprintData;
      const requiredFields = [
        "screen_resolution",
        "platform",
        "user_agent",
        "timezone_offset",
      ];
      const recommendedFields = [
        "canvas_hash",
        "hardware_concurrency",
        "language",
        "color_depth",
      ];

      const presentRequiredFields = requiredFields.filter(
        (field) =>
          fingerprint[field as keyof DeviceFingerprintData] !== null &&
          fingerprint[field as keyof DeviceFingerprintData] !== undefined &&
          fingerprint[field as keyof DeviceFingerprintData] !== ""
      );

      const presentRecommendedFields = recommendedFields.filter(
        (field) =>
          fingerprint[field as keyof DeviceFingerprintData] !== null &&
          fingerprint[field as keyof DeviceFingerprintData] !== undefined &&
          fingerprint[field as keyof DeviceFingerprintData] !== ""
      );

      entropiaDetalhes = {
        campos_presentes:
          presentRequiredFields.length + presentRecommendedFields.length,
        campos_obrigatorios: presentRequiredFields.length,
        campos_recomendados: presentRecommendedFields.length,
      };

      if (!entropiaSuficiente) {
        avisos.push(
          `Device fingerprint com entropia insuficiente ` +
            `(${entropiaDetalhes.campos_presentes} campos, mínimo recomendado: 6)`
        );
        logger.warn("Entropia insuficiente detectada em auditoria", {
          ...context,
          ...entropiaDetalhes,
        });
      } else {
        logger.debug("Entropia de fingerprint validada", {
          ...context,
          ...entropiaDetalhes,
        });
      }
    }
  } catch (error) {
    erros.push(
      `Erro ao validar entropia: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    logger.error("Erro ao validar entropia de fingerprint", error, context);
  }

  // ==========================================================================
  // VALIDAÇÃO 3: Embedding de Foto (se aplicável)
  // ==========================================================================
  let fotoEmbedada: boolean | undefined;

  try {
    if (assinatura.foto_url) {
      logger.debug("Validando embedding de foto em auditoria", context);
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
          "Foto pode não estar embedada no PDF " +
            `(manifesto com ${manifestPageSize} bytes, esperado >= ${minManifestSize})`
        );
        logger.warn("Possível falha de embedding de foto detectada", {
          ...context,
          manifest_page_size: manifestPageSize,
          min_manifest_size: minManifestSize,
        });
      } else {
        logger.debug("Foto validada como embedada", context);
      }
    }
  } catch (error) {
    erros.push(
      `Erro ao validar embedding de foto: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    logger.error("Erro ao validar embedding de foto", error, context);
  }

  // ==========================================================================
  // RESULTADO DA AUDITORIA
  // ==========================================================================
  const status: "valido" | "invalido" | "erro" =
    erros.length > 0 ? "erro" : !hashesValidos ? "invalido" : "valido";

  const result: AuditResult = {
    assinatura_id: assinatura.id,
    protocolo: assinatura.protocolo,
    status,
    hashes_validos: hashesValidos,
    hash_original_registrado: assinatura.hash_original_sha256,
    hash_final_registrado: assinatura.hash_final_sha256 || "",
    hash_final_recalculado: hashFinalRecalculado,
    entropia_suficiente: entropiaSuficiente,
    entropia_detalhes: entropiaDetalhes,
    foto_embedada: fotoEmbedada,
    avisos,
    erros,
    auditado_em: new Date().toISOString(),
  };

  timer.log("Auditoria de integridade concluída", context, {
    status,
    hashes_validos: hashesValidos,
    entropia_suficiente: entropiaSuficiente,
    avisos_count: avisos.length,
    erros_count: erros.length,
  });

  return result;
}
