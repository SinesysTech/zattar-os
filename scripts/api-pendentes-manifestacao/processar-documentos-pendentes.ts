/**
 * Script para processar documentos de TODOS os pendentes de manifestação
 * 
 * Este script:
 * 1. Busca todos os pendentes sem documento (arquivo_nome IS NULL)
 * 2. Para cada pendente, captura o documento PDF do PJE
 * 3. Faz upload para o Backblaze B2
 * 4. Atualiza o banco de dados com as informações do arquivo
 * 
 * Uso:
 * npm run tsx dev_data/scripts/processar-documentos-pendentes.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import { getCredentialComplete } from '@/backend/captura/credentials/credential.service';
import { autenticarPJE } from '@/backend/captura/services/trt/trt-auth.service';
import { getTribunalConfig } from '@/backend/captura/services/trt/config';
import { downloadAndUploadDocumento } from '@/backend/captura/services/pje/pje-expediente-documento.service';
import type { FetchDocumentoParams } from '@/backend/types/pje-trt/documento-types';
import type { CodigoTRT, GrauTRT } from '@/backend/types/captura/trt-types';
import type { Browser, Page } from 'playwright';

// Configuração
const DELAY_ENTRE_DOCUMENTOS = 1000; // 1 segundo entre documentos
const DELAY_ENTRE_TRIBUNAIS = 2000; // 2 segundos entre mudança de tribunal
const LIMITE_ERROS_CONSECUTIVOS = 3; // Parar se houver 3 erros consecutivos no mesmo tribunal

interface PendenteProcessar {
    id: number;
    id_pje: number;
    numero_processo: string;
    id_documento: number;
    trt: string;
    grau: string;
    credencial_id?: number;
}

interface EstatisticasGlobais {
    totalPendentes: number;
    sucessos: number;
    falhas: number;
    semDocumento: number;
    semCredencial: number;
    porTribunal: Map<string, {
        total: number;
        sucessos: number;
        falhas: number;
    }>;
}

/**
 * Buscar todos os pendentes sem documento
 */
async function buscarPendentesSemDocumento(): Promise<PendenteProcessar[]> {
    const supabase = createServiceClient();

    console.log('\n📋 Buscando pendentes sem documento...');

    const { data, error } = await supabase
        .from('pendentes_manifestacao')
        .select('id, id_pje, numero_processo, id_documento, trt, grau')
        .is('arquivo_nome', null)
        .not('id_documento', 'is', null)
        .order('trt')
        .order('grau')
        .order('id');

    if (error) {
        throw new Error(`Erro ao buscar pendentes: ${error.message}`);
    }

    console.log(`✅ Encontrados ${data?.length || 0} pendentes sem documento`);

    return (data || []) as PendenteProcessar[];
}

/**
 * Buscar credencial para um tribunal/grau
 */
async function buscarCredencial(trt: string, grau: string): Promise<number | null> {
    const supabase = createServiceClient();

    const { data, error } = await supabase
        .from('credenciais')
        .select('id')
        .eq('tribunal', trt)
        .eq('grau', grau)
        .eq('active', true)
        .limit(1)
        .single();

    if (error || !data) {
        return null;
    }

    return data.id;
}

/**
 * Processar documentos de pendentes
 */
async function processarDocumentos() {
    const inicio = Date.now();

    const estatisticas: EstatisticasGlobais = {
        totalPendentes: 0,
        sucessos: 0,
        falhas: 0,
        semDocumento: 0,
        semCredencial: 0,
        porTribunal: new Map(),
    };

    try {
        // 1. Buscar todos os pendentes sem documento
        const pendentes = await buscarPendentesSemDocumento();
        estatisticas.totalPendentes = pendentes.length;

        if (pendentes.length === 0) {
            console.log('\n✅ Nenhum pendente sem documento encontrado!');
            return;
        }

        // 2. Agrupar por TRT + Grau
        const grupos = new Map<string, PendenteProcessar[]>();

        for (const pendente of pendentes) {
            const chave = `${pendente.trt}_${pendente.grau}`;
            if (!grupos.has(chave)) {
                grupos.set(chave, []);
            }
            grupos.get(chave)!.push(pendente);
        }

        console.log(`\n📊 Agrupados em ${grupos.size} tribunais/graus diferentes`);

        // 3. Processar cada grupo (cada grupo = um tribunal + grau)
        let grupoAtual = 0;

        for (const [chave, pendentesDesteGrupo] of grupos.entries()) {
            grupoAtual++;

            // O grau já vem completo do banco (primeiro_grau ou segundo_grau)
            const primeiroGrupo = pendentesDesteGrupo[0];
            const trt = primeiroGrupo.trt;
            const grau = primeiroGrupo.grau as GrauTRT;

            console.log(`\n${'='.repeat(80)}`);
            console.log(`📍 Processando ${trt} ${grau} (${grupoAtual}/${grupos.size})`);
            console.log(`   Total de pendentes: ${pendentesDesteGrupo.length} `);
            console.log(`${'='.repeat(80)} `);

            // Inicializar estatísticas do tribunal
            if (!estatisticas.porTribunal.has(chave)) {
                estatisticas.porTribunal.set(chave, {
                    total: pendentesDesteGrupo.length,
                    sucessos: 0,
                    falhas: 0,
                });
            }

            // 3.1. Buscar credencial
            const credencialId = await buscarCredencial(trt, grau);

            if (!credencialId) {
                console.log(`⚠️ Credencial não encontrada para ${trt} ${grau}`);
                console.log(`   Pulando ${pendentesDesteGrupo.length} pendentes...`);
                estatisticas.semCredencial += pendentesDesteGrupo.length;
                continue;
            }

            console.log(`✅ Credencial encontrada: ID ${credencialId} `);

            // 3.2. Obter configuração do tribunal
            const credencialCompleta = await getCredentialComplete(credencialId);

            if (!credencialCompleta) {
                console.log(`❌ Erro ao obter credencial completa`);
                continue;
            }

            const config = await getTribunalConfig(credencialCompleta.tribunal, credencialCompleta.grau);

            if (!config) {
                console.log(`❌ Configuração não encontrada para ${trt} ${grau} `);
                continue;
            }

            // 3.3. Autenticar no PJE (uma vez por tribunal/grau)
            let browser: Browser | null = null;
            let page: Page | null = null;

            try {
                console.log(`\n🔐 Autenticando no ${trt} ${grau}...`);

                const authResult = await autenticarPJE({
                    credential: credencialCompleta.credenciais,
                    config,
                    headless: true,
                });

                browser = authResult.browser;
                page = authResult.page;

                console.log(`✅ Autenticação concluída!`);

                // 3.4. Processar cada pendente deste grupo
                let errosConsecutivos = 0;
                let processados = 0;

                for (const pendente of pendentesDesteGrupo) {
                    processados++;

                    console.log(`\n[${processados}/${pendentesDesteGrupo.length}] 📄 Processando pendente ID ${pendente.id} `);
                    console.log(`      Processo: ${pendente.numero_processo} `);
                    console.log(`      Documento ID: ${pendente.id_documento} `);

                    try {
                        // Preparar parâmetros
                        const params: FetchDocumentoParams = {
                            processoId: String(pendente.id_pje),
                            documentoId: String(pendente.id_documento),
                            pendenteId: pendente.id,
                            numeroProcesso: pendente.numero_processo,
                            trt: pendente.trt,
                            grau: pendente.grau,
                        };

                        // Capturar documento
                        const resultado = await downloadAndUploadDocumento(page, params);

                        if (resultado.success) {
                            console.log(`      ✅ Sucesso! Arquivo: ${resultado.arquivoInfo?.arquivo_nome} `);
                            estatisticas.sucessos++;
                            estatisticas.porTribunal.get(chave)!.sucessos++;
                            errosConsecutivos = 0; // Resetar contador de erros
                        } else {
                            console.log(`      ❌ Falha: ${resultado.error} `);
                            estatisticas.falhas++;
                            estatisticas.porTribunal.get(chave)!.falhas++;
                            errosConsecutivos++;
                        }

                    } catch (error) {
                        const erroMsg = error instanceof Error ? error.message : String(error);
                        console.log(`      ❌ Erro ao processar: ${erroMsg} `);
                        estatisticas.falhas++;
                        estatisticas.porTribunal.get(chave)!.falhas++;
                        errosConsecutivos++;
                    }

                    // Verificar se atingiu limite de erros consecutivos
                    if (errosConsecutivos >= LIMITE_ERROS_CONSECUTIVOS) {
                        console.log(`\n⚠️ Limite de ${LIMITE_ERROS_CONSECUTIVOS} erros consecutivos atingido!`);
                        console.log(`   Pulando os ${pendentesDesteGrupo.length - processados} pendentes restantes deste tribunal...`);
                        break;
                    }

                    // Delay entre documentos
                    if (processados < pendentesDesteGrupo.length) {
                        await new Promise(resolve => setTimeout(resolve, DELAY_ENTRE_DOCUMENTOS));
                    }
                }

            } catch (error) {
                const erroMsg = error instanceof Error ? error.message : String(error);
                console.log(`❌ Erro ao autenticar / processar ${trt} ${grau}: ${erroMsg} `);
            } finally {
                // Limpar recursos
                if (browser) {
                    await browser.close();
                    console.log(`\n🧹 Navegador fechado para ${trt} ${grau} `);
                }
            }

            // Delay entre tribunais
            if (grupoAtual < grupos.size) {
                console.log(`\n⏳ Aguardando ${DELAY_ENTRE_TRIBUNAIS}ms antes do próximo tribunal...`);
                await new Promise(resolve => setTimeout(resolve, DELAY_ENTRE_TRIBUNAIS));
            }
        }

    } finally {
        // 4. Exibir estatísticas finais
        const duracao = ((Date.now() - inicio) / 1000).toFixed(2);

        console.log(`\n${'='.repeat(80)} `);
        console.log(`📊 ESTATÍSTICAS FINAIS`);
        console.log(`${'='.repeat(80)} `);
        console.log(`⏱️  Duração total: ${duracao} s`);
        console.log(`📋 Total de pendentes: ${estatisticas.totalPendentes} `);
        console.log(`✅ Sucessos: ${estatisticas.sucessos} `);
        console.log(`❌ Falhas: ${estatisticas.falhas} `);
        console.log(`⚠️ Sem credencial: ${estatisticas.semCredencial} `);
        console.log(`📈 Taxa de sucesso: ${estatisticas.totalPendentes > 0 ? ((estatisticas.sucessos / (estatisticas.totalPendentes - estatisticas.semCredencial)) * 100).toFixed(2) : 0}% `);

        if (estatisticas.porTribunal.size > 0) {
            console.log(`\n📊 Por Tribunal / Grau: `);
            for (const [chave, stats] of estatisticas.porTribunal.entries()) {
                const [trt, grau] = chave.split('_');
                console.log(`   ${trt} ${grau}: `);
                console.log(`      Total: ${stats.total} `);
                console.log(`      ✅ Sucessos: ${stats.sucessos} `);
                console.log(`      ❌ Falhas: ${stats.falhas} `);
                console.log(`      📈 Taxa: ${stats.total > 0 ? ((stats.sucessos / stats.total) * 100).toFixed(2) : 0}% `);
            }
        }

        console.log(`\n${'='.repeat(80)} `);
    }
}

/**
 * Main
 */
async function main() {
    console.log('\n🚀 Iniciando processamento de documentos de pendentes');
    console.log(`Delay entre documentos: ${DELAY_ENTRE_DOCUMENTOS} ms`);
    console.log(`Delay entre tribunais: ${DELAY_ENTRE_TRIBUNAIS} ms`);
    console.log(`Limite de erros consecutivos: ${LIMITE_ERROS_CONSECUTIVOS} `);

    try {
        await processarDocumentos();
        console.log('\n✅ Processamento concluído!');
    } catch (error) {
        console.error('\n❌ Erro fatal no processamento:', error);
        process.exit(1);
    }
}

main();
