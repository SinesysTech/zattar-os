/**
 * Lista completa de tribunais válidos para Comunica CNJ
 * Extraída da API oficial do Comunica CNJ
 */

export interface TribunalCNJ {
  id: number;
  sigla: string | null;
  nome: string;
}

export const COMUNICA_CNJ_TRIBUNAIS: TribunalCNJ[] = [
  {
    id: 0,
    sigla: null,
    nome: 'Todas as instituições',
  },
  {
    id: 1,
    sigla: 'CNJ',
    nome: 'Conselho Nacional de Justiça',
  },
  {
    id: 2,
    sigla: 'PJeCor',
    nome: 'Corregedorias',
  },
  {
    id: 3,
    sigla: 'SEEU',
    nome: 'Sistema Eletrônico de Execução Unificado',
  },
  {
    id: 4,
    sigla: 'CJF',
    nome: 'Conselho da Justiça Federal',
  },
  {
    id: 5,
    sigla: 'CSJT',
    nome: 'Conselho Superior da Justiça do Trabalho',
  },
  {
    id: 6,
    sigla: 'STF',
    nome: 'Supremo Tribunal Federal',
  },
  {
    id: 7,
    sigla: 'STJ',
    nome: 'Superior Tribunal de Justiça',
  },
  {
    id: 8,
    sigla: 'STM',
    nome: 'Superior Tribunal Militar',
  },
  {
    id: 9,
    sigla: 'TJAC',
    nome: 'Tribunal de Justiça do Acre',
  },
  {
    id: 10,
    sigla: 'TJAL',
    nome: 'Tribunal de Justiça de Alagoas',
  },
  {
    id: 11,
    sigla: 'TJAM',
    nome: 'Tribunal de Justiça do Amazonas',
  },
  {
    id: 12,
    sigla: 'TJAP',
    nome: 'Tribunal de Justiça do Amapá',
  },
  {
    id: 13,
    sigla: 'TJBA',
    nome: 'Tribunal de Justiça da Bahia',
  },
  {
    id: 14,
    sigla: 'TJCE',
    nome: 'Tribunal de Justiça do Ceará',
  },
  {
    id: 15,
    sigla: 'TJDFT',
    nome: 'Tribunal de Justiça do Distrito Federal e Territórios',
  },
  {
    id: 16,
    sigla: 'TJES',
    nome: 'Tribunal de Justiça do Espírito Santo',
  },
  {
    id: 17,
    sigla: 'TJGO',
    nome: 'Tribunal de Justiça de Goiás',
  },
  {
    id: 18,
    sigla: 'TJMA',
    nome: 'Tribunal de Justiça do Maranhão',
  },
  {
    id: 19,
    sigla: 'TJMG',
    nome: 'Tribunal de Justiça de Minas Gerais',
  },
  {
    id: 20,
    sigla: 'TJMMG',
    nome: 'Tribunal de Justiça Militar do Estado de Minas Gerais',
  },
  {
    id: 21,
    sigla: 'TJMRS',
    nome: 'Tribunal de Justiça Militar do Estado do Rio Grande do sul',
  },
  {
    id: 22,
    sigla: 'TJMS',
    nome: 'Tribunal de Justiça do Mato Grosso do Sul',
  },
  {
    id: 23,
    sigla: 'TJMSP',
    nome: 'Tribunal de Justiça Militar do Estado de São Paulo',
  },
  {
    id: 24,
    sigla: 'TJMT',
    nome: 'Tribunal de Justiça do Mato Grosso',
  },
  {
    id: 25,
    sigla: 'TJPA',
    nome: 'Tribunal de Justiça do Pará',
  },
  {
    id: 26,
    sigla: 'TJPB',
    nome: 'Tribunal de Justiça da Paraíba',
  },
  {
    id: 27,
    sigla: 'TJPE',
    nome: 'Tribunal de Justiça de Pernambuco',
  },
  {
    id: 28,
    sigla: 'TJPI',
    nome: 'Tribunal de Justiça do Piauí',
  },
  {
    id: 29,
    sigla: 'TJPR',
    nome: 'Tribunal de Justiça do Paraná',
  },
  {
    id: 30,
    sigla: 'TJRJ',
    nome: 'Tribunal de Justiça do Rio de Janeiro',
  },
  {
    id: 31,
    sigla: 'TJRN',
    nome: 'Tribunal de Justiça do Rio Grande do Norte',
  },
  {
    id: 32,
    sigla: 'TJRO',
    nome: 'Tribunal de Justiça de Rondônia',
  },
  {
    id: 33,
    sigla: 'TJRR',
    nome: 'Tribunal de Justiça de Roraima',
  },
  {
    id: 34,
    sigla: 'TJRS',
    nome: 'Tribunal de Justiça do Rio Grande do Sul',
  },
  {
    id: 35,
    sigla: 'TJSC',
    nome: 'Tribunal de Justiça de Santa Catarina',
  },
  {
    id: 36,
    sigla: 'TJSE',
    nome: 'Tribunal de Justiça de Sergipe',
  },
  {
    id: 37,
    sigla: 'TJSP',
    nome: 'Tribunal de Justiça de São Paulo',
  },
  {
    id: 38,
    sigla: 'TJTO',
    nome: 'Tribunal de Justiça do Estado de Tocantins',
  },
  {
    id: 39,
    sigla: 'TRE-AC',
    nome: 'Tribunal Regional Eleitoral do Acre',
  },
  {
    id: 40,
    sigla: 'TRE-AL',
    nome: 'Tribunal Regional Eleitoral de Alagoas',
  },
  {
    id: 41,
    sigla: 'TRE-AM',
    nome: 'Tribunal Regional Eleitoral do Amazonas',
  },
  {
    id: 42,
    sigla: 'TRE-AP',
    nome: 'Tribunal Regional Eleitoral do Amapá',
  },
  {
    id: 43,
    sigla: 'TRE-BA',
    nome: 'Tribunal Regional Eleitoral da Bahia',
  },
  {
    id: 44,
    sigla: 'TRE-CE',
    nome: 'Tribunal Regional Eleitoral do Ceará',
  },
  {
    id: 45,
    sigla: 'TRE-DF',
    nome: 'Tribunal Regional Eleitoral do Distrito Federal e Territórios',
  },
  {
    id: 46,
    sigla: 'TRE-ES',
    nome: 'Tribunal Regional Eleitoral do Espírito Santo',
  },
  {
    id: 47,
    sigla: 'TRE-GO',
    nome: 'Tribunal Regional Eleitoral de Goiás',
  },
  {
    id: 48,
    sigla: 'TRE-MA',
    nome: 'Tribunal Regional Eleitoral do Maranhão',
  },
  {
    id: 49,
    sigla: 'TRE-MG',
    nome: 'Tribunal Regional Eleitoral de Minas Gerais',
  },
  {
    id: 50,
    sigla: 'TRE-MS',
    nome: 'Tribunal Regional Eleitoral do Mato Grosso do Sul',
  },
  {
    id: 51,
    sigla: 'TRE-MT',
    nome: 'Tribunal Regional Eleitoral de Mato Grosso',
  },
  {
    id: 52,
    sigla: 'TRE-PA',
    nome: 'Tribunal Regional Eleitoral do Pará',
  },
  {
    id: 53,
    sigla: 'TRE-PB',
    nome: 'Tribunal Regional Eleitoral da Paraíba',
  },
  {
    id: 54,
    sigla: 'TRE-PE',
    nome: 'Tribunal Regional Eleitoral de Pernambuco',
  },
  {
    id: 55,
    sigla: 'TRE-PI',
    nome: 'Tribunal Regional Eleitoral do Piauí',
  },
  {
    id: 56,
    sigla: 'TRE-PR',
    nome: 'Tribunal Regional Eleitoral do Paraná',
  },
  {
    id: 57,
    sigla: 'TRE-RJ',
    nome: 'Tribunal Regional Eleitoral do Rio de Janeiro',
  },
  {
    id: 58,
    sigla: 'TRE-RN',
    nome: 'Tribunal Regional Eleitoral do Rio Grande do Norte',
  },
  {
    id: 59,
    sigla: 'TRE-RO',
    nome: 'Tribunal Regional Eleitoral de Rondônia',
  },
  {
    id: 60,
    sigla: 'TRE-RR',
    nome: 'Tribunal Regional Eleitoral de Roraima',
  },
  {
    id: 61,
    sigla: 'TRE-RS',
    nome: 'Tribunal Regional Eleitoral do Rio Grande do Sul',
  },
  {
    id: 62,
    sigla: 'TRE-SC',
    nome: 'Tribunal Regional Eleitoral de Santa Catarina',
  },
  {
    id: 63,
    sigla: 'TRE-SE',
    nome: 'Tribunal Regional Eleitoral de Sergipe',
  },
  {
    id: 64,
    sigla: 'TRE-SP',
    nome: 'Tribunal Regional Eleitoral de São Paulo',
  },
  {
    id: 65,
    sigla: 'TRE-TO',
    nome: 'Tribunal Regional Eleitoral de Tocantins',
  },
  {
    id: 66,
    sigla: 'TRF1',
    nome: 'Tribunal Regional Federal da 1ª Região',
  },
  {
    id: 67,
    sigla: 'TRF2',
    nome: 'Tribunal Regional Federal da 2ª Região',
  },
  {
    id: 68,
    sigla: 'TRF3',
    nome: 'Tribunal Regional Federal da 3ª Região',
  },
  {
    id: 69,
    sigla: 'TRF4',
    nome: 'Tribunal Regional Federal da 4ª Região',
  },
  {
    id: 70,
    sigla: 'TRF5',
    nome: 'Tribunal Regional Federal da 5ª Região',
  },
  {
    id: 71,
    sigla: 'TRF6',
    nome: 'Tribunal Regional Federal da 6ª Região',
  },
  {
    id: 72,
    sigla: 'TRT1',
    nome: 'Tribunal Regional do Trabalho da 1ª Região',
  },
  {
    id: 73,
    sigla: 'TRT10',
    nome: 'Tribunal Regional do Trabalho da 10ª Região',
  },
  {
    id: 74,
    sigla: 'TRT11',
    nome: 'Tribunal Regional do Trabalho da 11ª Região',
  },
  {
    id: 75,
    sigla: 'TRT12',
    nome: 'Tribunal Regional do Trabalho da 12ª Região',
  },
  {
    id: 76,
    sigla: 'TRT13',
    nome: 'Tribunal Regional do Trabalho da 13ª Região',
  },
  {
    id: 77,
    sigla: 'TRT14',
    nome: 'Tribunal Regional do Trabalho da 14ª Região',
  },
  {
    id: 78,
    sigla: 'TRT15',
    nome: 'Tribunal Regional do Trabalho da 15ª Região',
  },
  {
    id: 79,
    sigla: 'TRT16',
    nome: 'Tribunal Regional do Trabalho da 16ª Região',
  },
  {
    id: 80,
    sigla: 'TRT17',
    nome: 'Tribunal Regional do Trabalho da 17ª Região',
  },
  {
    id: 81,
    sigla: 'TRT18',
    nome: 'Tribunal Regional do Trabalho da 18ª Região',
  },
  {
    id: 82,
    sigla: 'TRT19',
    nome: 'Tribunal Regional do Trabalho da 19ª Região',
  },
  {
    id: 83,
    sigla: 'TRT2',
    nome: 'Tribunal Regional do Trabalho da 2ª Região',
  },
  {
    id: 84,
    sigla: 'TRT20',
    nome: 'Tribunal Regional do Trabalho da 20ª Região',
  },
  {
    id: 85,
    sigla: 'TRT21',
    nome: 'Tribunal Regional do Trabalho da 21ª Região',
  },
  {
    id: 86,
    sigla: 'TRT22',
    nome: 'Tribunal Regional do Trabalho da 22ª Região',
  },
  {
    id: 87,
    sigla: 'TRT23',
    nome: 'Tribunal Regional do Trabalho da 23ª Região',
  },
  {
    id: 88,
    sigla: 'TRT24',
    nome: 'Tribunal Regional do Trabalho da 24ª Região',
  },
  {
    id: 89,
    sigla: 'TRT3',
    nome: 'Tribunal Regional do Trabalho da 3ª Região',
  },
  {
    id: 90,
    sigla: 'TRT4',
    nome: 'Tribunal Regional do Trabalho da 4ª Região',
  },
  {
    id: 91,
    sigla: 'TRT5',
    nome: 'Tribunal Regional do Trabalho da 5ª Região',
  },
  {
    id: 92,
    sigla: 'TRT6',
    nome: 'Tribunal Regional do Trabalho da 6ª Região',
  },
  {
    id: 93,
    sigla: 'TRT7',
    nome: 'Tribunal Regional do Trabalho da 7ª Região',
  },
  {
    id: 94,
    sigla: 'TRT8',
    nome: 'Tribunal Regional do Trabalho da 8ª Região',
  },
  {
    id: 95,
    sigla: 'TRT9',
    nome: 'Tribunal Regional do Trabalho da 9ª Região',
  },
  {
    id: 96,
    sigla: 'TSE',
    nome: 'Tribunal Superior Eleitoral',
  },
  {
    id: 97,
    sigla: 'TST',
    nome: 'Tribunal Superior do Trabalho',
  },
];

/**
 * Retorna apenas tribunais com sigla válida (filtra null)
 */
export function getTribunaisComSigla(): Array<{ sigla: string; nome: string }> {
  return COMUNICA_CNJ_TRIBUNAIS.filter((t) => t.sigla !== null).map((t) => ({
    sigla: t.sigla!,
    nome: t.nome,
  }));
}

/**
 * Retorna todos os tribunais (incluindo "Todas as instituições")
 */
export function getAllTribunais(): Array<{ sigla: string | null; nome: string }> {
  return COMUNICA_CNJ_TRIBUNAIS;
}

