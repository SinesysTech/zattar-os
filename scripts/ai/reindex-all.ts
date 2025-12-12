#!/usr/bin/env tsx
/**
 * Script de Reindexação Completa - Sinesys AI
 *
 * Script oficial de reindexação da camada RAG unificada.
 * Reindexa todos os documentos do sistema para busca semântica usando o sistema unificado.
 * ATENÇÃO: Operação custosa em termos de API calls!
 *
 * Este script usa:
 * - Tabela: public.embeddings (sistema unificado)
 * - Função: match_embeddings (RPC)
 * - Serviços: src/features/ai/services/indexing.service.ts
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

interface IndexStats {
  processos: number;
  audiencias: number;
  documentos: number;
  erros: number;
}

/**
 * Reindexação completa usando o sistema unificado
 */
async function reindexarTudo(): Promise<IndexStats> {
  console.log('🔄 Iniciando reindexação completa do Sinesys (sistema unificado)...\n');
  console.log('📋 Usando: public.embeddings + match_embeddings\n');

  const stats: IndexStats = {
    processos: 0,
    audiencias: 0,
    documentos: 0,
    erros: 0,
  };

  // Importar serviços do sistema unificado
  const { indexText } = await import('../../src/features/ai/services/indexing.service');
  const { deleteEmbeddingsByEntity } = await import('../../src/features/ai/repository');

  // 1. Limpar embeddings existentes (opcional - comentado para preservar dados)
  // console.log('🗑️  Removendo embeddings antigos...');
  // const { error: deleteError } = await supabase
  //   .from('embeddings')
  //   .delete()
  //   .neq('id', 0);
  // if (deleteError) {
  //   console.error('Erro ao limpar embeddings:', deleteError.message);
  // } else {
  //   console.log('✅ Embeddings antigos removidos\n');
  // }
  console.log('ℹ️  Embeddings existentes serão substituídos por entidade durante reindexação\n');

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
    stats.erros++;
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

        // Usar sistema unificado - indexText para texto puro
        await indexText(texto, {
          entity_type: 'processo_peca', // Usar processo_peca como tipo genérico para processos
          entity_id: processo.id,
          parent_id: null,
          metadata: {
            numero_processo: processo.numero_processo,
            status: processo.codigo_status_processo,
            grau: processo.grau,
            trt: processo.trt,
            tipo: 'processo', // Metadado adicional para compatibilidade
          },
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
    stats.erros++;
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

        // Usar sistema unificado
        await indexText(texto, {
          entity_type: 'processo_andamento', // Usar processo_andamento para audiências
          entity_id: audiencia.id,
          parent_id: audiencia.processo_id,
          metadata: {
            processo_id: audiencia.processo_id,
            numero_processo: audiencia.numero_processo,
            data_referencia: audiencia.data_inicio,
            tipo: 'audiencia', // Metadado adicional
          },
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
  console.log(`   Documentos indexados: ${stats.documentos}`);
  console.log(`   Erros encontrados:    ${stats.erros}`);
  console.log(`   Total de documentos:  ${stats.processos + stats.audiencias + stats.documentos}`);
  console.log('═'.repeat(50));
  console.log('✅ Reindexação usando sistema unificado (public.embeddings)');

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
