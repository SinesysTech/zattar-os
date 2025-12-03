/**
 * Script para testar conexão com Backblaze B2
 * 
 * Valida:
 * 1. Variáveis de ambiente configuradas
 * 2. Conexão com o Backblaze B2
 * 3. Upload de arquivo de teste
 * 4. Verificação de URL pública
 * 5. Limpeza (delete do arquivo de teste)
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { uploadToBackblaze, deleteFromBackblaze } from '@/backend/storage/backblaze-b2.service';

async function testarConexao() {
    console.log('\n🧪 Testando conexão com Backblaze B2\n');
    console.log('='.repeat(80));

    let testKey: string | null = null;

    try {
        // 1. Verificar variáveis de ambiente
        console.log('\n📋 1. Verificando variáveis de ambiente...');

        const requiredEnvVars = [
            'B2_ENDPOINT',
            'B2_REGION',
            'B2_BUCKET',
            'B2_KEY_ID',
            'B2_APPLICATION_KEY',
        ];

        const missing: string[] = [];

        for (const envVar of requiredEnvVars) {
            const value = process.env[envVar];
            if (!value) {
                missing.push(envVar);
                console.log(`   ❌ ${envVar}: NÃO CONFIGURADA`);
            } else {
                // Mostrar apenas parte da chave para segurança
                const displayValue = envVar.includes('KEY') || envVar.includes('APPLICATION')
                    ? `${value.substring(0, 8)}...`
                    : value;
                console.log(`   ✅ ${envVar}: ${displayValue}`);
            }
        }

        if (missing.length > 0) {
            throw new Error(`Variáveis de ambiente faltando: ${missing.join(', ')}`);
        }

        console.log('\n✅ Todas as variáveis de ambiente estão configuradas!');

        // 2. Criar arquivo de teste
        console.log('\n📋 2. Criando arquivo de teste...');

        const testContent = `Teste de conexão Backblaze B2
Timestamp: ${new Date().toISOString()}
Bucket: ${process.env.B2_BUCKET}
Region: ${process.env.B2_REGION}
`;

        const testBuffer = Buffer.from(testContent, 'utf-8');
        testKey = `test/connection-test-${Date.now()}.txt`;

        console.log(`   📝 Conteúdo: ${testBuffer.length} bytes`);
        console.log(`   🔑 Key: ${testKey}`);

        // 3. Fazer upload
        console.log('\n📋 3. Fazendo upload para Backblaze B2...');

        const uploadResult = await uploadToBackblaze({
            buffer: testBuffer,
            key: testKey,
            contentType: 'text/plain',
        });

        console.log(`   ✅ Upload bem-sucedido!`);
        console.log(`   🌐 URL: ${uploadResult.url}`);
        console.log(`   🪣 Bucket: ${uploadResult.bucket}`);
        console.log(`   🔑 Key: ${uploadResult.key}`);
        console.log(`   📅 Uploaded at: ${uploadResult.uploadedAt}`);

        // 4. Verificar URL (simular acesso)
        console.log('\n📋 4. Verificando URL pública...');
        console.log(`   🔗 URL gerada: ${uploadResult.url}`);
        console.log(`   ℹ️  Nota: Para validar acesso público, copie a URL e cole no navegador`);

        // 5. Limpar arquivo de teste
        console.log('\n📋 5. Limpando arquivo de teste...');

        await deleteFromBackblaze(testKey);

        console.log(`   ✅ Arquivo de teste deletado!`);

        // Resultado final
        console.log('\n' + '='.repeat(80));
        console.log('🎉 TESTE DE CONEXÃO CONCLUÍDO COM SUCESSO!');
        console.log('='.repeat(80));
        console.log('\n✅ O serviço Backblaze B2 está configurado e funcionando corretamente.');
        console.log('✅ Você pode executar o script de captura de documentos.\n');

    } catch (error) {
        console.error('\n' + '='.repeat(80));
        console.error('❌ ERRO NO TESTE DE CONEXÃO');
        console.error('='.repeat(80));

        if (error instanceof Error) {
            console.error(`\n❌ Mensagem: ${error.message}`);
            console.error(`\n📚 Stack trace:`);
            console.error(error.stack);
        } else {
            console.error(`\n❌ Erro desconhecido:`, error);
        }

        // Tentar limpar arquivo de teste mesmo em caso de erro
        if (testKey) {
            try {
                console.log(`\n🧹 Tentando limpar arquivo de teste...`);
                await deleteFromBackblaze(testKey);
                console.log(`   ✅ Arquivo de teste deletado`);
            } catch {
                console.log(`   ⚠️  Não foi possível deletar o arquivo de teste (${testKey})`);
            }
        }

        console.error('\n❌ Verifique as configurações e tente novamente.\n');
        process.exit(1);
    }
}

// Executar teste
testarConexao();
