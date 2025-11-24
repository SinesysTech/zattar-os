/**
 * Script para tornar o bucket Backblaze B2 público usando a API B2 Native
 * 
 * Este script usa a API nativa do Backblaze (não S3) para alterar o bucketType
 * para "allPublic", permitindo que qualquer pessoa baixe arquivos sem autenticação.
 * 
 * Uso:
 * tsx dev_data/scripts/make-bucket-public.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Carregar variáveis de ambiente
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

interface B2AuthResponse {
    authorizationToken: string;
    apiUrl: string;
    accountId: string;
}

interface B2Bucket {
    bucketId: string;
    bucketName: string;
    bucketType: string;
    accountId: string;
}

interface B2ListBucketsResponse {
    buckets: B2Bucket[];
}

async function authorizeAccount(): Promise<B2AuthResponse> {
    const keyId = process.env.B2_KEY_ID;
    const applicationKey = process.env.B2_APPLICATION_KEY;

    if (!keyId || !applicationKey) {
        throw new Error('B2_KEY_ID e B2_APPLICATION_KEY são obrigatórios');
    }

    const authString = Buffer.from(`${keyId}:${applicationKey}`).toString('base64');

    const response = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
        method: 'GET',
        headers: {
            Authorization: `Basic ${authString}`,
        },
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Erro ao autorizar: ${error}`);
    }

    return response.json();
}

async function listBuckets(authToken: string, apiUrl: string, accountId: string): Promise<B2Bucket[]> {
    const response = await fetch(`${apiUrl}/b2api/v2/b2_list_buckets`, {
        method: 'POST',
        headers: {
            Authorization: authToken,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountId }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Erro ao listar buckets: ${error}`);
    }

    const data: B2ListBucketsResponse = await response.json();
    return data.buckets;
}

async function updateBucket(
    authToken: string,
    apiUrl: string,
    accountId: string,
    bucketId: string,
    bucketType: string
): Promise<void> {
    const response = await fetch(`${apiUrl}/b2api/v2/b2_update_bucket`, {
        method: 'POST',
        headers: {
            Authorization: authToken,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            accountId,
            bucketId,
            bucketType,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Erro ao atualizar bucket: ${error}`);
    }
}

async function makeBucketPublic() {
    console.log('🔓 Tornando bucket Backblaze B2 público...\n');

    const bucketName = process.env.B2_BUCKET;
    if (!bucketName) {
        console.error('❌ B2_BUCKET não configurado');
        process.exit(1);
    }

    try {
        // 1. Autorizar
        console.log('🔑 Autorizando com Backblaze B2...');
        const auth = await authorizeAccount();
        console.log('✅ Autorização concluída\n');

        // 2. Listar buckets
        console.log('📋 Buscando bucket...');
        const buckets = await listBuckets(auth.authorizationToken, auth.apiUrl, auth.accountId);
        const bucket = buckets.find((b) => b.bucketName === bucketName);

        if (!bucket) {
            console.error(`❌ Bucket "${bucketName}" não encontrado`);
            console.log('   Buckets disponíveis:', buckets.map((b) => b.bucketName).join(', '));
            process.exit(1);
        }

        console.log(`   Bucket encontrado: ${bucket.bucketName}`);
        console.log(`   Tipo atual: ${bucket.bucketType}\n`);

        if (bucket.bucketType === 'allPublic') {
            console.log('✅ Bucket já está público (allPublic)');
            console.log('   Nenhuma alteração necessária\n');
            return;
        }

        // 3. Atualizar bucket para público
        console.log('🔄 Alterando tipo do bucket para "allPublic"...');
        await updateBucket(auth.authorizationToken, auth.apiUrl, auth.accountId, bucket.bucketId, 'allPublic');
        console.log('✅ Bucket atualizado com sucesso!\n');

        console.log('📝 Configuração final:');
        console.log(`   Bucket: ${bucket.bucketName}`);
        console.log('   Tipo: allPublic (acesso público sem autenticação)');
        console.log('   CORS: Configurado (execute configure-backblaze-bucket.ts se ainda não executou)');
        console.log('');
        console.log('✅ Agora os arquivos podem ser acessados publicamente pelo navegador!');

    } catch (error) {
        console.error('❌ Erro:', error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}

// Executar
makeBucketPublic().catch(console.error);
