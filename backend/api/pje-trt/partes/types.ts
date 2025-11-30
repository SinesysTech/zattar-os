/**
 * Arquivo: partes/types.ts
 *
 * PROPÓSITO:
 * Define tipos TypeScript para partes e representantes obtidos da API do PJE-TRT.
 * Estes tipos representam a estrutura de dados retornada pelos endpoints internos do PJE.
 *
 * EXPORTAÇÕES:
 * - PartePJE: Tipo para uma parte (pessoa envolvida) em um processo judicial
 * - RepresentantePJE: Tipo para um representante legal (advogado, defensor, etc.)
 * - TelefoneContato: Tipo para dados de contato telefônico
 *
 * QUEM USA ESTE ARQUIVO:
 * - backend/api/pje-trt/partes/obter-partes.ts
 * - backend/api/pje-trt/partes/obter-representantes.ts
 * - backend/captura/services/partes/ (serviços de captura)
 */

/**
 * Tipo: TelefoneContato
 *
 * PROPÓSITO:
 * Representa um número de telefone com DDD separado do número.
 * Formato usado pelo PJE para armazenar contatos telefônicos.
 */
export interface TelefoneContato {
  /** DDD (código de área) - ex: "31", "11", "21" */
  ddd?: string;
  /** Número do telefone sem DDD - ex: "987654321", "32101234" */
  numero?: string;
}

/**
 * Tipo: RepresentantePJE
 *
 * PROPÓSITO:
 * Representa um representante legal (advogado, defensor público, procurador, etc.)
 * de uma parte em um processo judicial. Contém dados cadastrais e OAB.
 *
 * ORIGEM DOS DADOS:
 * Endpoint: GET /pje-backend-api/api/partes/{idParte}/representantes
 *
 * CAMPOS OBRIGATÓRIOS:
 * - idPessoa: ID único da pessoa no sistema PJE
 * - nome: Nome completo do representante
 * - tipoDocumento: Tipo de documento (CPF ou CNPJ)
 * - numeroDocumento: Número do documento sem máscara
 * - tipo: Tipo de representante (ADVOGADO, DEFENSOR_PUBLICO, etc.)
 *
 * CAMPOS OPCIONAIS:
 * - numeroOAB, ufOAB, situacaoOAB: Dados da OAB (podem ser null para defensores/procuradores)
 * - email: E-mail de contato (pode ser null)
 * - telefones: Array de telefones (pode ser vazio)
 */
export interface RepresentantePJE {
  /** ID único da pessoa no sistema PJE - usado como chave de deduplicação */
  idPessoa: number;

  /** Nome completo do representante */
  nome: string;

  /** Tipo de documento de identificação */
  tipoDocumento: 'CPF' | 'CNPJ' | 'OUTRO';

  /** Número do documento sem máscara - ex: "12345678900" ou "12345678000195" - pode ser null */
  numeroDocumento: string | null;

  /** Número de inscrição na OAB - ex: "123456" - pode ser null para defensores/procuradores */
  numeroOAB: string | null;

  /** UF da inscrição na OAB - ex: "MG", "SP", "RJ" - pode ser null */
  ufOAB: string | null;

  /** Situação da inscrição na OAB - ex: "ATIVO", "SUSPENSO" - pode ser null */
  situacaoOAB: string | null;

  /** Tipo de representante - ex: ADVOGADO, DEFENSOR_PUBLICO, PROCURADOR_FEDERAL, PROCURADOR_MUNICIPAL - pode ser null */
  tipo: string | null;

  /** E-mail de contato - pode ser null */
  email: string | null;

  /** Array de telefones de contato - pode ser vazio [] ou undefined */
  telefones?: TelefoneContato[];

  /** JSON completo original retornado pela API do PJE - útil para debug e auditoria */
  dadosCompletos?: Record<string, unknown>;
}

/**
 * Tipo: PartePJE
 *
 * PROPÓSITO:
 * Representa uma parte (pessoa envolvida) em um processo judicial do PJE-TRT.
 * Pode ser autor, réu, perito, ministério público, ou outros tipos de partes.
 *
 * ORIGEM DOS DADOS:
 * Endpoint: GET /pje-backend-api/api/processos/{idProcesso}/partes
 *
 * CAMPOS CHAVE:
 * - idParte: ID único da parte no contexto do processo
 * - idPessoa: ID da pessoa no sistema PJE (usado como id_pessoa_pje no banco)
 * - tipoParte: Define o papel da parte no processo (AUTOR, REU, PERITO, etc.)
 * - polo: Define se a parte está no polo ativo, passivo ou outros
 * - principal: Indica se é a parte principal do polo (true/false)
 *
 * IDENTIFICAÇÃO DE CLIENTE:
 * O campo 'representantes' é crucial para identificar se a parte é nosso cliente.
 * Se algum representante possui CPF igual ao CPF do advogado da credencial, essa parte é nosso cliente.
 *
 * EXEMPLO DE DADOS:
 * {
 *   idParte: 123,
 *   idPessoa: 456789,
 *   nome: "João da Silva",
 *   tipoParte: "AUTOR",
 *   polo: "ATIVO",
 *   principal: true,
 *   tipoDocumento: "CPF",
 *   numeroDocumento: "12345678900",
 *   emails: ["joao@exemplo.com"],
 *   telefones: [{ ddd: "31", numero: "987654321" }],
 *   representantes: [
 *     {
 *       idPessoa: 789,
 *       nome: "Dra. Maria Advogada",
 *       numeroDocumento: "98765432100",
 *       numeroOAB: "123456",
 *       ufOAB: "MG",
 *       // ... outros campos
 *     }
 *   ],
 *   dadosCompletos: { ... }
 * }
 */
export interface PartePJE {
  /** ID único da parte no contexto do processo */
  idParte: number;

  /** ID da pessoa no sistema PJE - usado como id_pessoa_pje no banco para deduplicação */
  idPessoa: number;

  /** Nome completo da parte (pessoa física) ou razão social (pessoa jurídica) */
  nome: string;

  /** Tipo da parte no processo - define o papel processual */
  /** Exemplos: AUTOR, REU, PERITO, MINISTERIO_PUBLICO, ASSISTENTE, TESTEMUNHA, etc. */
  tipoParte: string;

  /** Polo processual - define o lado da parte no litígio */
  polo: 'ATIVO' | 'PASSIVO' | 'OUTROS';

  /** Indica se é a parte principal do polo - usado para priorizar exibição */
  principal: boolean;

  /** Tipo de documento de identificação - pode ser null/undefined para entidades como MPT, União Federal */
  tipoDocumento?: 'CPF' | 'CNPJ' | 'OUTRO' | null;

  /** Número do documento sem máscara - pode ser null/undefined para entidades como MPT, União Federal */
  numeroDocumento?: string | null;

  /** Array de e-mails de contato - pode ser vazio [] */
  emails: string[];

  /** Array de telefones de contato - pode ser vazio [] */
  telefones: TelefoneContato[];

  /** Array de representantes legais (advogados, defensores, etc.) - pode ser vazio [] */
  /** IMPORTANTE: Este campo é usado para identificar se a parte é nosso cliente */
  /** Se algum representante tem CPF igual ao do advogado da credencial → é nosso cliente */
  representantes?: RepresentantePJE[];

  /** JSON completo original retornado pela API do PJE - útil para debug e auditoria */
  dadosCompletos?: Record<string, unknown>;
}
