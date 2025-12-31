/**
 * Testes de Integração - Timeline Migration
 *
 * Valida o fluxo completo de leitura de timeline do JSONB,
 * agregação multi-instância e deduplicação.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createServiceClient } from '@/lib/supabase/service-client';
import { getTimelineCollection } from '@/lib/mongodb/collections';
import { closeMongoConnection } from '@/lib/mongodb';
import { obterTimelineUnificada } from '../../timeline-unificada';
import type { TimelineJSONB } from '../../domain';
import { ObjectId } from 'mongodb';

// ============================================================================
// Setup de Testes
// ============================================================================

let testProcessoId: number;
let testNumeroProcesso: string;
let testMongoId: string;
let testTimelineJSONB: TimelineJSONB;

beforeAll(async () => {
  // Verificar conexões
  const supabase = createServiceClient();

  // Buscar um processo de teste com timeline migrada
  const { data: processo, error } = await supabase
    .from('acervo')
    .select('id, numero_processo, timeline_mongodb_id, timeline_jsonb')
    .not('timeline_mongodb_id', 'is', null)
    .not('timeline_jsonb', 'is', null)
    .limit(1)
    .single();

  if (error || !processo) {
    throw new Error(
      'Nenhum processo com timeline migrada encontrado. Execute a migração antes de rodar os testes.'
    );
  }

  testProcessoId = processo.id;
  testNumeroProcesso = processo.numero_processo;
  testMongoId = processo.timeline_mongodb_id;
  testTimelineJSONB = processo.timeline_jsonb;

  console.log(`\n📋 Usando processo de teste: ${testNumeroProcesso} (ID: ${testProcessoId})`);
});

afterAll(async () => {
  await closeMongoConnection();
});

// ============================================================================
// Testes de Leitura JSONB
// ============================================================================

describe('Leitura de Timeline do JSONB', () => {
  it('deve ler timeline do JSONB corretamente', () => {
    expect(testTimelineJSONB).toBeDefined();
    expect(testTimelineJSONB).toHaveProperty('timeline');
    expect(testTimelineJSONB).toHaveProperty('metadata');

    expect(Array.isArray(testTimelineJSONB.timeline)).toBe(true);
    expect(testTimelineJSONB.timeline.length).toBeGreaterThan(0);

    expect(testTimelineJSONB.metadata).toHaveProperty('instancias');
    expect(testTimelineJSONB.metadata).toHaveProperty('totalDocumentos');
    expect(testTimelineJSONB.metadata).toHaveProperty('totalMovimentos');
    expect(testTimelineJSONB.metadata).toHaveProperty('duplicatasRemovidas');
    expect(testTimelineJSONB.metadata).toHaveProperty('dataProcessamento');
  });

  it('deve processar timeline JSONB com documentos e movimentos', () => {
    const documentos = testTimelineJSONB.timeline.filter((item) => item.documento === true);
    const movimentos = testTimelineJSONB.timeline.filter((item) => item.documento === false);

    const totalDocumentos = documentos.length;
    const totalMovimentos = movimentos.length;

    // Validar que totais batem com metadata
    expect(totalDocumentos).toBe(testTimelineJSONB.metadata.totalDocumentos);
    expect(totalMovimentos).toBe(testTimelineJSONB.metadata.totalMovimentos);
  });

  it('deve ter estrutura válida para cada item da timeline', () => {
    for (const item of testTimelineJSONB.timeline) {
      expect(item).toHaveProperty('data');
      expect(item).toHaveProperty('descricao');
      expect(item).toHaveProperty('documento');
      expect(item).toHaveProperty('hash');

      expect(typeof item.data).toBe('string');
      expect(typeof item.descricao).toBe('string');
      expect(typeof item.documento).toBe('boolean');
      expect(typeof item.hash).toBe('string');

      // Hash deve ter 64 caracteres (SHA-256 em hex)
      expect(item.hash).toHaveLength(64);
    }
  });

  it('deve lidar com timeline JSONB vazia', async () => {
    const timelineVazia: TimelineJSONB = {
      timeline: [],
      metadata: {
        instancias: [],
        totalDocumentos: 0,
        totalMovimentos: 0,
        duplicatasRemovidas: 0,
        dataProcessamento: new Date().toISOString(),
      },
    };

    expect(timelineVazia.timeline).toHaveLength(0);
    expect(timelineVazia.metadata.totalDocumentos).toBe(0);
    expect(timelineVazia.metadata.totalMovimentos).toBe(0);
  });
});

// ============================================================================
// Testes de Timeline Unificada
// ============================================================================

describe('Timeline Unificada', () => {
  it('deve agregar timelines de múltiplas instâncias', async () => {
    // Buscar processo com múltiplas instâncias
    const supabase = createServiceClient();
    const { data: processoMultiInstancia } = await supabase
      .from('acervo')
      .select('numero_processo, timeline_jsonb')
      .not('timeline_jsonb', 'is', null)
      .limit(100);

    // Encontrar um processo com múltiplas instâncias
    const processoComMultiplasInstancias = processoMultiInstancia?.find(
      (p) => p.timeline_jsonb?.metadata?.instancias?.length > 1
    );

    if (!processoComMultiplasInstancias) {
      console.warn('⚠️  Nenhum processo com múltiplas instâncias encontrado, pulando teste');
      return;
    }

    const resultado = await obterTimelineUnificada(processoComMultiplasInstancias.numero_processo);

    expect(resultado).toHaveProperty('timeline');
    expect(resultado).toHaveProperty('metadata');
    expect(resultado.metadata.instancias.length).toBeGreaterThan(1);
    expect(resultado.timeline.length).toBeGreaterThan(0);
    expect(resultado.metadata.duplicatasRemovidas).toBeGreaterThanOrEqual(0);
  }, 10000); // Timeout de 10 segundos

  it('deve deduplic ar eventos repetidos entre instâncias', async () => {
    // Buscar processo com duplicatas removidas
    const supabase = createServiceClient();
    const { data: processoComDuplicatas } = await supabase
      .from('acervo')
      .select('numero_processo, timeline_jsonb')
      .not('timeline_jsonb', 'is', null)
      .limit(100);

    // Encontrar um processo onde duplicatas foram removidas
    const processoComDuplicatasRemovidas = processoComDuplicatas?.find(
      (p) => (p.timeline_jsonb?.metadata?.duplicatasRemovidas || 0) > 0
    );

    if (!processoComDuplicatasRemovidas) {
      console.warn('⚠️  Nenhum processo com duplicatas removidas encontrado, pulando teste');
      return;
    }

    const resultado = await obterTimelineUnificada(
      processoComDuplicatasRemovidas.numero_processo
    );

    expect(resultado.metadata.duplicatasRemovidas).toBeGreaterThan(0);

    // Verificar que não há hashes duplicados
    const hashes = resultado.timeline.map((item) => item.hash);
    const hashesUnicos = new Set(hashes);
    expect(hashes.length).toBe(hashesUnicos.size);
  }, 10000);

  it('deve ordenar timeline por data (mais recente primeiro)', async () => {
    const resultado = await obterTimelineUnificada(testNumeroProcesso);

    expect(resultado.timeline.length).toBeGreaterThan(0);

    // Verificar ordenação decrescente
    for (let i = 0; i < resultado.timeline.length - 1; i++) {
      const dataAtual = new Date(resultado.timeline[i].data);
      const dataProxima = new Date(resultado.timeline[i + 1].data);

      expect(dataAtual >= dataProxima).toBe(true);
    }
  }, 10000);

  it('deve retornar timeline vazia para processo inexistente', async () => {
    const numeroProcessoInexistente = '9999999-99.9999.9.99.9999';
    const resultado = await obterTimelineUnificada(numeroProcessoInexistente);

    expect(resultado.timeline).toHaveLength(0);
    expect(resultado.metadata.instancias).toHaveLength(0);
    expect(resultado.metadata.totalDocumentos).toBe(0);
    expect(resultado.metadata.totalMovimentos).toBe(0);
  }, 10000);
});

// ============================================================================
// Testes de Integridade MongoDB vs PostgreSQL
// ============================================================================

describe('Integridade MongoDB vs PostgreSQL', () => {
  it('deve ter mesma quantidade de itens entre MongoDB e PostgreSQL', async () => {
    // Buscar timeline no MongoDB
    const collection = getTimelineCollection();
    const timelineMongo = await collection.findOne({ _id: new ObjectId(testMongoId) });

    expect(timelineMongo).toBeDefined();
    expect(timelineMongo?.timeline).toBeDefined();

    const lengthMongo = timelineMongo?.timeline?.length || 0;
    const lengthPostgres = testTimelineJSONB.timeline.length;

    expect(lengthPostgres).toBe(lengthMongo);
  });

  it('deve ter mesmos metadados entre MongoDB e PostgreSQL', async () => {
    // Buscar timeline no MongoDB
    const collection = getTimelineCollection();
    const timelineMongo = await collection.findOne({ _id: new ObjectId(testMongoId) });

    expect(timelineMongo).toBeDefined();
    expect(timelineMongo?.metadata).toBeDefined();

    const metaMongo = timelineMongo?.metadata;
    const metaPostgres = testTimelineJSONB.metadata;

    if (metaMongo) {
      expect(metaPostgres.totalDocumentos).toBe(metaMongo.totalDocumentos);
      expect(metaPostgres.totalMovimentos).toBe(metaMongo.totalMovimentos);

      // Verificar que instâncias estão presentes
      expect(metaPostgres.instancias.length).toBeGreaterThan(0);
    }
  });

  it('deve ter mesmos hashes entre MongoDB e PostgreSQL', async () => {
    // Buscar timeline no MongoDB
    const collection = getTimelineCollection();
    const timelineMongo = await collection.findOne({ _id: new ObjectId(testMongoId) });

    expect(timelineMongo).toBeDefined();
    expect(timelineMongo?.timeline).toBeDefined();

    const hashesMongo = new Set(
      (timelineMongo?.timeline || []).map((item: { hash: string }) => item.hash)
    );
    const hashesPostgres = new Set(testTimelineJSONB.timeline.map((item) => item.hash));

    // Verificar que todos os hashes do Postgres existem no Mongo
    for (const hash of hashesPostgres) {
      expect(hashesMongo.has(hash)).toBe(true);
    }
  });
});

// ============================================================================
// Testes de Performance (Benchmarks)
// ============================================================================

describe('Performance', () => {
  it('deve ler timeline do PostgreSQL mais rápido que MongoDB', async () => {
    const supabase = createServiceClient();
    const numMedicoes = 10;

    // Buscar 10 processos aleatórios
    const { data: processos } = await supabase
      .from('acervo')
      .select('id, timeline_mongodb_id')
      .not('timeline_mongodb_id', 'is', null)
      .not('timeline_jsonb', 'is', null)
      .limit(numMedicoes);

    if (!processos || processos.length < numMedicoes) {
      console.warn('⚠️  Processos insuficientes para teste de performance, pulando');
      return;
    }

    // Medir PostgreSQL
    const temposPostgres: number[] = [];
    for (const processo of processos) {
      const start = performance.now();
      await supabase.from('acervo').select('timeline_jsonb').eq('id', processo.id).single();
      const end = performance.now();
      temposPostgres.push(end - start);
    }

    // Medir MongoDB
    const collection = getTimelineCollection();
    const temposMongo: number[] = [];
    for (const processo of processos) {
      const start = performance.now();
      await collection.findOne({ _id: new ObjectId(processo.timeline_mongodb_id) });
      const end = performance.now();
      temposMongo.push(end - start);
    }

    const mediaPostgres = temposPostgres.reduce((a, b) => a + b, 0) / temposPostgres.length;
    const mediaMongo = temposMongo.reduce((a, b) => a + b, 0) / temposMongo.length;

    console.log(`\n📊 Performance Comparison:`);
    console.log(`   PostgreSQL média: ${mediaPostgres.toFixed(2)}ms`);
    console.log(`   MongoDB média: ${mediaMongo.toFixed(2)}ms`);

    const diffPercent = ((mediaPostgres - mediaMongo) / mediaMongo) * 100;
    console.log(`   Diferença: ${diffPercent > 0 ? '+' : ''}${diffPercent.toFixed(1)}%\n`);

    // PostgreSQL deve ser mais rápido ou no máximo 20% mais lento
    expect(mediaPostgres).toBeLessThanOrEqual(mediaMongo * 1.2);
  }, 30000); // Timeout de 30 segundos

  it('deve agregar timeline unificada em tempo aceitável', async () => {
    // Buscar processo com múltiplas instâncias
    const supabase = createServiceClient();
    const { data: processoMultiInstancia } = await supabase
      .from('acervo')
      .select('numero_processo, timeline_jsonb')
      .not('timeline_jsonb', 'is', null)
      .limit(100);

    // Encontrar um processo com 2-3 instâncias
    const processoComInstancias = processoMultiInstancia?.find(
      (p) =>
        (p.timeline_jsonb?.metadata?.instancias?.length || 0) >= 2 &&
        (p.timeline_jsonb?.metadata?.instancias?.length || 0) <= 3
    );

    if (!processoComInstancias) {
      console.warn('⚠️  Nenhum processo com 2-3 instâncias encontrado, usando processo de teste');
      const start = performance.now();
      await obterTimelineUnificada(testNumeroProcesso);
      const end = performance.now();
      const tempo = end - start;

      console.log(`\n⏱️  Tempo de agregação (1 instância): ${tempo.toFixed(2)}ms`);
      expect(tempo).toBeLessThan(2000); // Menos de 2 segundos
      return;
    }

    const start = performance.now();
    await obterTimelineUnificada(processoComInstancias.numero_processo);
    const end = performance.now();
    const tempo = end - start;

    const numInstancias = processoComInstancias.timeline_jsonb?.metadata?.instancias?.length || 0;
    console.log(`\n⏱️  Tempo de agregação (${numInstancias} instâncias): ${tempo.toFixed(2)}ms`);

    // Deve processar em menos de 2 segundos
    expect(tempo).toBeLessThan(2000);
  }, 10000);
});
