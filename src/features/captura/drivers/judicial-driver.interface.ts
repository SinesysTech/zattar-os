/**
 * JUDICIAL DRIVER INTERFACE - Contrato Padrão para Drivers
 *
 * Define o contrato que todos os drivers de captura devem implementar.
 * Cada sistema (PJE, ESAJ, EPROC) terá sua própria implementação.
 */

import type { Browser, Page } from 'playwright';
import type {
  Credencial,
  ConfigTribunal,
  BuscarProcessosParams,
  ResultadoCaptura,
  PeriodoAudiencias,
  AudienciaCapturada,
  MovimentacaoCapturada,
} from '../domain';

// =============================================================================
// INTERFACES DE AUTENTICAÇÃO
// =============================================================================

/**
 * Tokens de autenticação obtidos após login
 */
export interface AuthTokens {
  accessToken: string;
  xsrfToken?: string;
}

/**
 * Informações do advogado autenticado
 */
export interface AdvogadoInfo {
  idAdvogado: string;
  cpf: string;
  nome?: string;
}

/**
 * Sessão autenticada retornada pelo driver
 */
export interface SessaoAutenticada {
  page: Page;
  browser: Browser;
  tokens: AuthTokens;
  advogadoInfo: AdvogadoInfo;
}

// =============================================================================
// INTERFACE PRINCIPAL DO DRIVER
// =============================================================================

/**
 * Interface que todos os drivers de captura devem implementar
 *
 * Cada driver encapsula a lógica específica de autenticação e captura
 * de um sistema judicial (PJE, ESAJ, EPROC, etc).
 */
export interface JudicialDriver {
  /**
   * Autentica no sistema judicial usando as credenciais fornecidas
   *
   * @param credencial - CPF e senha do advogado
   * @param config - Configuração do tribunal (URLs, timeouts, etc)
   * @returns Sessão autenticada com página, browser, tokens e info do advogado
   */
  autenticar(credencial: Credencial, config: ConfigTribunal): Promise<SessaoAutenticada>;

  /**
   * Busca processos conforme os parâmetros fornecidos
   *
   * Deve ser chamado APÓS autenticar() ter sido executado com sucesso.
   *
   * @param params - Parâmetros de busca (tipo de captura, período, filtros)
   * @returns Resultado da captura com processos e metadados
   */
  buscarProcessos(params: BuscarProcessosParams): Promise<ResultadoCaptura>;

  /**
   * Busca audiências em um período específico (opcional)
   *
   * Nem todos os sistemas judiciais suportam busca de audiências.
   * Se não suportado, o driver pode lançar erro ou retornar array vazio.
   *
   * @param periodo - Período para buscar audiências (data início/fim)
   * @returns Lista de audiências encontradas
   */
  buscarAudiencias?(periodo: PeriodoAudiencias): Promise<AudienciaCapturada[]>;

  /**
   * Busca movimentações/timeline de um processo específico (opcional)
   *
   * Nem todos os sistemas judiciais suportam busca de movimentações.
   * Se não suportado, o driver pode lançar erro ou retornar array vazio.
   *
   * @param processoId - ID do processo no sistema judicial
   * @returns Lista de movimentações do processo
   */
  buscarMovimentacoes?(processoId: number): Promise<MovimentacaoCapturada[]>;

  /**
   * Encerra a sessão e fecha recursos (browser, etc)
   *
   * Deve ser chamado sempre após terminar de usar o driver,
   * preferencialmente em um bloco finally.
   */
  encerrar(): Promise<void>;
}
