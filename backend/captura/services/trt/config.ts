// Configurações específicas do TRT
// Implementação completa dos tribunais e suas configurações

import type { CodigoTRT, GrauTRT, ConfigTRT } from './types';

/**
 * Tipo para configuração de grau de um tribunal
 */
interface TribunalGrauConfig {
  grau: '1g' | '2g';
  loginUrl: string;
  baseUrl: string;
  apiUrl: string;
}

/**
 * Tipo para um tribunal completo
 */
interface TribunalData {
  codigo: CodigoTRT;
  nome: string;
  regiao: string;
  uf: string;
  cidadeSede: string;
  configs: TribunalGrauConfig[];
}

/**
 * Base de dados completa dos tribunais TRT
 * Contém todos os 24 TRTs com suas configurações de primeiro e segundo grau
 */
const TRIBUNAL_DATABASE: TribunalData[] = [
  {
    codigo: 'TRT1',
    nome: 'TRT da 1ª Região',
    regiao: 'Sudeste',
    uf: 'RJ',
    cidadeSede: 'Rio de Janeiro',
    configs: [
      {
        grau: '1g',
        loginUrl: 'https://pje.trt1.jus.br/primeirograu/login.seam',
        baseUrl: 'https://pje.trt1.jus.br',
        apiUrl: 'https://pje.trt1.jus.br/pje-comum-api/api',
      },
      {
        grau: '2g',
        loginUrl: 'https://pje.trt1.jus.br/segundograu/login.seam',
        baseUrl: 'https://pje.trt1.jus.br',
        apiUrl: 'https://pje.trt1.jus.br/pje-comum-api/api',
      },
    ],
  },
  {
    codigo: 'TRT2',
    nome: 'TRT da 2ª Região',
    regiao: 'Sudeste',
    uf: 'SP',
    cidadeSede: 'São Paulo',
    configs: [
      {
        grau: '1g',
        loginUrl: 'https://pje.trt2.jus.br/primeirograu/login.seam',
        baseUrl: 'https://pje.trt2.jus.br',
        apiUrl: 'https://pje.trt2.jus.br/pje-comum-api/api',
      },
      {
        grau: '2g',
        loginUrl: 'https://pje.trt2.jus.br/segundograu/login.seam',
        baseUrl: 'https://pje.trt2.jus.br',
        apiUrl: 'https://pje.trt2.jus.br/pje-comum-api/api',
      },
    ],
  },
  {
    codigo: 'TRT3',
    nome: 'TRT da 3ª Região',
    regiao: 'Sudeste',
    uf: 'MG',
    cidadeSede: 'Belo Horizonte',
    configs: [
      {
        grau: '1g',
        loginUrl: 'https://pje.trt3.jus.br/primeirograu/login.seam',
        baseUrl: 'https://pje.trt3.jus.br',
        apiUrl: 'https://pje.trt3.jus.br/pje-comum-api/api',
      },
      {
        grau: '2g',
        loginUrl: 'https://pje.trt3.jus.br/segundograu/login.seam',
        baseUrl: 'https://pje.trt3.jus.br',
        apiUrl: 'https://pje.trt3.jus.br/pje-comum-api/api',
      },
    ],
  },
  {
    codigo: 'TRT4',
    nome: 'TRT da 4ª Região',
    regiao: 'Sul',
    uf: 'RS',
    cidadeSede: 'Porto Alegre',
    configs: [
      {
        grau: '1g',
        loginUrl: 'https://pje.trt4.jus.br/primeirograu/login.seam',
        baseUrl: 'https://pje.trt4.jus.br',
        apiUrl: 'https://pje.trt4.jus.br/pje-comum-api/api',
      },
      {
        grau: '2g',
        loginUrl: 'https://pje.trt4.jus.br/segundograu/login.seam',
        baseUrl: 'https://pje.trt4.jus.br',
        apiUrl: 'https://pje.trt4.jus.br/pje-comum-api/api',
      },
    ],
  },
  {
    codigo: 'TRT5',
    nome: 'TRT da 5ª Região',
    regiao: 'Nordeste',
    uf: 'BA',
    cidadeSede: 'Salvador',
    configs: [
      {
        grau: '1g',
        loginUrl: 'https://pje.trt5.jus.br/primeirograu/login.seam',
        baseUrl: 'https://pje.trt5.jus.br',
        apiUrl: 'https://pje.trt5.jus.br/pje-comum-api/api',
      },
      {
        grau: '2g',
        loginUrl: 'https://pje.trt5.jus.br/segundograu/login.seam',
        baseUrl: 'https://pje.trt5.jus.br',
        apiUrl: 'https://pje.trt5.jus.br/pje-comum-api/api',
      },
    ],
  },
  {
    codigo: 'TRT6',
    nome: 'TRT da 6ª Região',
    regiao: 'Nordeste',
    uf: 'PE',
    cidadeSede: 'Recife',
    configs: [
      {
        grau: '1g',
        loginUrl: 'https://pje.trt6.jus.br/primeirograu/login.seam',
        baseUrl: 'https://pje.trt6.jus.br',
        apiUrl: 'https://pje.trt6.jus.br/pje-comum-api/api',
      },
      {
        grau: '2g',
        loginUrl: 'https://pje.trt6.jus.br/segundograu/login.seam',
        baseUrl: 'https://pje.trt6.jus.br',
        apiUrl: 'https://pje.trt6.jus.br/pje-comum-api/api',
      },
    ],
  },
  {
    codigo: 'TRT7',
    nome: 'TRT da 7ª Região',
    regiao: 'Nordeste',
    uf: 'CE',
    cidadeSede: 'Fortaleza',
    configs: [
      {
        grau: '1g',
        loginUrl: 'https://pje.trt7.jus.br/primeirograu/login.seam',
        baseUrl: 'https://pje.trt7.jus.br',
        apiUrl: 'https://pje.trt7.jus.br/pje-comum-api/api',
      },
      {
        grau: '2g',
        loginUrl: 'https://pje.trt7.jus.br/segundograu/login.seam',
        baseUrl: 'https://pje.trt7.jus.br',
        apiUrl: 'https://pje.trt7.jus.br/pje-comum-api/api',
      },
    ],
  },
  {
    codigo: 'TRT8',
    nome: 'TRT da 8ª Região',
    regiao: 'Norte',
    uf: 'PA',
    cidadeSede: 'Belém',
    configs: [
      {
        grau: '1g',
        loginUrl: 'https://pje.trt8.jus.br/primeirograu/login.seam',
        baseUrl: 'https://pje.trt8.jus.br',
        apiUrl: 'https://pje.trt8.jus.br/pje-comum-api/api',
      },
      {
        grau: '2g',
        loginUrl: 'https://pje.trt8.jus.br/segundograu/login.seam',
        baseUrl: 'https://pje.trt8.jus.br',
        apiUrl: 'https://pje.trt8.jus.br/pje-comum-api/api',
      },
    ],
  },
  {
    codigo: 'TRT9',
    nome: 'TRT da 9ª Região',
    regiao: 'Sul',
    uf: 'PR',
    cidadeSede: 'Curitiba',
    configs: [
      {
        grau: '1g',
        loginUrl: 'https://pje.trt9.jus.br/primeirograu/login.seam',
        baseUrl: 'https://pje.trt9.jus.br',
        apiUrl: 'https://pje.trt9.jus.br/pje-comum-api/api',
      },
      {
        grau: '2g',
        loginUrl: 'https://pje.trt9.jus.br/segundograu/login.seam',
        baseUrl: 'https://pje.trt9.jus.br',
        apiUrl: 'https://pje.trt9.jus.br/pje-comum-api/api',
      },
    ],
  },
  {
    codigo: 'TRT10',
    nome: 'TRT da 10ª Região',
    regiao: 'Centro-Oeste',
    uf: 'DF',
    cidadeSede: 'Brasília',
    configs: [
      {
        grau: '1g',
        loginUrl: 'https://pje.trt10.jus.br/primeirograu/login.seam',
        baseUrl: 'https://pje.trt10.jus.br',
        apiUrl: 'https://pje.trt10.jus.br/pje-comum-api/api',
      },
      {
        grau: '2g',
        loginUrl: 'https://pje.trt10.jus.br/segundograu/login.seam',
        baseUrl: 'https://pje.trt10.jus.br',
        apiUrl: 'https://pje.trt10.jus.br/pje-comum-api/api',
      },
    ],
  },
  {
    codigo: 'TRT11',
    nome: 'TRT da 11ª Região',
    regiao: 'Norte',
    uf: 'AM',
    cidadeSede: 'Manaus',
    configs: [
      {
        grau: '1g',
        loginUrl: 'https://pje.trt11.jus.br/primeirograu/login.seam',
        baseUrl: 'https://pje.trt11.jus.br',
        apiUrl: 'https://pje.trt11.jus.br/pje-comum-api/api',
      },
      {
        grau: '2g',
        loginUrl: 'https://pje.trt11.jus.br/segundograu/login.seam',
        baseUrl: 'https://pje.trt11.jus.br',
        apiUrl: 'https://pje.trt11.jus.br/pje-comum-api/api',
      },
    ],
  },
  {
    codigo: 'TRT12',
    nome: 'TRT da 12ª Região',
    regiao: 'Sul',
    uf: 'SC',
    cidadeSede: 'Florianópolis',
    configs: [
      {
        grau: '1g',
        loginUrl: 'https://pje.trt12.jus.br/primeirograu/login.seam',
        baseUrl: 'https://pje.trt12.jus.br',
        apiUrl: 'https://pje.trt12.jus.br/pje-comum-api/api',
      },
      {
        grau: '2g',
        loginUrl: 'https://pje.trt12.jus.br/segundograu/login.seam',
        baseUrl: 'https://pje.trt12.jus.br',
        apiUrl: 'https://pje.trt12.jus.br/pje-comum-api/api',
      },
    ],
  },
  {
    codigo: 'TRT13',
    nome: 'TRT da 13ª Região',
    regiao: 'Nordeste',
    uf: 'PB',
    cidadeSede: 'João Pessoa',
    configs: [
      {
        grau: '1g',
        loginUrl: 'https://pje.trt13.jus.br/primeirograu/login.seam',
        baseUrl: 'https://pje.trt13.jus.br',
        apiUrl: 'https://pje.trt13.jus.br/pje-comum-api/api',
      },
      {
        grau: '2g',
        loginUrl: 'https://pje.trt13.jus.br/segundograu/login.seam',
        baseUrl: 'https://pje.trt13.jus.br',
        apiUrl: 'https://pje.trt13.jus.br/pje-comum-api/api',
      },
    ],
  },
  {
    codigo: 'TRT14',
    nome: 'TRT da 14ª Região',
    regiao: 'Norte',
    uf: 'RO',
    cidadeSede: 'Porto Velho',
    configs: [
      {
        grau: '1g',
        loginUrl: 'https://pje.trt14.jus.br/primeirograu/login.seam',
        baseUrl: 'https://pje.trt14.jus.br',
        apiUrl: 'https://pje.trt14.jus.br/pje-comum-api/api',
      },
      {
        grau: '2g',
        loginUrl: 'https://pje.trt14.jus.br/segundograu/login.seam',
        baseUrl: 'https://pje.trt14.jus.br',
        apiUrl: 'https://pje.trt14.jus.br/pje-comum-api/api',
      },
    ],
  },
  {
    codigo: 'TRT15',
    nome: 'TRT da 15ª Região',
    regiao: 'Sudeste',
    uf: 'SP',
    cidadeSede: 'Campinas',
    configs: [
      {
        grau: '1g',
        loginUrl: 'https://pje.trt15.jus.br/primeirograu/login.seam',
        baseUrl: 'https://pje.trt15.jus.br',
        apiUrl: 'https://pje.trt15.jus.br/pje-comum-api/api',
      },
      {
        grau: '2g',
        loginUrl: 'https://pje.trt15.jus.br/segundograu/login.seam',
        baseUrl: 'https://pje.trt15.jus.br',
        apiUrl: 'https://pje.trt15.jus.br/pje-comum-api/api',
      },
    ],
  },
  {
    codigo: 'TRT16',
    nome: 'TRT da 16ª Região',
    regiao: 'Nordeste',
    uf: 'MA',
    cidadeSede: 'São Luís',
    configs: [
      {
        grau: '1g',
        loginUrl: 'https://pje.trt16.jus.br/primeirograu/login.seam',
        baseUrl: 'https://pje.trt16.jus.br',
        apiUrl: 'https://pje.trt16.jus.br/pje-comum-api/api',
      },
      {
        grau: '2g',
        loginUrl: 'https://pje.trt16.jus.br/segundograu/login.seam',
        baseUrl: 'https://pje.trt16.jus.br',
        apiUrl: 'https://pje.trt16.jus.br/pje-comum-api/api',
      },
    ],
  },
  {
    codigo: 'TRT17',
    nome: 'TRT da 17ª Região',
    regiao: 'Sudeste',
    uf: 'ES',
    cidadeSede: 'Vitória',
    configs: [
      {
        grau: '1g',
        loginUrl: 'https://pje.trt17.jus.br/primeirograu/login.seam',
        baseUrl: 'https://pje.trt17.jus.br',
        apiUrl: 'https://pje.trt17.jus.br/pje-comum-api/api',
      },
      {
        grau: '2g',
        loginUrl: 'https://pje.trt17.jus.br/segundograu/login.seam',
        baseUrl: 'https://pje.trt17.jus.br',
        apiUrl: 'https://pje.trt17.jus.br/pje-comum-api/api',
      },
    ],
  },
  {
    codigo: 'TRT18',
    nome: 'TRT da 18ª Região',
    regiao: 'Centro-Oeste',
    uf: 'GO',
    cidadeSede: 'Goiânia',
    configs: [
      {
        grau: '1g',
        loginUrl: 'https://pje.trt18.jus.br/primeirograu/login.seam',
        baseUrl: 'https://pje.trt18.jus.br',
        apiUrl: 'https://pje.trt18.jus.br/pje-comum-api/api',
      },
      {
        grau: '2g',
        loginUrl: 'https://pje.trt18.jus.br/segundograu/login.seam',
        baseUrl: 'https://pje.trt18.jus.br',
        apiUrl: 'https://pje.trt18.jus.br/pje-comum-api/api',
      },
    ],
  },
  {
    codigo: 'TRT19',
    nome: 'TRT da 19ª Região',
    regiao: 'Nordeste',
    uf: 'AL',
    cidadeSede: 'Maceió',
    configs: [
      {
        grau: '1g',
        loginUrl: 'https://pje.trt19.jus.br/primeirograu/login.seam',
        baseUrl: 'https://pje.trt19.jus.br',
        apiUrl: 'https://pje.trt19.jus.br/pje-comum-api/api',
      },
      {
        grau: '2g',
        loginUrl: 'https://pje.trt19.jus.br/segundograu/login.seam',
        baseUrl: 'https://pje.trt19.jus.br',
        apiUrl: 'https://pje.trt19.jus.br/pje-comum-api/api',
      },
    ],
  },
  {
    codigo: 'TRT20',
    nome: 'TRT da 20ª Região',
    regiao: 'Nordeste',
    uf: 'SE',
    cidadeSede: 'Aracaju',
    configs: [
      {
        grau: '1g',
        loginUrl: 'https://pje.trt20.jus.br/primeirograu/login.seam',
        baseUrl: 'https://pje.trt20.jus.br',
        apiUrl: 'https://pje.trt20.jus.br/pje-comum-api/api',
      },
      {
        grau: '2g',
        loginUrl: 'https://pje.trt20.jus.br/segundograu/login.seam',
        baseUrl: 'https://pje.trt20.jus.br',
        apiUrl: 'https://pje.trt20.jus.br/pje-comum-api/api',
      },
    ],
  },
  {
    codigo: 'TRT21',
    nome: 'TRT da 21ª Região',
    regiao: 'Nordeste',
    uf: 'RN',
    cidadeSede: 'Natal',
    configs: [
      {
        grau: '1g',
        loginUrl: 'https://pje.trt21.jus.br/primeirograu/login.seam',
        baseUrl: 'https://pje.trt21.jus.br',
        apiUrl: 'https://pje.trt21.jus.br/pje-comum-api/api',
      },
      {
        grau: '2g',
        loginUrl: 'https://pje.trt21.jus.br/segundograu/login.seam',
        baseUrl: 'https://pje.trt21.jus.br',
        apiUrl: 'https://pje.trt21.jus.br/pje-comum-api/api',
      },
    ],
  },
  {
    codigo: 'TRT22',
    nome: 'TRT da 22ª Região',
    regiao: 'Nordeste',
    uf: 'PI',
    cidadeSede: 'Teresina',
    configs: [
      {
        grau: '1g',
        loginUrl: 'https://pje.trt22.jus.br/primeirograu/login.seam',
        baseUrl: 'https://pje.trt22.jus.br',
        apiUrl: 'https://pje.trt22.jus.br/pje-comum-api/api',
      },
      {
        grau: '2g',
        loginUrl: 'https://pje.trt22.jus.br/segundograu/login.seam',
        baseUrl: 'https://pje.trt22.jus.br',
        apiUrl: 'https://pje.trt22.jus.br/pje-comum-api/api',
      },
    ],
  },
  {
    codigo: 'TRT23',
    nome: 'TRT da 23ª Região',
    regiao: 'Centro-Oeste',
    uf: 'MT',
    cidadeSede: 'Cuiabá',
    configs: [
      {
        grau: '1g',
        loginUrl: 'https://pje.trt23.jus.br/primeirograu/login.seam',
        baseUrl: 'https://pje.trt23.jus.br',
        apiUrl: 'https://pje.trt23.jus.br/pje-comum-api/api',
      },
      {
        grau: '2g',
        loginUrl: 'https://pje.trt23.jus.br/segundograu/login.seam',
        baseUrl: 'https://pje.trt23.jus.br',
        apiUrl: 'https://pje.trt23.jus.br/pje-comum-api/api',
      },
    ],
  },
  {
    codigo: 'TRT24',
    nome: 'TRT da 24ª Região',
    regiao: 'Centro-Oeste',
    uf: 'MS',
    cidadeSede: 'Campo Grande',
    configs: [
      {
        grau: '1g',
        loginUrl: 'https://pje.trt24.jus.br/primeirograu/login.seam',
        baseUrl: 'https://pje.trt24.jus.br',
        apiUrl: 'https://pje.trt24.jus.br/pje-comum-api/api',
      },
      {
        grau: '2g',
        loginUrl: 'https://pje.trt24.jus.br/segundograu/login.seam',
        baseUrl: 'https://pje.trt24.jus.br',
        apiUrl: 'https://pje.trt24.jus.br/pje-comum-api/api',
      },
    ],
  },
];

/**
 * Converte o formato de grau do banco/enum para o formato interno
 * 'primeiro_grau' -> '1g'
 * 'segundo_grau' -> '2g'
 */
function converterGrauParaInterno(grau: GrauTRT): '1g' | '2g' {
  return grau === 'primeiro_grau' ? '1g' : '2g';
}

/**
 * Busca a configuração de um tribunal específico e grau
 * 
 * @param trtCodigo - Código do TRT (ex: 'TRT1', 'TRT2')
 * @param grau - Grau do processo ('primeiro_grau' ou 'segundo_grau')
 * @returns Configuração do tribunal ou null se não encontrado
 * 
 * @example
 * const config = getTribunalConfig('TRT1', 'primeiro_grau');
 * // Retorna: { codigo: 'TRT1', nome: 'TRT da 1ª Região', grau: 'primeiro_grau', loginUrl: '...', baseUrl: '...', apiUrl: '...' }
 */
export function getTribunalConfig(
  trtCodigo: CodigoTRT,
  grau: GrauTRT
): ConfigTRT | null {
  const grauInterno = converterGrauParaInterno(grau);

  // Buscar o tribunal pelo código
  const tribunal = TRIBUNAL_DATABASE.find((t) => t.codigo === trtCodigo);

  if (!tribunal) {
    return null;
  }

  // Buscar a configuração pelo grau
  const config = tribunal.configs.find((c) => c.grau === grauInterno);

  if (!config) {
    return null;
  }

  // Retornar no formato ConfigTRT
  return {
    codigo: tribunal.codigo,
    nome: tribunal.nome,
    grau: grau, // Manter o formato do enum
    loginUrl: config.loginUrl,
    baseUrl: config.baseUrl,
    apiUrl: config.apiUrl,
  };
}

/**
 * Valida se um código de TRT existe na base de dados
 */
export function isValidTribunalCode(codigo: string): codigo is CodigoTRT {
  return TRIBUNAL_DATABASE.some((t) => t.codigo === codigo);
}

/**
 * Lista todos os códigos de tribunais disponíveis
 */
export function listTribunalCodes(): CodigoTRT[] {
  return TRIBUNAL_DATABASE.map((t) => t.codigo);
}
