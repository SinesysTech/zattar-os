// Script para popular acervo.classe_judicial_id a partir de acervo.classe_judicial (text)
// Vincula processos às classes judiciais normalizadas

// Carregar variáveis de ambiente do .env.local
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });
config(); // Carregar .env também se existir

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import { buscarClasseJudicial } from '@/backend/captura/services/persistence/classe-judicial-persistence.service';
import type { CodigoTRT, GrauTRT } from '@/backend/types/captura/trt-types';

/**
 * Estatísticas de processamento
 */
interface Estatisticas {
  processosProcessados: number;
  vinculados: number;
  jaVinculados: number;
  naoEncontrados: number;
  erros: number;
}

/**
 * Popular classe_judicial_id no acervo
 */
async function popularClasseJudicialAcervo(): Promise<void> {
  const supabase = createServiceClient();

  const stats: Estatisticas = {
    processosProcessados: 0,
    vinculados: 0,
    jaVinculados: 0,
    naoEncontrados: 0,
    erros: 0,
  };

  console.log('\n🚀 Iniciando população de classe_judicial_id em acervo\n');

  try {
    // Buscar todos os processos que ainda não têm classe_judicial_id vinculada
    // mas que têm classe_judicial (text) preenchida
    const { data: processos, error } = await supabase
      .from('acervo')
      .select('id, trt, grau, classe_judicial, classe_judicial_id')
      .not('classe_judicial', 'is', null)
      .order('id', { ascending: true });

    if (error) {
      throw new Error(`Erro ao buscar processos: ${error.message}`);
    }

    if (!processos || processos.length === 0) {
      console.log('ℹ️  Nenhum processo encontrado para processar');
      return;
    }

    console.log(`📊 Total de processos a processar: ${processos.length}\n`);

    // Processar cada processo
    for (const processo of processos) {
      stats.processosProcessados++;

      // Se já tem classe_judicial_id vinculada, pular
      if (processo.classe_judicial_id) {
        stats.jaVinculados++;
        continue;
      }

      try {
        const trt = processo.trt as CodigoTRT;
        const grau = processo.grau as GrauTRT;
        const classeText = processo.classe_judicial as string;

        // Buscar classe judicial pela sigla (mais confiável que descrição)
        // A coluna classe_judicial no acervo geralmente contém a sigla (ex: ATOrd, ATSum)
        const { data: classes, error: searchError } = await supabase
          .from('classe_judicial')
          .select('id')
          .eq('trt', trt)
          .eq('grau', grau)
          .eq('sigla', classeText)
          .limit(1);

        if (searchError) {
          throw searchError;
        }

        if (classes && classes.length > 0) {
          const classeJudicialId = classes[0].id;

          // Atualizar processo com classe_judicial_id
          const { error: updateError } = await supabase
            .from('acervo')
            .update({ classe_judicial_id: classeJudicialId })
            .eq('id', processo.id);

          if (updateError) {
            throw updateError;
          }

          stats.vinculados++;

          if (stats.processosProcessados % 100 === 0) {
            console.log(`  ⏳ Processados: ${stats.processosProcessados} | Vinculados: ${stats.vinculados}`);
          }
        } else {
          stats.naoEncontrados++;
          
          if (stats.naoEncontrados <= 10) {
            console.log(`  ⚠️  Classe judicial não encontrada: ${classeText} (TRT: ${trt}, Grau: ${grau})`);
          }
        }
      } catch (error) {
        stats.erros++;
        console.error(`  ❌ Erro ao processar processo ${processo.id}:`, error);
      }
    }

    // Mostrar resumo final
    console.log(`\n${'='.repeat(80)}`);
    console.log('📊 RESUMO FINAL');
    console.log(`${'='.repeat(80)}`);
    console.log(`\n📦 Processos processados: ${stats.processosProcessados}`);
    console.log(`✅ Vinculados: ${stats.vinculados}`);
    console.log(`⏭️  Já vinculados: ${stats.jaVinculados}`);
    console.log(`⚠️  Não encontrados: ${stats.naoEncontrados}`);
    console.log(`❌ Erros: ${stats.erros}`);

    if (stats.naoEncontrados > 10) {
      console.log(`\nℹ️  Total de ${stats.naoEncontrados} classes judiciais não encontradas (mostrando apenas as 10 primeiras)`);
    }

    if (stats.erros > 0) {
      console.log(`\n⚠️  Total de erros: ${stats.erros}`);
    } else {
      console.log(`\n✅ Nenhum erro encontrado!`);
    }
  } catch (error) {
    console.error('\n❌ Erro ao popular classe_judicial_id:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  popularClasseJudicialAcervo()
    .then(() => {
      console.log('\n✅ População de classe_judicial_id concluída com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ População de classe_judicial_id falhou:', error);
      process.exit(1);
    });
}

export { popularClasseJudicialAcervo };
