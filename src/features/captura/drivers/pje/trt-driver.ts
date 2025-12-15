/**
 * PJE TRT DRIVER - Implementação do Driver para TRT/PJE
 *
 * Este driver encapsula toda a lógica específica do PJE para TRTs.
 * 
 * TODO: REFACTOR - This driver relied on backend services that have been migrated or removed.
 * It needs to be reimplemented using the new architecture (likely calling the API routes or new services).
 * For now, methods throw "Not Implemented" to resolve build errors.
 */

import type {
  JudicialDriver,
  SessaoAutenticada,
} from '../judicial-driver.interface';
import type {
  Credencial,
  ConfigTribunal,
  BuscarProcessosParams,
  ResultadoCaptura,
  PeriodoAudiencias,
  AudienciaCapturada,
} from '../../domain';
import { mapearTipoAcessoParaGrau } from '../../domain';

// Placeholder types to fix generic usage if needed, or just use any/unknown where strictly necessary for now
// But since we are stubbing, we can just remove usage.

/**
 * Driver PJE para TRTs
 *
 * Implementa a interface JudicialDriver para o sistema PJE usado pelos TRTs.
 * Encapsula toda a lógica de autenticação SSO gov.br, OTP via 2FAuth e captura.
 */
export class PjeTrtDriver implements JudicialDriver {
  // private authResult: AuthResult | null = null; // Removed broken type
  private authResult: unknown | null = null;
  private twofauthConfig: unknown | undefined;

  /**
   * Configura o 2FAuth (opcional, pode usar variáveis de ambiente)
   */
  setTwoFAuthConfig(config: unknown): void {
    this.twofauthConfig = config;
  }

  /**
   * Autentica no sistema PJE/TRT
   */
  async autenticar(credencial: Credencial, config: ConfigTribunal): Promise<SessaoAutenticada> {
     // TODO: Re-implement authentication using new services
     console.error('PjeTrtDriver: autenticar not implemented due to missing dependencies.');
     throw new Error('PjeTrtDriver: Authentication implementation missing after migration.');
  }

  /**
   * Busca processos conforme parâmetros fornecidos
   */
  async buscarProcessos(params: BuscarProcessosParams): Promise<ResultadoCaptura> {
    console.error('PjeTrtDriver: buscarProcessos not implemented due to missing dependencies.');
    throw new Error('PjeTrtDriver: buscarProcessos implementation missing after migration.');
  }

  /**
   * Busca audiências em um período específico
   */
  async buscarAudiencias(periodo: PeriodoAudiencias): Promise<AudienciaCapturada[]> {
     console.error('PjeTrtDriver: buscarAudiencias not implemented due to missing dependencies.');
     throw new Error('PjeTrtDriver: buscarAudiencias implementation missing after migration.');
  }

  /**
   * Encerra a sessão e fecha recursos
   */
  async encerrar(): Promise<void> {
    if (this.authResult?.browser) {
      await this.authResult.browser.close();
      this.authResult = null;
    }
  }
}
