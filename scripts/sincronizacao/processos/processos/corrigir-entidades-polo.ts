/**
 * Script: corrigir-entidades-polo.ts
 *
 * PROPÓSITO:
 * Corrige entidades que foram cadastradas na tabela errada devido à lógica
 * incorreta de usar POLO (ativo/passivo) em vez de TIPO DA PARTE (autor/réu).
 *
 * PROBLEMA:
 * - O polo é dinâmico (muda conforme o grau do processo)
 * - O tipo da parte é fixo (autor sempre é autor)
 * - Quase todos os clientes do escritório são PF (pessoa física) e autores
 * - Empresas no polo ATIVO foram cadastradas como clientes (errado)
 * - Pessoas físicas no polo PASSIVO foram cadastradas como partes contrárias (errado)
 *
 * CORREÇÃO:
 * 1. Clientes PJ (CNPJ) criados hoje → mover para partes_contrarias
 * 2. Partes contrárias PF (CPF) criadas hoje → mover para clientes
 * 3. Atualizar endereços vinculados
 *
 * USO:
 *   npx tsx scripts/sincronizacao/corrigir-entidades-polo.ts [opções]
 *
 * OPÇÕES:
 *   --dry-run        Simula sem persistir
 *   --verbose        Logs detalhados
 *   --data YYYY-MM-DD  Data de filtro (default: hoje)
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Carregar variáveis de ambiente ANTES de importar outros módulos
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

import { createServiceClient } from '@/backend/utils/supabase/service-client';

// ============================================================================
// TIPOS
// ============================================================================

interface ConfiguracaoScript {
  dryRun: boolean;
  verbose: boolean;
  dataFiltro: string; // YYYY-MM-DD
}

interface ResultadoScript {
  clientesPJMovidos: number;
  partesContrariaPFMovidas: number;
  enderecosAtualizados: number;
  erros: string[];
}

interface ClientePJ {
  id: number;
  nome: string;
  cnpj: string;
  tipo_pessoa: string;
  emails: string[] | null;
  endereco_id: number | null;
  created_at: string;
}

interface ParteContrariaPF {
  id: number;
  nome: string;
  cpf: string;
  tipo_pessoa: string;
  emails: string[] | null;
  sexo: string | null;
  data_nascimento: string | null;
  nome_genitora: string | null;
  endereco_id: number | null;
  created_at: string;
}

// ============================================================================
// HELPERS
// ============================================================================

function parseArgs(): ConfiguracaoScript {
  const args = process.argv.slice(2);
  const config: ConfiguracaoScript = {
    dryRun: false,
    verbose: false,
    dataFiltro: new Date().toISOString().split('T')[0], // Hoje por padrão
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--dry-run':
        config.dryRun = true;
        break;
      case '--verbose':
        config.verbose = true;
        break;
      case '--data':
        config.dataFiltro = args[++i];
        break;
    }
  }

  return config;
}

// ============================================================================
// MIGRAÇÃO: Clientes PJ → Partes Contrárias
// ============================================================================

async function moverClientesPJParaPartesContrarias(
  config: ConfiguracaoScript,
  resultado: ResultadoScript
): Promise<void> {
  const supabase = createServiceClient();

  console.log('\n📦 ETAPA 1: Movendo Clientes PJ → Partes Contrárias');
  console.log('─'.repeat(50));

  // Buscar clientes PJ criados na data especificada
  const { data: clientesPJ, error: fetchError } = await supabase
    .from('clientes')
    .select('id, nome, cnpj, tipo_pessoa, emails, endereco_id, created_at')
    .eq('tipo_pessoa', 'pj')
    .gte('created_at', `${config.dataFiltro}T00:00:00`)
    .lt('created_at', `${config.dataFiltro}T23:59:59.999`);

  if (fetchError) {
    resultado.erros.push(`Erro ao buscar clientes PJ: ${fetchError.message}`);
    return;
  }

  if (!clientesPJ || clientesPJ.length === 0) {
    console.log('  ℹ️  Nenhum cliente PJ encontrado para migrar');
    return;
  }

  console.log(`  📊 Encontrados: ${clientesPJ.length} clientes PJ`);

  for (const cliente of clientesPJ as ClientePJ[]) {
    try {
      if (config.verbose) {
        console.log(`\n  → Processando: ${cliente.nome} (CNPJ: ${cliente.cnpj})`);
      }

      if (config.dryRun) {
        console.log(`  [DRY-RUN] Moveria cliente ID ${cliente.id} para partes_contrarias`);
        resultado.clientesPJMovidos++;
        continue;
      }

      // 1. Verificar se já existe parte contrária com mesmo CNPJ
      const { data: existente } = await supabase
        .from('partes_contrarias')
        .select('id')
        .eq('cnpj', cliente.cnpj)
        .maybeSingle();

      let novoId: number;

      if (existente) {
        // Já existe, usar o ID existente
        novoId = existente.id;
        if (config.verbose) {
          console.log(`    ⚠️  Parte contrária já existe (ID: ${novoId})`);
        }
      } else {
        // 2. Inserir na tabela partes_contrarias
        const { data: novaParte, error: insertError } = await supabase
          .from('partes_contrarias')
          .insert({
            nome: cliente.nome,
            cnpj: cliente.cnpj,
            tipo_pessoa: 'pj',
            emails: cliente.emails,
          })
          .select('id')
          .single();

        if (insertError) {
          resultado.erros.push(`Erro ao inserir parte contrária ${cliente.nome}: ${insertError.message}`);
          continue;
        }

        novoId = novaParte.id;
        if (config.verbose) {
          console.log(`    ✅ Criada parte contrária ID: ${novoId}`);
        }
      }

      // 3. Atualizar endereços vinculados
      const { data: enderecosAtualizados, error: updateEndError } = await supabase
        .from('enderecos')
        .update({
          entidade_tipo: 'parte_contraria',
          entidade_id: novoId,
        })
        .eq('entidade_tipo', 'cliente')
        .eq('entidade_id', cliente.id)
        .select('id');

      if (updateEndError) {
        resultado.erros.push(`Erro ao atualizar endereços do cliente ${cliente.id}: ${updateEndError.message}`);
      } else if (enderecosAtualizados && enderecosAtualizados.length > 0) {
        resultado.enderecosAtualizados += enderecosAtualizados.length;
        if (config.verbose) {
          console.log(`    📍 ${enderecosAtualizados.length} endereço(s) atualizado(s)`);
        }
      }

      // 4. Atualizar endereco_id na nova parte contrária (se tinha)
      if (cliente.endereco_id) {
        await supabase
          .from('partes_contrarias')
          .update({ endereco_id: cliente.endereco_id })
          .eq('id', novoId);
      }

      // 5. Deletar o cliente original
      const { error: deleteError } = await supabase
        .from('clientes')
        .delete()
        .eq('id', cliente.id);

      if (deleteError) {
        resultado.erros.push(`Erro ao deletar cliente ${cliente.id}: ${deleteError.message}`);
        continue;
      }

      resultado.clientesPJMovidos++;
      if (config.verbose) {
        console.log(`    🗑️  Cliente ID ${cliente.id} removido`);
      }

    } catch (error) {
      resultado.erros.push(`Erro ao processar cliente ${cliente.nome}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  console.log(`\n  ✅ ${resultado.clientesPJMovidos} clientes PJ movidos para partes_contrarias`);
}

// ============================================================================
// MIGRAÇÃO: Partes Contrárias PF → Clientes
// ============================================================================

async function moverPartesContrariasPFParaClientes(
  config: ConfiguracaoScript,
  resultado: ResultadoScript
): Promise<void> {
  const supabase = createServiceClient();

  console.log('\n📦 ETAPA 2: Movendo Partes Contrárias PF → Clientes');
  console.log('─'.repeat(50));

  // Buscar partes contrárias PF criadas na data especificada
  const { data: partesPF, error: fetchError } = await supabase
    .from('partes_contrarias')
    .select('id, nome, cpf, tipo_pessoa, emails, sexo, data_nascimento, nome_genitora, endereco_id, created_at')
    .eq('tipo_pessoa', 'pf')
    .gte('created_at', `${config.dataFiltro}T00:00:00`)
    .lt('created_at', `${config.dataFiltro}T23:59:59.999`);

  if (fetchError) {
    resultado.erros.push(`Erro ao buscar partes contrárias PF: ${fetchError.message}`);
    return;
  }

  if (!partesPF || partesPF.length === 0) {
    console.log('  ℹ️  Nenhuma parte contrária PF encontrada para migrar');
    return;
  }

  console.log(`  📊 Encontradas: ${partesPF.length} partes contrárias PF`);

  for (const parte of partesPF as ParteContrariaPF[]) {
    try {
      if (config.verbose) {
        console.log(`\n  → Processando: ${parte.nome} (CPF: ${parte.cpf})`);
      }

      if (config.dryRun) {
        console.log(`  [DRY-RUN] Moveria parte contrária ID ${parte.id} para clientes`);
        resultado.partesContrariaPFMovidas++;
        continue;
      }

      // 1. Verificar se já existe cliente com mesmo CPF
      const { data: existente } = await supabase
        .from('clientes')
        .select('id')
        .eq('cpf', parte.cpf)
        .maybeSingle();

      let novoId: number;

      if (existente) {
        // Já existe, usar o ID existente
        novoId = existente.id;
        if (config.verbose) {
          console.log(`    ⚠️  Cliente já existe (ID: ${novoId})`);
        }
      } else {
        // 2. Inserir na tabela clientes
        const { data: novoCliente, error: insertError } = await supabase
          .from('clientes')
          .insert({
            nome: parte.nome,
            cpf: parte.cpf,
            tipo_pessoa: 'pf',
            emails: parte.emails,
            sexo: parte.sexo,
            data_nascimento: parte.data_nascimento,
            nome_genitora: parte.nome_genitora,
          })
          .select('id')
          .single();

        if (insertError) {
          resultado.erros.push(`Erro ao inserir cliente ${parte.nome}: ${insertError.message}`);
          continue;
        }

        novoId = novoCliente.id;
        if (config.verbose) {
          console.log(`    ✅ Criado cliente ID: ${novoId}`);
        }
      }

      // 3. Atualizar endereços vinculados
      const { data: enderecosAtualizados, error: updateEndError } = await supabase
        .from('enderecos')
        .update({
          entidade_tipo: 'cliente',
          entidade_id: novoId,
        })
        .eq('entidade_tipo', 'parte_contraria')
        .eq('entidade_id', parte.id)
        .select('id');

      if (updateEndError) {
        resultado.erros.push(`Erro ao atualizar endereços da parte ${parte.id}: ${updateEndError.message}`);
      } else if (enderecosAtualizados && enderecosAtualizados.length > 0) {
        resultado.enderecosAtualizados += enderecosAtualizados.length;
        if (config.verbose) {
          console.log(`    📍 ${enderecosAtualizados.length} endereço(s) atualizado(s)`);
        }
      }

      // 4. Atualizar endereco_id no novo cliente (se tinha)
      if (parte.endereco_id) {
        await supabase
          .from('clientes')
          .update({ endereco_id: parte.endereco_id })
          .eq('id', novoId);
      }

      // 5. Deletar a parte contrária original
      const { error: deleteError } = await supabase
        .from('partes_contrarias')
        .delete()
        .eq('id', parte.id);

      if (deleteError) {
        resultado.erros.push(`Erro ao deletar parte contrária ${parte.id}: ${deleteError.message}`);
        continue;
      }

      resultado.partesContrariaPFMovidas++;
      if (config.verbose) {
        console.log(`    🗑️  Parte contrária ID ${parte.id} removida`);
      }

    } catch (error) {
      resultado.erros.push(`Erro ao processar parte ${parte.nome}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  console.log(`\n  ✅ ${resultado.partesContrariaPFMovidas} partes contrárias PF movidas para clientes`);
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  const config = parseArgs();

  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  CORREÇÃO DE ENTIDADES - POLO vs TIPO DA PARTE');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');

  if (config.dryRun) {
    console.log('🔸 MODO DRY-RUN: Nenhuma alteração será persistida\n');
  }

  console.log(`📅 Data de filtro: ${config.dataFiltro}`);

  const resultado: ResultadoScript = {
    clientesPJMovidos: 0,
    partesContrariaPFMovidas: 0,
    enderecosAtualizados: 0,
    erros: [],
  };

  const startTime = Date.now();

  try {
    // Etapa 1: Clientes PJ → Partes Contrárias
    await moverClientesPJParaPartesContrarias(config, resultado);

    // Etapa 2: Partes Contrárias PF → Clientes
    await moverPartesContrariasPFParaClientes(config, resultado);

  } catch (error) {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  // Relatório final
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  RELATÓRIO FINAL');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log(`⏱️  Duração: ${duration}s`);
  console.log('');
  console.log('📊 MIGRAÇÕES:');
  console.log(`   ├─ Clientes PJ → Partes Contrárias: ${resultado.clientesPJMovidos}`);
  console.log(`   └─ Partes Contrárias PF → Clientes: ${resultado.partesContrariaPFMovidas}`);
  console.log('');
  console.log(`📍 Endereços atualizados: ${resultado.enderecosAtualizados}`);
  console.log('');
  console.log(`❌ Erros: ${resultado.erros.length}`);

  if (resultado.erros.length > 0) {
    console.log('\nDetalhes dos erros:');
    resultado.erros.slice(0, 10).forEach((erro, i) => {
      console.log(`   ${i + 1}. ${erro}`);
    });
    if (resultado.erros.length > 10) {
      console.log(`   ... e mais ${resultado.erros.length - 10} erros`);
    }
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
}

main().catch(console.error);
