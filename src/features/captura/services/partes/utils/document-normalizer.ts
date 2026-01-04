/**
 * Utilitários para normalização e validação de documentos (CPF/CNPJ)
 *
 * Este módulo contém funções puras para:
 * - Normalizar CPF/CNPJ removendo formatação
 * - Validar formato básico de CPF/CNPJ
 */

/**
 * Normaliza CPF removendo máscara (pontos e traços)
 * Retorna string vazia se CPF for null/undefined
 *
 * @example
 * normalizarCpf("123.456.789-00") // "12345678900"
 * normalizarCpf(null) // ""
 */
export function normalizarCpf(cpf: string | null | undefined): string {
  if (!cpf) return "";
  return cpf.replace(/[.\-]/g, "");
}

/**
 * Normaliza CNPJ removendo máscara (pontos, traços e barras)
 * Retorna string vazia se CNPJ for null/undefined
 *
 * @example
 * normalizarCnpj("12.345.678/0001-90") // "12345678000190"
 * normalizarCnpj(null) // ""
 */
export function normalizarCnpj(cnpj: string | null | undefined): string {
  if (!cnpj) return "";
  return cnpj.replace(/[.\-/]/g, "");
}

/**
 * Normaliza documento genérico (CPF ou CNPJ)
 * Remove pontos, traços e barras
 * Retorna string vazia se documento for null/undefined
 *
 * @example
 * normalizarDocumento("123.456.789-00") // "12345678900"
 * normalizarDocumento("12.345.678/0001-90") // "12345678000190"
 */
export function normalizarDocumento(documento: string | null | undefined): string {
  if (!documento) return "";
  return documento.replace(/[.\-/]/g, "");
}

/**
 * Valida formato básico de CPF (apenas quantidade de dígitos)
 * Não valida dígitos verificadores
 *
 * @returns true se CPF tem 11 dígitos numéricos
 */
export function validarFormatoCpf(cpf: string | null | undefined): boolean {
  if (!cpf) return false;
  const cpfNormalizado = normalizarCpf(cpf);
  return /^\d{11}$/.test(cpfNormalizado);
}

/**
 * Valida formato básico de CNPJ (apenas quantidade de dígitos)
 * Não valida dígitos verificadores
 *
 * @returns true se CNPJ tem 14 dígitos numéricos
 */
export function validarFormatoCnpj(cnpj: string | null | undefined): boolean {
  if (!cnpj) return false;
  const cnpjNormalizado = normalizarCnpj(cnpj);
  return /^\d{14}$/.test(cnpjNormalizado);
}

/**
 * Valida CPF usando algoritmo de dígitos verificadores
 *
 * @returns true se CPF é válido (formato e dígitos verificadores)
 */
export function validarCpf(cpf: string | null | undefined): boolean {
  if (!cpf) return false;

  const cpfNormalizado = normalizarCpf(cpf);

  // Verifica se tem 11 dígitos
  if (!/^\d{11}$/.test(cpfNormalizado)) return false;

  // Verifica se todos os dígitos são iguais (CPFs inválidos conhecidos)
  if (/^(\d)\1{10}$/.test(cpfNormalizado)) return false;

  // Calcula primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpfNormalizado.charAt(i)) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpfNormalizado.charAt(9))) return false;

  // Calcula segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpfNormalizado.charAt(i)) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpfNormalizado.charAt(10))) return false;

  return true;
}

/**
 * Valida CNPJ usando algoritmo de dígitos verificadores
 *
 * @returns true se CNPJ é válido (formato e dígitos verificadores)
 */
export function validarCnpj(cnpj: string | null | undefined): boolean {
  if (!cnpj) return false;

  const cnpjNormalizado = normalizarCnpj(cnpj);

  // Verifica se tem 14 dígitos
  if (!/^\d{14}$/.test(cnpjNormalizado)) return false;

  // Verifica se todos os dígitos são iguais (CNPJs inválidos conhecidos)
  if (/^(\d)\1{13}$/.test(cnpjNormalizado)) return false;

  // Calcula primeiro dígito verificador
  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let soma = 0;
  for (let i = 0; i < 12; i++) {
    soma += parseInt(cnpjNormalizado.charAt(i)) * pesos1[i];
  }
  let resto = soma % 11;
  const dig1 = resto < 2 ? 0 : 11 - resto;
  if (dig1 !== parseInt(cnpjNormalizado.charAt(12))) return false;

  // Calcula segundo dígito verificador
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  soma = 0;
  for (let i = 0; i < 13; i++) {
    soma += parseInt(cnpjNormalizado.charAt(i)) * pesos2[i];
  }
  resto = soma % 11;
  const dig2 = resto < 2 ? 0 : 11 - resto;
  if (dig2 !== parseInt(cnpjNormalizado.charAt(13))) return false;

  return true;
}

/**
 * Verifica se documento tem comprimento válido após normalização
 *
 * @param documento - CPF ou CNPJ
 * @param tipoDocumento - "CPF" ou "CNPJ"
 * @returns true se documento tem comprimento correto (11 para CPF, 14 para CNPJ)
 */
export function temDocumentoValido(
  documento: string | null | undefined,
  tipoDocumento: "CPF" | "CNPJ"
): boolean {
  const documentoNormalizado = normalizarDocumento(documento);
  if (!documentoNormalizado) return false;

  if (tipoDocumento === "CPF") {
    return documentoNormalizado.length === 11;
  } else {
    return documentoNormalizado.length === 14;
  }
}
