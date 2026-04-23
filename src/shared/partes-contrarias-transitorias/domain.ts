import { z } from "zod";

/**
 * Tipos e schemas Zod para o módulo de partes contrárias transitórias.
 *
 * Partes contrárias transitórias são registros de parte contrária criados
 * com dados incompletos (apenas o nome é obrigatório). Ficam no estado
 * 'pendente' até que um usuário autenticado da firma complete o cadastro
 * e promova o registro para `partes_contrarias` definitivo.
 */

export type ParteContrariaTransitoriaStatus = "pendente" | "promovido";
export type ParteContrariaTransitoriaCriadoVia =
  | "formulario_publico"
  | "painel_interno";
export type TipoPessoa = "pf" | "pj";

export interface ParteContrariaTransitoria {
  id: number;
  nome: string;
  tipo_pessoa: TipoPessoa | null;
  cpf_ou_cnpj: string | null;
  email: string | null;
  telefone: string | null;
  observacoes: string | null;
  criado_via: ParteContrariaTransitoriaCriadoVia;
  criado_em_contrato_id: number | null;
  criado_por: number | null;
  sessao_formulario_uuid: string | null;
  status: ParteContrariaTransitoriaStatus;
  promovido_para_id: number | null;
  promovido_por: number | null;
  promovido_em: string | null;
  created_at: string;
  updated_at: string;
}

export const createTransitoriaSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, "Nome deve ter ao menos 2 caracteres")
    .max(200, "Nome deve ter no máximo 200 caracteres"),
  tipo_pessoa: z.enum(["pf", "pj"]).optional().nullable(),
  cpf_ou_cnpj: z.string().trim().optional().nullable(),
  email: z
    .string()
    .trim()
    .email("Email inválido")
    .optional()
    .nullable()
    .or(z.literal("")),
  telefone: z.string().trim().optional().nullable(),
  observacoes: z.string().trim().max(2000).optional().nullable(),
  criado_via: z.enum(["formulario_publico", "painel_interno"]),
  criado_em_contrato_id: z.number().int().positive().optional().nullable(),
  criado_por: z.number().int().positive().optional().nullable(),
  sessao_formulario_uuid: z.string().uuid().optional().nullable(),
});

export type CreateTransitoriaInput = z.infer<typeof createTransitoriaSchema>;

/**
 * Schema de atualização: permite editar os dados de uma transitória que ainda
 * está no estado `pendente`, sem promovê-la para `partes_contrarias`.
 *
 * Campos de origem (criado_via, criado_em_contrato_id, criado_por, sessao_formulario_uuid)
 * são intencionalmente omitidos — são metadados imutáveis de auditoria.
 *
 * Todos os campos editáveis são opcionais (patch parcial). Se `nome` vier,
 * precisa passar a mesma validação de mínimo/máximo do create.
 */
export const updateTransitoriaSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, "Nome deve ter ao menos 2 caracteres")
    .max(200, "Nome deve ter no máximo 200 caracteres")
    .optional(),
  tipo_pessoa: z.enum(["pf", "pj"]).nullable().optional(),
  cpf_ou_cnpj: z.string().trim().nullable().optional(),
  email: z
    .string()
    .trim()
    .email("Email inválido")
    .nullable()
    .optional()
    .or(z.literal("")),
  telefone: z.string().trim().nullable().optional(),
  observacoes: z.string().trim().max(2000).nullable().optional(),
});

export type UpdateTransitoriaInput = z.infer<typeof updateTransitoriaSchema>;

/**
 * Input de promoção: dados completos que o usuário preenche para criar
 * (ou vincular a) uma parte_contraria definitiva.
 *
 * Dois caminhos:
 * - `parte_contraria_id_alvo` preenchido → vincula transitória a parte_contraria existente
 * - `parte_contraria_id_alvo` null → cria nova parte_contraria com os dados informados
 */
export const promoverTransitoriaSchema = z
  .object({
    parte_contraria_id_alvo: z.number().int().positive().optional().nullable(),
    dados_novos: z
      .object({
        nome: z.string().trim().min(2).max(200),
        tipo_pessoa: z.enum(["pf", "pj"]),
        cpf: z.string().trim().optional().nullable(),
        cnpj: z.string().trim().optional().nullable(),
        email: z.string().trim().email().optional().nullable().or(z.literal("")),
        telefone: z.string().trim().optional().nullable(),
      })
      .optional()
      .nullable(),
  })
  .refine(
    (data) =>
      (data.parte_contraria_id_alvo != null && data.dados_novos == null) ||
      (data.parte_contraria_id_alvo == null && data.dados_novos != null),
    {
      message:
        "Forneça exatamente um: parte_contraria_id_alvo (merge) OU dados_novos (criar nova)",
    }
  );

export type PromoverTransitoriaInput = z.infer<typeof promoverTransitoriaSchema>;

/**
 * Sugestão de merge — retornada quando o sistema encontra partes_contrarias
 * existentes ou outras transitórias com nome similar, para permitir
 * deduplicação durante a promoção.
 */
export interface SugestaoMerge {
  kind: "parte_contraria" | "transitoria";
  id: number;
  nome: string;
  cpf?: string | null;
  cnpj?: string | null;
  score: number; // 0..1 — similaridade por trigram
}
