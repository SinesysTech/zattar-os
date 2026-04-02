export * from './types';
import { z } from 'zod';

export const cepSchema = z
  .string()
  .min(8, 'CEP deve ter 8 dígitos')
  .transform((val) => val.replace(/\D/g, ''));

export const enderecoSchema = z.object({
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  municipio: z.string().min(1, 'Município é obrigatório'),
  estado: z.string().min(2, 'Estado é obrigatório'),
  cep: cepSchema,
});
