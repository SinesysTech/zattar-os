/* eslint-disable no-restricted-imports */
/**
 * Script de teste para Captura de Perícias
 *
 * Testa a funcionalidade de captura de perícias que busca:
 * - Todas as situações (S, L, C, F, P, R)
 * - Apenas primeiro grau
 * - Paginação automática
 *
 * Valida:
 * - Autenticação no PJE
 * - Captura de perícias
 * - Persistência no banco de dados
 */

import { autenticarPJE } from '../../../src/features/captura/services/trt/trt-auth.service';
import { obterPericias } from '../../../src/features/captura/pje-trt';
import { salvarPericias } from '../../../src/features/captura/services/persistence/pericias-persistence.service';
import { buscarOuCriarAdvogadoPorCpf } from '../../../src/features/captura/services/advogado-helper.service';
import { getTribunalConfig } from '../../../src/features/captura/services/trt/config';

async function testarCapturaPericias() {
    console.log('🚀 Iniciando teste de Captura de Perícias...\n');

    const trt = 'TRT3';
    const grau = 'primeiro_grau';

    // Validar grau
    if (grau !== 'primeiro_grau') {
        console.error('❌ Captura de perícias disponível apenas para primeiro grau');
        process.exit(1);
    }

    const config = getTribunalConfig(trt, grau);
    let authResult;

    try {
        // Fase 1: Autenticação
        console.log('🔐 Fase 1: Autenticando no PJE...');
        authResult = await autenticarPJE({
            credential: {
                usuario: process.env.TRT_USUARIO || '',
                senha: process.env.TRT_SENHA || '',
                certificado: process.env.TRT_CERTIFICADO || '',
                senhaCertificado: process.env.TRT_SENHA_CERTIFICADO || '',
            },
            config,
            twofauthConfig: {
                baseUrl: process.env.TWOFAUTH_URL || 'http://localhost:8000',
                accountId: process.env.TWOFAUTH_ACCOUNT_ID || '',
            },
            headless: true,
        });

        const { page, advogadoInfo } = authResult;
        console.log(`✅ Autenticado como: ${advogadoInfo.nome}\n`);

        // Fase 2: Captura de Perícias
        console.log('🔬 Fase 2: Capturando perícias...');
        const inicio = performance.now();
        const pericias = await obterPericias(page, 500);
        const duracaoCaptura = performance.now() - inicio;

        console.log(`✅ ${pericias.length} perícias capturadas em ${(duracaoCaptura / 1000).toFixed(2)}s\n`);

        if (pericias.length === 0) {
            console.log('ℹ️ Nenhuma perícia encontrada. Teste concluído.');
            return;
        }

        // Estatísticas
        const porSituacao = pericias.reduce((acc, p) => {
            const codigo = p.situacao.codigo;
            acc[codigo] = (acc[codigo] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        console.log('📊 Perícias por situação:');
        Object.entries(porSituacao).forEach(([codigo, total]) => {
            const descricao = pericias.find(p => p.situacao.codigo === codigo)?.situacao.descricao || codigo;
            console.log(`   ${codigo} (${descricao}): ${total}`);
        });
        console.log('');

        // Fase 3: Persistência
        console.log('💾 Fase 3: Persistindo perícias...');
        const advogadoDb = await buscarOuCriarAdvogadoPorCpf(
            advogadoInfo.cpf,
            advogadoInfo.nome
        );

        const inicioPersistencia = performance.now();
        const resultado = await salvarPericias({
            pericias,
            advogadoId: advogadoDb.id,
            trt,
            grau,
        });
        const duracaoPersistencia = performance.now() - inicioPersistencia;

        console.log(`✅ Persistência concluída em ${(duracaoPersistencia / 1000).toFixed(2)}s\n`);

        // Resumo Final
        console.log('═'.repeat(80));
        console.log('📊 RESUMO FINAL:');
        console.log('═'.repeat(80));
        console.log(`\n🔬 PERÍCIAS:`);
        console.log(`   Total capturadas:        ${pericias.length}`);
        console.log(`   Inseridas:               ${resultado.inseridos}`);
        console.log(`   Atualizadas:             ${resultado.atualizados}`);
        console.log(`   Não atualizadas:         ${resultado.naoAtualizados}`);
        console.log(`   Erros:                   ${resultado.erros}`);
        console.log(`\n📚 ENTIDADES AUXILIARES:`);
        console.log(`   Especialidades criadas:  ${resultado.especialidadesCriadas}`);
        console.log(`   Peritos criados:         ${resultado.peritosCriados}`);
        console.log(`\n⏱️  PERFORMANCE:`);
        console.log(`   Captura:                 ${(duracaoCaptura / 1000).toFixed(2)}s`);
        console.log(`   Persistência:            ${(duracaoPersistencia / 1000).toFixed(2)}s`);
        console.log(`   Total:                   ${((duracaoCaptura + duracaoPersistencia) / 1000).toFixed(2)}s`);
        console.log('═'.repeat(80));

    } catch (error) {
        console.error('\n❌ Erro na captura de perícias:', error);
        process.exit(1);
    } finally {
        if (authResult?.browser) {
            console.log('\n🚪 Fechando browser...');
            await authResult.browser.close();
        }
    }
}

// Executa o teste
testarCapturaPericias()
    .then(() => {
        console.log('\n✅ Teste concluído!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Erro fatal:', error);
        process.exit(1);
    });

