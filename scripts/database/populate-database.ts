// Script para popular o banco de dados com resultados das capturas
// Processa arquivos JSON de acervo-geral e api-acervo-geral

// Carregar variáveis de ambiente do .env.local
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });
config(); // Carregar .env também se existir

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import { readdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

/**
 * Obter __dirname em módulos ES
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Diretório base dos resultados
 */
const RESULTS_DIR = join(__dirname, 'results');

/**
 * Tipos para os dados JSON
 */
interface ProcessoAcervoGeral {
  id: number;
  descricaoOrgaoJulgador: string;
  classeJudicial: string;
  numero: number;
  numeroProcesso: string;
  segredoDeJustica: boolean;
  codigoStatusProcesso: string;
  prioridadeProcessual: number;
  nomeParteAutora: string;
  qtdeParteAutora: number;
  nomeParteRe: string;
  qtdeParteRe: number;
  dataAutuacao: string | null;
  juizoDigital: boolean;
  dataArquivamento?: string | null;
  dataProximaAudiencia?: string | null;
  temAssociacao?: boolean;
}

interface ArquivoAcervoGeral {
  timestamp: string;
  config: {
    trtCodigo: string;
    grau: 'primeiro_grau' | 'segundo_grau';
  };
  dados: {
    processos: ProcessoAcervoGeral[];
  };
}

interface ArquivoApiAcervoGeral {
  timestamp: string;
  trtCodigo: string;
  grau: 'primeiro_grau' | 'segundo_grau';
  advogadoId: number;
  resultado: {
    success: boolean;
    data: {
      processos: ProcessoAcervoGeral[];
    };
  };
}

/**
 * Estatísticas do processamento
 */
interface Estatisticas {
  inseridos: number;
  descartados: number;
  erros: number;
  totalProcessos: number;
}

/**
 * Converte data ISO string para timestamptz ou null
 */
function parseDate(dateString: string | null | undefined): string | null {
  if (!dateString) return null;
  try {
    return new Date(dateString).toISOString();
  } catch {
    return null;
  }
}

/**
 * Encontra todos os arquivos resultado-*.json recursivamente em um diretório
 */
async function encontrarArquivosJson(
  diretorio: string
): Promise<string[]> {
  const arquivos: string[] = [];
  
  try {
    const entradas = await readdir(diretorio, { withFileTypes: true });
    
    for (const entrada of entradas) {
      const caminhoCompleto = join(diretorio, entrada.name);
      
      if (entrada.isDirectory()) {
        // Recursão para subdiretórios
        const arquivosSubdir = await encontrarArquivosJson(caminhoCompleto);
        arquivos.push(...arquivosSubdir);
      } else if (entrada.isFile() && entrada.name.startsWith('resultado-') && entrada.name.endsWith('.json')) {
        arquivos.push(caminhoCompleto);
      }
    }
  } catch (error) {
    console.error(`Erro ao ler diretório ${diretorio}:`, error);
  }
  
  return arquivos;
}

/**
 * Parseia um arquivo de acervo-geral
 */
async function parsearAcervoGeral(
  caminhoArquivo: string
): Promise<{ processos: ProcessoAcervoGeral[]; trt: string; grau: 'primeiro_grau' | 'segundo_grau' } | null> {
  try {
    const conteudo = await readFile(caminhoArquivo, 'utf-8');
    const dados: ArquivoAcervoGeral = JSON.parse(conteudo);
    
    if (!dados.config || !dados.dados?.processos) {
      console.warn(`Arquivo ${caminhoArquivo} não tem estrutura esperada`);
      return null;
    }
    
    return {
      processos: dados.dados.processos,
      trt: dados.config.trtCodigo,
      grau: dados.config.grau,
    };
  } catch (error) {
    console.error(`Erro ao parsear arquivo ${caminhoArquivo}:`, error);
    return null;
  }
}

/**
 * Parseia um arquivo de api-acervo-geral
 */
async function parsearApiAcervoGeral(
  caminhoArquivo: string
): Promise<{ processos: ProcessoAcervoGeral[]; trt: string; grau: 'primeiro_grau' | 'segundo_grau'; advogadoId: number } | null> {
  try {
    const conteudo = await readFile(caminhoArquivo, 'utf-8');
    const dados: ArquivoApiAcervoGeral = JSON.parse(conteudo);
    
    if (!dados.resultado?.success || !dados.resultado?.data?.processos) {
      console.warn(`Arquivo ${caminhoArquivo} não tem estrutura esperada ou não teve sucesso`);
      return null;
    }
    
    return {
      processos: dados.resultado.data.processos,
      trt: dados.trtCodigo,
      grau: dados.grau,
      advogadoId: dados.advogadoId,
    };
  } catch (error) {
    console.error(`Erro ao parsear arquivo ${caminhoArquivo}:`, error);
    return null;
  }
}

/**
 * Insere um processo no banco de dados
 * Se já existir (constraint única), descarta o registro
 */
async function inserirProcesso(
  processo: ProcessoAcervoGeral,
  advogadoId: number,
  trt: string,
  grau: 'primeiro_grau' | 'segundo_grau'
): Promise<'inserido' | 'descartado' | 'erro'> {
  const supabase = createServiceClient();
  
  try {
    const numeroProcesso = processo.numeroProcesso.trim();
    
    // Converter processo para formato do banco
    const dadosNovos = {
      id_pje: processo.id,
      advogado_id: advogadoId,
      origem: 'acervo_geral' as const,
      trt,
      grau,
      numero_processo: numeroProcesso,
      numero: processo.numero,
      descricao_orgao_julgador: processo.descricaoOrgaoJulgador.trim(),
      classe_judicial: processo.classeJudicial.trim(),
      segredo_justica: processo.segredoDeJustica,
      codigo_status_processo: processo.codigoStatusProcesso.trim(),
      prioridade_processual: processo.prioridadeProcessual,
      nome_parte_autora: processo.nomeParteAutora.trim(),
      qtde_parte_autora: processo.qtdeParteAutora,
      nome_parte_re: processo.nomeParteRe.trim(),
      qtde_parte_re: processo.qtdeParteRe,
      data_autuacao: parseDate(processo.dataAutuacao),
      juizo_digital: processo.juizoDigital,
      data_arquivamento: parseDate(processo.dataArquivamento),
      data_proxima_audiencia: parseDate(processo.dataProximaAudiencia),
      tem_associacao: processo.temAssociacao ?? false,
    };
    
    // Tentar inserir
    const { error } = await supabase.from('acervo').insert(dadosNovos);
    
    if (error) {
      // Verificar se é erro de constraint única (código 23505)
      if (error.code === '23505') {
        // Registro já existe - descartar
        return 'descartado';
      }
      // Outro tipo de erro
      throw error;
    }
    
    // Inserido com sucesso
    return 'inserido';
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error(`Erro ao inserir processo ${processo.numeroProcesso}:`, erroMsg);
    return 'erro';
  }
}

/**
 * Processa todos os arquivos de acervo-geral
 */
async function processarAcervoGeral(): Promise<Estatisticas> {
  const stats: Estatisticas = {
    inseridos: 0,
    descartados: 0,
    erros: 0,
    totalProcessos: 0,
  };
  
  const diretorioAcervoGeral = join(RESULTS_DIR, 'acervo-geral');
  console.log(`\n📁 Processando acervo-geral de: ${diretorioAcervoGeral}`);
  
  const arquivos = await encontrarArquivosJson(diretorioAcervoGeral);
  console.log(`   Encontrados ${arquivos.length} arquivos`);
  
  for (const arquivo of arquivos) {
    console.log(`\n   📄 Processando: ${arquivo}`);
    
    const dados = await parsearAcervoGeral(arquivo);
    if (!dados) {
      stats.erros++;
      continue;
    }
    
    console.log(`      TRT: ${dados.trt}, Grau: ${dados.grau}, Processos: ${dados.processos.length}`);
    stats.totalProcessos += dados.processos.length;
    
    // Processar cada processo
    for (const processo of dados.processos) {
      const resultado = await inserirProcesso(processo, 1, dados.trt, dados.grau);
      
      if (resultado === 'inserido') {
        stats.inseridos++;
      } else if (resultado === 'descartado') {
        stats.descartados++;
      } else {
        stats.erros++;
      }
    }
  }
  
  return stats;
}

/**
 * Processa todos os arquivos de api-acervo-geral
 */
async function processarApiAcervoGeral(): Promise<Estatisticas> {
  const stats: Estatisticas = {
    inseridos: 0,
    descartados: 0,
    erros: 0,
    totalProcessos: 0,
  };
  
  const diretorioApiAcervoGeral = join(RESULTS_DIR, 'api-acervo-geral');
  console.log(`\n📁 Processando api-acervo-geral de: ${diretorioApiAcervoGeral}`);
  
  const arquivos = await encontrarArquivosJson(diretorioApiAcervoGeral);
  console.log(`   Encontrados ${arquivos.length} arquivos`);
  
  for (const arquivo of arquivos) {
    console.log(`\n   📄 Processando: ${arquivo}`);
    
    const dados = await parsearApiAcervoGeral(arquivo);
    if (!dados) {
      stats.erros++;
      continue;
    }
    
    console.log(`      TRT: ${dados.trt}, Grau: ${dados.grau}, Advogado ID: ${dados.advogadoId}, Processos: ${dados.processos.length}`);
    stats.totalProcessos += dados.processos.length;
    
    // Processar cada processo
    for (const processo of dados.processos) {
      const resultado = await inserirProcesso(processo, dados.advogadoId, dados.trt, dados.grau);
      
      if (resultado === 'inserido') {
        stats.inseridos++;
      } else if (resultado === 'descartado') {
        stats.descartados++;
      } else {
        stats.erros++;
      }
    }
  }
  
  return stats;
}

/**
 * Função principal
 */
async function main() {
  console.log('🚀 Iniciando população do banco de dados com resultados das capturas\n');
  console.log('=' .repeat(80));
  
  const inicio = Date.now();
  
  try {
    // Processar acervo-geral
    const statsAcervoGeral = await processarAcervoGeral();
    
    // Processar api-acervo-geral
    const statsApiAcervoGeral = await processarApiAcervoGeral();
    
    // Consolidar estatísticas
    const statsTotal: Estatisticas = {
      inseridos: statsAcervoGeral.inseridos + statsApiAcervoGeral.inseridos,
      descartados: statsAcervoGeral.descartados + statsApiAcervoGeral.descartados,
      erros: statsAcervoGeral.erros + statsApiAcervoGeral.erros,
      totalProcessos: statsAcervoGeral.totalProcessos + statsApiAcervoGeral.totalProcessos,
    };
    
    const duracao = ((Date.now() - inicio) / 1000).toFixed(2);
    
    // Relatório final
    console.log('\n' + '='.repeat(80));
    console.log('📊 RELATÓRIO FINAL');
    console.log('='.repeat(80));
    console.log(`\n✅ Inseridos: ${statsTotal.inseridos}`);
    console.log(`⏭️  Descartados (duplicados): ${statsTotal.descartados}`);
    console.log(`❌ Erros: ${statsTotal.erros}`);
    console.log(`📦 Total de processos processados: ${statsTotal.totalProcessos}`);
    console.log(`⏱️  Duração: ${duracao}s`);
    
    console.log('\n📋 Detalhamento por fonte:');
    console.log(`   acervo-geral: ${statsAcervoGeral.inseridos} inseridos, ${statsAcervoGeral.descartados} descartados, ${statsAcervoGeral.erros} erros`);
    console.log(`   api-acervo-geral: ${statsApiAcervoGeral.inseridos} inseridos, ${statsApiAcervoGeral.descartados} descartados, ${statsApiAcervoGeral.erros} erros`);
    
    console.log('\n✨ Processamento concluído!\n');
  } catch (error) {
    console.error('\n❌ Erro fatal durante o processamento:', error);
    process.exit(1);
  }
}

// Executar script
main().catch((error) => {
  console.error('Erro não tratado:', error);
  process.exit(1);
});

