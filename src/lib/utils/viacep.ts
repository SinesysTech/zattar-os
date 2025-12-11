/**
 * Utilitários para integração com ViaCEP
 * API gratuita para consulta de endereços por CEP
 * https://viacep.com.br
 */

export interface EnderecoViaCep {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  uf: string;
  ibge?: string;
  gia?: string;
  ddd?: string;
  siafi?: string;
}

/**
 * Remove caracteres não numéricos de um CEP
 */
export function limparCep(cep: string): string {
  return cep.replace(/\D/g, '');
}

/**
 * Busca endereço por CEP usando a API ViaCEP
 * @param cep - CEP com ou sem formatação (ex: "01310-100" ou "01310100")
 * @returns Endereço encontrado ou null se não encontrado
 */
export async function buscarEnderecoPorCep(cep: string): Promise<EnderecoViaCep | null> {
  const cepNumerico = limparCep(cep);

  if (cepNumerico.length !== 8) {
    throw new Error('CEP deve conter 8 dígitos');
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cepNumerico}/json/`);

    if (!response.ok) {
      throw new Error('Erro ao consultar ViaCEP');
    }

    const data = await response.json();

    // ViaCEP retorna { erro: true } quando o CEP não é encontrado
    if (data.erro) {
      return null;
    }

    return {
      cep: data.cep,
      logradouro: data.logradouro || '',
      complemento: data.complemento || '',
      bairro: data.bairro || '',
      cidade: data.localidade || '',
      estado: data.uf || '',
      uf: data.uf || '',
      ibge: data.ibge,
      gia: data.gia,
      ddd: data.ddd,
      siafi: data.siafi,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Erro ao buscar endereço por CEP');
  }
}

