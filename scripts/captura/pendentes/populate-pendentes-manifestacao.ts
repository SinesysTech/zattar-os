// Script para popular o banco de dados com resultados de pendentes de manifestação
// Processa arquivos JSON de pendentes-manifestacao e api-pendentes-manifestacao

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
interface ProcessoPendente {
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
  idDocumento?: number;
  dataCienciaParte?: string | null;
  dataPrazoLegalParte?: string | null;
  dataCriacaoExpediente?: string | null;
  prazoVencido?: boolean;
  siglaOrgaoJulgador?: string | null;
}

interface ArquivoPendentesManifestacao {
  timestamp: string;
  config: {
    trtCodigo: string;
    grau: 'primeiro_grau' | 'segundo_grau';
    filtroPrazo: string;
  };
  dados: {
    processos: ProcessoPendente[];
  };
}

interface ArquivoApiPendentesManifestacao {
  timestamp: string;
  trtCodigo: string;
  grau: 'primeiro_grau' | 'segundo_grau';
  advogadoId: number;
  filtroPrazo: string;
  resultado: {
    success: boolean;
    data: {
      processos: ProcessoPendente[];
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
 * Parseia um arquivo de pendentes-manifestacao
 */
async function parsearPendentesManifestacao(
  caminhoArquivo: string
): Promise<{ processos: ProcessoPendente[]; trt: string; grau: 'primeiro_grau' | 'segundo_grau' } | null> {
  try {
    const conteudo = await readFile(caminhoArquivo, 'utf-8');
    const dados: ArquivoPendentesManifestacao = JSON.parse(conteudo);
    
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
 * Parseia um arquivo de api-pendentes-manifestacao
 */
async function parsearApiPendentesManifestacao(
  caminhoArquivo: string
): Promise<{ processos: ProcessoPendente[]; trt: string; grau: 'primeiro_grau' | 'segundo_grau'; advogadoId: number } | null> {
  try {
    const conteudo = await readFile(caminhoArquivo, 'utf-8');
    const dados: ArquivoApiPendentesManifestacao = JSON.parse(conteudo);
    
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
 * Insere um processo pendente no banco de dados
 * Se já existir (constraint única), descarta o registro
 */
async function inserirProcessoPendente(
  processo: ProcessoPendente,
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
      trt,
      grau,
      numero_processo: numeroProcesso,
      descricao_orgao_julgador: processo.descricaoOrgaoJulgador.trim(),
      classe_judicial: processo.classeJudicial.trim(),
      numero: processo.numero,
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
      id_documento: processo.idDocumento ?? null,
      data_ciencia_parte: parseDate(processo.dataCienciaParte),
      data_prazo_legal_parte: parseDate(processo.dataPrazoLegalParte),
      data_criacao_expediente: parseDate(processo.dataCriacaoExpediente),
      prazo_vencido: processo.prazoVencido ?? false,
      sigla_orgao_julgador: processo.siglaOrgaoJulgador?.trim() ?? null,
    };
    
    // Tentar inserir
    const { error } = await supabase.from('expedientes').insert(dadosNovos);
    
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
 * Processa todos os arquivos de pendentes-manifestacao
 */
async function processarPendentesManifestacao(): Promise<Estatisticas> {
  const stats: Estatisticas = {
    inseridos: 0,
    descartados: 0,
    erros: 0,
    totalProcessos: 0,
  };
  
  const diretorioPendentes = join(RESULTS_DIR, 'pendentes-manifestacao');
  console.log(`\n📁 Processando pendentes-manifestacao de: ${diretorioPendentes}`);
  
  const arquivos = await encontrarArquivosJson(diretorioPendentes);
  console.log(`   Encontrados ${arquivos.length} arquivos`);
  
  for (const arquivo of arquivos) {
    console.log(`\n   📄 Processando: ${arquivo}`);
    
    const dados = await parsearPendentesManifestacao(arquivo);
    if (!dados) {
      stats.erros++;
      continue;
    }
    
    console.log(`      TRT: ${dados.trt}, Grau: ${dados.grau}, Processos: ${dados.processos.length}`);
    stats.totalProcessos += dados.processos.length;
    
    // Processar cada processo
    for (const processo of dados.processos) {
      const resultado = await inserirProcessoPendente(processo, 1, dados.trt, dados.grau);
      
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
 * Processa todos os arquivos de api-pendentes-manifestacao
 */
async function processarApiPendentesManifestacao(): Promise<Estatisticas> {
  const stats: Estatisticas = {
    inseridos: 0,
    descartados: 0,
    erros: 0,
    totalProcessos: 0,
  };
  
  const diretorioApiPendentes = join(RESULTS_DIR, 'api-pendentes-manifestacao');
  console.log(`\n📁 Processando api-pendentes-manifestacao de: ${diretorioApiPendentes}`);
  
  const arquivos = await encontrarArquivosJson(diretorioApiPendentes);
  console.log(`   Encontrados ${arquivos.length} arquivos`);
  
  for (const arquivo of arquivos) {
    console.log(`\n   📄 Processando: ${arquivo}`);
    
    const dados = await parsearApiPendentesManifestacao(arquivo);
    if (!dados) {
      stats.erros++;
      continue;
    }
    
    console.log(`      TRT: ${dados.trt}, Grau: ${dados.grau}, Advogado ID: ${dados.advogadoId}, Processos: ${dados.processos.length}`);
    stats.totalProcessos += dados.processos.length;
    
    // Processar cada processo
    for (const processo of dados.processos) {
      const resultado = await inserirProcessoPendente(processo, dados.advogadoId, dados.trt, dados.grau);
      
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
  console.log('🚀 Iniciando população do banco de dados com resultados de pendentes de manifestação\n');
  console.log('='.repeat(80));
  
  const inicio = Date.now();
  
  try {
    // Processar pendentes-manifestacao
    const statsPendentes = await processarPendentesManifestacao();
    
    // Processar api-pendentes-manifestacao
    const statsApiPendentes = await processarApiPendentesManifestacao();
    
    // Consolidar estatísticas
    const statsTotal: Estatisticas = {
      inseridos: statsPendentes.inseridos + statsApiPendentes.inseridos,
      descartados: statsPendentes.descartados + statsApiPendentes.descartados,
      erros: statsPendentes.erros + statsApiPendentes.erros,
      totalProcessos: statsPendentes.totalProcessos + statsApiPendentes.totalProcessos,
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
    console.log(`   pendentes-manifestacao: ${statsPendentes.inseridos} inseridos, ${statsPendentes.descartados} descartados, ${statsPendentes.erros} erros`);
    console.log(`   api-pendentes-manifestacao: ${statsApiPendentes.inseridos} inseridos, ${statsApiPendentes.descartados} descartados, ${statsApiPendentes.erros} erros`);
    
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

