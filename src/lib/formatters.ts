/**
 * Sinesys - Formatadores de Dados Brasileiros
 *
 * Este arquivo centraliza todas as funções de formatação de dados
 * para garantir consistência visual em toda a aplicação, especialmente
 * para padrões brasileiros (CPF, CNPJ, Moeda, etc.).
 *
 * REGRA PARA AGENTES:
 * SEMPRE importe e use essas funções ao exibir dados para o usuário.
 * NUNCA crie lógica de formatação inline nos componentes.
 */

/**
 * Formata um número para o padrão monetário brasileiro (BRL).
 * @param value O valor numérico a ser formatado.
 * @returns A string formatada, ex: "R$ 1.234,56".
 */
export const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) {
    return "R$ 0,00";
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

/**
 * Formata uma string de CPF (11 dígitos) para o padrão com pontos e traço.
 * @param cpf A string do CPF (apenas dígitos).
 * @returns O CPF formatado (000.000.000-00) ou a string original se inválido.
 */
export const formatCPF = (cpf: string | null | undefined): string => {
  if (!cpf) return "";
  const cleaned = cpf.replace(/\D/g, "");
  if (cleaned.length !== 11) {
    return cpf; // Retorna original se não tiver 11 dígitos
  }
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

/**
 * Formata uma string de CNPJ (14 dígitos) para o padrão com pontos, barra e traço.
 * @param cnpj A string do CNPJ (apenas dígitos).
 * @returns O CNPJ formatado (00.000.000/0000-00) ou a string original se inválido.
 */
export const formatCNPJ = (cnpj: string | null | undefined): string => {
  if (!cnpj) return "";
  const cleaned = cnpj.replace(/\D/g, "");
  if (cleaned.length !== 14) {
    return cnpj; // Retorna original se não tiver 14 dígitos
  }
  return cleaned.replace(
    /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
    "$1.$2.$3/$4-$5"
  );
};

/**
 * Formata um objeto Date ou uma string de data para o padrão brasileiro (dd/MM/yyyy).
 * @param date O objeto Date ou a string de data.
 * @returns A data formatada ou uma string vazia se a data for inválida.
 */
export const formatDate = (
  date: Date | string | null | undefined
): string => {
  if (!date) return "";
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    // Adiciona verificação de data válida
    if (isNaN(dateObj.getTime())) {
        return "";
    }
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "UTC", // Garante consistência independente do fuso do servidor/cliente
    }).format(dateObj);
  } catch (error) {
    console.error("Erro ao formatar data:", error);
    return "";
  }
};

/**
 * Formata uma string de telefone (10 ou 11 dígitos) para o padrão brasileiro.
 * @param phone A string de telefone (apenas dígitos).
 * @returns O telefone formatado ((00) 0000-0000 ou (00) 00000-0000) ou o original.
 */
export const formatPhone = (phone: string | null | undefined): string => {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
  return phone; // Retorna original se não for 10 ou 11 dígitos
};
