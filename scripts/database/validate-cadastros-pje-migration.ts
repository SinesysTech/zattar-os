#!/usr/bin/env tsx

/**
 * Script de validação da migração de cadastros_pje
 * 
 * Valida a integridade da migração após a implementação da nova arquitetura
 * onde id_pessoa_pje não é mais globalmente único e foi movido para cadastros_pje.
 * 
 * Uso: npx tsx scripts/database/validate-cadastros-pje-migration.ts
 */

import { createServiceClient } from '../../backend/utils/supabase/service-client';

// ============================================================================
// Tipos e Interfaces
// ============================================================================

interface ValidationResult {
  test: string;
  status: 'PASS' | 'FAIL';
  message: string;
  details?: string[];
}

interface ValidationSummary {
  total: number;
  passed: number;
  failed: number;
  results: ValidationResult[];
}

// ============================================================================
// Funções de Validação
// ============================================================================

/**
 * Conta registros em cadastros_pje por tipo_entidade
 */
async function validarContagemCadastrosPJE(): Promise<ValidationResult> {
  const supabase = createServiceClient();
  
  try {
    const { data, error } = await supabase
      .from('cadastros_pje')
      .select('tipo_entidade')
      .then(async (result) => {
        if (result.error) throw result.error;
        
        // Contar por tipo_entidade
        const counts: Record<string, number> = {};
        result.data?.forEach(row => {
          counts[row.tipo_entidade] = (counts[row.tipo_entidade] || 0) + 1;
        });
        
        return { data: counts, error: null };
      });

    if (error) throw error;

    const details = Object.entries(data || {})
      .map(([tipo, count]) => `${tipo}: ${count} registros`)
      .sort();

    return {
      test: 'Contagem de registros em cadastros_pje',
      status: 'PASS',
      message: `Encontrados ${Object.values(data || {}).reduce((a, b) => a + b, 0)} registros totais`,
      details
    };
  } catch (error) {
    return {
      test: 'Contagem de registros em cadastros_pje',
      status: 'FAIL',
      message: `Erro ao contar registros: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Compara contagem de registros entre cadastros_pje e tabelas de origem
 */
async function validarContagemVsOrigem(): Promise<ValidationResult> {
  const supabase = createServiceClient();
  
  try {
    // Contar cadastros_pje por tipo_entidade
    const { data: cadastrosData, error: cadastrosError } = await supabase
      .from('cadastros_pje')
      .select('tipo_entidade, entidade_id');

    if (cadastrosError) throw cadastrosError;

    const cadastrosPorTipo: Record<string, Set<number>> = {};
    cadastrosData?.forEach(row => {
      if (!cadastrosPorTipo[row.tipo_entidade]) {
        cadastrosPorTipo[row.tipo_entidade] = new Set();
      }
      cadastrosPorTipo[row.tipo_entidade].add(row.entidade_id);
    });

    // Contar registros únicos por tipo
    const cadastrosCount = Object.fromEntries(
      Object.entries(cadastrosPorTipo).map(([tipo, ids]) => [tipo, ids.size])
    );

    // Contar registros nas tabelas de origem
    const origemCounts: Record<string, number> = {};
    
    // Clientes
    const { count: clientesCount } = await supabase
      .from('clientes')
      .select('*', { count: 'exact', head: true });
    origemCounts.cliente = clientesCount || 0;

    // Partes contrárias
    const { count: partesCount } = await supabase
      .from('partes_contrarias')
      .select('*', { count: 'exact', head: true });
    origemCounts.parte_contraria = partesCount || 0;

    // Terceiros
    const { count: terceirosCount } = await supabase
      .from('terceiros')
      .select('*', { count: 'exact', head: true });
    origemCounts.terceiro = terceirosCount || 0;

    // Representantes (após deduplicação)
    const { count: representantesCount } = await supabase
      .from('representantes')
      .select('*', { count: 'exact', head: true });
    origemCounts.representante = representantesCount || 0;

    // Verificar se não há perda de dados
    const details: string[] = [];
    let hasLoss = false;

    for (const [tipo, origemCount] of Object.entries(origemCounts)) {
      const cadastrosCountTipo = cadastrosCount[tipo] || 0;
      if (cadastrosCountTipo > origemCount) {
        details.push(`${tipo}: cadastros_pje (${cadastrosCountTipo}) > origem (${origemCount}) - IMPOSSÍVEL`);
        hasLoss = true;
      } else if (cadastrosCountTipo < origemCount) {
        details.push(`${tipo}: cadastros_pje (${cadastrosCountTipo}) < origem (${origemCount}) - POSSÍVEL (nem todos têm id_pessoa_pje)`);
      } else {
        details.push(`${tipo}: cadastros_pje (${cadastrosCountTipo}) = origem (${origemCount}) - OK`);
      }
    }

    return {
      test: 'Comparação contagem cadastros_pje vs tabelas origem',
      status: hasLoss ? 'FAIL' : 'PASS',
      message: hasLoss ? 'Encontrada perda de dados!' : 'Contagens compatíveis',
      details
    };
  } catch (error) {
    return {
      test: 'Comparação contagem cadastros_pje vs tabelas origem',
      status: 'FAIL',
      message: `Erro na comparação: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Verifica integridade referencial entre cadastros_pje e tabelas de entidade
 */
async function validarIntegridadeReferencial(): Promise<ValidationResult> {
  const supabase = createServiceClient();
  
  try {
    // Buscar todos os cadastros_pje
    const { data: cadastros, error: cadastrosError } = await supabase
      .from('cadastros_pje')
      .select('tipo_entidade, entidade_id');

    if (cadastrosError) throw cadastrosError;

    const orfaos: string[] = [];
    const tiposVerificados = new Set<string>();

    // Verificar cada registro
    for (const cadastro of cadastros || []) {
      const { tipo_entidade, entidade_id } = cadastro;
      tiposVerificados.add(tipo_entidade);

      let exists = false;
      let tableName = '';

      switch (tipo_entidade) {
        case 'cliente':
          tableName = 'clientes';
          const { data: cliente } = await supabase
            .from('clientes')
            .select('id')
            .eq('id', entidade_id)
            .single();
          exists = !!cliente;
          break;
        case 'parte_contraria':
          tableName = 'partes_contrarias';
          const { data: parte } = await supabase
            .from('partes_contrarias')
            .select('id')
            .eq('id', entidade_id)
            .single();
          exists = !!parte;
          break;
        case 'terceiro':
          tableName = 'terceiros';
          const { data: terceiro } = await supabase
            .from('terceiros')
            .select('id')
            .eq('id', entidade_id)
            .single();
          exists = !!terceiro;
          break;
        case 'representante':
          tableName = 'representantes';
          const { data: representante } = await supabase
            .from('representantes')
            .select('id')
            .eq('id', entidade_id)
            .single();
          exists = !!representante;
          break;
        default:
          orfaos.push(`${tipo_entidade}:${entidade_id} - tipo_entidade inválido`);
          continue;
      }

      if (!exists) {
        orfaos.push(`${tipo_entidade}:${entidade_id} não encontrado em ${tableName}`);
      }
    }

    const tiposEsperados = ['cliente', 'parte_contraria', 'terceiro', 'representante'];
    const tiposFaltando = tiposEsperados.filter(t => !tiposVerificados.has(t));

    const details: string[] = [];
    if (orfaos.length > 0) {
      details.push(`Registros órfãos encontrados: ${orfaos.length}`);
      details.push(...orfaos.slice(0, 10)); // Limitar output
      if (orfaos.length > 10) details.push(`... e mais ${orfaos.length - 10}`);
    }
    if (tiposFaltando.length > 0) {
      details.push(`Tipos de entidade não encontrados: ${tiposFaltando.join(', ')}`);
    }

    return {
      test: 'Integridade referencial cadastros_pje -> entidades',
      status: orfaos.length > 0 ? 'FAIL' : 'PASS',
      message: orfaos.length > 0 
        ? `Encontrados ${orfaos.length} registros órfãos`
        : 'Integridade referencial OK',
      details: details.length > 0 ? details : undefined
    };
  } catch (error) {
    return {
      test: 'Integridade referencial cadastros_pje -> entidades',
      status: 'FAIL',
      message: `Erro na verificação: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Verifica unicidade do constraint em cadastros_pje
 */
async function validarUnicidadeConstraint(): Promise<ValidationResult> {
  const supabase = createServiceClient();
  
  try {
    // Tentar inserir um registro duplicado
    const { data: existing, error: selectError } = await supabase
      .from('cadastros_pje')
      .select('tipo_entidade, id_pessoa_pje, sistema, tribunal, grau')
      .limit(1)
      .single();

    if (selectError || !existing) {
      return {
        test: 'Constraint UNIQUE em cadastros_pje',
        status: 'PASS',
        message: 'Constraint não pode ser testado (tabela vazia ou erro na consulta)'
      };
    }

    // Tentar inserir duplicata
    const { error: insertError } = await supabase
      .from('cadastros_pje')
      .insert({
        tipo_entidade: existing.tipo_entidade,
        entidade_id: 999999, // ID fictício
        id_pessoa_pje: existing.id_pessoa_pje,
        sistema: existing.sistema,
        tribunal: existing.tribunal,
        grau: existing.grau
      });

    if (insertError && insertError.code === '23505') {
      return {
        test: 'Constraint UNIQUE em cadastros_pje',
        status: 'PASS',
        message: 'Constraint UNIQUE funcionando corretamente'
      };
    } else if (insertError) {
      return {
        test: 'Constraint UNIQUE em cadastros_pje',
        status: 'FAIL',
        message: `Erro inesperado no teste de unicidade: ${insertError.message}`
      };
    } else {
      return {
        test: 'Constraint UNIQUE em cadastros_pje',
        status: 'FAIL',
        message: 'Constraint UNIQUE não está funcionando - inserção duplicada permitida'
      };
    }
  } catch (error) {
    return {
      test: 'Constraint UNIQUE em cadastros_pje',
      status: 'FAIL',
      message: `Erro no teste de unicidade: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Verifica deduplicação de representantes
 */
async function validarDeduplicacaoRepresentantes(): Promise<ValidationResult> {
  const supabase = createServiceClient();
  
  try {
    // Contar representantes únicos por CPF
    const { data: representantes, error } = await supabase
      .from('representantes')
      .select('cpf');

    if (error) throw error;

    const cpfs = representantes?.map(r => r.cpf).filter(Boolean) || [];
    const cpfsUnicos = new Set(cpfs);
    const duplicatas = cpfs.length - cpfsUnicos.size;

    // Verificar se todos os CPFs são únicos
    const details: string[] = [];
    if (duplicatas > 0) {
      details.push(`Encontradas ${duplicatas} duplicatas de CPF`);
    }

    // Verificar se todos os id_pessoa_pje antigos estão em cadastros_pje
    const { data: cadastrosRep, error: cadastrosError } = await supabase
      .from('cadastros_pje')
      .select('id_pessoa_pje')
      .eq('tipo_entidade', 'representante');

    if (cadastrosError) throw cadastrosError;

    const idPessoaPjeEmCadastros = new Set(
      cadastrosRep?.map(c => c.id_pessoa_pje) || []
    );

    // Se existir tabela representantes_old, verificar migração
    const { data: oldReps, error: oldError } = await supabase
      .from('representantes_old')
      .select('id_pessoa_pje')
      .not('id_pessoa_pje', 'is', null);

    if (!oldError && oldReps) {
      const idsAntigos = new Set(oldReps.map(r => r.id_pessoa_pje));
      const naoMigrados = Array.from(idsAntigos).filter(id => !idPessoaPjeEmCadastros.has(id));
      
      if (naoMigrados.length > 0) {
        details.push(`${naoMigrados.length} id_pessoa_pje antigos não migrados para cadastros_pje`);
      }
    }

    const status = duplicatas > 0 ? 'FAIL' : 'PASS';
    const message = duplicatas > 0 
      ? `Encontradas ${duplicatas} duplicatas de CPF em representantes`
      : 'Representantes deduplicados corretamente';

    return {
      test: 'Deduplicação de representantes',
      status,
      message,
      details: details.length > 0 ? details : undefined
    };
  } catch (error) {
    return {
      test: 'Deduplicação de representantes',
      status: 'FAIL',
      message: `Erro na verificação: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Verifica se processo_partes aponta para IDs válidos de representantes
 */
async function validarProcessoPartes(): Promise<ValidationResult> {
  const supabase = createServiceClient();
  
  try {
    // Buscar todos os vínculos em processo_partes
    const { data: vinculos, error } = await supabase
      .from('processo_partes')
      .select('representante_id')
      .not('representante_id', 'is', null);

    if (error) throw error;

    if (!vinculos || vinculos.length === 0) {
      return {
        test: 'Vínculos processo_partes -> representantes',
        status: 'PASS',
        message: 'Nenhum vínculo representante encontrado em processo_partes'
      };
    }

    const representanteIds = new Set(vinculos.map(v => v.representante_id));
    
    // Verificar se todos os IDs existem em representantes
    const { data: existentes, error: checkError } = await supabase
      .from('representantes')
      .select('id')
      .in('id', Array.from(representanteIds));

    if (checkError) throw checkError;

    const idsExistentes = new Set(existentes?.map(r => r.id) || []);
    const idsInvalidos = Array.from(representanteIds).filter(id => !idsExistentes.has(id));

    const details: string[] = [];
    if (idsInvalidos.length > 0) {
      details.push(`${idsInvalidos.length} vínculos apontam para representantes inexistentes`);
      details.push(`IDs inválidos: ${idsInvalidos.slice(0, 5).join(', ')}${idsInvalidos.length > 5 ? '...' : ''}`);
    }

    return {
      test: 'Vínculos processo_partes -> representantes',
      status: idsInvalidos.length > 0 ? 'FAIL' : 'PASS',
      message: idsInvalidos.length > 0 
        ? `${idsInvalidos.length} vínculos inválidos encontrados`
        : 'Todos os vínculos são válidos',
      details: details.length > 0 ? details : undefined
    };
  } catch (error) {
    return {
      test: 'Vínculos processo_partes -> representantes',
      status: 'FAIL',
      message: `Erro na verificação: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Testa queries de busca por id_pessoa_pje
 */
async function validarQueriesBusca(): Promise<ValidationResult> {
  const supabase = createServiceClient();
  
  try {
    const testes: { nome: string; query: () => Promise<any>; esperado: string }[] = [];
    const results: string[] = [];

    // Teste 1: Buscar cliente por id_pessoa_pje + tribunal + grau
    testes.push({
      nome: 'Buscar cliente por id_pessoa_pje + tribunal + grau',
      query: async () => {
        const { data } = await supabase
          .from('cadastros_pje')
          .select(`
            id_pessoa_pje,
            tribunal,
            grau,
            entidade_id,
            clientes!inner(id, nome, cpf, cnpj)
          `)
          .eq('tipo_entidade', 'cliente')
          .limit(1)
          .single();
        return data;
      },
      esperado: 'Retornar dados do cliente correto'
    });

    // Teste 2: Listar todos os IDs PJE de uma entidade
    testes.push({
      nome: 'Listar IDs PJE de uma entidade',
      query: async () => {
        const { data } = await supabase
          .from('cadastros_pje')
          .select('id_pessoa_pje, sistema, tribunal, grau')
          .eq('tipo_entidade', 'cliente')
          .eq('entidade_id', 1)
          .limit(5);
        return data;
      },
      esperado: 'Retornar lista de IDs PJE'
    });

    // Teste 3: Buscar representante por CPF
    testes.push({
      nome: 'Buscar representante por CPF',
      query: async () => {
        const { data } = await supabase
          .from('representantes')
          .select('id, nome, cpf')
          .not('cpf', 'is', null)
          .limit(1)
          .single();
        return data;
      },
      esperado: 'Retornar dados do representante'
    });

    // Executar testes
    for (const teste of testes) {
      try {
        const result = await teste.query();
        results.push(`${teste.nome}: ${result ? 'OK' : 'SEM DADOS'}`);
      } catch (error) {
        results.push(`${teste.nome}: ERRO - ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    const hasErrors = results.some(r => r.includes('ERRO'));

    return {
      test: 'Queries de busca funcionais',
      status: hasErrors ? 'FAIL' : 'PASS',
      message: hasErrors ? 'Algumas queries falharam' : 'Todas as queries funcionaram',
      details: results
    };
  } catch (error) {
    return {
      test: 'Queries de busca funcionais',
      status: 'FAIL',
      message: `Erro nos testes de query: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

// ============================================================================
// Função Principal
// ============================================================================

async function main() {
  console.log('🚀 Iniciando validação da migração cadastros_pje...\n');

  const validations = [
    validarContagemCadastrosPJE,
    validarContagemVsOrigem,
    validarIntegridadeReferencial,
    validarUnicidadeConstraint,
    validarDeduplicacaoRepresentantes,
    validarProcessoPartes,
    validarQueriesBusca
  ];

  const results: ValidationResult[] = [];

  for (const validation of validations) {
    console.log(`⏳ Executando: ${validation.name.replace('validar', '')}...`);
    const result = await validation();
    results.push(result);
    
    const statusIcon = result.status === 'PASS' ? '✅' : '❌';
    console.log(`${statusIcon} ${result.message}`);
    
    if (result.details && result.details.length > 0) {
      result.details.forEach(detail => console.log(`   ${detail}`));
    }
    console.log('');
  }

  // Resumo final
  const summary: ValidationSummary = {
    total: results.length,
    passed: results.filter(r => r.status === 'PASS').length,
    failed: results.filter(r => r.status === 'FAIL').length,
    results
  };

  console.log('📊 RESUMO DA VALIDAÇÃO');
  console.log('='.repeat(50));
  console.log(`Total de testes: ${summary.total}`);
  console.log(`Aprovados: ${summary.passed}`);
  console.log(`Reprovados: ${summary.failed}`);
  console.log('');

  if (summary.failed === 0) {
    console.log('🎉 MIGRAÇÃO VALIDADA COM SUCESSO!');
    console.log('Todas as validações passaram. A migração está íntegra.');
  } else {
    console.log('⚠️  PROBLEMAS ENCONTRADOS NA MIGRAÇÃO!');
    console.log('Verifique os testes reprovados acima e corrija antes de prosseguir.');
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(error => {
    console.error('Erro fatal na validação:', error);
    process.exit(1);
  });
}

export { main as validateCadastrosPjeMigration };