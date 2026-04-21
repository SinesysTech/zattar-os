/**
 * Contratação Trabalhista — Schemas Zod + Tipos (sem "use server").
 *
 * Arquivos "use server" não podem exportar objetos (Zod schemas) nem tipos.
 * Este arquivo centraliza schema e tipos consumidos pelo service paralelo.
 */

import { z } from "zod";
import {
  tipoContratoSchema,
  tipoCobrancaSchema,
  papelContratualSchema,
  type TipoContrato,
  type TipoCobranca,
  type PapelContratual,
} from "@/app/(authenticated)/contratos/domain";

// ─── Schemas de Input ──────────────────────────────────────────────

const enderecoInputSchema = z.object({
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  municipio: z.string().optional(),
  estado_sigla: z.string().length(2).optional(),
});

const clienteInputSchema = z.object({
  cpf: z.string().min(11, "CPF é obrigatório"),
  nome: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email().optional(),
  celular: z.string().optional().describe("Celular no formato DDDNUMERO ex: 31999998888"),
  rg: z.string().optional(),
  data_nascimento: z.string().optional().describe("YYYY-MM-DD"),
  estado_civil: z.string().optional(),
  genero: z.string().optional(),
  nacionalidade: z.string().optional(),
  endereco: enderecoInputSchema.optional(),
});

const parteContrariaInputSchema = z
  .object({
    tipo_pessoa: z.enum(["pf", "pj"]),
    cpf: z.string().optional(),
    cnpj: z.string().optional(),
    nome: z.string().min(1, "Nome/razão social é obrigatório"),
    nome_fantasia: z.string().optional(),
    email: z.string().email().optional(),
    endereco: enderecoInputSchema.optional(),
  })
  .refine((data) => (data.tipo_pessoa === "pf" ? !!data.cpf : !!data.cnpj), {
    message: "CPF é obrigatório para PF; CNPJ é obrigatório para PJ",
  });

const contratoInputSchema = z.object({
  tipo_contrato: tipoContratoSchema.optional().default("ajuizamento"),
  tipo_cobranca: tipoCobrancaSchema.optional().default("pro_exito"),
  papel_cliente: papelContratualSchema.optional().default("autora"),
  observacoes: z.string().optional(),
  segmento_slug: z.string().optional().default("trabalhista"),
  formulario_slug: z.string().optional(),
  responsavel_id: z.number().int().positive().optional(),
});

export const criarContratacaoTrabalhistaSchema = z.object({
  cliente: clienteInputSchema,
  parte_contraria: parteContrariaInputSchema,
  contrato: contratoInputSchema.optional().default({}),
  atualizar_cliente_se_existir: z.boolean().optional().default(false),
  base_url_publica: z
    .string()
    .url()
    .optional()
    .describe("Base URL para construir o link público (ex: https://zattaradvogados.com)"),
});

export type CriarContratacaoTrabalhistaInput = z.infer<typeof criarContratacaoTrabalhistaSchema>;

// ─── Link Público Standalone ────────────────────────────────────────

export const gerarLinkFormularioPublicoSchema = z.object({
  segmento_slug: z.string().min(1).default("trabalhista"),
  formulario_slug: z.string().min(1),
  base_url_publica: z.string().url().optional(),
});

export type GerarLinkFormularioPublicoInput = z.infer<typeof gerarLinkFormularioPublicoSchema>;

// ─── Output ─────────────────────────────────────────────────────────

export interface CriarContratacaoTrabalhistaResult {
  cliente: { id: number; nome: string; cpf: string; criado: boolean; atualizado: boolean };
  parte_contraria: { id: number; nome: string; documento: string; criado: boolean };
  contrato: {
    id: number;
    status: string;
    tipo_contrato: TipoContrato;
    tipo_cobranca: TipoCobranca;
    papel_cliente: PapelContratual;
  };
  link_formulario_publico: string | null;
  proximos_passos: string[];
  warnings: string[];
}
