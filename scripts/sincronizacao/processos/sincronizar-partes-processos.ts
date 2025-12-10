#!/usr/bin/env tsx
/**
 * Script de Sincronização de Partes e Processos
 *
 * PROPÓSITO:
 * Sincroniza vínculos faltantes entre processos (acervo) e partes (clientes/partes_contrarias)
 * na tabela processo_partes. Este script corrige vínculos que não foram criados durante
 * capturas anteriores devido a erros na lógica.
 *
 * ESTRATÉGIA DE SINCRONIZAÇÃO:
 * 1. Busca processos no acervo que não têm vínculos em processo_partes
 * 2. Para cada processo, tenta correlacionar:
 *    a. Cliente: pelo nome da parte autora (nome_parte_autora)
 *    b. Parte contrária: pelo nome da parte ré (nome_parte_re)
 * 3. Usa cadastros_pje para obter id_pessoa_pje quando disponível
 * 4. Cria os vínculos faltantes na tabela processo_partes
 *
 * COMO USAR:
 * npx tsx scripts/sincronizacao/sincronizar-partes-processos.ts [--dry-run] [--limit N] [--trt TRTX]
 *
 * OPÇÕES:
 * --dry-run    Simula a sincronização sem persistir (padrão: false)
 * --limit N    Limita a quantidade de processos a processar (padrão: sem limite)
 * --trt TRTX   Filtra por TRT específico (ex: TRT1, TRT3)
 * --verbose    Exibe logs detalhados
 *
 * EXEMPLOS:
 * npx tsx scripts/sincronizacao/sincronizar-partes-processos.ts --dry-run --limit 100
 * npx tsx scripts/sincronizacao/sincronizar-partes-processos.ts --trt TRT3 --limit 500
 * npx tsx scripts/sincronizacao/sincronizar-partes-processos.ts --verbose
 */

// Carregar variáveis de ambiente
import { config } from 'dotenv';
import { resolve } from 'path';

// Tentar carregar .env.local primeiro, depois .env
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import type { SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// TIPOS
// ============================================================================

interface ProcessoSemVinculo {
  id: number;
  id_pje: number;
  trt: string;
  grau: string;
  numero_processo: string;
  nome_parte_autora: string | null;
  nome_parte_re: string | null;
}

interface ClienteEncontrado {
  id: number;
  nome: string;
  cpf: string | null;
  cnpj: string | null;
  tipo_pessoa: string;
}

interface ParteContrariaEncontrada {
  id: number;
  nome: string;
  cpf: string | null;
  cnpj: string | null;
  tipo_pessoa: string;
}

interface CadastroPJE {
  id: number;
  tipo_entidade: string;
  entidade_id: number;
  id_pessoa_pje: number;
  tribunal: string;
  grau: string | null;
}

interface ResultadoSincronizacao {
  processosAnalisados: number;
  vinculosCriados: number;
  vinculosClientes: number;
  vinculosPartesContrarias: number;
  erros: number;
  detalhesErros: Array<{ processoId: number; erro: string }>;
  dryRun: boolean;
  duracao: number;
}

interface ConfiguracaoScript {
  dryRun: boolean;
  limite: number | null;
  trt: string | null;
  verbose: boolean;
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Normaliza nome para comparação (uppercase, trim, remove acentos)
 */
function normalizarNome(nome: string | null): string {
  if (!nome) return '';
  return nome
    .toUpperCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Parse dos argumentos da linha de comando
 */
function parseArgumentos(): ConfiguracaoScript {
  const args = process.argv.slice(2);
  const config: ConfiguracaoScript = {
    dryRun: false,
    limite: null,
    trt: null,
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--dry-run') {
      config.dryRun = true;
    } else if (arg === '--verbose') {
      config.verbose = true;
    } else if (arg === '--limit' && args[i + 1]) {
      config.limite = parseInt(args[i + 1], 10);
      i++;
    } else if (arg === '--trt' && args[i + 1]) {
      config.trt = args[i + 1].toUpperCase();
      i++;
    }
  }

  return config;
}

// ============================================================================
// FUNÇÕES DE BUSCA
// ============================================================================

/**
 * Busca processos no acervo que não têm vínculos em processo_partes
 * Usa paginação para buscar todos os registros (Supabase limita a 1000 por query)
 */
async function buscarProcessosSemVinculos(
  supabase: SupabaseClient,
  config: ConfiguracaoScript
): Promise<ProcessoSemVinculo[]> {
  console.log('📋 Buscando processos sem vínculos...');

  // Primeiro, buscar TODOS os IDs de processos que TÊM vínculos (com paginação)
  const idsComVinculos = new Set<number>();
  let offsetVinculos = 0;
  const limitePorPagina = 1000;

  console.log('   📊 Buscando processos com vínculos existentes...');
  while (true) {
    const { data, error } = await supabase
      .from('processo_partes')
      .select('processo_id')
      .range(offsetVinculos, offsetVinculos + limitePorPagina - 1);

    if (error) {
      throw new Error(`Erro ao buscar processos com vínculos: ${error.message}`);
    }

    if (!data || data.length === 0) break;

    data.forEach(p => idsComVinculos.add(p.processo_id));
    offsetVinculos += limitePorPagina;

    if (data.length < limitePorPagina) break; // Última página
  }

  console.log(`   📊 ${idsComVinculos.size} processos já têm vínculos`);

  // Buscar TODOS os processos do acervo (com paginação)
  const todosProcessos: ProcessoSemVinculo[] = [];
  let offsetProcessos = 0;

  console.log('   📊 Buscando processos do acervo...');
  while (true) {
    let query = supabase
      .from('acervo')
      .select('id, id_pje, trt, grau, numero_processo, nome_parte_autora, nome_parte_re')
      .order('id', { ascending: true })
      .range(offsetProcessos, offsetProcessos + limitePorPagina - 1);

    // Aplicar filtro de TRT se especificado
    if (config.trt) {
      query = query.eq('trt', config.trt);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Erro ao buscar processos: ${error.message}`);
    }

    if (!data || data.length === 0) break;

    todosProcessos.push(...(data as ProcessoSemVinculo[]));
    offsetProcessos += limitePorPagina;

    // Log de progresso a cada 10.000 processos
    if (todosProcessos.length % 10000 === 0) {
      console.log(`      ... ${todosProcessos.length} processos carregados`);
    }

    if (data.length < limitePorPagina) break; // Última página
  }

  console.log(`   📊 ${todosProcessos.length} processos totais no acervo`);

  // Filtrar processos que NÃO têm vínculos
  let processosSemVinculos = todosProcessos.filter(p => !idsComVinculos.has(p.id));

  // Aplicar limite se especificado
  if (config.limite && processosSemVinculos.length > config.limite) {
    processosSemVinculos = processosSemVinculos.slice(0, config.limite);
  }

  console.log(`   ✅ ${processosSemVinculos.length} processos encontrados sem vínculos`);
  return processosSemVinculos;
}

/**
 * Busca cliente pelo nome (normalizado)
 */
async function buscarClientePorNome(
  supabase: SupabaseClient,
  nome: string
): Promise<ClienteEncontrado | null> {
  const nomeNormalizado = normalizarNome(nome);

  if (!nomeNormalizado) return null;

  // Busca por nome exato (case insensitive)
  const { data, error } = await supabase
    .from('clientes')
    .select('id, nome, cpf, cnpj, tipo_pessoa')
    .ilike('nome', nomeNormalizado)
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  return data as ClienteEncontrado;
}

/**
 * Busca parte contrária pelo nome (normalizado)
 */
async function buscarParteContrariaPorNome(
  supabase: SupabaseClient,
  nome: string
): Promise<ParteContrariaEncontrada | null> {
  const nomeNormalizado = normalizarNome(nome);

  if (!nomeNormalizado) return null;

  // Busca por nome exato (case insensitive)
  const { data, error } = await supabase
    .from('partes_contrarias')
    .select('id, nome, cpf, cnpj, tipo_pessoa')
    .ilike('nome', nomeNormalizado)
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  return data as ParteContrariaEncontrada;
}

/**
 * Busca cadastro PJE para obter id_pessoa_pje
 */
async function buscarCadastroPJE(
  supabase: SupabaseClient,
  tipoEntidade: 'cliente' | 'parte_contraria',
  entidadeId: number,
  trt: string,
  grau: string
): Promise<CadastroPJE | null> {
  // Busca cadastro específico para o TRT/grau ou genérico (grau null)
  const { data, error } = await supabase
    .from('cadastros_pje')
    .select('id, tipo_entidade, entidade_id, id_pessoa_pje, tribunal, grau')
    .eq('tipo_entidade', tipoEntidade)
    .eq('entidade_id', entidadeId)
    .eq('tribunal', trt)
    .or(`grau.eq.${grau},grau.is.null`)
    .order('grau', { ascending: false, nullsFirst: false }) // Prioriza cadastro com grau específico
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  return data as CadastroPJE;
}

/**
 * Verifica se já existe vínculo para evitar duplicação
 */
async function verificarVinculoExistente(
  supabase: SupabaseClient,
  processoId: number,
  tipoEntidade: string,
  entidadeId: number,
  grau: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('processo_partes')
    .select('id')
    .eq('processo_id', processoId)
    .eq('tipo_entidade', tipoEntidade)
    .eq('entidade_id', entidadeId)
    .eq('grau', grau)
    .limit(1)
    .maybeSingle();

  return !error && data !== null;
}

// ============================================================================
// FUNÇÕES DE PERSISTÊNCIA
// ============================================================================

/**
 * Cria vínculo na tabela processo_partes
 */
async function criarVinculo(
  supabase: SupabaseClient,
  params: {
    processo_id: number;
    tipo_entidade: 'cliente' | 'parte_contraria';
    entidade_id: number;
    id_pje: number; // ID sintético (usamos id_pessoa_pje ou geramos um)
    id_pessoa_pje: number | null;
    tipo_parte: string;
    polo: 'ATIVO' | 'PASSIVO';
    trt: string;
    grau: string;
    numero_processo: string;
    principal: boolean;
    ordem: number;
  },
  dryRun: boolean
): Promise<boolean> {
  if (dryRun) {
    return true; // Simula sucesso em dry run
  }

  const dadosInsercao = {
    processo_id: params.processo_id,
    tipo_entidade: params.tipo_entidade,
    entidade_id: params.entidade_id,
    id_pje: params.id_pje,
    id_pessoa_pje: params.id_pessoa_pje,
    tipo_parte: params.tipo_parte,
    polo: params.polo,
    trt: params.trt,
    grau: params.grau,
    numero_processo: params.numero_processo,
    principal: params.principal,
    ordem: params.ordem,
  };

  const { error } = await supabase
    .from('processo_partes')
    .upsert(dadosInsercao, { onConflict: 'processo_id,tipo_entidade,entidade_id,grau' });

  if (error) {
    console.error(`   ❌ Erro ao criar vínculo: ${error.message}`);
    return false;
  }

  return true;
}

// ============================================================================
// FUNÇÃO PRINCIPAL DE SINCRONIZAÇÃO
// ============================================================================

async function sincronizarPartesProcessos(
  config: ConfiguracaoScript
): Promise<ResultadoSincronizacao> {
  const inicio = Date.now();
  const supabase = createServiceClient();

  const resultado: ResultadoSincronizacao = {
    processosAnalisados: 0,
    vinculosCriados: 0,
    vinculosClientes: 0,
    vinculosPartesContrarias: 0,
    erros: 0,
    detalhesErros: [],
    dryRun: config.dryRun,
    duracao: 0,
  };

  try {
    // 1. Buscar processos sem vínculos
    const processosSemVinculos = await buscarProcessosSemVinculos(supabase, config);

    if (processosSemVinculos.length === 0) {
      console.log('✅ Nenhum processo sem vínculos encontrado!');
      resultado.duracao = Date.now() - inicio;
      return resultado;
    }

    console.log(`\n🔄 Processando ${processosSemVinculos.length} processos...`);
    if (config.dryRun) {
      console.log('   ⚠️  MODO DRY-RUN: Nenhuma alteração será persistida\n');
    }

    // 2. Processar cada processo
    for (const processo of processosSemVinculos) {
      resultado.processosAnalisados++;

      if (config.verbose) {
        console.log(`\n📋 Processo ${resultado.processosAnalisados}/${processosSemVinculos.length}: ${processo.numero_processo}`);
        console.log(`   TRT: ${processo.trt}, Grau: ${processo.grau}`);
        console.log(`   Parte Autora: ${processo.nome_parte_autora || '(não informado)'}`);
        console.log(`   Parte Ré: ${processo.nome_parte_re || '(não informado)'}`);
      }

      try {
        // 2.1 Tentar vincular cliente (parte autora)
        if (processo.nome_parte_autora) {
          const cliente = await buscarClientePorNome(supabase, processo.nome_parte_autora);

          if (cliente) {
            // Verificar se já existe vínculo
            const vinculoExiste = await verificarVinculoExistente(
              supabase,
              processo.id,
              'cliente',
              cliente.id,
              processo.grau
            );

            if (!vinculoExiste) {
              // Buscar cadastro PJE para id_pessoa_pje
              const cadastroPJE = await buscarCadastroPJE(
                supabase,
                'cliente',
                cliente.id,
                processo.trt,
                processo.grau
              );

              // Criar vínculo
              // id_pje: usamos id_pessoa_pje se disponível, senão geramos um ID sintético
              const idPje = cadastroPJE?.id_pessoa_pje || (processo.id_pje * 1000 + 1);

              const sucesso = await criarVinculo(
                supabase,
                {
                  processo_id: processo.id,
                  tipo_entidade: 'cliente',
                  entidade_id: cliente.id,
                  id_pje: idPje,
                  id_pessoa_pje: cadastroPJE?.id_pessoa_pje || null,
                  tipo_parte: 'RECLAMANTE',
                  polo: 'ATIVO',
                  trt: processo.trt,
                  grau: processo.grau,
                  numero_processo: processo.numero_processo,
                  principal: true,
                  ordem: 0,
                },
                config.dryRun
              );

              if (sucesso) {
                resultado.vinculosCriados++;
                resultado.vinculosClientes++;

                if (config.verbose) {
                  console.log(`   ✅ Vínculo CLIENTE criado: ${cliente.nome} (ID: ${cliente.id})`);
                }
              }
            } else if (config.verbose) {
              console.log(`   ℹ️  Vínculo cliente já existe`);
            }
          } else if (config.verbose) {
            console.log(`   ⚠️  Cliente não encontrado pelo nome`);
          }
        }

        // 2.2 Tentar vincular parte contrária (parte ré)
        if (processo.nome_parte_re) {
          const parteContraria = await buscarParteContrariaPorNome(supabase, processo.nome_parte_re);

          if (parteContraria) {
            // Verificar se já existe vínculo
            const vinculoExiste = await verificarVinculoExistente(
              supabase,
              processo.id,
              'parte_contraria',
              parteContraria.id,
              processo.grau
            );

            if (!vinculoExiste) {
              // Buscar cadastro PJE para id_pessoa_pje
              const cadastroPJE = await buscarCadastroPJE(
                supabase,
                'parte_contraria',
                parteContraria.id,
                processo.trt,
                processo.grau
              );

              // Criar vínculo
              const idPje = cadastroPJE?.id_pessoa_pje || (processo.id_pje * 1000 + 2);

              const sucesso = await criarVinculo(
                supabase,
                {
                  processo_id: processo.id,
                  tipo_entidade: 'parte_contraria',
                  entidade_id: parteContraria.id,
                  id_pje: idPje,
                  id_pessoa_pje: cadastroPJE?.id_pessoa_pje || null,
                  tipo_parte: 'RECLAMADO',
                  polo: 'PASSIVO',
                  trt: processo.trt,
                  grau: processo.grau,
                  numero_processo: processo.numero_processo,
                  principal: true,
                  ordem: 1,
                },
                config.dryRun
              );

              if (sucesso) {
                resultado.vinculosCriados++;
                resultado.vinculosPartesContrarias++;

                if (config.verbose) {
                  console.log(`   ✅ Vínculo PARTE_CONTRARIA criado: ${parteContraria.nome} (ID: ${parteContraria.id})`);
                }
              }
            } else if (config.verbose) {
              console.log(`   ℹ️  Vínculo parte contrária já existe`);
            }
          } else if (config.verbose) {
            console.log(`   ⚠️  Parte contrária não encontrada pelo nome`);
          }
        }

        // Log de progresso a cada 100 processos
        if (resultado.processosAnalisados % 100 === 0) {
          console.log(`   📊 Progresso: ${resultado.processosAnalisados}/${processosSemVinculos.length} processos (${resultado.vinculosCriados} vínculos criados)`);
        }
      } catch (error) {
        resultado.erros++;
        const erroMsg = error instanceof Error ? error.message : String(error);
        resultado.detalhesErros.push({
          processoId: processo.id,
          erro: erroMsg,
        });

        if (config.verbose) {
          console.error(`   ❌ Erro ao processar: ${erroMsg}`);
        }
      }
    }
  } catch (error) {
    console.error('❌ Erro fatal na sincronização:', error);
    throw error;
  }

  resultado.duracao = Date.now() - inicio;
  return resultado;
}

// ============================================================================
// EXECUÇÃO
// ============================================================================

async function main() {
  console.log('═'.repeat(80));
  console.log('SINCRONIZAÇÃO DE PARTES E PROCESSOS');
  console.log('═'.repeat(80));

  const config = parseArgumentos();

  console.log('\n📋 Configuração:');
  console.log(`   • Modo: ${config.dryRun ? 'DRY-RUN (simulação)' : 'EXECUÇÃO REAL'}`);
  console.log(`   • Limite: ${config.limite || 'sem limite'}`);
  console.log(`   • TRT: ${config.trt || 'todos'}`);
  console.log(`   • Verbose: ${config.verbose ? 'sim' : 'não'}`);

  try {
    const resultado = await sincronizarPartesProcessos(config);

    console.log('\n' + '═'.repeat(80));
    console.log('RESULTADO DA SINCRONIZAÇÃO');
    console.log('═'.repeat(80));

    console.log(`\n📊 Estatísticas:`);
    console.log(`   • Processos analisados: ${resultado.processosAnalisados}`);
    console.log(`   • Vínculos criados: ${resultado.vinculosCriados}`);
    console.log(`     - Clientes: ${resultado.vinculosClientes}`);
    console.log(`     - Partes contrárias: ${resultado.vinculosPartesContrarias}`);
    console.log(`   • Erros: ${resultado.erros}`);
    console.log(`   • Duração: ${(resultado.duracao / 1000).toFixed(2)}s`);

    if (resultado.dryRun) {
      console.log('\n⚠️  MODO DRY-RUN: Nenhuma alteração foi persistida!');
      console.log('   Execute sem --dry-run para aplicar as alterações.');
    }

    if (resultado.erros > 0 && resultado.detalhesErros.length > 0) {
      console.log('\n❌ Detalhes dos erros (primeiros 10):');
      resultado.detalhesErros.slice(0, 10).forEach((e, i) => {
        console.log(`   ${i + 1}. Processo ID ${e.processoId}: ${e.erro}`);
      });
    }

    console.log('\n✅ Sincronização concluída!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERRO FATAL:', error);
    process.exit(1);
  }
}

main();

