
import { z } from 'zod';

export const GENERO_LABELS = {
  masculino: 'Masculino',
  feminino: 'Feminino',
  outro: 'Outro',
  prefiro_nao_informar: 'Prefiro não informar',
} as const;

export const STATUS_LABELS = {
  ativo: 'Ativo',
  inativo: 'Inativo',
} as const;

// Schemas básicos
export const cpfSchema = z.string().transform((val) => val.replace(/\D/g, '')).refine((val) => val.length === 11, {
  message: 'CPF deve conter 11 dígitos',
});

export const emailSchema = z.string().email('Email inválido');

export const telefoneSchema = z.string().transform((val) => val ? val.replace(/\D/g, '') : null).nullable();

// Schema de Endereço
export const enderecoSchema = z.object({
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().length(2, 'Estado deve ter 2 letras').optional(),
  pais: z.string().optional(),
  cep: z.string().transform((val) => val ? val.replace(/\D/g, '') : undefined).optional(),
}).nullable().optional();

// Schema de Criação de Usuário
export const criarUsuarioSchema = z.object({
  nomeCompleto: z.string().min(3, 'Nome completo deve ter no mínimo 3 caracteres'),
  nomeExibicao: z.string().min(2, 'Nome de exibição deve ter no mínimo 2 caracteres'),
  cpf: cpfSchema,
  rg: z.string().optional().nullable(),
  dataNascimento: z.string().nullable().optional(), // ISO string YYYY-MM-DD
  genero: z.enum(['masculino', 'feminino', 'outro', 'prefiro_nao_informar']).nullable().optional(),
  oab: z.string().optional().nullable(),
  ufOab: z.string().length(2, 'UF da OAB deve ter 2 letras').optional().nullable(),
  emailPessoal: emailSchema.nullable().optional().or(z.literal('')),
  emailCorporativo: emailSchema,
  telefone: telefoneSchema.optional(),
  ramal: z.string().optional().nullable(),
  endereco: enderecoSchema,
  authUserId: z.string().uuid().optional().nullable(),
  cargoId: z.coerce.number().optional().nullable(),
  isSuperAdmin: z.boolean().default(false),
  ativo: z.boolean().default(true),
});

// Schema de Atualização de Usuário
export const atualizarUsuarioSchema = criarUsuarioSchema.partial().extend({
  id: z.number(),
});

// Type guards
export function isUsuarioAtivo(usuario: { ativo: boolean }): boolean {
  return usuario.ativo;
}

export function isSuperAdmin(usuario: { isSuperAdmin: boolean }): boolean {
  return usuario.isSuperAdmin;
}
