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
   * Valida o dígito verificador do número de processo CNJ usando o método mod 97.
   *
   * Regra CNJ: DV = 98 - (resto % 97)
   * Onde resto = NNNNNNN + AAAA + J + TR + OOOO (sem o DV)
   *
   * @param numero - Número do processo com 20 dígitos
   * @returns Error se o dígito verificador for inválido, null se válido
   */
  private static validarDigitoVerificador(numero: string): Error | null {
    // Formato: NNNNNNNDDAAAAJTROOOO
    // Posições: 0-6 (NNNNNNN), 7-8 (DD), 9-12 (AAAA), 13 (J), 14-15 (TR), 16-19 (OOOO)

    const sequencial = numero.substring(0, 7);
    const dvInformado = parseInt(numero.substring(7, 9), 10);
    const ano = numero.substring(9, 13);
    const segmento = numero.substring(13, 14);
    const tribunal = numero.substring(14, 16);
    const origem = numero.substring(16, 20);

    // Concatenar na ordem correta para cálculo: origem + ano + segmento + tribunal + sequencial
    const numeroParaCalculo = origem + ano + segmento + tribunal + sequencial;

    // Calcular dígito verificador: 98 - (número % 97)
    const resto = BigInt(numeroParaCalculo) % BigInt(97);
    const dvCalculado = 98 - Number(resto);

    if (dvCalculado !== dvInformado) {
      return new Error(
        `Número do processo com dígito verificador inválido. ` +
        `Esperado: ${dvCalculado.toString().padStart(2, '0')}, ` +
        `Informado: ${dvInformado.toString().padStart(2, '0')}`
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
