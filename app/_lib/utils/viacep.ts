/**
 * Utilitários para integração com ViaCEP API
 * Documentação: https://viacep.com.br/
 */

/**
 * Interface para o retorno da API ViaCEP
 */
export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  unidade: string;
  bairro: string;
  localidade: string;
  uf: string;
  estado: string;
  regiao: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

/**
 * Interface para o endereço formatado
 */
export interface EnderecoViaCep {
  cep: string;
  logradouro: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
}

/**
 * Valida formato de CEP (8 dígitos)
 */
export function validarCep(cep: string): boolean {
  // Remove caracteres não numéricos
  const cepLimpo = cep.replace(/\D/g, '');

  // Verifica se tem exatamente 8 dígitos
  return /^\d{8}$/.test(cepLimpo);
}

/**
 * Formata CEP para exibição (xxxxx-xxx)
 */
export function formatarCep(cep: string): string {
  const cepLimpo = cep.replace(/\D/g, '');

  if (cepLimpo.length !== 8) {
    return cep;
  }

  return `${cepLimpo.slice(0, 5)}-${cepLimpo.slice(5)}`;
}

/**
 * Remove formatação do CEP (apenas dígitos)
 */
export function limparCep(cep: string): string {
  return cep.replace(/\D/g, '');
}

/**
 * Busca endereço pelo CEP na API ViaCEP
 * @param cep CEP a ser consultado (com ou sem formatação)
 * @returns Dados do endereço ou null se não encontrado
 * @throws Error se o CEP for inválido ou houver erro na requisição
 */
export async function buscarEnderecoPorCep(
  cep: string
): Promise<EnderecoViaCep | null> {
  // Remove formatação
  const cepLimpo = limparCep(cep);

  // Valida formato
  if (!validarCep(cepLimpo)) {
    throw new Error('CEP inválido. O CEP deve conter 8 dígitos.');
  }

  try {
    const response = await fetch(
      `https://viacep.com.br/ws/${cepLimpo}/json/`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Erro ao consultar CEP. Tente novamente.');
    }

    const data: ViaCepResponse = await response.json();

    // Verifica se o CEP foi encontrado
    if (data.erro) {
      return null;
    }

    // Mapeia para o formato interno
    return {
      cep: formatarCep(data.cep),
      logradouro: data.logradouro,
      complemento: data.complemento || undefined,
      bairro: data.bairro,
      cidade: data.localidade,
      estado: data.uf,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Erro ao consultar CEP. Verifique sua conexão.');
  }
}

/**
 * Hook personalizado para buscar CEP (para usar em componentes React)
 */
export function useBuscarCep() {
  const buscar = async (cep: string): Promise<EnderecoViaCep | null> => {
    return buscarEnderecoPorCep(cep);
  };

  return { buscar };
}
