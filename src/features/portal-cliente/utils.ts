import { z } from "zod";

export const cpfSchema = z.string().regex(/^\d{11}$/);

export interface ValidacaoCpf {
  valido: boolean;
  cpfLimpo: string;
  erro?: string;
}

export function validarCpf(cpf: string): ValidacaoCpf {
  const cpfLimpo = cpf.replace(/\D/g, "");
  if (cpfLimpo.length !== 11 || /^(\d)\1{10}$/.test(cpfLimpo)) {
    return { valido: false, cpfLimpo, erro: "CPF inválido" };
  }
  return { valido: true, cpfLimpo };
}
