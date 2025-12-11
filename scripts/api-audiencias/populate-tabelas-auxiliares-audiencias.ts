// Script para popular tabelas auxiliares de audiências a partir de arquivos JSON
// Popula: classe_judicial, tipo_audiencia, sala_audiencia, orgao_julgador
// A partir dos arquivos JSON em: dev_data/scripts/results/api-audiencias

// Carregar variáveis de ambiente do .env.local
import { config } from 'dotenv';
import { resolve, join, dirname } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });
config(); // Carregar .env também se existir

import { readdir, readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import type { CodigoTRT, GrauTRT } from '@/features/captura';
import { salvarClasseJudicial } from '@/features/captura/services/persistence/classe-judicial-persistence.service';
import { salvarTipoAudiencia } from '@/features/captura/services/persistence/tipo-audiencia-persistence.service';
import { salvarSalaAudiencia } from '@/features/captura/services/persistence/sala-audiencia-persistence.service';
import { salvarOrgaoJulgador, buscarOrgaoJulgador } from '@/features/captura/services/persistence/orgao-julgador-persistence.service';

/**
 * Obter __dirname em módulos ES
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Diretório de resultados
 */
const RESULTS_DIR = join(__dirname, 'results', 'api-audiencias');

/**
 * Interface do arquivo JSON de resultados
 */
interface ResultadoJSON {
  timestamp: string;
  trtCodigo: CodigoTRT;
  grau: GrauTRT;
  advogadoId: number;
  resultado: {
    success: boolean;
    data?: {
      audiencias?: Array<{
        id: number;
        processo?: {
          id: number;
          numero: string;
          classeJudicial?: {
            id: number;
            codigo: string;
            descricao: string;
            sigla: string;
            requerProcessoReferenciaCodigo?: string;
            controlaValorCausa?: boolean;
            podeIncluirAutoridade?: boolean;
            pisoValorCausa?: number;
            tetoValorCausa?: number;
            ativo?: boolean;
            idClasseJudicialPai?: number;
            possuiFilhos?: boolean;
          };
          orgaoJulgador?: {
            id: number;
            descricao: string;
            cejusc?: boolean;
            ativo?: boolean;
            postoAvancado?: boolean;
            novoOrgaoJulgador?: boolean;
            codigoServentiaCnj?: number;
          };
        };
        tipo?: {
          id: number;
          descricao: string;
          codigo: string;
          isVirtual: boolean;
        };
        salaAudiencia?: {
          nome: string;
          id?: number;
        };
      }>;
    };
  };
}

/**
 * Estatísticas de processamento
 */
interface Estatisticas {
  arquivosProcessados: number;
  audienciasProcessadas: number;
  classesJudiciais: {
    inseridas: number;
    atualizadas: number;
    descartadas: number;
    erros: number;
  };
  tiposAudiencia: {
    inseridos: number;
    atualizados: number;
    descartados: number;
    erros: number;
  };
  salasAudiencia: {
    inseridas: number;
    atualizadas: number;
    descartadas: number;
    erros: number;
  };
  orgaosJulgadores: {
    inseridos: number;
    atualizados: number;
    descartados: number;
    erros: number;
  };
}

/**
 * Inicializar estatísticas
 */
function inicializarEstatisticas(): Estatisticas {
  return {
    arquivosProcessados: 0,
    audienciasProcessadas: 0,
    classesJudiciais: { inseridas: 0, atualizadas: 0, descartadas: 0, erros: 0 },
    tiposAudiencia: { inseridos: 0, atualizados: 0, descartados: 0, erros: 0 },
    salasAudiencia: { inseridas: 0, atualizadas: 0, descartadas: 0, erros: 0 },
    orgaosJulgadores: { inseridos: 0, atualizados: 0, descartados: 0, erros: 0 },
  };
}

/**
 * Processar um arquivo JSON de resultados
 */
async function processarArquivo(
  trtDir: string,
  arquivo: string,
  stats: Estatisticas
): Promise<void> {
  const arquivoPath = join(trtDir, arquivo);
  console.log(`\n📄 Processando: ${arquivo}`);

  try {
    const conteudo = await readFile(arquivoPath, 'utf-8');
    const dados: ResultadoJSON = JSON.parse(conteudo);

    if (!dados.resultado.success || !dados.resultado.data?.audiencias) {
      console.log(`  ⚠️  Arquivo sem dados de audiências ou com erro`);
      return;
    }

    const { trtCodigo, grau } = dados;
    const audiencias = dados.resultado.data.audiencias;

    console.log(`  📊 TRT: ${trtCodigo} | Grau: ${grau} | Audiências: ${audiencias.length}`);

    // Processar cada audiência
    for (const audiencia of audiencias) {
      stats.audienciasProcessadas++;

      // 1. Processar Classe Judicial
      if (audiencia.processo?.classeJudicial) {
        try {
          const resultado = await salvarClasseJudicial({
            classeJudicial: audiencia.processo.classeJudicial,
            trt: trtCodigo,
            grau,
          });

          if (resultado.inserido) {
            stats.classesJudiciais.inseridas++;
          } else if (resultado.atualizado) {
            stats.classesJudiciais.atualizadas++;
          } else if (resultado.descartado) {
            stats.classesJudiciais.descartadas++;
          }
        } catch (error) {
          stats.classesJudiciais.erros++;
          console.error(`  ❌ Erro ao salvar classe judicial ${audiencia.processo.classeJudicial.id}:`, error);
        }
      }

      // 2. Processar Órgão Julgador
      if (audiencia.processo?.orgaoJulgador) {
        try {
          // Verificar se já existe
          const existe = await buscarOrgaoJulgador(
            audiencia.processo.orgaoJulgador.id,
            trtCodigo,
            grau
          );

          if (!existe) {
            await salvarOrgaoJulgador({
              orgaoJulgador: {
                id: audiencia.processo.orgaoJulgador.id,
                descricao: audiencia.processo.orgaoJulgador.descricao,
                cejusc: audiencia.processo.orgaoJulgador.cejusc ?? false,
                ativo: audiencia.processo.orgaoJulgador.ativo ?? false,
                postoAvancado: audiencia.processo.orgaoJulgador.postoAvancado ?? false,
                novoOrgaoJulgador: audiencia.processo.orgaoJulgador.novoOrgaoJulgador ?? false,
                codigoServentiaCnj: audiencia.processo.orgaoJulgador.codigoServentiaCnj ?? 0,
              },
              trt: trtCodigo,
              grau,
            });
            stats.orgaosJulgadores.inseridos++;
          } else {
            stats.orgaosJulgadores.descartados++;
          }
        } catch (error) {
          stats.orgaosJulgadores.erros++;
          console.error(`  ❌ Erro ao salvar órgão julgador ${audiencia.processo.orgaoJulgador.id}:`, error);
        }
      }

      // 3. Processar Tipo de Audiência
      if (audiencia.tipo) {
        try {
          const resultado = await salvarTipoAudiencia({
            tipoAudiencia: audiencia.tipo,
            trt: trtCodigo,
            grau,
          });

          if (resultado.inserido) {
            stats.tiposAudiencia.inseridos++;
          } else if (resultado.atualizado) {
            stats.tiposAudiencia.atualizados++;
          } else if (resultado.descartado) {
            stats.tiposAudiencia.descartados++;
          }
        } catch (error) {
          stats.tiposAudiencia.erros++;
          console.error(`  ❌ Erro ao salvar tipo de audiência ${audiencia.tipo.id}:`, error);
        }
      }

      // 4. Processar Sala de Audiência
      if (audiencia.salaAudiencia?.nome && audiencia.processo?.orgaoJulgador) {
        try {
          // Buscar ID do órgão julgador
          const orgaoJulgador = await buscarOrgaoJulgador(
            audiencia.processo.orgaoJulgador.id,
            trtCodigo,
            grau
          );

          if (orgaoJulgador) {
            const resultado = await salvarSalaAudiencia({
              salaAudiencia: audiencia.salaAudiencia,
              trt: trtCodigo,
              grau,
              orgaoJulgadorId: orgaoJulgador.id,
            });

            if (resultado.inserido) {
              stats.salasAudiencia.inseridas++;
            } else if (resultado.atualizado) {
              stats.salasAudiencia.atualizadas++;
            } else if (resultado.descartado) {
              stats.salasAudiencia.descartadas++;
            }
          }
        } catch (error) {
          stats.salasAudiencia.erros++;
          console.error(`  ❌ Erro ao salvar sala de audiência ${audiencia.salaAudiencia.nome}:`, error);
        }
      }
    }

    stats.arquivosProcessados++;
    console.log(`  ✅ Arquivo processado com sucesso`);
  } catch (error) {
    console.error(`  ❌ Erro ao processar arquivo ${arquivo}:`, error);
  }
}

/**
 * Processar todos os arquivos JSON em um diretório de TRT
 */
async function processarDiretorioTRT(trtDir: string, stats: Estatisticas): Promise<void> {
  const arquivos = await readdir(trtDir);
  const arquivosJSON = arquivos.filter((f) => f.endsWith('.json'));

  if (arquivosJSON.length === 0) {
    console.log(`  ℹ️  Nenhum arquivo JSON encontrado`);
    return;
  }

  for (const arquivo of arquivosJSON) {
    await processarArquivo(trtDir, arquivo, stats);
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('\n🚀 Iniciando população de tabelas auxiliares de audiências\n');
  console.log(`📂 Diretório de resultados: ${RESULTS_DIR}\n`);

  const stats = inicializarEstatisticas();

  try {
    // Listar diretórios de TRTs
    const entradas = await readdir(RESULTS_DIR, { withFileTypes: true });
    const diretoriosTRT = entradas
      .filter((e) => e.isDirectory() && e.name.startsWith('trt'))
      .map((e) => e.name)
      .sort();

    console.log(`📋 Diretórios encontrados: ${diretoriosTRT.length}`);
    console.log(`📋 TRTs: ${diretoriosTRT.join(', ')}\n`);

    // Processar cada diretório de TRT
    for (let i = 0; i < diretoriosTRT.length; i++) {
      const trtNome = diretoriosTRT[i];
      const trtDir = join(RESULTS_DIR, trtNome);

      console.log(`\n${'='.repeat(80)}`);
      console.log(`[${i + 1}/${diretoriosTRT.length}] Processando ${trtNome.toUpperCase()}`);
      console.log(`${'='.repeat(80)}`);

      await processarDiretorioTRT(trtDir, stats);
    }

    // Mostrar resumo final
    console.log(`\n${'='.repeat(80)}`);
    console.log('📊 RESUMO FINAL');
    console.log(`${'='.repeat(80)}`);
    console.log(`\n📄 Arquivos processados: ${stats.arquivosProcessados}`);
    console.log(`📦 Audiências processadas: ${stats.audienciasProcessadas}`);

    console.log(`\n📚 CLASSES JUDICIAIS:`);
    console.log(`  ✅ Inseridas: ${stats.classesJudiciais.inseridas}`);
    console.log(`  🔄 Atualizadas: ${stats.classesJudiciais.atualizadas}`);
    console.log(`  ⏭️  Descartadas (idênticas): ${stats.classesJudiciais.descartadas}`);
    console.log(`  ❌ Erros: ${stats.classesJudiciais.erros}`);

    console.log(`\n🏛️  ÓRGÃOS JULGADORES:`);
    console.log(`  ✅ Inseridos: ${stats.orgaosJulgadores.inseridos}`);
    console.log(`  🔄 Atualizados: ${stats.orgaosJulgadores.atualizados}`);
    console.log(`  ⏭️  Descartados (existentes): ${stats.orgaosJulgadores.descartados}`);
    console.log(`  ❌ Erros: ${stats.orgaosJulgadores.erros}`);

    console.log(`\n📋 TIPOS DE AUDIÊNCIA:`);
    console.log(`  ✅ Inseridos: ${stats.tiposAudiencia.inseridos}`);
    console.log(`  🔄 Atualizados: ${stats.tiposAudiencia.atualizados}`);
    console.log(`  ⏭️  Descartados (idênticos): ${stats.tiposAudiencia.descartados}`);
    console.log(`  ❌ Erros: ${stats.tiposAudiencia.erros}`);

    console.log(`\n🚪 SALAS DE AUDIÊNCIA:`);
    console.log(`  ✅ Inseridas: ${stats.salasAudiencia.inseridas}`);
    console.log(`  🔄 Atualizadas: ${stats.salasAudiencia.atualizadas}`);
    console.log(`  ⏭️  Descartadas (idênticas): ${stats.salasAudiencia.descartadas}`);
    console.log(`  ❌ Erros: ${stats.salasAudiencia.erros}`);

    const totalErros =
      stats.classesJudiciais.erros +
      stats.tiposAudiencia.erros +
      stats.salasAudiencia.erros +
      stats.orgaosJulgadores.erros;

    if (totalErros > 0) {
      console.log(`\n⚠️  Total de erros: ${totalErros}`);
    } else {
      console.log(`\n✅ Nenhum erro encontrado!`);
    }
  } catch (error) {
    console.error('\n❌ Erro ao processar arquivos:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main()
    .then(() => {
      console.log('\n✅ População de tabelas concluída com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ População de tabelas falhou:', error);
      process.exit(1);
    });
}

export { main };
