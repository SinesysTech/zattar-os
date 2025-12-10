/**
 * PJE TRT DRIVER - Implementação do Driver para TRT/PJE
 *
 * Este driver encapsula toda a lógica específica do PJE para TRTs.
 * O código original de autenticação e captura foi preservado ipsis litteris,
 * apenas encapsulado dentro da interface JudicialDriver.
 *
 * IMPORTANTE: Não alterar seletores CSS, timeouts ou lógica de navegação.
 * Estes valores foram ajustados empiricamente e são críticos para o funcionamento.
 */

import type { Page, Browser } from 'playwright';
import { autenticarPJE as autenticarPJEOriginal, obterTokens, obterIdAdvogado } from '@/backend/captura/services/trt/trt-auth.service';
import type { AuthResult } from '@/backend/captura/services/trt/trt-auth.service';
import { obterTodasAudiencias } from '@/backend/api/pje-trt/audiencias';
import { obterTodosProcessosPendentesManifestacao } from '@/backend/api/pje-trt/expedientes';
import type { CredenciaisTRT, ConfigTRT, TipoAcessoTribunal } from '@/backend/types/captura/trt-types';
import type { TwoFAuthConfig } from '@/backend/api/twofauth.service';
import type {
  JudicialDriver,
  SessaoAutenticada,
  AuthTokens,
  AdvogadoInfo,
} from '../judicial-driver.interface';
import type {
  Credencial,
  ConfigTribunal,
  BuscarProcessosParams,
  ResultadoCaptura,
  PeriodoAudiencias,
  AudienciaCapturada,
  ProcessoCapturado,
} from '../../domain';
import type { GrauProcesso } from '@/types/domain/common';
import { mapearTipoAcessoParaGrau } from '../../domain';

/**
 * Driver PJE para TRTs
 *
 * Implementa a interface JudicialDriver para o sistema PJE usado pelos TRTs.
 * Encapsula toda a lógica de autenticação SSO gov.br, OTP via 2FAuth e captura.
 */
export class PjeTrtDriver implements JudicialDriver {
  private authResult: AuthResult | null = null;
  private twofauthConfig: TwoFAuthConfig | undefined;

  /**
   * Configura o 2FAuth (opcional, pode usar variáveis de ambiente)
   */
  setTwoFAuthConfig(config: TwoFAuthConfig): void {
    this.twofauthConfig = config;
  }

  /**
   * Mapeia ConfigTribunal genérica para ConfigTRT específica
   */
  private mapConfigToTRT(config: ConfigTribunal): ConfigTRT {
    // Usar função utilitária centralizada para mapear tipoAcesso para grau
    // Isso mantém consistência com a lógica usada em tribunal-config-persistence.service.ts
    const grau = mapearTipoAcessoParaGrau(config.tipoAcesso);

    // Usar código do tribunal da config (preenchido pela factory) ou fallback
    const codigo = config.tribunalCodigo || this.extractCodigoTribunal(config.tribunalId);

    return {
      codigo: codigo as any, // CodigoTRT
      nome: config.tribunalNome || '', // Nome do tribunal
      grau: grau as any, // GrauTRT
      tipoAcesso: config.tipoAcesso as TipoAcessoTribunal,
      loginUrl: config.loginUrl,
      baseUrl: config.baseUrl,
      apiUrl: config.apiUrl,
      customTimeouts: config.customTimeouts,
    };
  }

  /**
   * Extrai código do tribunal do tribunalId (fallback)
   * A factory já preenche tribunalCodigo, mas este método serve como fallback
   */
  private extractCodigoTribunal(tribunalId: string): string {
    // Por enquanto, assumir que tribunalId pode ser o próprio código
    return tribunalId.toUpperCase();
  }

  /**
   * Obtém configuração 2FAuth (variáveis de ambiente ou config fornecida)
   */
  private getTwoFAuthConfig(): TwoFAuthConfig | undefined {
    if (this.twofauthConfig) {
      return this.twofauthConfig;
    }

    // Tentar obter de variáveis de ambiente
    if (
      process.env.TWOFAUTH_API_URL &&
      process.env.TWOFAUTH_API_TOKEN &&
      process.env.TWOFAUTH_ACCOUNT_ID
    ) {
      return {
        apiUrl: process.env.TWOFAUTH_API_URL,
        apiToken: process.env.TWOFAUTH_API_TOKEN,
        accountId: parseInt(process.env.TWOFAUTH_ACCOUNT_ID, 10),
      };
    }

    return undefined;
  }

  /**
   * Mapeia Credencial genérica para CredenciaisTRT
   */
  private mapCredencialToTRT(credencial: Credencial): CredenciaisTRT {
    return {
      cpf: credencial.cpf,
      senha: credencial.senha,
    };
  }

  /**
   * Autentica no sistema PJE/TRT
   */
  async autenticar(credencial: Credencial, config: ConfigTribunal): Promise<SessaoAutenticada> {
    const credencialTRT = this.mapCredencialToTRT(credencial);
    const configTRT = this.mapConfigToTRT(config);
    const twofauthConfig = this.getTwoFAuthConfig();

    // Chamar função original de autenticação (código preservado ipsis litteris)
    this.authResult = await autenticarPJEOriginal({
      credential: credencialTRT,
      config: configTRT,
      twofauthConfig,
      headless: true,
    });

    // Mapear resultado para interface genérica
    return {
      page: this.authResult.page,
      browser: this.authResult.browser,
      tokens: this.authResult.tokens,
      advogadoInfo: this.authResult.advogadoInfo,
    };
  }

  /**
   * Busca processos conforme parâmetros fornecidos
   */
  async buscarProcessos(params: BuscarProcessosParams): Promise<ResultadoCaptura> {
    if (!this.authResult) {
      throw new Error('Driver não autenticado. Chame autenticar() primeiro.');
    }

    const { page, advogadoInfo } = this.authResult;
    const inicio = performance.now();
    const processos: ProcessoCapturado[] = [];
    const audiencias: AudienciaCapturada[] = [];

    // Determinar tipo de captura e executar
    switch (params.tipo) {
      case 'audiencias_designadas':
      case 'audiencias_realizadas':
      case 'audiencias_canceladas':
        {
          if (!params.periodo) {
            throw new Error('Período é obrigatório para captura de audiências');
          }

          const codigoSituacao =
            params.tipo === 'audiencias_designadas'
              ? 'M'
              : params.tipo === 'audiencias_realizadas'
              ? 'F'
              : 'C';

          const { audiencias: audienciasCapturadas } = await obterTodasAudiencias(
            page,
            params.periodo.dataInicio,
            params.periodo.dataFim,
            codigoSituacao
          );

          // Converter para formato genérico
          for (const aud of audienciasCapturadas) {
            audiencias.push({
              idProcesso: aud.idProcesso,
              numeroProcesso: aud.nrProcesso || aud.processo?.numero || '',
              dataAudiencia: aud.dataHoraFim || aud.dataHora || '',
              tipoAudiencia: aud.tipo || '',
              situacao: aud.situacao || codigoSituacao,
              sala: aud.sala,
            });

            // Extrair processo se disponível
            if (aud.idProcesso) {
              processos.push({
                idPje: aud.idProcesso,
                numeroProcesso: aud.nrProcesso || aud.processo?.numero || '',
                classeJudicial: '',
                orgaoJulgador: aud.orgaoJulgador || '',
                parteAutora: '',
                parteRe: '',
                dataAutuacao: '',
                status: '',
              });
            }
          }
        }
        break;

      case 'expedientes_no_prazo':
      case 'expedientes_sem_prazo':
        {
          const idAdvogado = parseInt(advogadoInfo.idAdvogado, 10);
          const agrupadorExpediente = params.tipo === 'expedientes_no_prazo' ? 'N' : 'I';

          const processosPendentes = await obterTodosProcessosPendentesManifestacao(
            page,
            idAdvogado,
            500,
            {
              agrupadorExpediente,
              tipoPainelAdvogado: 2,
              idPainelAdvogadoEnum: 2,
              ordenacaoCrescente: false,
            }
          );

          // Converter para formato genérico
          for (const proc of processosPendentes) {
            processos.push({
              idPje: proc.id,
              numeroProcesso: proc.numeroProcesso,
              classeJudicial: proc.classeJudicial || '',
              orgaoJulgador: proc.descricaoOrgaoJulgador || '',
              parteAutora: proc.nomeParteAutora || '',
              parteRe: proc.nomeParteRe || '',
              dataAutuacao: proc.dataAutuacao || '',
              status: proc.codigoStatusProcesso || '',
            });
          }
        }
        break;

      case 'acervo_geral':
      case 'arquivados':
        // TODO: Implementar captura de acervo geral e arquivados
        throw new Error(`Tipo de captura ${params.tipo} ainda não implementado no driver`);

      default:
        throw new Error(`Tipo de captura desconhecido: ${params.tipo}`);
    }

    const duracaoMs = performance.now() - inicio;

    return {
      processos,
      audiencias: audiencias.length > 0 ? audiencias : undefined,
      metadados: {
        tribunal: '', // Será preenchido pelo service
        sistema: 'PJE',
        grau: 'primeiro_grau', // Será preenchido pelo service
        dataCaptura: new Date().toISOString(),
        duracaoMs,
      },
    };
  }

  /**
   * Busca audiências em um período específico
   */
  async buscarAudiencias(periodo: PeriodoAudiencias): Promise<AudienciaCapturada[]> {
    if (!this.authResult) {
      throw new Error('Driver não autenticado. Chame autenticar() primeiro.');
    }

    const { page } = this.authResult;

    // Buscar todas as audiências (designadas, realizadas e canceladas)
    const [designadas, realizadas, canceladas] = await Promise.all([
      obterTodasAudiencias(page, periodo.dataInicio, periodo.dataFim, 'M').then((r) => r.audiencias),
      obterTodasAudiencias(page, periodo.dataInicio, periodo.dataFim, 'F').then((r) => r.audiencias),
      obterTodasAudiencias(page, periodo.dataInicio, periodo.dataFim, 'C').then((r) => r.audiencias),
    ]);

    // Converter para formato genérico
    const todasAudiencias: AudienciaCapturada[] = [];

    for (const aud of [...designadas, ...realizadas, ...canceladas]) {
      todasAudiencias.push({
        idProcesso: aud.idProcesso,
        numeroProcesso: aud.nrProcesso || aud.processo?.numero || '',
        dataAudiencia: aud.dataHoraFim || aud.dataHora || '',
        tipoAudiencia: aud.tipo || '',
        situacao: aud.situacao || '',
        sala: aud.sala,
      });
    }

    return todasAudiencias;
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
