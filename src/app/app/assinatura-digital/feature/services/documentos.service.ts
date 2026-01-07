import { randomBytes, randomUUID } from "crypto";
import { PDFDocument, type PDFImage } from "pdf-lib";
import { createServiceClient } from "@/lib/supabase/service-client";
import { uploadToBackblaze } from "@/lib/storage/backblaze-b2.service";
import { calculateHash } from "../services/integrity.service";
import { decodeDataUrlToBuffer } from "../services/base64";
import { downloadFromStorageUrl } from "../services/signature";
import {
  TABLE_DOCUMENTOS,
  TABLE_DOCUMENTO_ASSINANTES,
  TABLE_DOCUMENTO_ANCORAS,
} from "./constants";
import { calculateTokenExpiration, calculatePostSignatureExpiration } from "../utils/token-expiration";
import type {
  AssinaturaDigitalDocumento,
  AssinaturaDigitalDocumentoAssinante,
  AssinaturaDigitalDocumentoAncora,
  AssinaturaDigitalDocumentoAssinanteTipo,
  CreateAssinaturaDigitalDocumentoAssinanteInput,
  CreateAssinaturaDigitalDocumentoInput,
  UpsertAssinaturaDigitalDocumentoAncoraInput,
} from "../types/types";

function buildPublicLink(token: string): string {
  return `/assinatura/${token}`;
}

function generateOpaqueToken(): string {
  // 32 bytes -> 64 chars hex (não enumerável e suficientemente imprevisível)
  return randomBytes(32).toString("hex");
}

async function fetchAssinanteSnapshot(
  tipo: AssinaturaDigitalDocumentoAssinanteTipo,
  entidadeId?: number | null
): Promise<Record<string, unknown>> {
  if (!entidadeId || tipo === "convidado") return {};

  const supabase = createServiceClient();

  // Normalização do snapshot para a jornada pública
  // (evita dependência das tabelas externas no link público)
  if (tipo === "cliente") {
    const { data } = await supabase
      .from("clientes")
      .select("id, nome, cpf, cnpj, emails, ddd_celular, numero_celular")
      .eq("id", entidadeId)
      .single();

    if (!data) return {};
    const email =
      Array.isArray(data.emails) && data.emails.length > 0 ? data.emails[0] : null;
    const telefone =
      data.ddd_celular && data.numero_celular
        ? `${data.ddd_celular}${data.numero_celular}`
        : null;

    return {
      entidade_id: data.id,
      nome_completo: data.nome,
      cpf: data.cpf ?? null,
      cnpj: data.cnpj ?? null,
      email: email ?? null,
      telefone: telefone ?? null,
    };
  }

  if (tipo === "parte_contraria") {
    const { data } = await supabase
      .from("partes_contrarias")
      .select("id, nome, cpf, cnpj, emails, ddd_celular, numero_celular")
      .eq("id", entidadeId)
      .single();

    if (!data) return {};
    const email =
      Array.isArray(data.emails) && data.emails.length > 0 ? data.emails[0] : null;
    const telefone =
      data.ddd_celular && data.numero_celular
        ? `${data.ddd_celular}${data.numero_celular}`
        : null;

    return {
      entidade_id: data.id,
      nome_completo: data.nome,
      cpf: data.cpf ?? null,
      cnpj: data.cnpj ?? null,
      email: email ?? null,
      telefone: telefone ?? null,
    };
  }

  if (tipo === "representante") {
    const { data } = await supabase
      .from("representantes")
      .select("id, nome, cpf, email, emails, ddd_celular, numero_celular")
      .eq("id", entidadeId)
      .single();

    if (!data) return {};
    const email =
      data.email ??
      (Array.isArray(data.emails) && data.emails.length > 0 ? data.emails[0] : null);
    const telefone =
      data.ddd_celular && data.numero_celular
        ? `${data.ddd_celular}${data.numero_celular}`
        : null;

    return {
      entidade_id: data.id,
      nome_completo: data.nome,
      cpf: data.cpf ?? null,
      email: email ?? null,
      telefone: telefone ?? null,
    };
  }

  if (tipo === "terceiro") {
    const { data } = await supabase
      .from("terceiros")
      .select("id, nome, cpf, cnpj, emails, ddd_celular, numero_celular")
      .eq("id", entidadeId)
      .single();

    if (!data) return {};
    const email =
      Array.isArray(data.emails) && data.emails.length > 0 ? data.emails[0] : null;
    const telefone =
      data.ddd_celular && data.numero_celular
        ? `${data.ddd_celular}${data.numero_celular}`
        : null;

    return {
      entidade_id: data.id,
      nome_completo: data.nome,
      cpf: data.cpf ?? null,
      cnpj: data.cnpj ?? null,
      email: email ?? null,
      telefone: telefone ?? null,
    };
  }

  if (tipo === "usuario") {
    const { data } = await supabase
      .from("usuarios")
      .select("id, nome_completo, cpf, email_corporativo, telefone")
      .eq("id", entidadeId)
      .single();

    if (!data) return {};
    return {
      entidade_id: data.id,
      nome_completo: data.nome_completo,
      cpf: data.cpf ?? null,
      email: data.email_corporativo ?? null,
      telefone: data.telefone ?? null,
    };
  }

  return {};
}

export async function createDocumentoFromUploadedPdf(params: {
  titulo?: string | null;
  selfie_habilitada: boolean;
  pdfBuffer: Buffer;
  created_by?: number | null;
  assinantes: CreateAssinaturaDigitalDocumentoAssinanteInput[];
}): Promise<{
  documento: AssinaturaDigitalDocumento;
  assinantes: Array<
    AssinaturaDigitalDocumentoAssinante & {
      public_link: string;
    }
  >;
}> {
  const supabase = createServiceClient();

  const documento_uuid = randomUUID();
  const hashOriginal = calculateHash(params.pdfBuffer);

  const pdfKey = `assinatura-digital/documentos/${documento_uuid}/original.pdf`;
  const uploadedPdf = await uploadToBackblaze({
    buffer: params.pdfBuffer,
    key: pdfKey,
    contentType: "application/pdf",
  });

  const docInsert: CreateAssinaturaDigitalDocumentoInput & {
    documento_uuid: string;
    status: "rascunho";
  } = {
    documento_uuid,
    status: "rascunho",
    titulo: params.titulo ?? null,
    selfie_habilitada: params.selfie_habilitada,
    pdf_original_url: uploadedPdf.url,
    hash_original_sha256: hashOriginal,
    created_by: params.created_by ?? null,
    assinantes: params.assinantes,
  };

  const { assinantes: _, ...docRow } = docInsert;

  const { data: documentoData, error: docError } = await supabase
    .from(TABLE_DOCUMENTOS)
    .insert(docRow)
    .select("*")
    .single();

  if (docError) {
    throw new Error(`Erro ao criar documento: ${docError.message}`);
  }

  const documento = documentoData as AssinaturaDigitalDocumento;

  const assinantesToInsert = await Promise.all(
    params.assinantes.map(async (a) => {
      const snapshot =
        a.dados_snapshot && Object.keys(a.dados_snapshot).length > 0
          ? a.dados_snapshot
          : await fetchAssinanteSnapshot(a.assinante_tipo, a.assinante_entidade_id);

      return {
        documento_id: documento.id,
        assinante_tipo: a.assinante_tipo,
        assinante_entidade_id: a.assinante_entidade_id ?? null,
        dados_snapshot: snapshot ?? {},
        dados_confirmados: false,
        token: generateOpaqueToken(),
        status: "pendente",
        expires_at: calculateTokenExpiration(),
      };
    })
  );

  const { data: assinantesData, error: signersError } = await supabase
    .from(TABLE_DOCUMENTO_ASSINANTES)
    .insert(assinantesToInsert)
    .select("*");

  if (signersError) {
    throw new Error(`Erro ao criar assinantes: ${signersError.message}`);
  }

  const assinantes = (assinantesData as AssinaturaDigitalDocumentoAssinante[]).map(
    (s) => ({
      ...s,
      public_link: buildPublicLink(s.token),
    })
  );

  return { documento, assinantes };
}

export async function getDocumentoByUuid(documentoUuid: string): Promise<{
  documento: AssinaturaDigitalDocumento;
  assinantes: Array<AssinaturaDigitalDocumentoAssinante & { public_link: string }>;
  ancoras: AssinaturaDigitalDocumentoAncora[];
} | null> {
  const supabase = createServiceClient();

  const { data: doc, error: docError } = await supabase
    .from(TABLE_DOCUMENTOS)
    .select("*")
    .eq("documento_uuid", documentoUuid)
    .single();

  if (docError) {
    if (docError.code === "PGRST116") return null;
    throw new Error(`Erro ao obter documento: ${docError.message}`);
  }

  const documento = doc as AssinaturaDigitalDocumento;

  const { data: signers, error: signersError } = await supabase
    .from(TABLE_DOCUMENTO_ASSINANTES)
    .select("*")
    .eq("documento_id", documento.id)
    .order("id");

  if (signersError) {
    throw new Error(`Erro ao obter assinantes: ${signersError.message}`);
  }

  const { data: ancoras, error: anchorsError } = await supabase
    .from(TABLE_DOCUMENTO_ANCORAS)
    .select("*")
    .eq("documento_id", documento.id)
    .order("id");

  if (anchorsError) {
    throw new Error(`Erro ao obter âncoras: ${anchorsError.message}`);
  }

  return {
    documento,
    assinantes: (signers as AssinaturaDigitalDocumentoAssinante[]).map((s) => ({
      ...s,
      public_link: buildPublicLink(s.token),
    })),
    ancoras: (ancoras as AssinaturaDigitalDocumentoAncora[]) ?? [],
  };
}

export async function setDocumentoAnchors(params: {
  documentoUuid: string;
  anchors: UpsertAssinaturaDigitalDocumentoAncoraInput[];
}): Promise<{ ancoras: AssinaturaDigitalDocumentoAncora[] }> {
  const supabase = createServiceClient();

  const { data: doc, error: docError } = await supabase
    .from(TABLE_DOCUMENTOS)
    .select("id")
    .eq("documento_uuid", params.documentoUuid)
    .single();

  if (docError) {
    throw new Error(`Erro ao obter documento: ${docError.message}`);
  }

  const documento_id = (doc as { id: number }).id;

  // Substituir todas as âncoras do documento (simples e previsível)
  const { error: delError } = await supabase
    .from(TABLE_DOCUMENTO_ANCORAS)
    .delete()
    .eq("documento_id", documento_id);

  if (delError) {
    throw new Error(`Erro ao limpar âncoras: ${delError.message}`);
  }

  const toInsert = params.anchors.map((a) => ({
    documento_id,
    documento_assinante_id: a.documento_assinante_id,
    tipo: a.tipo,
    pagina: a.pagina,
    x_norm: a.x_norm,
    y_norm: a.y_norm,
    w_norm: a.w_norm,
    h_norm: a.h_norm,
  }));

  const { data: inserted, error: insError } = await supabase
    .from(TABLE_DOCUMENTO_ANCORAS)
    .insert(toInsert)
    .select("*");

  if (insError) {
    throw new Error(`Erro ao salvar âncoras: ${insError.message}`);
  }

  const { error: updateDocError } = await supabase
    .from(TABLE_DOCUMENTOS)
    .update({ status: "pronto" })
    .eq("id", documento_id);

  if (updateDocError) {
    throw new Error(`Erro ao atualizar status do documento: ${updateDocError.message}`);
  }

  return { ancoras: (inserted as AssinaturaDigitalDocumentoAncora[]) ?? [] };
}

export async function listDocumentos(params: {
  limit?: number;
} = {}): Promise<{
  documentos: (AssinaturaDigitalDocumento & {
    _assinantes_count: number;
    _assinantes_concluidos: number;
  })[];
}> {
  const supabase = createServiceClient();
  const limit = params.limit ?? 50;

  const { data, error } = await supabase
    .from(TABLE_DOCUMENTOS)
    .select(`
      *,
      assinantes:assinatura_digital_documento_assinantes(id, status)
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Erro ao listar documentos: ${error.message}`);
  }

  // Processar dados para incluir contagens
  const documentosComContagem = (data ?? []).map((doc) => {
    const assinantes = doc.assinantes || [];
    return {
      ...doc,
      assinantes: undefined, // Remover assinantes da resposta principal
      _assinantes_count: assinantes.length,
      _assinantes_concluidos: assinantes.filter((a: { status: string }) => a.status === "concluido").length,
    };
  });

  return { documentos: documentosComContagem };
}

export async function updatePublicSignerIdentification(params: {
  token: string;
  dados: {
    nome_completo: string;
    cpf: string;
    email: string;
    telefone: string;
  };
}): Promise<{ assinante_id: number }> {
  const supabase = createServiceClient();

  const { data: signer, error: signerError } = await supabase
    .from(TABLE_DOCUMENTO_ASSINANTES)
    .select("id, status, dados_snapshot, expires_at")
    .eq("token", params.token)
    .single();

  if (signerError) {
    throw new Error("Link inválido.");
  }

  // Verificar expiração do token
  if (signer.expires_at && new Date(signer.expires_at) <= new Date()) {
    throw new Error("Este link de assinatura expirou. Solicite um novo link ao remetente.");
  }

  if (signer.status === "concluido") {
    throw new Error("Este link já foi concluído e não pode ser reutilizado.");
  }

  const mergedSnapshot = {
    ...(signer.dados_snapshot ?? {}),
    nome_completo: params.dados.nome_completo,
    cpf: params.dados.cpf,
    email: params.dados.email,
    telefone: params.dados.telefone,
  };

  const { error: updateError } = await supabase
    .from(TABLE_DOCUMENTO_ASSINANTES)
    .update({
      dados_snapshot: mergedSnapshot,
      dados_confirmados: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", signer.id);

  if (updateError) {
    throw new Error(`Erro ao salvar identificação: ${updateError.message}`);
  }

  return { assinante_id: signer.id };
}

export async function finalizePublicSigner(params: {
  token: string;
  // identificação/segurança
  ip_address?: string | null;
  user_agent?: string | null;
  geolocation?: Record<string, unknown> | null;
  dispositivo_fingerprint_raw?: Record<string, unknown> | null;
  termos_aceite_versao: string;
  // artefatos
  selfie_base64?: string | null;
  assinatura_base64: string;
  rubrica_base64?: string | null;
}): Promise<{
  documento_uuid: string;
  pdf_final_url: string;
  hash_final_sha256: string;
  assinante_id: number;
}> {
  const supabase = createServiceClient();

  const { data: signer, error: signerError } = await supabase
    .from(TABLE_DOCUMENTO_ASSINANTES)
    .select("*")
    .eq("token", params.token)
    .single();

  if (signerError) {
    throw new Error(`Token inválido: ${signerError.message}`);
  }

  const assinante = signer as AssinaturaDigitalDocumentoAssinante;

  // Verificar expiração do token
  if (assinante.expires_at && new Date(assinante.expires_at) <= new Date()) {
    throw new Error("Este link de assinatura expirou. Solicite um novo link ao remetente.");
  }

  if (assinante.status === "concluido") {
    throw new Error("Este link já foi concluído e não pode ser reutilizado.");
  }

  const { data: documentoRow, error: docError } = await supabase
    .from(TABLE_DOCUMENTOS)
    .select("*")
    .eq("id", assinante.documento_id)
    .single();

  if (docError) {
    throw new Error(`Documento não encontrado: ${docError.message}`);
  }

  const documento = documentoRow as AssinaturaDigitalDocumento;

  // Validar necessidade de rubrica com base nas âncoras do assinante
  const { data: signerAnchors, error: signerAnchorsError } = await supabase
    .from(TABLE_DOCUMENTO_ANCORAS)
    .select("tipo")
    .eq("documento_id", documento.id)
    .eq("documento_assinante_id", assinante.id);

  if (signerAnchorsError) {
    throw new Error(`Erro ao validar âncoras: ${signerAnchorsError.message}`);
  }

  const requiresRubrica = (signerAnchors ?? []).some((a) => a.tipo === "rubrica");
  if (requiresRubrica && !params.rubrica_base64) {
    throw new Error("Rubrica é obrigatória para este documento.");
  }

  // Upload de artefatos (assinatura/rubrica/selfie) para B2
  const assinaturaBuf = decodeDataUrlToBuffer(params.assinatura_base64).buffer;
  const assinaturaKey = `assinatura-digital/documentos/${documento.documento_uuid}/assinantes/${assinante.id}/assinatura.png`;
  const assinaturaUpload = await uploadToBackblaze({
    buffer: assinaturaBuf,
    key: assinaturaKey,
    contentType: "image/png",
  });

  let rubricaUrl: string | null = null;
  if (params.rubrica_base64) {
    const rubricaBuf = decodeDataUrlToBuffer(params.rubrica_base64).buffer;
    const rubricaKey = `assinatura-digital/documentos/${documento.documento_uuid}/assinantes/${assinante.id}/rubrica.png`;
    const rubricaUpload = await uploadToBackblaze({
      buffer: rubricaBuf,
      key: rubricaKey,
      contentType: "image/png",
    });
    rubricaUrl = rubricaUpload.url;
  }

  let selfieUrl: string | null = null;
  if (documento.selfie_habilitada) {
    if (!params.selfie_base64) {
      throw new Error("Selfie é obrigatória para este documento.");
    }
    const selfieBuf = decodeDataUrlToBuffer(params.selfie_base64).buffer;
    const selfieKey = `assinatura-digital/documentos/${documento.documento_uuid}/assinantes/${assinante.id}/selfie.jpg`;
    const selfieUpload = await uploadToBackblaze({
      buffer: selfieBuf,
      key: selfieKey,
      contentType: "image/jpeg",
    });
    selfieUrl = selfieUpload.url;
  }

  const nowIso = new Date().toISOString();

  const { error: updateSignerError } = await supabase
    .from(TABLE_DOCUMENTO_ASSINANTES)
    .update({
      selfie_url: selfieUrl,
      assinatura_url: assinaturaUpload.url,
      rubrica_url: rubricaUrl,
      ip_address: params.ip_address ?? null,
      user_agent: params.user_agent ?? null,
      geolocation: params.geolocation ?? null,
      termos_aceite_versao: params.termos_aceite_versao,
      termos_aceite_data: nowIso,
      dispositivo_fingerprint_raw: params.dispositivo_fingerprint_raw ?? null,
      status: "concluido",
      concluido_em: nowIso,
      // Estender expiração após assinatura (48h para download)
      expires_at: calculatePostSignatureExpiration(),
    })
    .eq("id", assinante.id);

  if (updateSignerError) {
    throw new Error(`Erro ao atualizar assinante: ${updateSignerError.message}`);
  }

  // Regerar PDF final sempre a partir do original + assinaturas concluídas (determinístico)
  const { data: allSigners, error: allSignersError } = await supabase
    .from(TABLE_DOCUMENTO_ASSINANTES)
    .select("*")
    .eq("documento_id", documento.id);

  if (allSignersError) {
    throw new Error(`Erro ao obter assinantes: ${allSignersError.message}`);
  }

  const concluded = (allSigners as AssinaturaDigitalDocumentoAssinante[]).filter(
    (s) => s.status === "concluido"
  );

  const { data: anchors, error: anchorsError } = await supabase
    .from(TABLE_DOCUMENTO_ANCORAS)
    .select("*")
    .eq("documento_id", documento.id);

  if (anchorsError) {
    throw new Error(`Erro ao obter âncoras: ${anchorsError.message}`);
  }

  const originalPdfBuffer = await downloadFromStorageUrl(documento.pdf_original_url, {
    service: "documentos",
    operation: "download_original_pdf",
    documento_uuid: documento.documento_uuid,
  });

  const pdfDoc = await PDFDocument.load(originalPdfBuffer);
  const pages = pdfDoc.getPages();

  // Aplicar assinaturas/rubricas de todos assinantes concluídos
  for (const s of concluded) {
    if (!s.assinatura_url) continue;
    const sigBuffer = await downloadFromStorageUrl(s.assinatura_url, {
      service: "documentos",
      operation: "download_signature_image",
      documento_uuid: documento.documento_uuid,
      assinante_id: s.id,
    });
    const sigImage = await pdfDoc.embedPng(sigBuffer);

  let rubImage: PDFImage | null = null;
    if (s.rubrica_url) {
      const rubBuffer = await downloadFromStorageUrl(s.rubrica_url, {
        service: "documentos",
        operation: "download_rubrica_image",
        documento_uuid: documento.documento_uuid,
        assinante_id: s.id,
      });
      rubImage = await pdfDoc.embedPng(rubBuffer);
    }

    const signerAnchors = (anchors as AssinaturaDigitalDocumentoAncora[]).filter(
      (a) => a.documento_assinante_id === s.id
    );

    for (const a of signerAnchors) {
      const pageIndex = a.pagina - 1;
      const page = pages[pageIndex];
      if (!page) continue;

      const { width: pageW, height: pageH } = page.getSize();
      const x = a.x_norm * pageW;
      const w = a.w_norm * pageW;
      const h = a.h_norm * pageH;
      // y_norm vem do front como referência no topo; converter para origem inferior do PDF
      const y = pageH - (a.y_norm + a.h_norm) * pageH;

      if (a.tipo === "assinatura") {
        page.drawImage(sigImage, { x, y, width: w, height: h });
      } else if (a.tipo === "rubrica" && rubImage) {
        page.drawImage(rubImage, { x, y, width: w, height: h });
      }
    }
  }

  const finalPdfBytes = await pdfDoc.save();
  const finalPdfBuffer = Buffer.from(finalPdfBytes);
  const hashFinal = calculateHash(finalPdfBuffer);

  const finalKey = `assinatura-digital/documentos/${documento.documento_uuid}/final.pdf`;
  const finalUpload = await uploadToBackblaze({
    buffer: finalPdfBuffer,
    key: finalKey,
    contentType: "application/pdf",
  });

  const allDone = (allSigners as AssinaturaDigitalDocumentoAssinante[]).every(
    (s) => s.status === "concluido"
  );

  const { error: updateDocError } = await supabase
    .from(TABLE_DOCUMENTOS)
    .update({
      pdf_final_url: finalUpload.url,
      hash_final_sha256: hashFinal,
      status: allDone ? "concluido" : "pronto",
    })
    .eq("id", documento.id);

  if (updateDocError) {
    throw new Error(`Erro ao atualizar documento: ${updateDocError.message}`);
  }

  return {
    documento_uuid: documento.documento_uuid,
    pdf_final_url: finalUpload.url,
    hash_final_sha256: hashFinal,
    assinante_id: assinante.id,
  };
}


