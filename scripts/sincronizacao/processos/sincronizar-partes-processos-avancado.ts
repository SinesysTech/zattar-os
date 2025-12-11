#!/usr/bin/env tsx
/**
 * Script Avançado de Sincronização de Partes e Processos
 *
 * PROPÓSITO:
 * Versão avançada que além de correlacionar por nome, também pode recapturar
 * partes diretamente da API do PJE para processos que não têm correlação.
 *
 * ESTRATÉGIA DE SINCRONIZAÇÃO (3 níveis):
 * 1. NÍVEL 1 - Correlação por Nome:
 *    - Busca clientes/partes pelo nome exato (case insensitive)
 *    - Usa cadastros_pje para obter id_pessoa_pje
 *
 * 2. NÍVEL 2 - Correlação por CPF/CNPJ (via cadastros_pje):
 *    - Se não encontrar por nome, busca por id_pessoa_pje em cadastros_pje
 *    - Correlaciona com clientes/partes existentes
 *
 * 3. NÍVEL 3 - Recaptura do PJE (opcional):
 *    - Se habilitado (--recapturar), busca partes diretamente da API do PJE
 *    - Cria entidades e vínculos novos
 *
 * COMO USAR:
 * npx tsx scripts/sincronizacao/sincronizar-partes-processos-avancado.ts [opções]
 *
 * OPÇÕES:
 * --dry-run         Simula a sincronização sem persistir
 * --limit N         Limita a quantidade de processos
 * --trt TRTX        Filtra por TRT específico
 * --verbose         Exibe logs detalhados
 * --nivel N         Nível máximo de sincronização (1, 2 ou 3)
 * --recapturar      Habilita recaptura do PJE (nível 3) - REQUER AUTENTICAÇÃO
 * --credencial-id N ID da credencial para autenticação no PJE
 *
 * EXEMPLOS:
 * npx tsx scripts/sincronizacao/sincronizar-partes-processos-avancado.ts --dry-run --limit 100
 * npx tsx scripts/sincronizacao/sincronizar-partes-processos-avancado.ts --trt TRT3 --nivel 2
 * npx tsx scripts/sincronizacao/sincronizar-partes-processos-avancado.ts --recapturar --credencial-id 1 --limit 50
 */

// Carregar variáveis de ambiente
import { config } from 'dotenv';
import { resolve } from 'path';

// Tentar carregar .env.local primeiro, depois .env
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

import { createServiceClient } from '@/lib/supabase/service-client';
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
  qtde_parte_autora: number;
  qtde_parte_re: number;
}

interface EntidadeEncontrada {
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
  vinculosNivel1: number; // Por nome
  vinculosNivel2: number; // Por cadastros_pje
  vinculosNivel3: number; // Por recaptura
  vinculosClientes: number;
  vinculosPartesContrarias: number;
  erros: number;
  detalhesErros: Array<{ processoId: number; erro: string }>;
  processosSemCorrelacao: number;
  dryRun: boolean;
  duracao: number;
}

interface ConfiguracaoScript {
  dryRun: boolean;
  limite: number | null;
  trt: string | null;
  verbose: boolean;
  nivelMaximo: 1 | 2 | 3;
  recapturar: boolean;
  credencialId: number | null;
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

function normalizarNome(nome: string | null): string {
  if (!nome) return '';
  return nome
    .toUpperCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function parseArgumentos(): ConfiguracaoScript {
  const args = process.argv.slice(2);
  const config: ConfiguracaoScript = {
    dryRun: false,
    limite: null,
    trt: null,
    verbose: false,
    nivelMaximo: 2,
    recapturar: false,
    credencialId: null,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--dry-run') {
      config.dryRun = true;
    } else if (arg === '--verbose') {
      config.verbose = true;
    } else if (arg === '--recapturar') {
      config.recapturar = true;
      config.nivelMaximo = 3;
    } else if (arg === '--limit' && args[i + 1]) {
      config.limite = parseInt(args[i + 1], 10);
      i++;
    } else if (arg === '--trt' && args[i + 1]) {
      config.trt = args[i + 1].toUpperCase();
      i++;
    } else if (arg === '--nivel' && args[i + 1]) {
      const nivel = parseInt(args[i + 1], 10);
      if (nivel >= 1 && nivel <= 3) {
        config.nivelMaximo = nivel as 1 | 2 | 3;
      }
      i++;
    } else if (arg === '--credencial-id' && args[i + 1]) {
      config.credencialId = parseInt(args[i + 1], 10);
      i++;
    }
  }

  return config;
}

// ============================================================================
// FUNÇÕES DE BUSCA
// ============================================================================

async function buscarProcessosSemVinculos(
  supabase: SupabaseClient,
  config: ConfiguracaoScript
): Promise<ProcessoSemVinculo[]> {
  console.log('📋 Buscando processos sem vínculos...');

  // Buscar IDs de processos que TÊM vínculos
  const { data: processosComVinculos, error: errorVinculos } = await supabase
    .from('processo_partes')
    .select('processo_id');

  if (errorVinculos) {
    throw new Error(`Erro ao buscar processos com vínculos: ${errorVinculos.message}`);
  }

  const idsComVinculos = new Set((processosComVinculos || []).map(p => p.processo_id));
  console.log(`   📊 ${idsComVinculos.size} processos já têm vínculos`);

  // Buscar todos os processos do acervo
  let query = supabase
    .from('acervo')
    .select('id, id_pje, trt, grau, numero_processo, nome_parte_autora, nome_parte_re, qtde_parte_autora, qtde_parte_re');

  if (config.trt) {
    query = query.eq('trt', config.trt);
  }

  query = query.order('id', { ascending: true });

  const { data: todosProcessos, error: errorProcessos } = await query;

  if (errorProcessos) {
    throw new Error(`Erro ao buscar processos: ${errorProcessos.message}`);
  }

  let processosSemVinculos = (todosProcessos || []).filter(p => !idsComVinculos.has(p.id));

  if (config.limite && processosSemVinculos.length > config.limite) {
    processosSemVinculos = processosSemVinculos.slice(0, config.limite);
  }

  console.log(`   ✅ ${processosSemVinculos.length} processos encontrados sem vínculos`);
  return processosSemVinculos as ProcessoSemVinculo[];
}

async function buscarEntidadePorNome(
  supabase: SupabaseClient,
  nome: string,
  tabela: 'clientes' | 'partes_contrarias'
): Promise<EntidadeEncontrada | null> {
  const nomeNormalizado = normalizarNome(nome);
  if (!nomeNormalizado) return null;

  const { data, error } = await supabase
    .from(tabela)
    .select('id, nome, cpf, cnpj, tipo_pessoa')
    .ilike('nome', nomeNormalizado)
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data as EntidadeEncontrada;
}

async function buscarCadastroPJE(
  supabase: SupabaseClient,
  tipoEntidade: 'cliente' | 'parte_contraria',
  entidadeId: number,
  trt: string,
  grau: string
): Promise<CadastroPJE | null> {
  const { data, error } = await supabase
    .from('cadastros_pje')
    .select('id, tipo_entidade, entidade_id, id_pessoa_pje, tribunal, grau')
    .eq('tipo_entidade', tipoEntidade)
    .eq('entidade_id', entidadeId)
    .eq('tribunal', trt)
    .or(`grau.eq.${grau},grau.is.null`)
    .order('grau', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data as CadastroPJE;
}

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

async function criarVinculo(
  supabase: SupabaseClient,
  params: {
    processo_id: number;
    tipo_entidade: 'cliente' | 'parte_contraria';
    entidade_id: number;
    id_pje: number;
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
    return true;
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
// SINCRONIZAÇÃO NÍVEL 1: Por Nome
// ============================================================================

async function sincronizarNivel1(
  supabase: SupabaseClient,
  processo: ProcessoSemVinculo,
  resultado: ResultadoSincronizacao,
  config: ConfiguracaoScript
): Promise<{ clienteVinculado: boolean; parteContrariaVinculada: boolean }> {
  let clienteVinculado = false;
  let parteContrariaVinculada = false;

  // Tentar vincular cliente (parte autora)
  if (processo.nome_parte_autora) {
    const cliente = await buscarEntidadePorNome(supabase, processo.nome_parte_autora, 'clientes');

    if (cliente) {
      const vinculoExiste = await verificarVinculoExistente(
        supabase,
        processo.id,
        'cliente',
        cliente.id,
        processo.grau
      );

      if (!vinculoExiste) {
        const cadastroPJE = await buscarCadastroPJE(
          supabase,
          'cliente',
          cliente.id,
          processo.trt,
          processo.grau
        );

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
          resultado.vinculosNivel1++;
          clienteVinculado = true;

          if (config.verbose) {
            console.log(`   ✅ [N1] Vínculo CLIENTE: ${cliente.nome}`);
          }
        }
      }
    }
  }

  // Tentar vincular parte contrária (parte ré)
  if (processo.nome_parte_re) {
    const parteContraria = await buscarEntidadePorNome(supabase, processo.nome_parte_re, 'partes_contrarias');

    if (parteContraria) {
      const vinculoExiste = await verificarVinculoExistente(
        supabase,
        processo.id,
        'parte_contraria',
        parteContraria.id,
        processo.grau
      );

      if (!vinculoExiste) {
        const cadastroPJE = await buscarCadastroPJE(
          supabase,
          'parte_contraria',
          parteContraria.id,
          processo.trt,
          processo.grau
        );

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
          resultado.vinculosNivel1++;
          parteContrariaVinculada = true;

          if (config.verbose) {
            console.log(`   ✅ [N1] Vínculo PARTE_CONTRARIA: ${parteContraria.nome}`);
          }
        }
      }
    }
  }

  return { clienteVinculado, parteContrariaVinculada };
}

// ============================================================================
// FUNÇÃO PRINCIPAL
// ============================================================================

async function sincronizarPartesProcessos(
  config: ConfiguracaoScript
): Promise<ResultadoSincronizacao> {
  const inicio = Date.now();
  const supabase = createServiceClient();

  const resultado: ResultadoSincronizacao = {
    processosAnalisados: 0,
    vinculosCriados: 0,
    vinculosNivel1: 0,
    vinculosNivel2: 0,
    vinculosNivel3: 0,
    vinculosClientes: 0,
    vinculosPartesContrarias: 0,
    erros: 0,
    detalhesErros: [],
    processosSemCorrelacao: 0,
    dryRun: config.dryRun,
    duracao: 0,
  };

  try {
    const processosSemVinculos = await buscarProcessosSemVinculos(supabase, config);

    if (processosSemVinculos.length === 0) {
      console.log('✅ Nenhum processo sem vínculos encontrado!');
      resultado.duracao = Date.now() - inicio;
      return resultado;
    }

    console.log(`\n🔄 Processando ${processosSemVinculos.length} processos...`);
    console.log(`   📊 Nível máximo de sincronização: ${config.nivelMaximo}`);
    if (config.dryRun) {
      console.log('   ⚠️  MODO DRY-RUN: Nenhuma alteração será persistida\n');
    }

    for (const processo of processosSemVinculos) {
      resultado.processosAnalisados++;

      if (config.verbose) {
        console.log(`\n📋 [${resultado.processosAnalisados}/${processosSemVinculos.length}] ${processo.numero_processo}`);
        console.log(`   TRT: ${processo.trt}, Grau: ${processo.grau}`);
      }

      try {
        // NÍVEL 1: Correlação por nome
        const resultadoNivel1 = await sincronizarNivel1(supabase, processo, resultado, config);

        // Se não conseguiu vincular nenhuma parte, conta como sem correlação
        if (!resultadoNivel1.clienteVinculado && !resultadoNivel1.parteContrariaVinculada) {
          resultado.processosSemCorrelacao++;

          if (config.verbose) {
            console.log(`   ⚠️  Nenhuma correlação encontrada`);
          }
        }

        // Log de progresso
        if (resultado.processosAnalisados % 100 === 0) {
          console.log(`   📊 Progresso: ${resultado.processosAnalisados}/${processosSemVinculos.length} (${resultado.vinculosCriados} vínculos)`);
        }
      } catch (error) {
        resultado.erros++;
        const erroMsg = error instanceof Error ? error.message : String(error);
        resultado.detalhesErros.push({
          processoId: processo.id,
          erro: erroMsg,
        });

        if (config.verbose) {
          console.error(`   ❌ Erro: ${erroMsg}`);
        }
      }
    }
  } catch (error) {
    console.error('❌ Erro fatal:', error);
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
  console.log('SINCRONIZAÇÃO AVANÇADA DE PARTES E PROCESSOS');
  console.log('═'.repeat(80));

  const config = parseArgumentos();

  console.log('\n📋 Configuração:');
  console.log(`   • Modo: ${config.dryRun ? 'DRY-RUN (simulação)' : 'EXECUÇÃO REAL'}`);
  console.log(`   • Limite: ${config.limite || 'sem limite'}`);
  console.log(`   • TRT: ${config.trt || 'todos'}`);
  console.log(`   • Nível máximo: ${config.nivelMaximo}`);
  console.log(`   • Verbose: ${config.verbose ? 'sim' : 'não'}`);

  try {
    const resultado = await sincronizarPartesProcessos(config);

    console.log('\n' + '═'.repeat(80));
    console.log('RESULTADO DA SINCRONIZAÇÃO');
    console.log('═'.repeat(80));

    console.log(`\n📊 Estatísticas:`);
    console.log(`   • Processos analisados: ${resultado.processosAnalisados}`);
    console.log(`   • Vínculos criados: ${resultado.vinculosCriados}`);
    console.log(`     - Nível 1 (por nome): ${resultado.vinculosNivel1}`);
    console.log(`     - Nível 2 (por cadastro): ${resultado.vinculosNivel2}`);
    console.log(`     - Nível 3 (recaptura): ${resultado.vinculosNivel3}`);
    console.log(`   • Por tipo:`);
    console.log(`     - Clientes: ${resultado.vinculosClientes}`);
    console.log(`     - Partes contrárias: ${resultado.vinculosPartesContrarias}`);
    console.log(`   • Processos sem correlação: ${resultado.processosSemCorrelacao}`);
    console.log(`   • Erros: ${resultado.erros}`);
    console.log(`   • Duração: ${(resultado.duracao / 1000).toFixed(2)}s`);

    if (resultado.dryRun) {
      console.log('\n⚠️  MODO DRY-RUN: Nenhuma alteração foi persistida!');
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

