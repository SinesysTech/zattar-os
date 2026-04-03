import { z } from 'zod';

/**
 * Pangea (BNP) - Banco Nacional de Precedentes
 *
 * @see http://pangeabnp.pdpj.jus.br/
 */

// =============================================================================
// INPUT
// =============================================================================

export const PANGEA_ORDENACAO_VALUES = [
  'Text',
  'ChronologicalAsc',
  'ChronologicalDesc',
  'NumericAsc',
  'NumericDesc',
] as const;

export type PangeaOrdenacao = (typeof PANGEA_ORDENACAO_VALUES)[number];

export const PANGEA_TIPO_VALUES = [
  'SUM',
  'SV',
  'RG',
  'IAC',
  'SIRDR',
  'RR',
  'CT',
  'IRDR',
  'IRR',
  'PUIL',
  'NT',
  'OJ',
] as const;

export type PangeaTipo = (typeof PANGEA_TIPO_VALUES)[number];

/**
 * Máximo seguro observado no endpoint do Pangea.
 * - 10.000: OK
 * - 20.000: 500 no upstream (em testes)
 */
export const PANGEA_MAX_TAMANHO_PAGINA = 10_000;

export const pangeaBuscaInputSchema = z.object({
  // Campos de busca
  buscaGeral: z.string().optional().default(''),
  todasPalavras: z.string().optional().default(''),
  quaisquerPalavras: z.string().optional().default(''),
  semPalavras: z.string().optional().default(''),
  trechoExato: z.string().optional().default(''),

  // Data de atualização (aceita yyyy-mm-dd ou dd/mm/yyyy)
  atualizacaoDesde: z.string().optional(),
  atualizacaoAte: z.string().optional(),

  // Filtros
  cancelados: z.boolean().optional().default(false),
  ordenacao: z.enum(PANGEA_ORDENACAO_VALUES).optional().default('Text'),
  nr: z.string().optional().default(''),
  pagina: z.number().int().min(1).optional().default(1),
  tamanhoPagina: z.number().int().min(1).max(PANGEA_MAX_TAMANHO_PAGINA).optional().default(PANGEA_MAX_TAMANHO_PAGINA),
  orgaos: z.array(z.string()).optional().default([]),
  tipos: z.array(z.enum(PANGEA_TIPO_VALUES)).optional().default([]),
});

export type PangeaBuscaInput = z.infer<typeof pangeaBuscaInputSchema>;

// =============================================================================
// OUTPUT
// =============================================================================

const nullableArray = <T extends z.ZodTypeAny>(item: T) =>
  z.preprocess(
    (v) => (v === null ? undefined : v),
    z.array(item).optional().default([])
  );

const nullableRecord = <T extends z.ZodTypeAny>(valueSchema: T) =>
  z.preprocess(
    (v) => (v === null ? undefined : v),
    z.record(z.string(), valueSchema).optional()
  );

const nullableInt = () =>
  z.preprocess(
    (v) => {
      if (v === null || v === undefined || v === '') return undefined;
      if (typeof v === 'number') return v;
      if (typeof v === 'string') {
        const n = Number(v);
        return Number.isFinite(n) ? n : v;
      }
      return v;
    },
    z.number().int().optional()
  );

export const pangeaAggSchema = z.object({
  tipo: z.preprocess((v) => (v === null || v === undefined ? '' : v), z.string()),
  total: z.preprocess(
    (v) => {
      if (v === null || v === undefined || v === '') return 0;
      if (typeof v === 'number') return v;
      if (typeof v === 'string') {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
      }
      return v;
    },
    z.number().int().nonnegative()
  ),
});

export type PangeaAgg = z.infer<typeof pangeaAggSchema>;

export const pangeaProcessoParadigmaSchema = z.object({
  // O Pangea pode retornar link ausente/null ou em formato não-URL.
  // Guardamos como string "best-effort" para não quebrar a busca.
  link: z
    .preprocess(
      (v) => {
        if (v === null || v === undefined) return undefined;
        if (typeof v === 'string') return v;
        return String(v);
      },
      z.string().min(1).optional()
    ),
  numero: z.preprocess((v) => (v === null || v === undefined ? '' : v), z.string()),
});

export type PangeaProcessoParadigma = z.infer<typeof pangeaProcessoParadigmaSchema>;

export const pangeaResultadoSchema = z
  .object({
    id: z.string(),
    // Em alguns cenários o Pangea pode retornar nr como string. Aceitamos ambos.
    nr: z
      .preprocess(
        (v) => {
          if (v === null || v === undefined || v === '') return null;
          if (typeof v === 'number') return v;
          if (typeof v === 'string') return Number(v);
          return v;
        },
        z.number().int().nullable()
      )
      .optional(),
    orgao: z.string(),
    tipo: z.string(),
    situacao: z.string().optional(),
    questao: z.string().optional(),
    tese: z.string().optional(),
    ultimaAtualizacao: z.string().optional(),
    possuiDecisoes: z.boolean().optional(),
    alertaSituacao: z.string().optional(),
    highlight: nullableRecord(z.string()),
    processosParadigma: nullableArray(pangeaProcessoParadigmaSchema),
    suspensoes: z
      .array(
        z.object({
          ativa: z.boolean().optional(),
          dataSuspensao: z.string().optional(),
          descricao: z.string().optional(),
          linkDecisao: z.string().url().optional(),
        })
      )
      .optional(),
  })
  .passthrough();

export type PangeaResultado = z.infer<typeof pangeaResultadoSchema>;

export const pangeaBuscaResponseSchema = z
  .object({
    aggsEspecies: nullableArray(pangeaAggSchema),
    aggsOrgaos: nullableArray(pangeaAggSchema),
    posicao_final: nullableInt(),
    posicao_inicial: nullableInt(),
    total: nullableInt(),
    resultados: nullableArray(pangeaResultadoSchema),
  })
  .passthrough();

export type PangeaBuscaResponse = z.infer<typeof pangeaBuscaResponseSchema>;

export interface PangeaOrgaoDisponivel {
  codigo: string;
  nome: string;
}


