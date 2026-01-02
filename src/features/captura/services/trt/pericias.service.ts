/**
 * Serviço de captura de perícias do TRT
 * 
 * FLUXO:
 * 
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  🔐 FASE 1: AUTENTICAÇÃO                                        │
 * │  └── Login SSO PDPJ → OTP → JWT + Cookies                       │
 * └─────────────────────────────────────────────────────────────────┘
 *                               │
 *                               ▼
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  📡 FASE 2: BUSCAR PERÍCIAS                                    │
 * │  └── GET /pje-comum-api/api/pericias                            │
 * │  └── Retorno: perícias (cada uma com idProcesso)               │
 * └─────────────────────────────────────────────────────────────────┘
 *                               │
 *                               ▼
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  🔍 FASE 3: FILTRAR POR SITUAÇÕES                              │
 * │  └── Filtrar perícias pelas situações selecionadas             │
 * └─────────────────────────────────────────────────────────────────┘
 *                               │
 *                               ▼
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  💾 FASE 4: PERSISTÊNCIA                                        │
 * │  └── 🔬 Perícias: upsert (Supabase)                             │
 * └─────────────────────────────────────────────────────────────────┘
 *                               │
 *                               ▼
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  🚪 FASE 5: FECHAR BROWSER                                      │
 * └─────────────────────────────────────────────────────────────────┘
 */

import { autenticarPJE, type AuthResult } from './trt-auth.service';
import type { CapturaTRTParams } from './trt-capture.service';
import { obterPericias } from '@/features/captura/pje-trt';
import type { Pericia } from '../../types/pericias-types';
import { salvarPericias, type SalvarPericiasResult } from '../persistence/pericias-persistence.service';
import { buscarOuCriarAdvogadoPorCpf } from '../advogado-helper.service';
import { captureLogService, type LogEntry } from '../persistence/capture-log.service';

/**
 * Parâmetros específicos para captura de perícias
 */
export interface CapturaPericiasParams extends CapturaTRTParams {
  /** Situações das perícias a capturar: S, L, C, F, P, R */
  situacoes?: ('S' | 'L' | 'C' | 'F' | 'P' | 'R')[];
}

/**
 * Resultado da captura de perícias
 */
export interface PericiasResult {
  pericias: Pericia[];
  total: number;
  persistencia?: SalvarPericiasResult;
  paginasBrutas?: unknown[];
  logs?: LogEntry[];
}

/**
 * Serviço de captura de perícias
 */
export async function periciasCapture(
  params: CapturaPericiasParams
): Promise<PericiasResult> {
  let authResult: AuthResult | null = null;

  try {
    // ═══════════════════════════════════════════════════════════════
    // FASE 1: AUTENTICAÇÃO
    // ═══════════════════════════════════════════════════════════════
    console.log('🔐 [Perícias] Fase 1: Autenticando no PJE...');
    authResult = await autenticarPJE({
      credential: params.credential,
      config: params.config,
      twofauthConfig: params.twofauthConfig,
      headless: true,
    });

    const { page, advogadoInfo } = authResult;
    console.log(`✅ [Perícias] Autenticado como: ${advogadoInfo.nome}`);

    // ═══════════════════════════════════════════════════════════════
    // FASE 2: BUSCAR PERÍCIAS
    // ═══════════════════════════════════════════════════════════════
    console.log('📡 [Perícias] Fase 2: Buscando perícias...');

    // obterPericias busca todas as situações automaticamente
    const todasPericias = await obterPericias(page, 500);

    console.log(`✅ [Perícias] ${todasPericias.length} perícias encontradas (todas as situações)`);

    // ═══════════════════════════════════════════════════════════════
    // FASE 3: FILTRAR POR SITUAÇÕES
    // ═══════════════════════════════════════════════════════════════
    let periciasFiltradas: Pericia[] = todasPericias;

    if (params.situacoes && params.situacoes.length > 0) {
      console.log(`🔍 [Perícias] Fase 3: Filtrando por situações: ${params.situacoes.join(', ')}`);
      periciasFiltradas = todasPericias.filter(p => 
        params.situacoes?.includes(p.situacao?.codigo as 'S' | 'L' | 'C' | 'F' | 'P' | 'R')
      );
      console.log(`✅ [Perícias] ${periciasFiltradas.length} perícias após filtro`);
    } else {
      console.log(`ℹ️ [Perícias] Nenhum filtro de situação aplicado, usando todas as ${todasPericias.length} perícias`);
    }

    // Se não há perícias, retornar imediatamente
    if (periciasFiltradas.length === 0) {
      return {
        pericias: [],
        total: 0,
      };
    }

    // ═══════════════════════════════════════════════════════════════
    // FASE 4: PERSISTÊNCIA
    // ═══════════════════════════════════════════════════════════════
    console.log('💾 [Perícias] Fase 4: Persistindo dados...');

    // 4.1 Buscar/criar advogado
    const advogadoDb = await buscarOuCriarAdvogadoPorCpf(
      advogadoInfo.cpf,
      advogadoInfo.nome
    );

    // 4.2 Persistir perícias
    console.log('   🔬 Persistindo perícias...');
    let persistencia: SalvarPericiasResult | undefined;
    let logsPersistencia: LogEntry[] | undefined;

    try {
      persistencia = await salvarPericias({
        pericias: periciasFiltradas,
        advogadoId: advogadoDb.id,
        trt: params.config.codigo,
        grau: params.config.grau,
      });

      console.log(`   ✅ Perícias persistidas:`, {
        inseridos: persistencia.inseridos,
        atualizados: persistencia.atualizados,
        naoAtualizados: persistencia.naoAtualizados,
        erros: persistencia.erros,
      });
    } catch (error) {
      console.error('❌ [Perícias] Erro ao salvar perícias:', error);
    } finally {
      captureLogService.imprimirResumo();
      logsPersistencia = captureLogService.consumirLogs();
    }

    // ═══════════════════════════════════════════════════════════════
    // RESULTADO FINAL
    // ═══════════════════════════════════════════════════════════════
    console.log('🏁 [Perícias] Captura concluída!');
    console.log(`   📊 Resumo:`);
    console.log(`      - Perícias encontradas: ${todasPericias.length}`);
    console.log(`      - Perícias filtradas: ${periciasFiltradas.length}`);
    console.log(`      - Perícias persistidas: ${persistencia?.inseridos || 0} inseridas, ${persistencia?.atualizados || 0} atualizadas`);

    return {
      pericias: periciasFiltradas,
      total: periciasFiltradas.length,
      persistencia,
      logs: logsPersistencia,
    };
  } finally {
    // ═══════════════════════════════════════════════════════════════
    // FASE 5: FECHAR BROWSER
    // ═══════════════════════════════════════════════════════════════
    if (authResult?.browser) {
      console.log('🚪 [Perícias] Fechando browser...');
      await authResult.browser.close();
    }
  }
}

/**
 * Serviço de captura de perícias (wrapper para compatibilidade com rota de API)
 */
export async function capturarPericiasService(params: {
  advogado_id: number;
  credencial_ids: number[];
  situacoes?: ('S' | 'L' | 'C' | 'F' | 'P' | 'R')[];
}): Promise<{
  success: boolean;
  data?: {
    credenciais_processadas: number;
    message: string;
  };
  capture_id?: number;
  error?: string;
}> {
  // Esta função será chamada pela rota de API
  // A implementação real será feita na rota, similar ao padrão de audiências
  throw new Error('Esta função deve ser chamada apenas pela rota de API');
}

