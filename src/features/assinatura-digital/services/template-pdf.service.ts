// pdf-lib é importado dinamicamente para evitar erro "Class extends value undefined"
// em routes de API durante o build do Next.js com Turbopack.
// NÃO usar import type de pdf-lib pois mesmo isso pode causar avaliação do módulo no Turbopack.
import { decodeDataUrlToBuffer } from "./base64";
import type { TemplateCampoPdf, TipoVariavel, EstiloCampo } from "../types";
import type {
  ClienteBasico,
  FormularioBasico,
  SegmentoBasico,
  TemplateBasico,
} from "./data.service";
import { logger, createTimer, LogServices } from "./logger";

// Helper para carregar pdf-lib dinamicamente
async function loadPdfLib(): Promise<{
  PDFDocument: typeof import("pdf-lib").PDFDocument;
  rgb: typeof import("pdf-lib").rgb;
  StandardFonts: typeof import("pdf-lib").StandardFonts;
}> {
  const pdfLib = await import("pdf-lib");
  return {
    PDFDocument: pdfLib.PDFDocument,
    rgb: pdfLib.rgb,
    StandardFonts: pdfLib.StandardFonts,
  };
}

interface PdfDataContext {
  cliente: ClienteBasico;
  segmento: SegmentoBasico;
  formulario: FormularioBasico;
  protocolo: string;
  ip?: string | null;
  user_agent?: string | null;
  parte_contraria?: { nome: string };
}

interface TemplateWithCampos extends TemplateBasico {
  campos_parsed: TemplateCampoPdf[];
}

/**
 * Dados estruturados para geração da página de manifesto de assinatura eletrônica.
 * Contém todas as evidências necessárias para conformidade com MP 2.200-2/2001.
 */
export interface ManifestData {
  // Identificação do documento
  protocolo: string;
  nomeArquivo: string;
  hashOriginalSha256: string;
  hashFinalSha256?: string; // Opcional pois é calculado após flatten

  // Dados do signatário
  signatario: {
    nomeCompleto: string;
    cpf: string;
    dataHora: string; // ISO 8601
    dataHoraLocal: string; // Formatado pt-BR
    ipOrigem: string | null;
    geolocalizacao?: {
      latitude: number;
      longitude: number;
      accuracy?: number;
    } | null;
  };

  // Evidências biométricas (data URLs)
  evidencias: {
    fotoBase64?: string; // Selfie (obrigatória quando formulario.foto_necessaria=true)
    assinaturaBase64: string; // Rubrica
  };

  // Conformidade legal
  termos: {
    versao: string;
    dataAceite: string; // ISO 8601
    textoDeclaracao: string;
  };

  // Device fingerprint (opcional para exibição resumida)
  dispositivo?: {
    plataforma?: string;
    navegador?: string;
    resolucao?: string;
  };
}

const CANVAS = { width: 540, height: 765 };

function convertX(x: number, pageWidth: number) {
  return (x / CANVAS.width) * pageWidth;
}

function convertWidth(width: number, pageWidth: number) {
  return (width / CANVAS.width) * pageWidth;
}

function convertHeight(height: number, pageHeight: number) {
  return (height / CANVAS.height) * pageHeight;
}

function convertY(y: number, height: number, pageHeight: number) {
  const scaledHeight = convertHeight(height, pageHeight);
  const scaledY = (y / CANVAS.height) * pageHeight;
  return pageHeight - scaledY - scaledHeight;
}

function parseCampos(template: TemplateBasico): TemplateWithCampos {
  let campos_parsed: TemplateCampoPdf[] = [];
  try {
    campos_parsed = JSON.parse(template.campos || "[]");
  } catch {
    campos_parsed = [];
  }
  return { ...template, campos_parsed };
}

function resolveVariable(
  variable: TipoVariavel | undefined,
  ctx: PdfDataContext,
  extras: Record<string, unknown>
) {
  if (!variable) return "";

  // Mapeamento de variáveis do contexto básico
  const map: Record<string, unknown> = {
    "cliente.nome_completo": ctx.cliente.nome,
    "cliente.nome": ctx.cliente.nome,
    "cliente.cpf": ctx.cliente.cpf,
    "cliente.cnpj": ctx.cliente.cnpj,
    "cliente.tipo_pessoa": ctx.cliente.tipo_pessoa,
    "parte_contraria.nome": ctx.parte_contraria?.nome,
    "segmento.id": ctx.segmento.id,
    "segmento.nome": ctx.segmento.nome,
    "segmento.slug": ctx.segmento.slug,
    "segmento.descricao": (
      ctx.segmento as SegmentoBasico & { descricao?: string }
    ).descricao,
    "sistema.protocolo": ctx.protocolo,
    "sistema.ip_cliente": ctx.ip,
    "sistema.user_agent": ctx.user_agent,
    "formulario.nome": ctx.formulario.nome,
    "formulario.slug": ctx.formulario.slug,
    "formulario.id": ctx.formulario.id,
  };

  // Tentar resolver do contexto primeiro, depois de extras
  // Extras pode conter dados completos do cliente (cliente_dados do payload)
  let value = map[variable];

  if (value === undefined || value === null) {
    // Tentar resolver de extras (dados completos do cliente podem estar aqui)
    value = extras[variable];

    // Se a variável começa com "cliente." e não foi encontrada, tentar buscar em extras com prefixo
    if (value === undefined && variable.startsWith("cliente.")) {
      const clienteKey = variable.replace("cliente.", "");
      const clienteDados = extras.cliente_dados as
        | Record<string, unknown>
        | undefined;
      if (clienteDados && clienteKey in clienteDados) {
        value = clienteDados[clienteKey];
      }
    }
  }

  return value === undefined || value === null ? "" : String(value);
}

function formatValue(tipo: string, raw: string) {
  const val = raw ?? "";
  switch (tipo) {
    case "cpf": {
      const digits = val.replace(/\D/g, "");
      if (digits.length === 11) {
        return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
      }
      return val;
    }
    case "cnpj": {
      const digits = val.replace(/\D/g, "");
      if (digits.length === 14) {
        return digits.replace(
          /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
          "$1.$2.$3/$4-$5"
        );
      }
      return val;
    }
    case "data": {
      const d = new Date(val);
      return isNaN(d.getTime()) ? val : d.toLocaleDateString("pt-BR");
    }
    default:
      return val;
  }
}

async function loadTemplatePdf(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `Falha ao baixar template PDF: ${res.status} ${res.statusText}`
    );
  }
  const arr = new Uint8Array(await res.arrayBuffer());
  return arr;
}

function buildStyle(
  style: EstiloCampo | undefined,
  pdfLib: {
    rgb: typeof import("pdf-lib").rgb;
    StandardFonts: typeof import("pdf-lib").StandardFonts;
  }
) {
  return {
    fontName: style?.fonte || pdfLib.StandardFonts.Helvetica,
    fontSize: style?.tamanho_fonte || 12,
    color: style?.cor ? hexToRgb(style.cor, pdfLib.rgb) : pdfLib.rgb(0, 0, 0),
    align: style?.alinhamento || "left",
    bold: style?.negrito || false,
    italic: style?.italico || false,
  };
}

function hexToRgb(hex: string, rgb: typeof import("pdf-lib").rgb) {
  const sanitized = hex.replace("#", "");
  const num = parseInt(sanitized, 16);
  if (Number.isNaN(num)) return rgb(0, 0, 0);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return rgb(r / 255, g / 255, b / 255);
}

async function embedText(
  page: {
    drawText: (
      text: string,
      options: { x: number; y: number; size: number; font: unknown }
    ) => void;
  },
  font: unknown,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  size: number
) {
  const chunks = wrapText(font, text, size, maxWidth);
  let currentY = y;
  chunks.forEach((line) => {
    page.drawText(line, { x, y: currentY, size, font });
    currentY -= size + 2;
  });
}

function wrapText(
  font: unknown,
  text: string,
  fontSize: number,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  words.forEach((word) => {
    const tentative = current ? `${current} ${word}` : word;
    const width = font.widthOfTextAtSize(tentative, fontSize);
    if (width <= maxWidth || !current) {
      current = tentative;
    } else {
      lines.push(current);
      current = word;
    }
  });
  if (current) lines.push(current);
  return lines;
}

function renderRich(template: string, resolver: (variable: string) => string) {
  return template.replace(/{{\s*([^}]+)\s*}}/g, (_, v) => resolver(v));
}

export async function generatePdfFromTemplate(
  template: TemplateBasico,
  ctx: PdfDataContext,
  extras: Record<string, unknown>,
  images?: { assinaturaBase64?: string; fotoBase64?: string }
): Promise<Buffer> {
  const pdfLib = await loadPdfLib();
  const tpl = parseCampos(template);
  const pdfBytes = await loadTemplatePdf(template.arquivo_original);
  const pdfDoc = await pdfLib.PDFDocument.load(pdfBytes);

  const helvetica = await pdfDoc.embedFont(pdfLib.StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(
    pdfLib.StandardFonts.HelveticaBold
  );

  for (const campo of tpl.campos_parsed) {
    const pageIndex = Math.max((campo.posicao?.pagina ?? 1) - 1, 0);
    const page = pdfDoc.getPage(pageIndex);
    const { width: pageWidth, height: pageHeight } = page.getSize();
    const pos = campo.posicao;
    if (!pos) continue;

    const x = convertX(pos.x, pageWidth);
    const y = convertY(pos.y, pos.height, pageHeight);
    const w = convertWidth(pos.width, pageWidth);
    const h = convertHeight(pos.height, pageHeight);

    const style = buildStyle(campo.estilo, pdfLib);
    const font = style.bold ? helveticaBold : helvetica;

    if (campo.tipo === "assinatura" && images?.assinaturaBase64) {
      const { buffer, contentType } = decodeDataUrlToBuffer(
        images.assinaturaBase64
      );
      const image = contentType.includes("png")
        ? await pdfDoc.embedPng(buffer)
        : await pdfDoc.embedJpg(buffer);
      page.drawImage(image, { x, y, width: w, height: h });
      continue;
    }

    if (campo.tipo === "foto" && images?.fotoBase64) {
      const { buffer, contentType } = decodeDataUrlToBuffer(images.fotoBase64);
      const image = contentType.includes("png")
        ? await pdfDoc.embedPng(buffer)
        : await pdfDoc.embedJpg(buffer);
      page.drawImage(image, { x, y, width: w, height: h });
      continue;
    }

    const resolve = (v: string) =>
      resolveVariable(v as TipoVariavel, ctx, extras);
    let value = "";
    if (campo.tipo === "texto_composto" && campo.conteudo_composto?.template) {
      value = renderRich(campo.conteudo_composto.template, resolve);
    } else {
      value = resolveVariable(campo.variavel, ctx, extras);
    }
    if (!value && campo.valor_padrao) value = campo.valor_padrao;
    value = formatValue(campo.tipo, value);

    await embedText(
      page,
      font,
      value,
      x,
      y + h - style.fontSize,
      w,
      style.fontSize
    );
  }

  const result = await pdfDoc.save();
  return Buffer.from(result);
}

// =============================================================================
// MANIFESTO DE ASSINATURA ELETRÔNICA - MP 2.200-2/2001
// =============================================================================

/**
 * Constantes para página de manifesto
 */
export const MANIFEST_PAGE_SIZE = {
  width: 595.28, // A4 width in points
  height: 841.89, // A4 height in points
} as const;

export const MANIFEST_LEGAL_TEXT =
  "O signatário reconhece a autenticidade deste documento e a validade da " +
  "assinatura eletrônica utilizada, conforme Art. 10, § 2º, da Medida Provisória " +
  "nº 2.200-2/2001. Declara que os dados biométricos coletados (foto e assinatura) " +
  "são prova de sua autoria e que o hash SHA-256 garante a integridade deste ato.";

/**
 * Formata data ISO para formato brasileiro (dd/mm/yyyy HH:mm:ss)
 * @param isoDate - Data em formato ISO 8601
 * @returns Data formatada em pt-BR ou o valor original se a data for inválida
 */
function formatDateTimeBrazil(isoDate: string): string {
  if (!isoDate) {
    return "Data não informada";
  }

  const date = new Date(isoDate);

  // Validar se a data é válida antes de formatar
  if (isNaN(date.getTime())) {
    return isoDate; // Retorna o valor original se inválido
  }

  return date.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Embeda imagem no PDF a partir de data URL, detectando tipo automaticamente.
 *
 * IMPORTANTE: Apenas formatos PNG e JPEG são suportados pelo pdf-lib.
 * Enviar outros contentTypes (como WebP, GIF, BMP) causará erro.
 * O consumidor deve garantir que as imagens estejam em formato compatível
 * antes de chamar esta função.
 *
 * @param pdfDoc - Documento PDF onde a imagem será embedada
 * @param dataUrl - Data URL da imagem (formato: data:image/png;base64,...)
 * @param label - Rótulo opcional para identificar a imagem em mensagens de erro (ex: "foto", "assinatura")
 * @returns Imagem embedada no PDF
 * @throws {Error} Se o tipo de imagem não for PNG ou JPEG
 */
async function embedImageFromDataUrl(
  pdfDoc: unknown,
  dataUrl: string,
  label?: string
): Promise<unknown> {
  const { buffer, contentType } = decodeDataUrlToBuffer(dataUrl);
  const imageLabel = label ? ` (${label})` : "";

  if (contentType.includes("png")) {
    return await pdfDoc.embedPng(buffer);
  } else if (contentType.includes("jpg") || contentType.includes("jpeg")) {
    return await pdfDoc.embedJpg(buffer);
  } else {
    throw new Error(
      `Tipo de imagem não suportado${imageLabel}: ${contentType}. ` +
        `Apenas PNG e JPEG são aceitos.`
    );
  }
}

/**
 * Adiciona página de manifesto de assinatura eletrônica ao PDF.
 *
 * CONFORMIDADE LEGAL - MP 2.200-2/2001
 *
 * Esta função implementa a página de evidências exigida para Assinatura Eletrônica
 * Avançada, incluindo:
 * - Identificação do documento (protocolo, hashes SHA-256)
 * - Dados do signatário (nome, CPF, data/hora, IP, geolocalização)
 * - Evidências biométricas (foto selfie e assinatura manuscrita EMBEDADAS)
 * - Declaração jurídica com aceite de termos
 *
 * As imagens são embedadas diretamente no PDF (não referenciadas) para garantir
 * integridade forense. Qualquer modificação no PDF após flatten alterará o hash
 * final, tornando adulteração detectável.
 *
 * @param pdfDoc - Documento PDF já carregado (será modificado in-place)
 * @param manifestData - Dados estruturados do manifesto
 * @returns PDFDocument modificado com página de manifesto anexada
 * @throws {Error} Se houver falha ao embedar imagens ou desenhar conteúdo
 *
 * @example
 * const pdfDoc = await PDFDocument.load(pdfBytes);
 * await appendManifestPage(pdfDoc, {
 *   protocolo: 'FS-20250101120000-12345',
 *   nomeArquivo: 'contrato.pdf',
 *   hashOriginalSha256: 'a3c5f1e2...',
 *   signatario: { ... },
 *   evidencias: { fotoBase64: '...', assinaturaBase64: '...' },
 *   termos: { ... }
 * });
 * const finalPdfBytes = await pdfDoc.save();
 *
 * AUDITORIA E PERÍCIA TÉCNICA
 *
 * O manifesto serve como "página de rosto" forense do documento assinado.
 * Em auditorias ou perícias judiciais, o perito pode:
 * 1. Extrair o manifesto do PDF (última página)
 * 2. Verificar que todos os campos obrigatórios estão presentes
 * 3. Recalcular o hash_final_sha256 do PDF completo
 * 4. Comparar com o hash exibido no manifesto
 * 5. Validar que foto e assinatura estão embedadas (não apenas referenciadas)
 *
 * Qualquer divergência indica adulteração pós-assinatura.
 */
export async function appendManifestPage(
  pdfDoc: unknown,
  manifestData: ManifestData
): Promise<unknown> {
  const pdfLib = await loadPdfLib();
  const timer = createTimer();
  const context = { service: LogServices.PDF, operation: "append_manifest" };

  logger.info("Adicionando página de manifesto ao PDF", context, {
    protocolo: manifestData.protocolo,
    arquivo: manifestData.nomeArquivo,
  });

  try {
    // Validar dados obrigatórios
    if (!manifestData.protocolo || !manifestData.hashOriginalSha256) {
      throw new Error(
        "Protocolo e hash original são obrigatórios para manifesto"
      );
    }

    if (!manifestData.evidencias.assinaturaBase64) {
      throw new Error("Assinatura é obrigatória para manifesto");
    }

    if (!manifestData.signatario.nomeCompleto || !manifestData.signatario.cpf) {
      throw new Error("Nome completo e CPF do signatário são obrigatórios");
    }

    // Criar nova página A4
    const page = pdfDoc.addPage([
      MANIFEST_PAGE_SIZE.width,
      MANIFEST_PAGE_SIZE.height,
    ]);
    const { width, height } = page.getSize();

    // Embedar fontes
    const fontRegular = await pdfDoc.embedFont(pdfLib.StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(pdfLib.StandardFonts.HelveticaBold);

    // Embedar imagens (com labels para mensagens de erro contextualizadas)
    const fotoImage = manifestData.evidencias.fotoBase64
      ? await embedImageFromDataUrl(
          pdfDoc,
          manifestData.evidencias.fotoBase64,
          "foto"
        )
      : null;
    const assinaturaImage = await embedImageFromDataUrl(
      pdfDoc,
      manifestData.evidencias.assinaturaBase64,
      "assinatura"
    );

    // Constantes de layout
    const marginLeft = 50;
    const marginRight = 50;
    const contentWidth = width - marginLeft - marginRight;
    const lineColor = pdfLib.rgb(0.7, 0.7, 0.7);
    const textColor = pdfLib.rgb(0, 0, 0);
    const linkColor = pdfLib.rgb(0, 0, 0.8);

    let currentY = height - 50; // Começar do topo com margem

    // ==========================================================================
    // CABEÇALHO
    // ==========================================================================
    page.drawText("MANIFESTO DE ASSINATURA ELETRÔNICA", {
      x: marginLeft,
      y: currentY,
      size: 16,
      font: fontBold,
      color: textColor,
    });
    currentY -= 20;

    page.drawText("Conformidade MP 2.200-2/2001", {
      x: marginLeft,
      y: currentY,
      size: 10,
      font: fontRegular,
      color: pdfLib.rgb(0.4, 0.4, 0.4),
    });
    currentY -= 35;

    // ==========================================================================
    // IDENTIFICAÇÃO DO DOCUMENTO
    // ==========================================================================
    page.drawText("IDENTIFICAÇÃO DO DOCUMENTO", {
      x: marginLeft,
      y: currentY,
      size: 12,
      font: fontBold,
      color: textColor,
    });
    currentY -= 5;

    page.drawLine({
      start: { x: marginLeft, y: currentY },
      end: { x: width - marginRight, y: currentY },
      thickness: 1,
      color: lineColor,
    });
    currentY -= 15;

    const docFields = [
      `Nome do Arquivo: ${manifestData.nomeArquivo}`,
      `Protocolo: ${manifestData.protocolo}`,
    ];

    for (const field of docFields) {
      page.drawText(field, {
        x: marginLeft,
        y: currentY,
        size: 10,
        font: fontRegular,
        color: textColor,
      });
      currentY -= 15;
    }

    // Hash original (pode ser longo, quebrar se necessário)
    page.drawText("Hash SHA-256 Original:", {
      x: marginLeft,
      y: currentY,
      size: 10,
      font: fontRegular,
      color: textColor,
    });
    currentY -= 12;

    const hashOriginal = manifestData.hashOriginalSha256;
    const hashChunks = hashOriginal.match(/.{1,64}/g) || [hashOriginal];
    for (const chunk of hashChunks) {
      page.drawText(chunk, {
        x: marginLeft + 10,
        y: currentY,
        size: 8,
        font: fontRegular,
        color: pdfLib.rgb(0.3, 0.3, 0.3),
      });
      currentY -= 10;
    }
    currentY -= 5;

    // Hash final (se disponível)
    page.drawText("Hash SHA-256 Final:", {
      x: marginLeft,
      y: currentY,
      size: 10,
      font: fontRegular,
      color: textColor,
    });
    currentY -= 12;

    const hashFinal = manifestData.hashFinalSha256 || "Calculado após flatten";
    if (manifestData.hashFinalSha256) {
      const finalChunks = hashFinal.match(/.{1,64}/g) || [hashFinal];
      for (const chunk of finalChunks) {
        page.drawText(chunk, {
          x: marginLeft + 10,
          y: currentY,
          size: 8,
          font: fontRegular,
          color: pdfLib.rgb(0.3, 0.3, 0.3),
        });
        currentY -= 10;
      }
    } else {
      page.drawText(hashFinal, {
        x: marginLeft + 10,
        y: currentY,
        size: 8,
        font: fontRegular,
        color: pdfLib.rgb(0.5, 0.5, 0.5),
      });
      currentY -= 10;
    }
    currentY -= 20;

    // ==========================================================================
    // DADOS DO SIGNATÁRIO
    // ==========================================================================
    page.drawText("DADOS DO SIGNATÁRIO", {
      x: marginLeft,
      y: currentY,
      size: 12,
      font: fontBold,
      color: textColor,
    });
    currentY -= 5;

    page.drawLine({
      start: { x: marginLeft, y: currentY },
      end: { x: width - marginRight, y: currentY },
      thickness: 1,
      color: lineColor,
    });
    currentY -= 15;

    const cpfFormatado = formatValue("cpf", manifestData.signatario.cpf);
    const signatarioFields = [
      `Nome Completo: ${manifestData.signatario.nomeCompleto}`,
      `CPF: ${cpfFormatado}`,
      `Data/Hora (UTC): ${manifestData.signatario.dataHora}`,
      `Data/Hora (Local): ${
        manifestData.signatario.dataHoraLocal ||
        formatDateTimeBrazil(manifestData.signatario.dataHora)
      }`,
      `IP de Origem: ${manifestData.signatario.ipOrigem || "Não disponível"}`,
    ];

    for (const field of signatarioFields) {
      page.drawText(field, {
        x: marginLeft,
        y: currentY,
        size: 10,
        font: fontRegular,
        color: textColor,
      });
      currentY -= 15;
    }

    // Geolocalização (se disponível)
    if (manifestData.signatario.geolocalizacao) {
      const geo = manifestData.signatario.geolocalizacao;
      const geoText = `Geolocalização: Lat ${geo.latitude.toFixed(
        6
      )}, Long ${geo.longitude.toFixed(6)}${
        geo.accuracy ? ` (±${Math.round(geo.accuracy)}m)` : ""
      }`;
      page.drawText(geoText, {
        x: marginLeft,
        y: currentY,
        size: 10,
        font: fontRegular,
        color: textColor,
      });
      currentY -= 12;

      const mapsLink = `https://maps.google.com/?q=${geo.latitude},${geo.longitude}`;
      page.drawText(mapsLink, {
        x: marginLeft,
        y: currentY,
        size: 8,
        font: fontRegular,
        color: linkColor,
      });
      currentY -= 15;
    }

    // Dispositivo (se disponível)
    if (manifestData.dispositivo) {
      const { plataforma, navegador, resolucao } = manifestData.dispositivo;
      const dispositivoParts: string[] = [];

      if (plataforma) dispositivoParts.push(plataforma);
      if (navegador) dispositivoParts.push(navegador);
      if (resolucao) dispositivoParts.push(resolucao);

      if (dispositivoParts.length > 0) {
        const dispositivoText = `Dispositivo: ${dispositivoParts.join(" • ")}`;
        page.drawText(dispositivoText, {
          x: marginLeft,
          y: currentY,
          size: 9,
          font: fontRegular,
          color: pdfLib.rgb(0.4, 0.4, 0.4),
        });
        currentY -= 15;
      }
    }
    currentY -= 15;

    // ==========================================================================
    // EVIDÊNCIAS BIOMÉTRICAS
    // ==========================================================================
    page.drawText("EVIDÊNCIAS BIOMÉTRICAS", {
      x: marginLeft,
      y: currentY,
      size: 12,
      font: fontBold,
      color: textColor,
    });
    currentY -= 5;

    page.drawLine({
      start: { x: marginLeft, y: currentY },
      end: { x: width - marginRight, y: currentY },
      thickness: 1,
      color: lineColor,
    });
    currentY -= 20;

    // Layout: Foto à esquerda (se presente), Assinatura à direita
    const imageY = currentY - 120;

    // Foto (lado esquerdo) - opcional
    if (fotoImage) {
      page.drawText("Foto (Selfie) no Momento da Assinatura:", {
        x: marginLeft,
        y: currentY,
        size: 10,
        font: fontRegular,
        color: textColor,
      });

      // Calcular dimensões mantendo proporção para foto (max 120x120)
      const fotoDims = fotoImage.scale(1);
      const fotoMaxSize = 120;
      const fotoScale = Math.min(
        fotoMaxSize / fotoDims.width,
        fotoMaxSize / fotoDims.height
      );
      const fotoWidth = fotoDims.width * fotoScale;
      const fotoHeight = fotoDims.height * fotoScale;

      page.drawImage(fotoImage, {
        x: marginLeft,
        y: imageY,
        width: fotoWidth,
        height: fotoHeight,
      });
    }

    // Assinatura (lado direito se houver foto, ou lado esquerdo se não houver)
    const assColumnX = fotoImage ? marginLeft + 180 : marginLeft;
    page.drawText("Assinatura Manuscrita Eletrônica:", {
      x: assColumnX,
      y: currentY,
      size: 10,
      font: fontRegular,
      color: textColor,
    });

    // Calcular dimensões mantendo proporção para assinatura (max 200x80)
    const assDims = assinaturaImage.scale(1);
    const assMaxWidth = 200;
    const assMaxHeight = 80;
    const assScale = Math.min(
      assMaxWidth / assDims.width,
      assMaxHeight / assDims.height
    );
    const assWidth = assDims.width * assScale;
    const assHeight = assDims.height * assScale;

    page.drawImage(assinaturaImage, {
      x: assColumnX,
      y: imageY + (120 - assHeight), // Alinhar pelo topo
      width: assWidth,
      height: assHeight,
    });

    currentY = imageY - 25;

    // ==========================================================================
    // DECLARAÇÃO JURÍDICA
    // ==========================================================================
    page.drawText("DECLARAÇÃO JURÍDICA", {
      x: marginLeft,
      y: currentY,
      size: 12,
      font: fontBold,
      color: textColor,
    });
    currentY -= 5;

    page.drawLine({
      start: { x: marginLeft, y: currentY },
      end: { x: width - marginRight, y: currentY },
      thickness: 1,
      color: lineColor,
    });
    currentY -= 15;

    // Texto da declaração (quebrar em múltiplas linhas)
    const declaracaoTexto =
      manifestData.termos.textoDeclaracao || MANIFEST_LEGAL_TEXT;
    const declaracaoLines = wrapText(
      fontRegular,
      declaracaoTexto,
      9,
      contentWidth
    );

    for (const line of declaracaoLines) {
      page.drawText(line, {
        x: marginLeft,
        y: currentY,
        size: 9,
        font: fontRegular,
        color: textColor,
      });
      currentY -= 12;
    }
    currentY -= 10;

    // Metadados dos termos
    page.drawText(`Versão dos Termos: ${manifestData.termos.versao}`, {
      x: marginLeft,
      y: currentY,
      size: 9,
      font: fontRegular,
      color: pdfLib.rgb(0.4, 0.4, 0.4),
    });
    currentY -= 12;

    const dataAceiteFormatada = formatDateTimeBrazil(
      manifestData.termos.dataAceite
    );
    page.drawText(`Data de Aceite: ${dataAceiteFormatada}`, {
      x: marginLeft,
      y: currentY,
      size: 9,
      font: fontRegular,
      color: pdfLib.rgb(0.4, 0.4, 0.4),
    });

    // ==========================================================================
    // RODAPÉ
    // ==========================================================================
    const footerText =
      "Documento gerado eletronicamente. Validade jurídica conforme Art. 10, § 2º, MP 2.200-2/2001.";
    const footerWidth = fontRegular.widthOfTextAtSize(footerText, 8);
    page.drawText(footerText, {
      x: (width - footerWidth) / 2,
      y: 40,
      size: 8,
      font: fontRegular,
      color: pdfLib.rgb(0.5, 0.5, 0.5),
    });

    // Número da página
    const pageCount = pdfDoc.getPageCount();
    const pageNumText = `Página ${pageCount} de ${pageCount}`;
    const pageNumWidth = fontRegular.widthOfTextAtSize(pageNumText, 8);
    page.drawText(pageNumText, {
      x: width - marginRight - pageNumWidth,
      y: 25,
      size: 8,
      font: fontRegular,
      color: pdfLib.rgb(0.5, 0.5, 0.5),
    });

    timer.log("Página de manifesto adicionada com sucesso", context, {
      page_count: pageCount,
    });

    return pdfDoc;
  } catch (error) {
    logger.error("Erro ao adicionar página de manifesto", error, context);
    throw new Error(
      `Falha ao gerar manifesto: ${
        error instanceof Error ? error.message : "Erro desconhecido"
      }`
    );
  }
}
