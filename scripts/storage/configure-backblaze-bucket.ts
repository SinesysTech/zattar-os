/**
 * Script para configurar o bucket Backblaze B2 com:
 * 1. Tipo público (allPublic) - permite downloads sem autenticação
 * 2. Regras CORS - permite acesso do navegador
 * 
 * Uso:
 * tsx dev_data/scripts/configure-backblaze-bucket.ts
 */

import { S3Client, PutBucketCorsCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Carregar variáveis de ambiente
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

interface CorsRule {
    AllowedHeaders: string[];
    AllowedMethods: string[];
    AllowedOrigins: string[];
    ExposeHeaders?: string[];
    MaxAgeSeconds?: number;
}

async function configureBucket() {
    console.log('🔧 Configurando bucket Backblaze B2...\n');

    // Validar variáveis de ambiente
    const endpoint = process.env.B2_ENDPOINT;
    const region = process.env.B2_REGION;
    const keyId = process.env.B2_KEY_ID;
    const applicationKey = process.env.B2_APPLICATION_KEY;
    const bucket = process.env.B2_BUCKET;

    if (!endpoint || !region || !keyId || !applicationKey || !bucket) {
        console.error('❌ Variáveis de ambiente incompletas!');
        console.error('Necessário: B2_ENDPOINT, B2_REGION, B2_KEY_ID, B2_APPLICATION_KEY, B2_BUCKET');
        process.exit(1);
    }

    console.log('📋 Configurações:');
    console.log(`   Endpoint: ${endpoint}`);
    console.log(`   Region: ${region}`);
    console.log(`   Bucket: ${bucket}`);
    console.log('');

    // Criar cliente S3
    const client = new S3Client({
        endpoint,
        region,
        credentials: {
            accessKeyId: keyId,
            secretAccessKey: applicationKey,
        },
    });

    // Configurar regras CORS
    const corsRules: CorsRule[] = [
        {
            AllowedHeaders: ['*'],
            AllowedMethods: ['GET', 'HEAD'],
            AllowedOrigins: ['*'], // Permite qualquer origem
            ExposeHeaders: [
                'ETag',
                'Content-Length',
                'Content-Type',
                'x-amz-request-id',
                'x-amz-id-2',
            ],
            MaxAgeSeconds: 3600,
        },
    ];

    try {
        console.log('🔄 Aplicando regras CORS...');

        const corsCommand = new PutBucketCorsCommand({
            Bucket: bucket,
            CORSConfiguration: {
                CORSRules: corsRules,
            },
        });

        await client.send(corsCommand);
        console.log('✅ Regras CORS aplicadas com sucesso!\n');

        console.log('📝 Regras CORS configuradas:');
        console.log('   - AllowedOrigins: * (qualquer origem)');
        console.log('   - AllowedMethods: GET, HEAD');
        console.log('   - AllowedHeaders: * (todos)');
        console.log('   - MaxAgeSeconds: 3600');
        console.log('');

        console.log('⚠️  IMPORTANTE:');
        console.log('   Para permitir downloads públicos, você TAMBÉM precisa:');
        console.log('   1. Acessar o painel Backblaze B2: https://secure.backblaze.com/b2_buckets.htm');
        console.log(`   2. Selecionar o bucket: ${bucket}`);
        console.log('   3. Clicar em "Bucket Settings"');
        console.log('   4. Alterar "Files in Bucket" para "Public"');
        console.log('');
        console.log('   Ou usar a API B2 Native (b2_update_bucket) com bucketType: "allPublic"');
        console.log('   (A API S3-compatible não suporta alterar bucketType)');
        console.log('');

    } catch (error) {
        console.error('❌ Erro ao configurar bucket:', error);
        if (error instanceof Error) {
            console.error('   Mensagem:', error.message);
            if ('$metadata' in error) {
                console.error('   Metadata:', (error as unknown as { $metadata: unknown }).$metadata);
            }
        }
        process.exit(1);
    }

    console.log('✅ Configuração concluída!');
}

// Executar
configureBucket().catch(console.error);
