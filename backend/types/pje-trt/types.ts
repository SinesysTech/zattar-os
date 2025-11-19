/**
 * Arquivo: types.ts
 * 
 * PROPÓSITO:
 * Este arquivo contém todas as interfaces, tipos e enums compartilhados utilizados pelas APIs do PJE TRT.
 * Centraliza as definições de tipos para garantir consistência em toda a aplicação.
 * 
 * DEPENDÊNCIAS:
 * Nenhuma dependência externa. Este arquivo contém apenas definições de tipos TypeScript.
 * 
 * EXPORTAÇÕES:
 * - PagedResponse<T>: Interface genérica para respostas paginadas da API do PJE
 * - Totalizador: Interface para totalizadores do painel do advogado
 * - Processo: Interface para processos retornados pela API do PJE
 * - Audiencia: Interface para audiências retornadas pela API do PJE
 * - AgrupamentoProcessoTarefa: Enum com os tipos de agrupamento de processos
 * 
 * QUEM USA ESTE ARQUIVO:
 * - processos.ts: Importa PagedResponse, Totalizador, Processo e AgrupamentoProcessoTarefa
 * - audiencias.ts: Importa PagedResponse e Audiencia
 * - Arquivos de serviços de captura (pendentes-manifestacao.service.ts, acervo-geral.service.ts, arquivados.service.ts, audiencias.service.ts)
 * - Arquivos de persistence (pendentes-persistence.service.ts, acervo-persistence.service.ts, audiencias-persistence.service.ts)
 */

/**
 * Interface: PagedResponse<T>
 * 
 * PROPÓSITO:
 * Representa a estrutura padrão de resposta paginada retornada pelas APIs do PJE.
 * É uma interface genérica que pode ser usada com qualquer tipo de dado (Processo, Audiencia, etc.).
 * 
 * CAMPOS:
 * - pagina: number - Número da página atual retornada pela API (começa em 1)
 * - tamanhoPagina: number - Quantidade de registros por página (geralmente 100)
 * - qtdPaginas: number - Total de páginas disponíveis para este conjunto de dados
 * - totalRegistros: number - Total de registros disponíveis em todas as páginas
 * - resultado: T[] - Array com os registros da página atual (tipo genérico T)
 * 
 * USO:
 * Utilizada por todas as funções que retornam dados paginados:
 * - obterProcessos() retorna PagedResponse<Processo>
 * - obterPautaAudiencias() retorna PagedResponse<Audiencia>
 * 
 * EXEMPLO DE RESPOSTA DA API:
 * {
 *   "pagina": 1,
 *   "tamanhoPagina": 100,
 *   "qtdPaginas": 5,
 *   "totalRegistros": 450,
 *   "resultado": [...]
 * }
 */
export interface PagedResponse<T> {
  pagina: number;
  tamanhoPagina: number;
  qtdPaginas: number;
  totalRegistros: number;
  resultado: T[];
}

/**
 * Interface: Totalizador
 * 
 * PROPÓSITO:
 * Representa um totalizador do painel do advogado no PJE.
 * Cada totalizador indica quantos processos existem em cada categoria (Acervo Geral, Pendentes de Manifestação, Arquivados).
 * 
 * CAMPOS:
 * - quantidadeProcessos: number - Quantidade total de processos nesta categoria
 * - idAgrupamentoProcessoTarefa: number - ID do agrupamento (1=Acervo Geral, 2=Pendentes, 5=Arquivados)
 * - nomeAgrupamentoTarefa: string - Nome descritivo do agrupamento (ex: "Acervo Geral", "Pendentes de Manifestação")
 * - ordem: number - Ordem de exibição do agrupamento no painel
 * - destaque: boolean - Indica se este agrupamento deve ser destacado no painel
 * 
 * USO:
 * Utilizada pela função obterTotalizadores() que retorna um array de Totalizador[].
 * Usada pelos serviços de captura para validar quantidades esperadas de processos.
 * 
 * EXEMPLO DE RESPOSTA DA API:
 * [
 *   {
 *     "quantidadeProcessos": 1279,
 *     "idAgrupamentoProcessoTarefa": 1,
 *     "nomeAgrupamentoTarefa": "Acervo Geral",
 *     "ordem": 1,
 *     "destaque": false
 *   },
 *   {
 *     "quantidadeProcessos": 107,
 *     "idAgrupamentoProcessoTarefa": 2,
 *     "nomeAgrupamentoTarefa": "Pendentes de Manifestação",
 *     "ordem": 2,
 *     "destaque": false
 *   }
 * ]
 */
export interface Totalizador {
  quantidadeProcessos: number;
  idAgrupamentoProcessoTarefa: number;
  nomeAgrupamentoTarefa: string;
  ordem: number;
  destaque: boolean;
}

/**
 * Interface: Processo
 * 
 * PROPÓSITO:
 * Representa um processo retornado pela API do PJE.
 * Contém todas as informações principais de um processo judicial do TRT.
 * 
 * CAMPOS:
 * - id: number - ID único do processo no sistema PJE
 * - descricaoOrgaoJulgador: string - Descrição do órgão julgador responsável pelo processo
 * - classeJudicial: string - Classe judicial do processo (ex: "Reclamação Trabalhista")
 * - numero: number - Número numérico do processo
 * - numeroProcesso: string - Número completo do processo no formato CNJ (ex: "0000123-45.2023.5.03.0001")
 * - segredoDeJustica: boolean - Indica se o processo está sob segredo de justiça
 * - codigoStatusProcesso: string - Código do status atual do processo
 * - prioridadeProcessual: number - Nível de prioridade processual (0 = normal, valores maiores = maior prioridade)
 * - nomeParteAutora: string - Nome da parte autora (requerente)
 * - qtdeParteAutora: number - Quantidade de partes autoras no processo
 * - nomeParteRe: string - Nome da parte ré (requerida)
 * - qtdeParteRe: number - Quantidade de partes rés no processo
 * - dataAutuacao: string - Data de autuação do processo no formato ISO (YYYY-MM-DD)
 * - juizoDigital: boolean - Indica se o processo está em juízo digital
 * - dataArquivamento?: string - Data de arquivamento do processo (opcional, presente apenas em processos arquivados)
 * - dataProximaAudiencia?: string | null - Data da próxima audiência agendada (opcional, pode ser null)
 * - temAssociacao: boolean - Indica se o processo tem associação com outros processos
 * 
 * USO:
 * Utilizada por todas as funções que retornam processos:
 * - obterProcessos() retorna PagedResponse<Processo>
 * - obterTodosProcessos() retorna Processo[]
 * 
 * Usada pelos serviços de captura e persistence para salvar processos no banco de dados.
 */
export interface Processo {
  id: number;
  descricaoOrgaoJulgador: string;
  classeJudicial: string;
  numero: number;
  numeroProcesso: string;
  segredoDeJustica: boolean;
  codigoStatusProcesso: string;
  prioridadeProcessual: number;
  nomeParteAutora: string;
  qtdeParteAutora: number;
  nomeParteRe: string;
  qtdeParteRe: number;
  dataAutuacao: string;
  juizoDigital: boolean;
  dataArquivamento?: string;
  dataProximaAudiencia?: string | null;
  temAssociacao: boolean;
}

/**
 * Interface: ClasseJudicial
 * 
 * Representa a classe judicial retornada pela API do PJE.
 */
export interface ClasseJudicial {
  id: number;
  codigo: string;
  descricao: string;
  sigla: string;
  requerProcessoReferenciaCodigo: string;
  controlaValorCausa: boolean;
  podeIncluirAutoridade: boolean;
  pisoValorCausa: number;
  tetoValorCausa: number;
  ativo: boolean;
  idClasseJudicialPai: number | null;
  possuiFilhos: boolean;
}

/**
 * Interface: OrgaoJulgador
 * 
 * Representa o órgão julgador retornado pela API do PJE.
 */
export interface OrgaoJulgador {
  id: number;
  descricao: string;
  cejusc: boolean;
  ativo: boolean;
  postoAvancado: boolean;
  novoOrgaoJulgador: boolean;
  codigoServentiaCnj: number;
}

/**
 * Interface: ProcessoAudiencia
 * 
 * Representa o processo dentro de uma audiência do PJE.
 */
export interface ProcessoAudiencia {
  id: number;
  numero: string;
  classeJudicial: ClasseJudicial;
  segredoDeJustica: boolean;
  juizoDigital: boolean;
  orgaoJulgador: OrgaoJulgador;
}

/**
 * Interface: TipoAudiencia
 * 
 * Representa o tipo de audiência retornado pela API do PJE.
 */
export interface TipoAudiencia {
  id: number;
  descricao: string;
  codigo: string;
  isVirtual: boolean;
}

/**
 * Interface: PoloAudiencia
 * 
 * Representa um polo (ativo ou passivo) em uma audiência.
 */
export interface PoloAudiencia {
  nome: string;
  polo: string;
  poloEnum: 'ATIVO' | 'PASSIVO';
  representaVarios: boolean;
  cpf?: string;
  cnpj?: string;
}

/**
 * Interface: SalaAudiencia
 * 
 * Representa a sala de audiência retornada pela API do PJE.
 */
export interface SalaAudiencia {
  nome: string;
  id?: number;
}

/**
 * Interface: PautaAudienciaHorario
 * 
 * Representa o horário da audiência na pauta.
 */
export interface PautaAudienciaHorario {
  id: number;
  horaInicial: string;
  horaFinal: string;
}

/**
 * Interface: Audiencia
 * 
 * PROPÓSITO:
 * Representa uma audiência retornada pela API do PJE.
 * Contém todas as informações sobre uma audiência agendada, incluindo dados do processo relacionado.
 * 
 * ESTRUTURA COMPLETA DO OBJETO PJE:
 * - Dados principais da audiência (id, datas, status)
 * - Processo relacionado (com classe judicial, órgão julgador)
 * - Tipo de audiência (com informações sobre virtualidade)
 * - Polos (ativo e passivo com CPF/CNPJ)
 * - Sala de audiência
 * - Pauta e horários
 * - Flags de estado (designada, em andamento, documento ativo)
 * 
 * USO:
 * Utilizada por todas as funções que retornam audiências:
 * - obterPautaAudiencias() retorna PagedResponse<Audiencia>
 * - obterTodasAudiencias() retorna Audiencia[]
 * 
 * Usada pelos serviços de captura e persistence para salvar audiências no banco de dados.
 */
export interface Audiencia {
  id: number;
  dataInicio: string;
  dataFim: string;
  salaAudiencia: SalaAudiencia;
  status: string;
  processo: ProcessoAudiencia;
  tipo: TipoAudiencia;
  designada: boolean;
  emAndamento: boolean;
  documentoAtivo: boolean;
  poloAtivo: PoloAudiencia;
  poloPassivo: PoloAudiencia;
  pautaAudienciaHorario: PautaAudienciaHorario;
  statusDescricao: string;
  idProcesso: number;
  nrProcesso: string;
  urlAudienciaVirtual?: string;
}

/**
 * Enum: AgrupamentoProcessoTarefa
 * 
 * PROPÓSITO:
 * Define os tipos de agrupamento de processos disponíveis no painel do advogado no PJE.
 * Cada valor corresponde a um ID usado pela API para filtrar processos por categoria.
 * 
 * VALORES:
 * - ACERVO_GERAL = 1: Todos os processos ativos do advogado
 * - PENDENTES_MANIFESTACAO = 2: Processos que aguardam manifestação do advogado
 * - ARQUIVADOS = 5: Processos arquivados
 * 
 * USO:
 * Utilizado como parâmetro nas funções obterProcessos() e obterTodosProcessos() para especificar
 * qual categoria de processos deve ser retornada.
 * 
 * EXEMPLO DE USO:
 * obterTodosProcessos(page, idAdvogado, AgrupamentoProcessoTarefa.ACERVO_GERAL)
 * obterTodosProcessos(page, idAdvogado, AgrupamentoProcessoTarefa.PENDENTES_MANIFESTACAO)
 * obterTodosProcessos(page, idAdvogado, AgrupamentoProcessoTarefa.ARQUIVADOS)
 */
export enum AgrupamentoProcessoTarefa {
  ACERVO_GERAL = 1,
  PENDENTES_MANIFESTACAO = 2,
  ARQUIVADOS = 5,
}

