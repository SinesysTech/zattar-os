#!/usr/bin/env tsx
/**
 * Script de Re-captura e Re-persistência de Partes do Acervo
 *
 * PROPÓSITO:
 * Re-captura partes de todos os processos do acervo diretamente da API do PJE
 * e persiste no banco de dados, incluindo endereços e representantes.
 * 
 * PROBLEMA QUE RESOLVE:
 * - Os payloads brutos de partes não eram salvos no MongoDB anteriormente
 * - Endereços podem não ter sido persistidos corretamente
 * - Terceiros podem ter falhado na persistência por validações muito rígidas
 *
 * ESTRATÉGIA:
 * 1. Busca todos os processos do acervo (PostgreSQL)
 * 2. Para cada processo, autentica no PJE e busca partes via API
 * 3. Persiste partes, endereços e representantes
 * 4. Salva payload bruto no MongoDB para futuras re-execuções
 * 5. Gera relatório de sucesso/falhas
 *
 * COMO USAR:
 * npx tsx scripts/reprocessamento/reprocessar-partes-acervo.ts [opções]
 *
 * OPÇÕES:
 * --dry-run           Simula a re-captura sem persistir
 * --limit N           Limita a quantidade de processos
 * --trt TRTX          Filtra por TRT específico (ex: TRT3, TRT15)
 * --grau G            Filtra por grau (primeiro_grau, segundo_grau)
 * --credencial-id N   ID da credencial para autenticação no PJE (obrigatório)
 * --delay N           Delay entre requisições em ms (default: 500)
 * --verbose           Exibe logs detalhados
 * --skip-mongo        Não salva payloads brutos no MongoDB
 * --processo-id N     Processa apenas um processo específico por ID PJE
 * --resume-from N     Retoma do processo com ID > N
 *
 * EXEMPLOS:
 * # Simular re-captura de 10 processos do TRT3
 * npx tsx scripts/reprocessamento/reprocessar-partes-acervo.ts --dry-run --limit 10 --trt TRT3 --credencial-id 1
 *
 * # Re-capturar partes de todos os processos do TRT15 primeiro grau
 * npx tsx scripts/reprocessamento/reprocessar-partes-acervo.ts --trt TRT15 --grau primeiro_grau --credencial-id 1
 *
 * # Re-capturar um processo específico
 * npx tsx scripts/reprocessamento/reprocessar-partes-acervo.ts --processo-id 123456 --credencial-id 1
 *
 * REQUISITOS:
 * - Credencial válida no PJE (mesma usada para capturas automáticas)
 * - Conexão com PostgreSQL (Supabase)
 * - Conexão com MongoDB (para salvar payloads brutos)
 */

// Carregar variáveis de ambiente
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

import { createServiceClient } from '@/lib/supabase/service-client';
import { getCredentialComplete } from '@/features/captura/credentials/credential.service';
import { getTribunalConfig, autenticarPJE, obterPartesProcesso } from '@/features/captura';
import { persistirPartesProcesso } from '@/features/captura/services/partes/partes-capture.service';
import { registrarCapturaRawLog } from '@/features/captura/services/persistence/captura-raw-log.service';
import type { GrauAcervo } from '@/features/acervo/types';

// ============================================================================
// TIPOS
// ============================================================================

interface ProcessoAcervo {
  id: number;
  id_pje: number;
  trt: string;
  grau: GrauAcervo;
  numero_processo: string;
}

interface ConfiguracaoScript {
  dryRun: boolean;
  limit: number | null;
  trt: string | null;
  grau: GrauAcervo | null;
  credencialId: number;
  delay: number;
  verbose: boolean;
  skipMongo: boolean;
  processoId: number | null;
  resumeFrom: number | null;
}

interface ResultadoRecaptura {
  processosAnalisados: number;
  clientesSalvos: number;
  partesContrariasSalvas: number;
  terceirosSalvos: number;
  representantesSalvos: number;
  vinculosCriados: number;
  payloadsSalvos: number;
  erros: number;
  detalhesErros: Array<{ processoId: number; erro: string }>;
  dryRun: boolean;
  duracao: number;
}

// ============================================================================
// PARSING DE ARGUMENTOS
// ============================================================================

function parseArgs(): ConfiguracaoScript {
  const args = process.argv.slice(2);
  const config: ConfiguracaoScript = {
    dryRun: false,
    limit: null,
    trt: null,
    grau: null,
    credencialId: 0,
    delay: 500,
    verbose: false,
    skipMongo: false,
    processoId: null,
    resumeFrom: null,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--dry-run':
        config.dryRun = true;
        break;
      case '--limit':
        config.limit = parseInt(args[++i], 10);
        break;
      case '--trt':
        config.trt = args[++i].toUpperCase();
        break;
      case '--grau':
        config.grau = args[++i] as GrauAcervo;
        break;
      case '--credencial-id':
        config.credencialId = parseInt(args[++i], 10);
        break;
      case '--delay':
        config.delay = parseInt(args[++i], 10);
        break;
      case '--verbose':
        config.verbose = true;
        break;
      case '--skip-mongo':
        config.skipMongo = true;
        break;
      case '--processo-id':
        config.processoId = parseInt(args[++i], 10);
        break;
      case '--resume-from':
        config.resumeFrom = parseInt(args[++i], 10);
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
    }
  }

  return config;
}

function printHelp() {
  console.log(`
Re-captura de Partes do Acervo

USO:
  npx tsx scripts/reprocessamento/reprocessar-partes-acervo.ts [opções]

OPÇÕES:
  --dry-run           Simula a re-captura sem persistir
  --limit N           Limita a quantidade de processos
  --trt TRTX          Filtra por TRT específico (ex: TRT3, TRT15)
  --grau G            Filtra por grau (primeiro_grau, segundo_grau)
  --credencial-id N   ID da credencial para autenticação no PJE (obrigatório)
  --delay N           Delay entre requisições em ms (default: 500)
  --verbose           Exibe logs detalhados
  --skip-mongo        Não salva payloads brutos no MongoDB
  --processo-id N     Processa apenas um processo específico por ID PJE
  --resume-from N     Retoma do processo com ID > N
  --help, -h          Exibe esta ajuda

EXEMPLOS:
  # Simular re-captura de 10 processos do TRT3
  npx tsx scripts/reprocessamento/reprocessar-partes-acervo.ts --dry-run --limit 10 --trt TRT3 --credencial-id 1

  # Re-capturar partes de todos os processos do TRT15 primeiro grau
  npx tsx scripts/reprocessamento/reprocessar-partes-acervo.ts --trt TRT15 --grau primeiro_grau --credencial-id 1
`);
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

async function buscarProcessosAcervo(config: ConfiguracaoScript): Promise<ProcessoAcervo[]> {
  const supabase = createServiceClient();

  let query = supabase
    .from('acervo')
    .select('id, id_pje, trt, grau, numero_processo')
    .not('id_pje', 'is', null)
    .order('id', { ascending: true });

  // Filtro por processo específico
  if (config.processoId) {
    query = query.eq('id_pje', config.processoId);
  }

  // Filtro por TRT
  if (config.trt) {
    // Normaliza: TRT3 -> 3
    const trtNumber = config.trt.replace(/^TRT/i, '');
    query = query.eq('trt', trtNumber);
  }

  // Filtro por grau
  if (config.grau) {
    query = query.eq('grau', config.grau);
  }

  // Resume from
  if (config.resumeFrom) {
    query = query.gt('id', config.resumeFrom);
  }

  // Limite
  if (config.limit) {
    query = query.limit(config.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Erro ao buscar processos: ${error.message}`);
  }

  return (data || []) as ProcessoAcervo[];
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// EXECUÇÃO PRINCIPAL
// ============================================================================

async function main() {
  const config = parseArgs();
  const inicio = Date.now();

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🔄 RE-CAPTURA DE PARTES DO ACERVO');
  console.log('═══════════════════════════════════════════════════════════════');

  // Validar credencial
  if (!config.credencialId) {
    console.error('❌ ERRO: --credencial-id é obrigatório');
    console.log('Use --help para ver as opções disponíveis');
    process.exit(1);
  }

  // Exibir configuração
  console.log('\n📋 Configuração:');
  console.log(`   Modo: ${config.dryRun ? 'DRY RUN (simulação)' : 'PRODUÇÃO'}`);
  console.log(`   Credencial ID: ${config.credencialId}`);
  console.log(`   TRT: ${config.trt || 'Todos'}`);
  console.log(`   Grau: ${config.grau || 'Todos'}`);
  console.log(`   Limite: ${config.limit || 'Sem limite'}`);
  console.log(`   Delay: ${config.delay}ms`);
  console.log(`   Salvar MongoDB: ${config.skipMongo ? 'Não' : 'Sim'}`);

  const resultado: ResultadoRecaptura = {
    processosAnalisados: 0,
    clientesSalvos: 0,
    partesContrariasSalvas: 0,
    terceirosSalvos: 0,
    representantesSalvos: 0,
    vinculosCriados: 0,
    payloadsSalvos: 0,
    erros: 0,
    detalhesErros: [],
    dryRun: config.dryRun,
    duracao: 0,
  };

  try {
    // 1. Buscar credencial
    console.log('\n🔐 Buscando credencial...');
    const credencial = await getCredentialComplete(config.credencialId);
    if (!credencial) {
      throw new Error(`Credencial ${config.credencialId} não encontrada`);
    }
    console.log(`   ✅ Credencial encontrada: ${credencial.tribunal} ${credencial.grau}`);

    // Se TRT não especificado, usar o da credencial
    const trtFiltro = config.trt || `TRT${credencial.tribunal}`;

    // 2. Buscar processos
    console.log('\n📋 Buscando processos do acervo...');
    const processos = await buscarProcessosAcervo({
      ...config,
      trt: trtFiltro,
    });
    console.log(`   ✅ ${processos.length} processos encontrados`);

    if (processos.length === 0) {
      console.log('\n⚠️ Nenhum processo encontrado com os filtros especificados');
      return;
    }

    // 3. Autenticar no PJE
    console.log('\n🔐 Autenticando no PJE...');
    const tribunalConfig = getTribunalConfig({
      codigo: credencial.tribunal,
      grau: credencial.grau,
    });
    
    const authResult = await autenticarPJE(credencial.credenciais, tribunalConfig);
    if (!authResult.success) {
      throw new Error(`Falha na autenticação: ${authResult.error}`);
    }
    console.log('   ✅ Autenticação bem-sucedida');

    // 4. Processar cada processo
    console.log('\n🔄 Processando processos...\n');
    
    for (let i = 0; i < processos.length; i++) {
      const processo = processos[i];
      const progresso = `[${i + 1}/${processos.length}]`;
      
      try {
        if (config.verbose) {
          console.log(`${progresso} Processando: ${processo.numero_processo} (ID PJE: ${processo.id_pje})`);
        } else {
          process.stdout.write(`\r${progresso} Processando ID PJE ${processo.id_pje}...`);
        }

        resultado.processosAnalisados++;

        // Buscar partes da API do PJE
        const { partes, payloadBruto } = await obterPartesProcesso(authResult.page, processo.id_pje);

        if (partes.length === 0) {
          if (config.verbose) {
            console.log(`   ⚠️ Processo sem partes`);
          }
          continue;
        }

        if (config.verbose) {
          console.log(`   📥 ${partes.length} partes encontradas`);
        }

        // Persistir partes (se não for dry-run)
        if (!config.dryRun) {
          const resultadoPersistencia = await persistirPartesProcesso(
            partes,
            {
              id_pje: processo.id_pje,
              trt: processo.trt,
              grau: processo.grau,
              id: processo.id,
              numero_processo: processo.numero_processo,
            },
            {
              id: parseInt(credencial.credenciais.idAdvogado, 10),
              documento: credencial.credenciais.cpf,
              nome: credencial.credenciais.nome,
            }
          );

          resultado.clientesSalvos += resultadoPersistencia.clientes;
          resultado.partesContrariasSalvas += resultadoPersistencia.partesContrarias;
          resultado.terceirosSalvos += resultadoPersistencia.terceiros;
          resultado.representantesSalvos += resultadoPersistencia.representantes;
          resultado.vinculosCriados += resultadoPersistencia.vinculos;

          // Salvar payload bruto no MongoDB
          if (!config.skipMongo && payloadBruto) {
            await registrarCapturaRawLog({
              captura_log_id: -1, // Log independente (não vinculado a agendamento)
              tipo_captura: 'partes',
              advogado_id: credencial.advogadoId,
              credencial_id: config.credencialId,
              credencial_ids: [config.credencialId],
              trt: processo.trt,
              grau: processo.grau,
              status: 'success',
              requisicao: {
                processo_id: processo.id_pje,
                numero_processo: processo.numero_processo,
                captura_pai: 'reprocessamento_manual',
                script: 'reprocessar-partes-acervo.ts',
              },
              payload_bruto: payloadBruto,
              resultado_processado: resultadoPersistencia,
            });
            resultado.payloadsSalvos++;
          }
        } else {
          // Dry run - apenas contar
          resultado.clientesSalvos += partes.filter(p => p.polo === 'ATIVO').length;
          resultado.partesContrariasSalvas += partes.filter(p => p.polo === 'PASSIVO').length;
          resultado.terceirosSalvos += partes.filter(p => p.polo === 'OUTROS').length;
          if (payloadBruto) {
            resultado.payloadsSalvos++;
          }
        }

        // Delay entre requisições
        if (i < processos.length - 1) {
          await delay(config.delay);
        }
      } catch (error) {
        resultado.erros++;
        const erroMsg = error instanceof Error ? error.message : String(error);
        resultado.detalhesErros.push({
          processoId: processo.id_pje,
          erro: erroMsg,
        });
        if (config.verbose) {
          console.log(`   ❌ Erro: ${erroMsg}`);
        }
      }
    }

    // Limpar linha de progresso
    if (!config.verbose) {
      process.stdout.write('\r' + ' '.repeat(60) + '\r');
    }

  } catch (error) {
    console.error('\n❌ Erro fatal:', error instanceof Error ? error.message : error);
    resultado.erros++;
  } finally {
    resultado.duracao = (Date.now() - inicio) / 1000;
  }

  // 5. Exibir resultado
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('📊 RESULTADO DA RE-CAPTURA');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`   Modo: ${resultado.dryRun ? 'DRY RUN (simulação)' : 'PRODUÇÃO'}`);
  console.log(`   Duração: ${resultado.duracao.toFixed(1)}s`);
  console.log(`   Processos analisados: ${resultado.processosAnalisados}`);
  console.log(`   Clientes salvos: ${resultado.clientesSalvos}`);
  console.log(`   Partes contrárias salvas: ${resultado.partesContrariasSalvas}`);
  console.log(`   Terceiros salvos: ${resultado.terceirosSalvos}`);
  console.log(`   Representantes salvos: ${resultado.representantesSalvos}`);
  console.log(`   Vínculos criados: ${resultado.vinculosCriados}`);
  console.log(`   Payloads MongoDB: ${resultado.payloadsSalvos}`);
  console.log(`   Erros: ${resultado.erros}`);

  if (resultado.detalhesErros.length > 0) {
    console.log('\n⚠️ Detalhes dos erros:');
    for (const erro of resultado.detalhesErros.slice(0, 10)) {
      console.log(`   - Processo ${erro.processoId}: ${erro.erro}`);
    }
    if (resultado.detalhesErros.length > 10) {
      console.log(`   ... e mais ${resultado.detalhesErros.length - 10} erros`);
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════════\n');

  // Salvar resultado em arquivo
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputPath = `scripts/results/reprocessamento-partes-${timestamp}.json`;
  
  try {
    const fs = await import('fs/promises');
    await fs.mkdir('scripts/results', { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(resultado, null, 2));
    console.log(`📄 Resultado salvo em: ${outputPath}`);
  } catch {
    console.warn('⚠️ Não foi possível salvar o resultado em arquivo');
  }

  process.exit(resultado.erros > 0 ? 1 : 0);
}

main().catch(console.error);

