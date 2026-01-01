/* eslint-disable no-restricted-imports */
/**
 * Script de teste para Captura Combinada
 *
 * Testa a funcionalidade de captura combinada que executa:
 * - 3 tipos de audiências (Designadas, Realizadas, Canceladas)
 * - 2 tipos de expedientes (No Prazo, Sem Prazo)
 * - Timeline + Partes de todos os processos únicos
 *
 * Tudo em uma única sessão autenticada!
 */

import { capturaCombinada } from '../../src/features/captura/services/trt/captura-combinada.service';
import type { CapturaCombinAdaParams } from '../../src/features/captura/services/trt/trt-capture.service';
import { getTribunalConfig } from '../../src/features/captura/services/trt/config';

async function testarCapturaCombinada() {
    console.log('🚀 Iniciando teste de Captura Combinada...\n');

    // Configuração do teste
    const params: CapturaCombinAdaParams = {
        credential: {
            usuario: process.env.TRT_USUARIO || '',
            senha: process.env.TRT_SENHA || '',
            certificado: process.env.TRT_CERTIFICADO || '',
            senhaCertificado: process.env.TRT_SENHA_CERTIFICADO || '',
        },
        config: getTribunalConfig('TRT3', 'primeiro_grau'),
        twofauthConfig: {
            baseUrl: process.env.TWOFAUTH_URL || 'http://localhost:8000',
            accountId: process.env.TWOFAUTH_ACCOUNT_ID || '',
        },
    };

    try {
        const resultado = await capturaCombinada(params);

        console.log('\n✅ Captura Combinada concluída com sucesso!\n');
        console.log('📊 RESUMO GERAL:');
        console.log('═'.repeat(80));
        console.log('\n🎤 AUDIÊNCIAS:');
        console.log(`   Designadas:  ${resultado.resumo.totalAudienciasDesignadas.toString().padStart(5)}`);
        console.log(`   Realizadas:  ${resultado.resumo.totalAudienciasRealizadas.toString().padStart(5)}`);
        console.log(`   Canceladas:  ${resultado.resumo.totalAudienaciasCanceladas.toString().padStart(5)}`);

        console.log('\n📋 EXPEDIENTES:');
        console.log(`   No Prazo:    ${resultado.resumo.totalExpedientesNoPrazo.toString().padStart(5)}`);
        console.log(`   Sem Prazo:   ${resultado.resumo.totalExpedientesSemPrazo.toString().padStart(5)}`);

        console.log('\n🔬 PERÍCIAS:');
        console.log(`   Total:       ${resultado.resumo.totalPericias.toString().padStart(5)}`);

        console.log('\n📦 PROCESSOS:');
        console.log(`   Únicos:      ${resultado.resumo.totalProcessosUnicos.toString().padStart(5)}`);
        console.log(`   Pulados:     ${resultado.resumo.totalProcessosPulados.toString().padStart(5)} (atualizados recentemente)`);

        console.log('\n🔄 DADOS COMPLEMENTARES:');
        console.log(`   Timelines:   ${resultado.dadosComplementares.timelinesCapturadas.toString().padStart(5)}`);
        console.log(`   Partes:      ${resultado.dadosComplementares.partesCapturadas.toString().padStart(5)}`);
        console.log(`   Erros:       ${resultado.dadosComplementares.erros.toString().padStart(5)}`);

        console.log('\n💾 PERSISTÊNCIA:');
        if (resultado.persistenciaAudiencias) {
            console.log(`   Audiências:  ${resultado.persistenciaAudiencias.inseridos} inseridas, ${resultado.persistenciaAudiencias.atualizados} atualizadas`);
        }
        if (resultado.persistenciaExpedientes) {
            console.log(`   Expedientes: ${resultado.persistenciaExpedientes.inseridos} inseridos, ${resultado.persistenciaExpedientes.atualizados} atualizados`);
        }
        if (resultado.persistenciaPericias) {
            console.log(`   Perícias:    ${resultado.persistenciaPericias.inseridos} inseridas, ${resultado.persistenciaPericias.atualizados} atualizadas`);
        }

        console.log('\n⏱️  PERFORMANCE:');
        console.log(`   Duração:     ${(resultado.duracaoMs / 1000).toFixed(2)}s`);
        console.log(`   Média/proc:  ${(resultado.duracaoMs / (resultado.resumo.totalProcessosUnicos || 1) / 1000).toFixed(2)}s`);

        console.log('\n═'.repeat(80));
        console.log('\n💡 BENEFÍCIO: Economizou tempo ao reutilizar a mesma sessão autenticada!');
        console.log(`   (vs. 5 autenticações separadas = ~${(5 * 30).toFixed(0)}s de autenticação evitados)\n`);

    } catch (error) {
        console.error('\n❌ Erro na Captura Combinada:', error);
        process.exit(1);
    }
}

// Executa o teste
testarCapturaCombinada()
    .then(() => {
        console.log('\n✅ Teste concluído!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Erro fatal:', error);
        process.exit(1);
    });
