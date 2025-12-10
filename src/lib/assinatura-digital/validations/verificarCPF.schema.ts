import { z } from 'zod';
import { validateCPF } from '@/lib/assinatura-digital/validators/cpf.validator';

export const verificarCPFSchema = z.object({
  cpf: z
    .string()
    .refine(
      (cpf) => {
        const digits = cpf.replace(/\D/g, '');
        return digits.length > 0;
      },
      { message: 'CPF é obrigatório' }
    )
    .refine(
      (cpf) => {
        const digits = cpf.replace(/\D/g, '');
        return digits.length === 11;
      },
      { message: 'CPF deve ter 11 dígitos' }
    )
    .refine(
      (cpf) => {
        const digits = cpf.replace(/\D/g, '');
        return validateCPF(digits);
      },
      { message: 'CPF inválido' }
    ),
});

export type VerificarCPFFormData = z.infer<typeof verificarCPFSchema>;