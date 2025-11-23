/**
 * Arquivo: captura/services/partes/identificacao-partes.service.ts
 *
 * PROPÓSITO:
 * Lógica de negócio para identificar automaticamente o tipo de parte em um processo:
 * - cliente: Parte representada por advogado do nosso escritório
 * - parte_contraria: Parte oposta (não representada por nós)
 * - terceiro: Parte especial (perito, MP, testemunha, etc.)
 *
 * ALGORITMO:
 * 1. Verifica se tipo_parte está na lista de tipos especiais → terceiro
 * 2. Verifica se algum representante tem CPF igual ao advogado → cliente
 * 3. Caso contrário → parte_contraria
 *
 * EXPORTAÇÕES:
 * - identificarTipoParte(): Função principal de identificação
 * - normalizarCpf(): Helper para normalizar CPF (remove formatação)
 * - isTipoEspecial(): Helper para verificar se é tipo especial
 *
 * QUEM USA ESTE ARQUIVO:
 * - backend/captura/services/partes/partes-capture.service.ts
 */

import type { PartePJE, RepresentantePJE } from '@/backend/api/pje-trt/partes/types';
import type { TipoParteClassificacao } from './types';

/**
 * Lista de tipos de parte considerados "terceiros"
 *
 * PROPÓSITO:
 * Tipos especiais que não são nem cliente nem parte contrária.
 * São participantes auxiliares do processo (peritos, MP, testemunhas, etc.)
 *
 * IMPORTANTE:
 * Mesmo que um perito seja representado por advogado do escritório,
 * ele será classificado como terceiro (tipo especial tem prioridade).
 */
const TIPOS_ESPECIAIS = [
  'PERITO',
  'PERITO_CONTADOR',
  'PERITO_MEDICO',
  'PERITO_JUDICIAL',
  'MINISTERIO_PUBLICO',
  'MINISTERIO_PUBLICO_TRABALHO',
  'MINISTERIO_PUBLICO_ESTADUAL',
  'MINISTERIO_PUBLICO_FEDERAL',
  'ASSISTENTE',
  'ASSISTENTE_TECNICO',
  'TESTEMUNHA',
  'CUSTOS_LEGIS',
  'AMICUS_CURIAE',
  'PREPOSTO',
  'CURADOR',
  'CURADOR_ESPECIAL',
  'INVENTARIANTE',
  'ADMINISTRADOR',
  'SINDICO',
  'DEPOSITARIO',
  'LEILOEIRO',
  'LEILOEIRO_OFICIAL',
  'TRADUTOR',
  'INTERPRETE',
] as const;

/**
 * Interface para dados mínimos do advogado necessários para identificação
 */
export interface AdvogadoIdentificacao {
  /** ID do advogado */
  id: number;
  /** CPF do advogado (com ou sem formatação) */
  cpf: string;
  /** Nome do advogado (opcional, usado apenas para logging) */
  nome?: string;
}

/**
 * Função: identificarTipoParte
 *
 * PROPÓSITO:
 * Classifica uma parte em um dos três tipos: cliente, parte_contraria ou terceiro.
 * Usa lógica de prioridade: tipo especial > representante nosso > parte contrária.
 *
 * PARÂMETROS:
 * - parte: PartePJE (obrigatório)
 *   Dados completos da parte incluindo representantes
 *
 * - advogado: AdvogadoIdentificacao (obrigatório)
 *   Dados do advogado dono da credencial usada na captura
 *
 * RETORNO:
 * - 'cliente': Parte é representada por advogado do escritório
 * - 'parte_contraria': Parte não é representada por nós
 * - 'terceiro': Parte tem tipo especial (perito, MP, etc.)
 *
 * ALGORITMO:
 * 1. Verifica se tipoParte está em TIPOS_ESPECIAIS
 *    → Se sim, retorna 'terceiro'
 * 2. Normaliza CPF do advogado (remove pontos, hífens)
 * 3. Para cada representante:
 *    a. Normaliza CPF do representante
 *    b. Compara CPFs normalizados
 *    c. Se match, retorna 'cliente'
 * 4. Se nenhum representante deu match, retorna 'parte_contraria'
 *
 * LOGGING:
 * - Info: Identificação bem-sucedida com detalhes
 * - Warning: Parte sem representantes, CPF inválido
 * - Debug: Cada comparação de CPF
 *
 * EXEMPLO:
 * const parte: PartePJE = {
 *   idParte: 123,
 *   nome: "João Silva",
 *   tipoParte: "AUTOR",
 *   representantes: [
 *     { numeroDocumento: "12345678900", nome: "Dra. Maria", ... }
 *   ],
 *   ...
 * };
 *
 * const advogado = { id: 1, cpf: "123.456.789-00" };
 *
 * const tipo = identificarTipoParte(parte, advogado);
 * // Retorna 'cliente' (CPF do representante = CPF do advogado)
 */
export function identificarTipoParte(
  parte: PartePJE,
  advogado: AdvogadoIdentificacao
): TipoParteClassificacao {
  // Validação básica
  if (!parte || !advogado) {
    throw new Error('Parte e advogado são obrigatórios para identificação');
  }

  if (!advogado.cpf) {
    throw new Error('CPF do advogado é obrigatório para identificação');
  }

  // 1. Verifica se é tipo especial (prioridade máxima)
  if (isTipoEspecial(parte.tipoParte)) {
    console.log(
      `[IDENTIFICACAO] Parte "${parte.nome}" (${parte.tipoParte}) identificada como TERCEIRO (tipo especial)`
    );
    return 'terceiro';
  }

  // 2. Verifica representantes
  const representantes = parte.representantes || [];

  // Se não tem representantes, classifica como parte contrária com warning
  if (representantes.length === 0) {
    console.warn(
      `[IDENTIFICACAO] Parte "${parte.nome}" sem representantes cadastrados - classificada como PARTE_CONTRARIA`
    );
    return 'parte_contraria';
  }

  // Normaliza CPF do advogado para comparação
  const cpfAdvogadoNormalizado = normalizarCpf(advogado.cpf);

  // Valida CPF do advogado
  if (!cpfAdvogadoNormalizado || !isCpfValido(cpfAdvogadoNormalizado)) {
    console.warn(
      `[IDENTIFICACAO] CPF do advogado inválido: ${advogado.cpf} - tratando como parte contrária`
    );
    return 'parte_contraria';
  }

  // 3. Compara CPF de cada representante com CPF do advogado
  for (const representante of representantes) {
    // Pula representantes sem CPF
    if (!representante.numeroDocumento) {
      console.warn(
        `[IDENTIFICACAO] Representante "${representante.nome}" sem CPF - pulando`
      );
      continue;
    }

    // Normaliza CPF do representante
    const cpfRepresentanteNormalizado = normalizarCpf(representante.numeroDocumento);

    // Valida CPF do representante
    if (!cpfRepresentanteNormalizado || !isCpfValido(cpfRepresentanteNormalizado)) {
      console.warn(
        `[IDENTIFICACAO] Representante "${representante.nome}" possui CPF inválido: ${representante.numeroDocumento} - pulando`
      );
      continue;
    }

    // Compara CPFs normalizados
    if (cpfRepresentanteNormalizado === cpfAdvogadoNormalizado) {
      console.log(
        `[IDENTIFICACAO] Parte "${parte.nome}" identificada como CLIENTE (representada por ${representante.nome} - ${representante.numeroOAB || 'sem OAB'}/${representante.ufOAB || 'N/A'})`
      );
      return 'cliente';
    }

    console.debug(
      `[IDENTIFICACAO] CPF do representante ${representante.nome} não corresponde ao advogado da credencial`
    );
  }

  // 4. Nenhum representante deu match → parte contrária
  console.log(
    `[IDENTIFICACAO] Parte "${parte.nome}" identificada como PARTE_CONTRARIA (${representantes.length} representantes, nenhum do escritório)`
  );
  return 'parte_contraria';
}

/**
 * Função: normalizarCpf
 *
 * PROPÓSITO:
 * Remove caracteres não numéricos de um CPF para permitir comparação.
 *
 * TRANSFORMAÇÕES:
 * - "123.456.789-00" → "12345678900"
 * - "123 456 789 00" → "12345678900"
 * - "12345678900" → "12345678900" (já normalizado)
 *
 * RETORNO:
 * - String apenas com dígitos
 * - String vazia se input for inválido
 */
export function normalizarCpf(cpf: string | undefined | null): string {
  if (!cpf) return '';

  // Remove tudo que não é dígito
  return cpf.replace(/\D/g, '');
}

/**
 * Função: isCpfValido
 *
 * PROPÓSITO:
 * Valida se CPF normalizado é válido (11 dígitos e não é sequência de zeros).
 *
 * VALIDAÇÕES:
 * - Deve ter exatamente 11 dígitos
 * - Não pode ser "00000000000" (CPF inválido comum)
 * - Não pode ser "11111111111", "22222222222", etc.
 *
 * NOTA:
 * Esta é uma validação básica, não verifica dígitos verificadores.
 * Suficiente para o propósito de identificação de partes.
 */
function isCpfValido(cpfNormalizado: string): boolean {
  if (cpfNormalizado.length !== 11) return false;

  // Verifica se não é sequência de números iguais (00000000000, 11111111111, etc.)
  if (/^(\d)\1{10}$/.test(cpfNormalizado)) return false;

  return true;
}

/**
 * Função: isTipoEspecial
 *
 * PROPÓSITO:
 * Verifica se o tipo da parte está na lista de tipos especiais (terceiros).
 *
 * PARÂMETROS:
 * - tipoParte: string - Tipo da parte retornado pelo PJE
 *
 * RETORNO:
 * - true: Tipo está na lista de tipos especiais
 * - false: Tipo não é especial (pode ser cliente ou parte contrária)
 *
 * COMPORTAMENTO:
 * - Comparação case-insensitive
 * - Remove underscores e espaços antes de comparar
 */
export function isTipoEspecial(tipoParte: string | undefined): boolean {
  if (!tipoParte) return false;

  const tipoNormalizado = tipoParte.toUpperCase().replace(/[_\s]/g, '');

  return TIPOS_ESPECIAIS.some(
    (tipoEspecial) => tipoEspecial.replace(/[_\s]/g, '') === tipoNormalizado
  );
}
