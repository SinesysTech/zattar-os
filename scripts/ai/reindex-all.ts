#!/usr/bin/env tsx
/**
 * Script de Reindexação Completa - Sinesys AI
 *
 * Reindexa todos os documentos do sistema para busca semântica.
 * ATENÇÃO: Operação custosa em termos de API calls!
 *
 * Uso:
 *   npm run ai:reindex
 *   npx tsx scripts/ai/reindex-all.ts
 */

import { config } from 'dotenv';

// Carregar variáveis de ambiente
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

// Cliente Supabase para scripts (não usa cookies)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!
);

// Configuração do embedding
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;
const MAX_CHUNK_SIZE = 2000;
const CHUNK_OVERLAP = 200;

interface IndexStats {
  processos: number;
  audiencias: number;
  erros: number;
}

/**
 * Gera embedding usando OpenAI
 */
async function gerarEmbedding(texto: string): Promise<number[]> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY não configurada');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      input: texto.trim().replace(/\s+/g, ' '),
      model: EMBEDDING_MODEL,
      dimensions: EMBEDDING_DIMENSIONS,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`OpenAI API Error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

/**
 * Divide texto em chunks
 */
function chunkTexto(texto: string): string[] {
  const chunks: string[] = [];

  if (texto.length <= MAX_CHUNK_SIZE) {
    return [texto.trim()];
  }

  let offset = 0;
  while (offset < texto.length) {
    const end = Math.min(offset + MAX_CHUNK_SIZE, texto.length);
    const chunk = texto.substring(offset, end).trim();
    if (chunk) {
      chunks.push(chunk);
    }
    offset = end - CHUNK_OVERLAP;
    if (offset <= (chunks.length > 0 ? offset : 0)) {
      offset = end;
    }
  }

  return chunks;
}

/**
 * Indexa um documento
 */
async function indexarDocumento(
  texto: string,
  metadata: Record<string, unknown>
): Promise<number> {
  const chunks = chunkTexto(texto);
  let indexados = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const embedding = await gerarEmbedding(chunk);

    const chunkMetadata = {
      ...metadata,
      chunkIndex: i,
      totalChunks: chunks.length,
    };

    const { error } = await supabase.from('embeddings_conhecimento').insert({
      texto: chunk,
      embedding,
      metadata: chunkMetadata,
    });

    if (error) {
      console.error(`  Erro ao inserir chunk ${i}:`, error.message);
    } else {
      indexados++;
    }

    // Rate limiting - 1 request por 100ms
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return indexados;
}

/**
 * Reindexação completa
 */
async function reindexarTudo(): Promise<IndexStats> {
  console.log('🔄 Iniciando reindexação completa do Sinesys...\n');

  const stats: IndexStats = {
    processos: 0,
    audiencias: 0,
    erros: 0,
  };

  // 1. Limpar embeddings existentes
  console.log('🗑️  Removendo embeddings antigos...');
  const { error: deleteError } = await supabase
    .from('embeddings_conhecimento')
    .delete()
    .neq('id', 0);

  if (deleteError) {
    console.error('Erro ao limpar embeddings:', deleteError.message);
  } else {
    console.log('✅ Embeddings antigos removidos\n');
  }

  // 2. Reindexar processos
  console.log('📁 Indexando processos...');
  const { data: processos, error: processosError } = await supabase
    .from('acervo')
    .select(
      'id, numero_processo, classe_judicial, nome_parte_autora, nome_parte_re, descricao_orgao_julgador, codigo_status_processo, grau, trt'
    )
    .order('id');

  if (processosError) {
    console.error('Erro ao buscar processos:', processosError.message);
  } else {
    console.log(`   Encontrados ${processos?.length || 0} processos`);

    for (const processo of processos || []) {
      try {
        const texto = `
Processo: ${processo.numero_processo}
Classe Judicial: ${processo.classe_judicial || 'N/A'}
Parte Autora: ${processo.nome_parte_autora || 'N/A'}
Parte Ré: ${processo.nome_parte_re || 'N/A'}
Órgão Julgador: ${processo.descricao_orgao_julgador || 'N/A'}
Status: ${processo.codigo_status_processo || 'N/A'}
Tribunal: ${processo.trt || 'N/A'}
Grau: ${processo.grau || 'N/A'}
        `.trim();

        await indexarDocumento(texto, {
          tipo: 'processo',
          id: processo.id,
          numeroProcesso: processo.numero_processo,
          status: processo.codigo_status_processo,
          grau: processo.grau,
          trt: processo.trt,
        });

        stats.processos++;
        process.stdout.write(`\r   Processos indexados: ${stats.processos}`);
      } catch (error) {
        console.error(`\n   Erro ao indexar processo ${processo.id}:`, error);
        stats.erros++;
      }
    }
    console.log(`\n✅ ${stats.processos} processos indexados\n`);
  }

  // 3. Reindexar audiências
  console.log('📅 Indexando audiências...');
  const { data: audiencias, error: audienciasError } = await supabase
    .from('audiencias')
    .select('id, processo_id, numero_processo, tipo_descricao, data_inicio, observacoes, status')
    .order('id');

  if (audienciasError) {
    console.error('Erro ao buscar audiências:', audienciasError.message);
  } else {
    console.log(`   Encontradas ${audiencias?.length || 0} audiências`);

    for (const audiencia of audiencias || []) {
      try {
        const texto = `
Audiência do processo ${audiencia.numero_processo}
Tipo: ${audiencia.tipo_descricao || 'N/A'}
Data: ${audiencia.data_inicio || 'N/A'}
Status: ${audiencia.status || 'N/A'}
Observações: ${audiencia.observacoes || 'N/A'}
        `.trim();

        await indexarDocumento(texto, {
          tipo: 'audiencia',
          id: audiencia.id,
          processoId: audiencia.processo_id,
          numeroProcesso: audiencia.numero_processo,
          dataReferencia: audiencia.data_inicio,
        });

        stats.audiencias++;
        process.stdout.write(`\r   Audiências indexadas: ${stats.audiencias}`);
      } catch (error) {
        console.error(`\n   Erro ao indexar audiência ${audiencia.id}:`, error);
        stats.erros++;
      }
    }
    console.log(`\n✅ ${stats.audiencias} audiências indexadas\n`);
  }

  // Resumo final
  console.log('═'.repeat(50));
  console.log('📊 RESUMO DA REINDEXAÇÃO');
  console.log('═'.repeat(50));
  console.log(`   Processos indexados:  ${stats.processos}`);
  console.log(`   Audiências indexadas: ${stats.audiencias}`);
  console.log(`   Erros encontrados:    ${stats.erros}`);
  console.log(`   Total de documentos:  ${stats.processos + stats.audiencias}`);
  console.log('═'.repeat(50));

  return stats;
}

// Executar
reindexarTudo()
  .then((stats) => {
    if (stats.erros > 0) {
      console.log('\n⚠️  Reindexação concluída com erros');
      process.exit(1);
    } else {
      console.log('\n✅ Reindexação completa com sucesso!');
      process.exit(0);
    }
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal na reindexação:', error);
    process.exit(1);
  });
