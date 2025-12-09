/**
 * Serviço de Captura Combinada do TRT
 * 
 * PROPÓSITO:
 * Executa múltiplas capturas em uma única sessão autenticada, otimizando
 * o uso da conexão e reduzindo o tempo total de execução.
 * 
 * FLUXO OTIMIZADO:
 * 
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  🔐 FASE 1: AUTENTICAÇÃO                                        │
 * │  └── Login SSO PDPJ → OTP → JWT + Cookies (sessão mantida!)    │
 * └─────────────────────────────────────────────────────────────────┘
 *                               │
 *                               ▼
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  📡 FASE 2: CAPTURAS MÚLTIPLAS (mesma sessão!)                  │
 * │  ├── 🎤 Audiências Designadas (hoje → +1 ano)                   │
 * │  ├── 🎤 Audiências Realizadas (ontem)                           │
 * │  ├── 🎤 Audiências Canceladas (hoje → +1 ano)                   │
 * │  ├── 📋 Expedientes No Prazo                                    │
 * │  └── 📋 Expedientes Sem Prazo                                   │
 * └─────────────────────────────────────────────────────────────────┘
 *                               │
 *                               ▼
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  📊 FASE 3: CONSOLIDAR PROCESSOS ÚNICOS                         │
 * │  └── Extrai IDs únicos de todas as listas capturadas            │
 * └─────────────────────────────────────────────────────────────────┘
 *                               │
 *                               ▼
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  🔄 FASE 4: DADOS COMPLEMENTARES (todos os processos)           │
 * │  ├── 🔍 Verificação de recaptura (pula se atualizado < 24h)     │
 * │  ├── 📜 Timeline: GET /processos/id/{id}/timeline               │
 * │  └── 👥 Partes: GET /processos/id/{id}/partes                   │
 * └─────────────────────────────────────────────────────────────────┘
 *                               │
 *                               ▼
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  💾 FASE 5: PERSISTÊNCIA CONSOLIDADA                            │
 * │  ├── 📜 Timeline (MongoDB)                                      │
 * │  ├── 👥 Partes (PostgreSQL)                                     │
 * │  ├── 🎤 Audiências (PostgreSQL)                                 │
 * │  └── 📋 Expedientes (PostgreSQL)                                │
 * └─────────────────────────────────────────────────────────────────┘
 *                               │
 *                               ▼
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  🚪 FASE 6: FECHAR BROWSER                                      │
 * └─────────────────────────────────────────────────────────────────┘
 */

import { autenticarPJE, type AuthResult } from './trt-auth.service';
import type { CapturaCombinAdaParams } from './trt-capture.service';
import { obterTodasAudiencias } from '@/backend/api/pje-trt';
import {
    obterTodosProcessosPendentesManifestacao,
} from '@/backend/api/pje-trt';
import { salvarAudiencias, type SalvarAudienciasResult } from '../persistence/audiencias-persistence.service';
import { salvarPendentes, type SalvarPendentesResult, type ProcessoPendente } from '../persistence/pendentes-persistence.service';
import { buscarOuCriarAdvogadoPorCpf } from '@/backend/utils/captura/advogado-helper.service';
import { captureLogService, type LogEntry } from '../persistence/capture-log.service';
import {
    buscarDadosComplementaresProcessos,
} from './dados-complementares.service';
import { salvarTimelineNoMongoDB } from '../timeline/timeline-persistence.service';
import { persistirPartesProcesso } from '../partes/partes-capture.service';
import type { TimelineItemEnriquecido } from '@/backend/types/pje-trt/timeline';
import { createServiceClient } from '@/backend/utils/supabase/service-client';

/**
 * Resultado de uma captura individual (audiências ou pendentes)
 */
interface ResultadoCapturaIndividual {
    tipo: 'audiencias_designadas' | 'audiencias_realizadas' | 'audiencias_canceladas' | 'expedientes_no_prazo' | 'expedientes_sem_prazo';
    total: number;
    processos: Array<{ idProcesso?: number; id?: number; numeroProcesso?: string }>;
    dados?: unknown;
}

/**
 * Resultado da captura combinada
 */
export interface CapturaCombinAdaResult {
    /** Resultados individuais de cada captura */
    capturas: ResultadoCapturaIndividual[];

    /** Resumo geral */
    resumo: {
        totalAudienciasDesignadas: number;
        totalAudienciasRealizadas: number;
        totalAudienaciasCanceladas: number;
        totalExpedientesNoPrazo: number;
        totalExpedientesSemPrazo: number;
        totalProcessosUnicos: number;
        totalProcessosPulados: number;
    };

    /** Dados complementares capturados */
    dadosComplementares: {
        processosUnicos: number;
        processosPulados: number;
        timelinesCapturadas: number;
        partesCapturadas: number;
        erros: number;
    };

    /** Persistência */
    persistenciaAudiencias?: SalvarAudienciasResult;
    persistenciaExpedientes?: SalvarPendentesResult;

    /** Payloads brutos de partes (MongoDB) */
    payloadsBrutosPartes?: Array<{
        processoId: number;
        numeroProcesso?: string;
        payloadBruto: Record<string, unknown> | null;
    }>;

    /** Logs */
    logs?: LogEntry[];

    /** Duração total */
    duracaoMs: number;
}

/**
 * Calcula data de hoje no formato YYYY-MM-DD
 */
function getDataHoje(): string {
    return new Date().toISOString().split('T')[0];
}

/**
 * Calcula data de ontem no formato YYYY-MM-DD
 */
function getDataOntem(): string {
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);
    return ontem.toISOString().split('T')[0];
}

/**
 * Calcula data de hoje + 365 dias no formato YYYY-MM-DD
 */
function getDataUmAnoDepois(): string {
    const hoje = new Date();
    const umAnoDepois = new Date(hoje);
    umAnoDepois.setFullYear(hoje.getFullYear() + 1);
    return umAnoDepois.toISOString().split('T')[0];
}

/**
 * Extrai IDs únicos de processos de múltiplas listas
 */
function extrairProcessosUnicosDeTodas(listas: ResultadoCapturaIndividual[]): number[] {
    const idsSet = new Set<number>();

    for (const lista of listas) {
        for (const processo of lista.processos) {
            const id = processo.idProcesso ?? processo.id;
            if (id) {
                idsSet.add(id);
            }
        }
    }

    const idsUnicos = Array.from(idsSet);
    console.log(`📋 [CapturaCombinada] ${idsUnicos.length} processos únicos extraídos de ${listas.reduce((acc, l) => acc + l.total, 0)} registros totais`);
    return idsUnicos;
}

/**
 * Serviço de captura combinada
 * 
 * Executa múltiplas capturas em uma única sessão:
 * 1. Audiências Designadas (hoje → +1 ano)
 * 2. Audiências Realizadas (ontem)
 * 3. Audiências Canceladas (hoje → +1 ano)
 * 4. Expedientes No Prazo
 * 5. Expedientes Sem Prazo
 * 6. Timeline + Partes de todos os processos únicos
 */
export async function capturaCombinada(
    params: CapturaCombinAdaParams
): Promise<CapturaCombinAdaResult> {
    const inicio = performance.now();
    let authResult: AuthResult | null = null;

    const resultado: CapturaCombinAdaResult = {
        capturas: [],
        resumo: {
            totalAudienciasDesignadas: 0,
            totalAudienciasRealizadas: 0,
            totalAudienaciasCanceladas: 0,
            totalExpedientesNoPrazo: 0,
            totalExpedientesSemPrazo: 0,
            totalProcessosUnicos: 0,
            totalProcessosPulados: 0,
        },
        dadosComplementares: {
            processosUnicos: 0,
            processosPulados: 0,
            timelinesCapturadas: 0,
            partesCapturadas: 0,
            erros: 0,
        },
        duracaoMs: 0,
    };

    try {
        // ═══════════════════════════════════════════════════════════════
        // FASE 1: AUTENTICAÇÃO
        // ═══════════════════════════════════════════════════════════════
        console.log('🔐 [CapturaCombinada] Fase 1: Autenticando no PJE...');
        authResult = await autenticarPJE({
            credential: params.credential,
            config: params.config,
            twofauthConfig: params.twofauthConfig,
            headless: true,
        });

        const { page, advogadoInfo } = authResult;
        console.log(`✅ [CapturaCombinada] Autenticado como: ${advogadoInfo.nome}`);

        // ═══════════════════════════════════════════════════════════════
        // FASE 2: CAPTURAS MÚLTIPLAS (mesma sessão!)
        // ═══════════════════════════════════════════════════════════════
        console.log('📡 [CapturaCombinada] Fase 2: Executando capturas múltiplas...');

        const hoje = getDataHoje();
        const ontem = getDataOntem();
        const umAnoDepois = getDataUmAnoDepois();

        // 2.1 Audiências Designadas (M) - hoje → +1 ano
        console.log(`   🎤 Capturando Audiências Designadas (${hoje} → ${umAnoDepois})...`);
        const { audiencias: audienciasDesignadas, paginas: paginasDesignadas } = await obterTodasAudiencias(
            page,
            hoje,
            umAnoDepois,
            'M' // Designada/Marcada
        );
        console.log(`   ✅ ${audienciasDesignadas.length} audiências designadas encontradas`);

        resultado.capturas.push({
            tipo: 'audiencias_designadas',
            total: audienciasDesignadas.length,
            processos: audienciasDesignadas.map(a => ({
                idProcesso: a.idProcesso,
                numeroProcesso: a.nrProcesso || a.processo?.numero,
            })),
            dados: { audiencias: audienciasDesignadas, paginas: paginasDesignadas },
        });
        resultado.resumo.totalAudienciasDesignadas = audienciasDesignadas.length;

        // 2.2 Audiências Realizadas (F) - ontem
        console.log(`   🎤 Capturando Audiências Realizadas (${ontem})...`);
        const { audiencias: audienciasRealizadas, paginas: paginasRealizadas } = await obterTodasAudiencias(
            page,
            ontem,
            ontem,
            'F' // Finalizada/Realizada
        );
        console.log(`   ✅ ${audienciasRealizadas.length} audiências realizadas encontradas`);

        resultado.capturas.push({
            tipo: 'audiencias_realizadas',
            total: audienciasRealizadas.length,
            processos: audienciasRealizadas.map(a => ({
                idProcesso: a.idProcesso,
                numeroProcesso: a.nrProcesso || a.processo?.numero,
            })),
            dados: { audiencias: audienciasRealizadas, paginas: paginasRealizadas },
        });
        resultado.resumo.totalAudienciasRealizadas = audienciasRealizadas.length;

        // 2.3 Audiências Canceladas (C) - hoje → +1 ano
        console.log(`   🎤 Capturando Audiências Canceladas (${hoje} → ${umAnoDepois})...`);
        const { audiencias: audienciasCanceladas, paginas: paginasCanceladas } = await obterTodasAudiencias(
            page,
            hoje,
            umAnoDepois,
            'C' // Cancelada
        );
        console.log(`   ✅ ${audienciasCanceladas.length} audiências canceladas encontradas`);

        resultado.capturas.push({
            tipo: 'audiencias_canceladas',
            total: audienciasCanceladas.length,
            processos: audienciasCanceladas.map(a => ({
                idProcesso: a.idProcesso,
                numeroProcesso: a.nrProcesso || a.processo?.numero,
            })),
            dados: { audiencias: audienciasCanceladas, paginas: paginasCanceladas },
        });
        resultado.resumo.totalAudienaciasCanceladas = audienciasCanceladas.length;

        // 2.4 Expedientes No Prazo (N)
        console.log(`   📋 Capturando Expedientes No Prazo...`);
        const idAdvogado = parseInt(advogadoInfo.idAdvogado, 10);
        const expedientesNoPrazo = await obterTodosProcessosPendentesManifestacao(
            page,
            idAdvogado,
            500,
            {
                agrupadorExpediente: 'N', // No prazo
                tipoPainelAdvogado: 2,
                idPainelAdvogadoEnum: 2,
                ordenacaoCrescente: false,
            }
        );
        console.log(`   ✅ ${expedientesNoPrazo.length} expedientes no prazo encontrados`);

        resultado.capturas.push({
            tipo: 'expedientes_no_prazo',
            total: expedientesNoPrazo.length,
            processos: expedientesNoPrazo.map(e => ({
                id: e.id,
                numeroProcesso: e.numeroProcesso,
            })),
            dados: { processos: expedientesNoPrazo },
        });
        resultado.resumo.totalExpedientesNoPrazo = expedientesNoPrazo.length;

        // 2.5 Expedientes Sem Prazo (I)
        console.log(`   📋 Capturando Expedientes Sem Prazo...`);
        const expedientesSemPrazo = await obterTodosProcessosPendentesManifestacao(
            page,
            idAdvogado,
            500,
            {
                agrupadorExpediente: 'I', // Sem prazo (Indefinido)
                tipoPainelAdvogado: 2,
                idPainelAdvogadoEnum: 2,
                ordenacaoCrescente: false,
            }
        );
        console.log(`   ✅ ${expedientesSemPrazo.length} expedientes sem prazo encontrados`);

        resultado.capturas.push({
            tipo: 'expedientes_sem_prazo',
            total: expedientesSemPrazo.length,
            processos: expedientesSemPrazo.map(e => ({
                id: e.id,
                numeroProcesso: e.numeroProcesso,
            })),
            dados: { processos: expedientesSemPrazo },
        });
        resultado.resumo.totalExpedientesSemPrazo = expedientesSemPrazo.length;

        // ═══════════════════════════════════════════════════════════════
        // FASE 3: CONSOLIDAR PROCESSOS ÚNICOS
        // ═══════════════════════════════════════════════════════════════
        console.log('📊 [CapturaCombinada] Fase 3: Consolidando processos únicos...');
        const processosIds = extrairProcessosUnicosDeTodas(resultado.capturas);
        resultado.resumo.totalProcessosUnicos = processosIds.length;

        if (processosIds.length === 0) {
            console.log('ℹ️ [CapturaCombinada] Nenhum processo para atualizar');
            resultado.duracaoMs = performance.now() - inicio;
            return resultado;
        }

        // ═══════════════════════════════════════════════════════════════
        // FASE 4: DADOS COMPLEMENTARES (timeline + partes)
        // ═══════════════════════════════════════════════════════════════
        console.log('🔄 [CapturaCombinada] Fase 4: Buscando dados complementares...');

        const dadosComplementares = await buscarDadosComplementaresProcessos(
            page,
            processosIds,
            {
                buscarTimeline: true,
                buscarPartes: true,
                trt: params.config.codigo,
                grau: params.config.grau,
                verificarRecaptura: true, // Pula processos atualizados recentemente
                horasParaRecaptura: 24,   // Recaptura se > 24h desde última atualização
                delayEntreRequisicoes: 300,
                onProgress: (atual, total, processoId) => {
                    if (atual % 10 === 0 || atual === 1 || atual === total) {
                        console.log(`   📊 Progresso: ${atual}/${total} (processo ${processoId})`);
                    }
                },
            }
        );

        console.log(`✅ [CapturaCombinada] Dados complementares obtidos:`, dadosComplementares.resumo);
        resultado.dadosComplementares = {
            processosUnicos: processosIds.length,
            processosPulados: dadosComplementares.resumo.processosPulados,
            timelinesCapturadas: 0, // Será preenchido na persistência
            partesCapturadas: 0,    // Será preenchido na persistência
            erros: dadosComplementares.resumo.erros,
        };
        resultado.resumo.totalProcessosPulados = dadosComplementares.resumo.processosPulados;

        // ═══════════════════════════════════════════════════════════════
        // FASE 5: PERSISTÊNCIA CONSOLIDADA
        // ═══════════════════════════════════════════════════════════════
        console.log('💾 [CapturaCombinada] Fase 5: Persistindo dados...');

        // 5.1 Buscar/criar advogado
        const advogadoDb = await buscarOuCriarAdvogadoPorCpf(
            advogadoInfo.cpf,
            advogadoInfo.nome
        );

        // 5.2 Buscar IDs dos processos no acervo (para vínculos)
        console.log('   📦 Buscando processos no acervo...');
        const mapeamentoIds = new Map<number, number>();
        const supabase = createServiceClient();

        for (const idPje of processosIds) {
            const { data } = await supabase
                .from('acervo')
                .select('id')
                .eq('id_pje', idPje)
                .eq('trt', params.config.codigo)
                .eq('grau', params.config.grau)
                .maybeSingle();

            if (data?.id) {
                mapeamentoIds.set(idPje, data.id);
            }
        }
        console.log(`   ✅ ${mapeamentoIds.size}/${processosIds.length} processos encontrados no acervo`);

        // 5.3 Persistir timelines no MongoDB
        console.log('   📜 Persistindo timelines...');
        let timelinesPersistidas = 0;
        for (const [processoId, dados] of dadosComplementares.porProcesso) {
            if (dados.timeline && Array.isArray(dados.timeline) && dados.timeline.length > 0) {
                try {
                    await salvarTimelineNoMongoDB({
                        processoId: String(processoId),
                        trtCodigo: params.config.codigo,
                        grau: params.config.grau,
                        timeline: dados.timeline as TimelineItemEnriquecido[],
                        advogadoId: advogadoDb.id,
                    });
                    timelinesPersistidas++;
                } catch (e) {
                    console.warn(`   ⚠️ Erro ao persistir timeline do processo ${processoId}:`, e);
                    captureLogService.logErro('timeline', e instanceof Error ? e.message : String(e), {
                        processoId,
                        trt: params.config.codigo,
                        grau: params.config.grau,
                    });
                }
            }
        }
        console.log(`   ✅ ${timelinesPersistidas} timelines persistidas`);
        resultado.dadosComplementares.timelinesCapturadas = timelinesPersistidas;

        // 5.4 Persistir partes
        console.log('   👥 Persistindo partes...');
        let partesPersistidas = 0;
        for (const [processoId, dados] of dadosComplementares.porProcesso) {
            if (dados.partes && dados.partes.length > 0) {
                try {
                    const idAcervo = mapeamentoIds.get(processoId);

                    // Buscar número do processo de qualquer uma das listas
                    let numeroProcesso: string | undefined;
                    for (const captura of resultado.capturas) {
                        const proc = captura.processos.find(p => (p.idProcesso ?? p.id) === processoId);
                        if (proc?.numeroProcesso) {
                            numeroProcesso = proc.numeroProcesso;
                            break;
                        }
                    }

                    await persistirPartesProcesso(
                        dados.partes,
                        {
                            id_pje: processoId,
                            trt: params.config.codigo,
                            grau: params.config.grau === 'primeiro_grau' ? 'primeiro_grau' : 'segundo_grau',
                            id: idAcervo,
                            numero_processo: numeroProcesso,
                        },
                        {
                            id: parseInt(advogadoInfo.idAdvogado, 10),
                            documento: advogadoInfo.cpf,
                            nome: advogadoInfo.nome,
                        }
                    );
                    partesPersistidas++;
                } catch (e) {
                    console.warn(`   ⚠️ Erro ao persistir partes do processo ${processoId}:`, e);
                    captureLogService.logErro('partes', e instanceof Error ? e.message : String(e), {
                        processoId,
                        trt: params.config.codigo,
                        grau: params.config.grau,
                    });
                }
            }
        }
        console.log(`   ✅ ${partesPersistidas} processos com partes persistidas`);
        resultado.dadosComplementares.partesCapturadas = partesPersistidas;

        // 5.5 Persistir audiências (consolidar todas)
        console.log('   🎤 Persistindo audiências...');
        const todasAudiencias = [
            ...audienciasDesignadas,
            ...audienciasRealizadas,
            ...audienciasCanceladas,
        ];

        if (todasAudiencias.length > 0) {
            try {
                const persistenciaAud = await salvarAudiencias({
                    audiencias: todasAudiencias,
                    advogadoId: advogadoDb.id,
                    trt: params.config.codigo,
                    grau: params.config.grau,
                    atas: {}, // Atas seriam processadas em captura específica
                });

                console.log(`   ✅ Audiências persistidas:`, {
                    inseridos: persistenciaAud.inseridos,
                    atualizados: persistenciaAud.atualizados,
                    naoAtualizados: persistenciaAud.naoAtualizados,
                    erros: persistenciaAud.erros,
                });
                resultado.persistenciaAudiencias = persistenciaAud;
            } catch (error) {
                console.error('❌ [CapturaCombinada] Erro ao salvar audiências:', error);
            }
        }

        // 5.6 Persistir expedientes (consolidar todos)
        console.log('   📋 Persistindo expedientes...');
        const todosExpedientes = [
            ...expedientesNoPrazo,
            ...expedientesSemPrazo,
        ];

        if (todosExpedientes.length > 0) {
            try {
                const persistenciaExp = await salvarPendentes({
                    processos: todosExpedientes as ProcessoPendente[],
                    advogadoId: advogadoDb.id,
                    trt: params.config.codigo,
                    grau: params.config.grau,
                });

                console.log(`   ✅ Expedientes persistidos:`, {
                    inseridos: persistenciaExp.inseridos,
                    atualizados: persistenciaExp.atualizados,
                    naoAtualizados: persistenciaExp.naoAtualizados,
                    erros: persistenciaExp.erros,
                });
                resultado.persistenciaExpedientes = persistenciaExp;
            } catch (error) {
                console.error('❌ [CapturaCombinada] Erro ao salvar expedientes:', error);
            }
        }

        // 5.7 Coletar payloads brutos de partes
        const payloadsBrutosPartes: Array<{
            processoId: number;
            numeroProcesso?: string;
            payloadBruto: Record<string, unknown> | null;
        }> = [];

        for (const [processoId, dados] of dadosComplementares.porProcesso) {
            if (dados.payloadBrutoPartes !== undefined) {
                // Buscar número do processo de qualquer uma das listas
                let numeroProcesso: string | undefined;
                for (const captura of resultado.capturas) {
                    const proc = captura.processos.find(p => (p.idProcesso ?? p.id) === processoId);
                    if (proc?.numeroProcesso) {
                        numeroProcesso = proc.numeroProcesso;
                        break;
                    }
                }

                payloadsBrutosPartes.push({
                    processoId,
                    numeroProcesso,
                    payloadBruto: dados.payloadBrutoPartes,
                });
            }
        }
        console.log(`   📦 Payloads de partes coletados: ${payloadsBrutosPartes.length}`);
        resultado.payloadsBrutosPartes = payloadsBrutosPartes;

        // Logs finais
        captureLogService.imprimirResumo();
        resultado.logs = captureLogService.consumirLogs();

        // ═══════════════════════════════════════════════════════════════
        // RESULTADO FINAL
        // ═══════════════════════════════════════════════════════════════
        resultado.duracaoMs = performance.now() - inicio;

        console.log('🏁 [CapturaCombinada] Captura concluída!');
        console.log(`   📊 Resumo Geral:`);
        console.log(`      Audiências:`);
        console.log(`        - Designadas: ${resultado.resumo.totalAudienciasDesignadas}`);
        console.log(`        - Realizadas: ${resultado.resumo.totalAudienciasRealizadas}`);
        console.log(`        - Canceladas: ${resultado.resumo.totalAudienaciasCanceladas}`);
        console.log(`      Expedientes:`);
        console.log(`        - No Prazo: ${resultado.resumo.totalExpedientesNoPrazo}`);
        console.log(`        - Sem Prazo: ${resultado.resumo.totalExpedientesSemPrazo}`);
        console.log(`      Processos:`);
        console.log(`        - Únicos: ${resultado.resumo.totalProcessosUnicos}`);
        console.log(`        - Pulados: ${resultado.resumo.totalProcessosPulados}`);
        console.log(`      Dados Complementares:`);
        console.log(`        - Timelines: ${resultado.dadosComplementares.timelinesCapturadas}`);
        console.log(`        - Partes: ${resultado.dadosComplementares.partesCapturadas}`);
        console.log(`        - Erros: ${resultado.dadosComplementares.erros}`);
        console.log(`      Duração: ${(resultado.duracaoMs / 1000).toFixed(2)}s`);

        return resultado;
    } finally {
        // ═══════════════════════════════════════════════════════════════
        // FASE 6: FECHAR BROWSER
        // ═══════════════════════════════════════════════════════════════
        if (authResult?.browser) {
            console.log('🚪 [CapturaCombinada] Fechando browser...');
            await authResult.browser.close();
        }
    }
}
