/**
 * Value Objects para garantir invariantes de domínio.
 *
 * Value Objects são objetos imutáveis que representam conceitos de domínio
 * com regras de validação embutidas. Eles garantem que valores inválidos
 * nunca sejam criados.
 */

/**
 * Representa um CEP brasileiro válido.
 *
 * Formato: NNNNN-NNN (8 dígitos numéricos)
 * Exemplo: 01310-100
 */
export class CEP {
  private constructor(private readonly valor: string) {}

  /**
   * Cria uma instância de CEP a partir de uma string.
   * Normaliza e valida o formato do CEP.
   *
   * @param cep - String contendo o CEP (com ou sem formatação)
   * @returns Instância de CEP ou Error se inválido
   *
   * @example
   * ```ts
   * const cep = CEP.criar('01310-100');
   * if (cep instanceof Error) {
   *   console.error(cep.message);
   * } else {
   *   console.log(cep.formatar()); // "01310-100"
   * }
   * ```
   */
  static criar(cep: string): CEP | Error {
    // Normalizar: remover tudo que não é dígito
    const normalizado = cep.replace(/\D/g, '');

    // Validar formato
    const erro = CEP.validar(normalizado);
    if (erro) {
      return erro;
    }

    return new CEP(normalizado);
  }

  /**
   * Valida se uma string representa um CEP válido.
   *
   * @param cep - String contendo o CEP sem formatação
   * @returns Error se inválido, null se válido
   */
  static validar(cep: string): Error | null {
    if (!cep || cep.length !== 8) {
      return new Error('CEP deve conter exatamente 8 dígitos');
    }

    if (!/^\d{8}$/.test(cep)) {
      return new Error('CEP deve conter apenas dígitos numéricos');
    }

    return null;
  }

  /**
   * Retorna o CEP formatado no padrão NNNNN-NNN.
   *
   * @returns CEP formatado
   */
  formatar(): string {
    return `${this.valor.substring(0, 5)}-${this.valor.substring(5)}`;
  }

  /**
   * Retorna a representação em string do CEP (sem formatação).
   *
   * @returns CEP sem formatação
   */
  toString(): string {
    return this.valor;
  }

  /**
   * Compara este CEP com outro para verificar igualdade.
   *
   * @param outro - Outro CEP para comparação
   * @returns true se forem iguais, false caso contrário
   */
  equals(outro: CEP): boolean {
    return this.valor === outro.valor;
  }
}

/**
 * Representa um número de processo judicial no formato CNJ.
 *
 * Formato: NNNNNNN-DD.AAAA.J.TR.OOOO
 * - NNNNNNN: Número sequencial do processo
 * - DD: Dígito verificador (calculado por mod 97)
 * - AAAA: Ano de registro
 * - J: Segmento da justiça (1-9)
 * - TR: Tribunal
 * - OOOO: Código da unidade de origem
 *
 * Exemplo: 0000123-45.2024.5.02.0001
 */
export class NumeroProcesso {
  private constructor(private readonly valor: string) {}

  /**
   * Cria uma instância de NumeroProcesso a partir de uma string.
   * Normaliza, valida o formato e o dígito verificador CNJ.
   *
   * @param numero - String contendo o número do processo (com ou sem formatação)
   * @returns Instância de NumeroProcesso ou Error se inválido
   *
   * @example
   * ```ts
   * const numero = NumeroProcesso.criar('0000123-45.2024.5.02.0001');
   * if (numero instanceof Error) {
   *   console.error(numero.message);
   * } else {
   *   console.log(numero.formatar()); // "0000123-45.2024.5.02.0001"
   * }
   * ```
   */
  static criar(numero: string): NumeroProcesso | Error {
    // Normalizar: remover tudo que não é dígito
    const normalizado = numero.replace(/\D/g, '');

    // Validar formato básico
    const erro = NumeroProcesso.validar(normalizado);
    if (erro) {
      return erro;
    }

    // Validar dígito verificador CNJ (método mod 97)
    const dvErro = NumeroProcesso.validarDigitoVerificador(normalizado);
    if (dvErro) {
      return dvErro;
    }

    return new NumeroProcesso(normalizado);
  }

  /**
   * Valida se uma string representa um número de processo válido (formato).
   *
   * @param numero - String contendo o número do processo sem formatação
   * @returns Error se inválido, null se válido
   */
  static validar(numero: string): Error | null {
    if (!numero || numero.length !== 20) {
      return new Error('Número do processo deve conter exatamente 20 dígitos');
    }

    if (!/^\d{20}$/.test(numero)) {
      return new Error('Número do processo deve conter apenas dígitos numéricos');
    }

    return null;
  }

  /**
   * Valida o dígito verificador do número de processo CNJ usando o algoritmo mod 97.
   *
   * Algoritmo CNJ (Resolução 65/2008, MNI PJe/TRT):
   * O dígito verificador é calculado de forma que a verificação em três etapas
   * resulte em 1 (princípio ISO 7064).
   *
   * Etapas:
   * 1. op1 = NNNNNNN % 97
   * 2. op2 = parseInt(op1 + AAAA + J + TR) % 97
   * 3. opFinal = parseInt(op2 + OOOO + DD) % 97
   * 4. Válido se opFinal === 1
   *
   * @param numero - Número do processo com 20 dígitos (NNNNNNNDDAAAAJTROOOO)
   * @returns Error se o dígito verificador for inválido, null se válido
   */
  private static validarDigitoVerificador(numero: string): Error | null {
    // Formato: NNNNNNNDDAAAAJTROOOO
    // Posições: 0-6 (N: sequencial), 7-8 (D: DV), 9-12 (A: ano),
    //           13 (J: segmento justiça), 14-15 (TR: tribunal), 16-19 (O: origem)

    const n = numero.slice(0, 7);   // Número sequencial
    const d = numero.slice(7, 9);   // Dígito verificador
    const a = numero.slice(9, 13);  // Ano de registro
    const j = numero.slice(13, 14); // Segmento da justiça (5 = trabalhista)
    const tr = numero.slice(14, 16); // Tribunal
    const o = numero.slice(16, 20); // Origem (vara/unidade)

    // Algoritmo mod 97 em três etapas (MNI/CNJ/PJe)
    const op1 = parseInt(n, 10) % 97;
    const op2 = parseInt(`${op1}${a}${j}${tr}`, 10) % 97;
    const opFinal = parseInt(`${op2}${o}${d}`, 10) % 97;

    // Um número válido resulta em opFinal === 1
    if (opFinal !== 1) {
      return new Error(
        `Número do processo com dígito verificador inválido (CNJ Res.65/2008)`
      );
    }

    return null;
  }

  /**
   * Retorna o número do processo formatado no padrão CNJ.
   *
   * @returns Número formatado (NNNNNNN-DD.AAAA.J.TR.OOOO)
   */
  formatar(): string {
    const sequencial = this.valor.substring(0, 7);
    const dv = this.valor.substring(7, 9);
    const ano = this.valor.substring(9, 13);
    const segmento = this.valor.substring(13, 14);
    const tribunal = this.valor.substring(14, 16);
    const origem = this.valor.substring(16, 20);

    return `${sequencial}-${dv}.${ano}.${segmento}.${tribunal}.${origem}`;
  }

  /**
   * Retorna a representação em string do número do processo (sem formatação).
   *
   * @returns Número do processo sem formatação
   */
  toString(): string {
    return this.valor;
  }

  /**
   * Compara este número de processo com outro para verificar igualdade.
   *
   * @param outro - Outro número de processo para comparação
   * @returns true se forem iguais, false caso contrário
   */
  equals(outro: NumeroProcesso): boolean {
    return this.valor === outro.valor;
  }
}
