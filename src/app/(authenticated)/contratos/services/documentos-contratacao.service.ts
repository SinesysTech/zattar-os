import { createServiceClient } from '@/lib/supabase/service-client';
import type { TemplateBasico } from '@/shared/assinatura-digital/services/data.service';
import type { DadosContratoParaMapping, CampoFaltante } from './mapeamento-contrato-input-data';
import { contratoParaInputData, detectarCamposFaltantes } from './mapeamento-contrato-input-data';
import {
  generatePdfFromTemplate,
  resolveVariable,
  type PdfDataContext,
} from '@/shared/assinatura-digital/services/template-pdf.service';
import JSZip from 'jszip';

/**
 * Tipo do formulário que representa o pacote de documentos de contratação
 * (CHECK constraint em assinatura_digital_formularios.tipo_formulario).
 */
export const TIPO_FORMULARIO_CONTRATO = 'contrato' as const;

export interface SegmentoDoFormulario {
  id: number;
  nome: string;
  slug: string;
  ativo: boolean;
}

export interface FormularioComTemplates {
  id: number;
  formulario_uuid: string;
  nome: string;
  slug: string;
  segmento_id: number;
  ativo: boolean;
  ordem: number | null;
  template_ids: string[];
  segmento: SegmentoDoFormulario;
}

/**
 * Agregação de formulários tipo 'contrato' ativos de um mesmo segmento.
 *
 * Cada formulário no banco contribui com os seus `template_ids`; a união
 * deduplicada forma o pacote de templates que será gerado para o contrato.
 *
 * `formularioPrincipal` é o primeiro formulário por `ordem` (asc) — serve como
 * representação canônica em campos `{{formulario.*}}` dos templates. Em firmas
 * com múltiplos formulários tipo contrato no mesmo segmento, o admin controla
 * qual é o "principal" ajustando a `ordem` em Assinatura Digital › Formulários.
 */
export interface PacoteTemplatesContratacao {
  segmento: SegmentoDoFormulario;
  formularios: FormularioComTemplates[];
  formularioPrincipal: FormularioComTemplates;
  templateUuidsUnificados: string[];
}

export async function carregarDadosContrato(
  contratoId: number,
): Promise<DadosContratoParaMapping | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('contratos')
    .select(`
      id, segmento_id, cliente_id,
      cliente:clientes!cliente_id (
        id, tipo_pessoa, nome, cpf, cnpj, rg, nacionalidade, estado_civil,
        ddd_celular, numero_celular, emails,
        endereco:enderecos!endereco_id (
          logradouro, numero, complemento, bairro,
          municipio, estado_sigla, cep
        )
      ),
      partes:contrato_partes (
        tipo_entidade, papel_contratual, nome_snapshot, ordem
      )
    `)
    .eq('id', contratoId)
    .single();

  if (error || !data) return null;

  const cliente = Array.isArray(data.cliente) ? data.cliente[0] : data.cliente;
  const endereco = cliente
    ? Array.isArray(cliente.endereco)
      ? cliente.endereco[0]
      : cliente.endereco
    : null;

  return {
    contrato: {
      id: data.id,
      segmento_id: data.segmento_id,
      cliente_id: data.cliente_id,
    },
    cliente: cliente
      ? { ...cliente, endereco: endereco ?? null }
      : null,
    partes: Array.isArray(data.partes) ? data.partes : [],
  };
}

/**
 * Resolve o pacote de templates de contratação (`tipo_formulario = 'contrato'`)
 * ativo associado ao segmento do contrato. Não há hardcoding de slug nem de id
 * de segmento: a firma cadastra seus formulários em /assinatura-digital/formularios
 * classificando cada um por tipo + segmento, e o sistema descobre quais aplicar
 * por meio da dupla (segmento_id, tipo_formulario='contrato').
 *
 * **Múltiplos formulários por segmento**: se o admin cadastrar dois ou mais
 * formulários tipo contrato ativos no mesmo segmento (ex: "ContratacaoPadrao"
 * + "ContratacaoProBono"), a união dedup de `template_ids` é o que sai no ZIP /
 * pacote de assinatura. A ordem de templates no pacote respeita (ordem do
 * formulário asc, depois ordem dentro do `template_ids[]`). O primeiro formulário
 * (menor `ordem`) vira `formularioPrincipal` e é quem aparece em
 * `{{formulario.nome}}` / `{{formulario.slug}}` nos templates.
 */
export async function carregarPacoteContratacaoPorSegmento(
  segmentoId: number,
): Promise<PacoteTemplatesContratacao | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('assinatura_digital_formularios')
    .select(`
      id, formulario_uuid, nome, slug, segmento_id, ativo, ordem, template_ids,
      segmento:segmentos!segmento_id ( id, nome, slug, ativo )
    `)
    .eq('tipo_formulario', TIPO_FORMULARIO_CONTRATO)
    .eq('segmento_id', segmentoId)
    .eq('ativo', true)
    .order('ordem', { ascending: true, nullsFirst: false });

  if (error || !data || data.length === 0) return null;

  const formularios: FormularioComTemplates[] = [];
  let segmentoAgregado: SegmentoDoFormulario | null = null;

  for (const row of data) {
    const segmentoRow = Array.isArray(row.segmento) ? row.segmento[0] : row.segmento;
    if (!segmentoRow) continue;

    const segmentoFormatado: SegmentoDoFormulario = {
      id: segmentoRow.id as number,
      nome: segmentoRow.nome as string,
      slug: segmentoRow.slug as string,
      ativo: (segmentoRow.ativo as boolean | null) ?? false,
    };

    if (segmentoAgregado == null) segmentoAgregado = segmentoFormatado;

    formularios.push({
      id: row.id,
      formulario_uuid: row.formulario_uuid,
      nome: row.nome,
      slug: row.slug,
      segmento_id: row.segmento_id,
      ativo: row.ativo ?? false,
      ordem: row.ordem,
      template_ids: row.template_ids ?? [],
      segmento: segmentoFormatado,
    });
  }

  if (formularios.length === 0 || segmentoAgregado == null) return null;

  // União deduplicada de template UUIDs, preservando a ordem de aparição
  // (ordem do formulário asc, ordem do template dentro do formulário).
  const seen = new Set<string>();
  const templateUuidsUnificados: string[] = [];
  for (const form of formularios) {
    for (const uuid of form.template_ids) {
      if (seen.has(uuid)) continue;
      seen.add(uuid);
      templateUuidsUnificados.push(uuid);
    }
  }

  return {
    segmento: segmentoAgregado,
    formularios,
    formularioPrincipal: formularios[0],
    templateUuidsUnificados,
  };
}

export async function carregarTemplatesPorUuids(
  uuids: string[],
): Promise<TemplateBasico[]> {
  if (uuids.length === 0) return [];
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('assinatura_digital_templates')
    .select('id, template_uuid, nome, ativo, arquivo_original, pdf_url, campos')
    .in('template_uuid', uuids)
    .eq('ativo', true);

  if (error || !data) return [];
  return data as TemplateBasico[];
}

// ---------------------------------------------------------------------------
// ZIP orchestration
// ---------------------------------------------------------------------------

export interface GerarZipInput {
  dados: DadosContratoParaMapping;
  templates: TemplateBasico[];
  pacote: PacoteTemplatesContratacao;
  overrides?: Record<string, string>;
}

function sanitizarNomeArquivo(nome: string): string {
  return nome.replace(/[/\\:*?"<>|]/g, '_').trim() || 'documento';
}

export async function gerarZipPdfsContratacao(
  input: GerarZipInput,
): Promise<Buffer> {
  const { dados, templates, pacote, overrides = {} } = input;

  const mapeado = contratoParaInputData(dados);
  const principal = pacote.formularioPrincipal;

  const ctx = {
    cliente: mapeado.cliente,
    segmento: pacote.segmento,
    formulario: {
      id: principal.id,
      formulario_uuid: principal.formulario_uuid,
      nome: principal.nome,
      slug: principal.slug,
      segmento_id: principal.segmento_id,
      ativo: principal.ativo,
    },
    protocolo: `CTR-${dados.contrato.id}-${Date.now()}`,
    parte_contraria: mapeado.parteContrariaNome
      ? { nome: mapeado.parteContrariaNome }
      : undefined,
  };

  const extras: Record<string, unknown> = {
    ...mapeado.ctxExtras,
    ...overrides,
  };

  const buffers = await Promise.all(
    templates.map(async (template) => {
      const buffer = await generatePdfFromTemplate(
        template,
        ctx,
        extras,
        undefined,
      );
      return { nome: template.nome, buffer };
    }),
  );

  const zip = new JSZip();
  for (const { nome, buffer } of buffers) {
    zip.file(`${sanitizarNomeArquivo(nome)}.pdf`, buffer);
  }
  return zip.generateAsync({ type: 'nodebuffer' });
}

// ---------------------------------------------------------------------------
// High-level validation + generation helpers
// ---------------------------------------------------------------------------

export type { CampoFaltante };

export type ResultadoValidacao =
  | { status: 'pronto'; formularioId: number; qtdTemplates: number }
  | { status: 'campos_faltantes'; camposFaltantes: CampoFaltante[] }
  | { status: 'erro'; mensagem: string };

type ContextoResult =
  | {
      status: 'success';
      dados: DadosContratoParaMapping;
      pacote: PacoteTemplatesContratacao;
      templates: TemplateBasico[];
    }
  | { status: 'error'; mensagem: string };

async function carregarContexto(contratoId: number): Promise<ContextoResult> {
  const dados = await carregarDadosContrato(contratoId);
  if (!dados || !dados.cliente) {
    return { status: 'error', mensagem: 'Contrato sem cliente vinculado' };
  }

  const segmentoId = dados.contrato.segmento_id;
  if (!segmentoId) {
    return {
      status: 'error',
      mensagem:
        'Contrato sem segmento definido. Edite o contrato e escolha um segmento antes de gerar os documentos.',
    };
  }

  const pacote = await carregarPacoteContratacaoPorSegmento(segmentoId);
  if (!pacote || pacote.templateUuidsUnificados.length === 0) {
    return {
      status: 'error',
      mensagem:
        'Nenhum formulário de contratação ativo está cadastrado para este segmento. Configure um em Assinatura Digital › Formulários com tipo "Contrato" e pelo menos um template.',
    };
  }

  const templates = await carregarTemplatesPorUuids(pacote.templateUuidsUnificados);
  if (templates.length !== pacote.templateUuidsUnificados.length) {
    return {
      status: 'error',
      mensagem:
        'Um ou mais templates dos formulários estão desativados ou foram removidos. Revise a configuração dos formulários do segmento.',
    };
  }

  return { status: 'success', dados, pacote, templates };
}

export async function validarGeracaoPdfs(
  contratoId: number,
  overrides: Record<string, string> = {},
): Promise<ResultadoValidacao> {
  const ctx = await carregarContexto(contratoId);
  if (ctx.status === 'error') return { status: 'erro', mensagem: ctx.mensagem };

  let pdfCtx: PdfDataContext;
  let extras: Record<string, unknown>;
  try {
    const mapeado = contratoParaInputData(ctx.dados);
    const principal = ctx.pacote.formularioPrincipal;
    pdfCtx = {
      cliente: mapeado.cliente,
      segmento: ctx.pacote.segmento,
      formulario: {
        id: principal.id,
        formulario_uuid: principal.formulario_uuid,
        nome: principal.nome,
        slug: principal.slug,
        segmento_id: principal.segmento_id,
        ativo: principal.ativo,
      },
      protocolo: `CTR-${ctx.dados.contrato.id}-validate`,
      parte_contraria: mapeado.parteContrariaNome
        ? { nome: mapeado.parteContrariaNome }
        : undefined,
    };
    extras = { ...mapeado.ctxExtras, ...overrides };
  } catch (err) {
    return {
      status: 'erro',
      mensagem: err instanceof Error ? err.message : 'Erro no mapeamento',
    };
  }

  const resolver = (chave: string) => resolveVariable(chave, pdfCtx, extras);
  const faltantes = detectarCamposFaltantes(resolver, ctx.templates);
  if (faltantes.length > 0) {
    return { status: 'campos_faltantes', camposFaltantes: faltantes };
  }

  return {
    status: 'pronto',
    formularioId: ctx.pacote.formularioPrincipal.id,
    qtdTemplates: ctx.templates.length,
  };
}

export async function gerarZipPdfsParaContrato(
  contratoId: number,
  overrides: Record<string, string> = {},
): Promise<{ buffer: Buffer; nomeCliente: string }> {
  const ctx = await carregarContexto(contratoId);
  if (ctx.status === 'error') throw new Error(ctx.mensagem);

  const buffer = await gerarZipPdfsContratacao({
    dados: ctx.dados,
    templates: ctx.templates,
    pacote: ctx.pacote,
    overrides,
  });

  return {
    buffer,
    nomeCliente: ctx.dados.cliente?.nome ?? 'Contrato',
  };
}
