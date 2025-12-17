/**
 * Script de Vetorização Retroativa
 *
 * Indexa documentos existentes no banco de dados para a base vetorial RAG.
 * Executar com: npm run ai:index-existing
 *
 * Opções:
 *   --dry-run       Apenas lista documentos sem indexar
 *   --limit=N       Limita a N documentos
 *   --entity=TYPE   Filtra por tipo de entidade
 */

// Carregar variáveis de ambiente
import { config } from 'dotenv';
import { resolve } from 'path';

// Carregar .env.local se existir
config({ path: resolve(process.cwd(), '.env.local') });
// Carregar .env como fallback
config({ path: resolve(process.cwd(), '.env') });

import { createClient } from '@supabase/supabase-js';
import { indexDocument } from '../../src/features/ai/services/indexing.service';
import { isContentTypeSupported } from '../../src/features/ai/services/extraction.service';
import { extractKeyFromUrl, getMimeType } from '../../src/features/ai/services/storage-adapter.service';

// Configuração do cliente Supabase (service role para acesso total)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Tenta SUPABASE_SERVICE_ROLE_KEY primeiro, depois SUPABASE_SECRET_KEY (compatibilidade)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e (SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_SECRET_KEY) são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface DocumentToIndex {
  id: number;
  entity_type: 'documento' | 'processo_peca' | 'contrato' | 'expediente';
  parent_id: number | null;
  storage_key: string;
  content_type: string;
  metadata: Record<string, unknown>;
}

async function getDocumentsToIndex(limit?: number): Promise<DocumentToIndex[]> {
  const documents: DocumentToIndex[] = [];

  // 1. Documentos da feature documentos (uploads)
  console.log('📂 Buscando uploads de documentos...');
  const { data: uploads, error: uploadsError } = await supabase
    .from('documentos_uploads')
    .select('id, documento_id, b2_url, b2_key, tipo_mime, nome_arquivo')
    .or('b2_key.not.is.null,b2_url.not.is.null')
    .limit(limit ?? 1000);

  if (uploadsError) {
    console.error('Erro ao buscar uploads:', uploadsError);
  } else if (uploads) {
    console.log(`   Encontrados ${uploads.length} uploads`);
    for (const u of uploads) {
      const contentType = u.tipo_mime || getMimeType(null);
      if (isContentTypeSupported(contentType)) {
        documents.push({
          id: u.id,
          entity_type: 'documento',
          parent_id: u.documento_id,
          storage_key: u.b2_key || extractKeyFromUrl(u.b2_url),
          content_type: contentType,
          metadata: { nome_arquivo: u.nome_arquivo },
        });
      }
    }
  }

  // 2. Contratos (se existir tabela)
  console.log('📂 Buscando contratos...');
  const { data: contratos, error: contratosError } = await supabase
    .from('contratos')
    .select('id, arquivo_url, tipo_arquivo')
    .not('arquivo_url', 'is', null)
    .limit(limit ?? 1000);

  if (contratosError) {
    // Tabela pode não existir
    console.log('   Tabela de contratos não encontrada ou erro:', contratosError.message);
  } else if (contratos) {
    console.log(`   Encontrados ${contratos.length} contratos`);
    for (const c of contratos) {
      const contentType = c.tipo_arquivo || 'application/pdf';
      if (isContentTypeSupported(contentType)) {
        documents.push({
          id: c.id,
          entity_type: 'contrato',
          parent_id: null,
          storage_key: extractKeyFromUrl(c.arquivo_url),
          content_type: contentType,
          metadata: {},
        });
      }
    }
  }

  // 3. Expedientes - buscar diretamente pelos campos de arquivo
  console.log('📂 Buscando expedientes com arquivos...');
  const { data: expedientes, error: expedientesError } = await supabase
    .from('expedientes')
    .select('id, arquivo_key, arquivo_url, arquivo_nome')
    .or('arquivo_key.not.is.null,arquivo_url.not.is.null')
    .limit(limit ?? 1000);

  if (expedientesError) {
    console.log('   Erro ao buscar expedientes:', expedientesError.message);
  } else if (expedientes) {
    console.log(`   Encontrados ${expedientes.length} expedientes com arquivos`);
    for (const exp of expedientes) {
      const storageKey = exp.arquivo_key || extractKeyFromUrl(exp.arquivo_url);
      if (storageKey) {
        // Extrair extensão do nome do arquivo
        const fileName = exp.arquivo_nome || '';
        const extension = fileName.split('.').pop()?.toLowerCase() || '';
        
        // Mapear extensão para MIME type
        const mimeMap: Record<string, string> = {
          pdf: 'application/pdf',
          doc: 'application/msword',
          docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          txt: 'text/plain',
          html: 'text/html',
          htm: 'text/html',
        };
        
        // Usar extensão ou fallback para PDF
        const contentType = mimeMap[extension] || 'application/pdf';
        
        documents.push({
          id: exp.id,
          entity_type: 'expediente',
          parent_id: null,
          storage_key: storageKey,
          content_type: contentType,
          metadata: { nome_arquivo: exp.arquivo_nome },
        });
      }
    }
  }

  return documents;
}

async function checkIfAlreadyIndexed(entity_type: string, entity_id: number): Promise<boolean> {
  const { count, error } = await supabase
    .from('embeddings')
    .select('*', { count: 'exact', head: true })
    .eq('entity_type', entity_type)
    .eq('entity_id', entity_id);

  if (error) {
    console.error('Erro ao verificar indexação:', error);
    return false;
  }

  return (count ?? 0) > 0;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limitArg = args.find(a => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : undefined;

  console.log('🚀 Iniciando vetorização retroativa...');
  if (dryRun) {
    console.log('🔍 Modo dry-run: apenas listando documentos');
  }

  const documents = await getDocumentsToIndex(limit);
  console.log(`\n📊 Total de documentos elegíveis: ${documents.length}`);

  if (dryRun) {
    console.log('\nDocumentos que seriam indexados:');
    for (const doc of documents.slice(0, 20)) {
      console.log(`  - ${doc.entity_type}/${doc.id} (${doc.content_type})`);
    }
    if (documents.length > 20) {
      console.log(`  ... e mais ${documents.length - 20} documentos`);
    }
    return;
  }

  let indexed = 0;
  let skipped = 0;
  let failed = 0;

  // Processar em paralelo com limite de concorrência (otimizado para batching)
  const CONCURRENCY_LIMIT = 3; // Processar 3 documentos em paralelo
  // Cada documento já faz batch interno de chunks, então não precisa de delay

  for (let i = 0; i < documents.length; i += CONCURRENCY_LIMIT) {
    const batch = documents.slice(i, i + CONCURRENCY_LIMIT);
    const batchResults = await Promise.allSettled(
      batch.map(async (doc) => {
        const progress = `[${documents.indexOf(doc) + 1}/${documents.length}]`;

        try {
          // Verificar se já foi indexado
          const alreadyIndexed = await checkIfAlreadyIndexed(doc.entity_type, doc.id);
          if (alreadyIndexed) {
            console.log(`${progress} ⏭️ Já indexado: ${doc.entity_type}/${doc.id}`);
            return { status: 'skipped', doc };
          }

      console.log(`${progress} 🔄 Indexando: ${doc.entity_type}/${doc.id}`);

      // Passar cliente Supabase para evitar erro de cookies
      await indexDocument(
        {
          entity_type: doc.entity_type,
          entity_id: doc.id,
          parent_id: doc.parent_id,
          storage_provider: 'backblaze',
          storage_key: doc.storage_key,
          content_type: doc.content_type,
          metadata: doc.metadata,
        },
        supabase // Cliente Supabase com service role
      );

          console.log(`${progress} ✅ Sucesso: ${doc.entity_type}/${doc.id}`);
          return { status: 'success', doc };
        } catch (error) {
          console.error(`${progress} ❌ Falha: ${doc.entity_type}/${doc.id}`, error instanceof Error ? error.message : error);
          return { status: 'failed', doc, error };
        }
      })
    );

    // Contar resultados do batch
    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        if (result.value.status === 'success') indexed++;
        else if (result.value.status === 'skipped') skipped++;
        else if (result.value.status === 'failed') failed++;
      } else {
        failed++;
      }
    }

    // Log de progresso do batch
    console.log(`\n📊 Progresso: ${indexed} indexados, ${skipped} pulados, ${failed} falhas (${Math.min(i + CONCURRENCY_LIMIT, documents.length)}/${documents.length})\n`);
  }

  console.log(`\n📊 Resumo da Vetorização:`);
  console.log(`   ✅ Indexados: ${indexed}`);
  console.log(`   ⏭️ Pulados (já indexados): ${skipped}`);
  console.log(`   ❌ Falhas: ${failed}`);
  console.log(`   📁 Total processado: ${indexed + skipped + failed}`);
}

main().catch((error) => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
