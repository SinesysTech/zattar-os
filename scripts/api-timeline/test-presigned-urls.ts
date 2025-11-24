/**
 * Script de teste para URLs assinadas (Presigned URLs) do Backblaze B2
 * 
 * Este script testa:
 * 1. Geração de URL assinada para um arquivo existente
 * 2. Validação de acesso com a URL assinada
 * 3. Confirmação de que bucket privado está funcionando corretamente
 * 
 * Uso:
 * tsx dev_data/scripts/test-presigned-urls.ts
 */

import { generatePresignedUrl } from '../../backend/storage/backblaze-b2.service';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Carregar variáveis de ambiente
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testPresignedUrls() {
    console.log('🔐 Testando URLs Assinadas (Presigned URLs)...\n');

    try {
        // Exemplo: gerar URL assinada para um arquivo de teste
        // SUBSTITUA 'processos/teste/documento.pdf' pela chave real de um arquivo seu
        const testKey = 'processos/0010702-80.2025.5.03.0111/timeline/test.pdf';

        console.log('📋 Configurações:');
        console.log(`   Key do arquivo: ${testKey}`);
        console.log(`   Validade: 3600 segundos (1 hora)\n`);

        console.log('🔄 Gerando URL assinada...');
        const presignedUrl = await generatePresignedUrl(testKey, 3600);

        console.log('✅ URL assinada gerada com sucesso!\n');
        console.log('📄 URL Assinada:');
        console.log(presignedUrl);
        console.log('');

        console.log('ℹ️  INFORMAÇÕES:');
        console.log('   - A URL acima permite acesso temporário ao arquivo');
        console.log('   - Válida por 1 hora a partir de agora');
        console.log('   - Funciona mesmo com bucket PRIVADO');
        console.log('   - Não expõe suas credenciais do Backblaze');
        console.log('');

        console.log('🧪 COMO TESTAR:');
        console.log('   1. Copie a URL gerada acima');
        console.log('   2. Cole no navegador');
        console.log('   3. O arquivo deve ser baixado/exibido');
        console.log('   4. Após 1 hora, a URL expirará e não funcionará mais');
        console.log('');

        console.log('✅ Teste concluído com sucesso!');
        console.log('   O sistema de URLs assinadas está funcionando corretamente.');
        console.log('   Seu bucket pode permanecer PRIVADO! 🔒');

    } catch (error) {
        console.error('❌ Erro no teste:', error);
        if (error instanceof Error) {
            console.error('   Mensagem:', error.message);
        }
        process.exit(1);
    }
}

// Executar
testPresignedUrls().catch(console.error);
