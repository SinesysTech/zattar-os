// Schema Zod para validação de Dados Pessoais
import { z } from 'zod';
import { validateCPF } from '@/core/app/_lib/assinatura-digital/validators/cpf.validator';
import { validateTelefone } from '@/core/app/_lib/assinatura-digital/validators/telefone.validator';
import { parseData } from '@/core/app/_lib/assinatura-digital/formatters/data';
import { formatCelularWithCountryCode } from '@/core/app/_lib/assinatura-digital/formatters/telefone';
import { ESTADOS_CIVIS, GENEROS, ESTADOS_BRASILEIROS } from '@/lib/assinatura-digital/constants/estadosCivis';
import { NACIONALIDADES } from '@/lib/assinatura-digital/constants/nacionalidades';

// Helper para validar data e calcular idade
const validateDateAndAge = (dateStr: string): boolean => {
  const [day, month, year] = dateStr.split('/').map(Number);

  // Valida se a data existe no calendário
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return false;
  }

  // Calcula idade
  const today = new Date();
  let age = today.getFullYear() - year;
  const monthDiff = today.getMonth() - (month - 1);

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < day)) {
    age--;
  }

  // Verifica se idade está entre 16 e 100 anos
  return age >= 16 && age <= 100;
};

export const dadosPessoaisSchema = z.object({
  // Dados pessoais
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').trim(),

  cpf: z
    .string()
    .min(1, 'CPF é obrigatório')
    .transform((val) => val.replace(/\D/g, ''))
    .refine((val) => val.length === 11, 'CPF deve ter 11 dígitos')
    .refine((val) => validateCPF(val), 'CPF inválido'),

  rg: z.string().optional().default(''),

  dataNascimento: z
    .string()
    .min(1, 'Data de nascimento é obrigatória')
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Data deve estar no formato dd/mm/aaaa')
    .refine(validateDateAndAge, 'Data inválida ou idade deve estar entre 16 e 100 anos')
    .transform(parseData),

  estadoCivil: z
    .string()
    .refine((val) => val in ESTADOS_CIVIS, 'Estado civil inválido'),

  genero: z
    .string()
    .refine((val) => val in GENEROS, 'Gênero inválido'),

  nacionalidade: z
    .string()
    .refine((val) => val in NACIONALIDADES, 'Nacionalidade inválida'),

  // Contato
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido')
    .toLowerCase()
    .trim(),

  celular: z
    .string()
    .min(1, 'Celular é obrigatório')
    .transform((val) => val.replace(/\D/g, ''))
    // Remove código do país se presente (+55)
    .transform((val) => val.startsWith('55') && val.length > 11 ? val.substring(2) : val)
    .refine((val) => val.length === 11, 'Celular deve ter 11 dígitos')
    .refine((val) => validateTelefone(val), 'Celular inválido')
    .transform(formatCelularWithCountryCode),

  telefone: z
    .string()
    .optional()
    .transform((val) => (val ? val.replace(/\D/g, '') : ''))
    // Remove código do país se presente (+55)
    .transform((val) => {
      if (!val) return '';
      return val.startsWith('55') && val.length > 11 ? val.substring(2) : val;
    })
    .refine((val) => !val || validateTelefone(val), 'Telefone inválido')
    .refine((val) => !val || val.length === 10 || val.length === 11, 'Telefone deve ter 10 ou 11 dígitos'),

  // Endereço
  cep: z
    .string()
    .min(1, 'CEP é obrigatório')
    .transform((val) => val.replace(/\D/g, ''))
    .refine((val) => val.length === 8, 'CEP deve ter 8 dígitos'),

  logradouro: z.string().min(3, 'Logradouro deve ter no mínimo 3 caracteres').trim(),

  numero: z.string().min(1, 'Número é obrigatório').trim(),

  complemento: z.string().optional().default(''),

  bairro: z.string().min(2, 'Bairro deve ter no mínimo 2 caracteres').trim(),

  cidade: z.string().min(2, 'Cidade deve ter no mínimo 2 caracteres').trim(),

  estado: z
    .string()
    .refine((val) => val in ESTADOS_BRASILEIROS, 'Estado inválido'),
});

export type DadosPessoaisFormData = z.infer<typeof dadosPessoaisSchema>;

// Helper functions para mapeamento de texto
export const getEstadoCivilText = (codigo: string): string => {
  return ESTADOS_CIVIS[codigo as keyof typeof ESTADOS_CIVIS] || '';
};

export const getGeneroText = (codigo: number | undefined): string => {
  if (codigo === undefined) return '';
  return GENEROS[codigo as keyof typeof GENEROS] || '';
};

export const getNacionalidadeText = (id: number | undefined): string => {
  if (id === undefined) return '';
  return NACIONALIDADES[id as keyof typeof NACIONALIDADES] || '';
};