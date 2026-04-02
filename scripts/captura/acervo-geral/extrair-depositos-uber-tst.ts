/**
 * Script para baixar PDFs de comprovantes de depósito recursal
 * e extrair valores dos processos Uber no TST
 *
 * Fluxo:
 * 1. Busca doc_ids + id_pje do banco (Supabase)
 * 2. Autentica no PJE TST
 * 3. Baixa cada PDF em memória
 * 4. Salva PDFs em disco para extração posterior (Python/pdfplumber)
 * 5. Salva mapeamento doc_id -> processo em JSON
 *
 * Uso:
 *   npx tsx --conditions react-server scripts/captura/acervo-geral/extrair-depositos-uber-tst.ts
 */

import { config } from 'dotenv';
import { resolve, join, dirname } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });
config();

import { writeFile, mkdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import { autenticarPJE, type AuthResult } from '@/features/captura/services/trt/trt-auth.service';
import { baixarDocumento } from '@/features/captura/pje-trt/timeline/baixar-documento';
import { getTribunalConfig } from '@/features/captura/services/trt/config';
import { createServiceClient } from '@/lib/supabase/service-client';
import type { CredenciaisTRT } from '@/features/captura';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const RESULTS_DIR = join(__dirname, '..', '..', 'results', 'depositos-uber-tst');
const PDFS_DIR = join(RESULTS_DIR, 'pdfs');
const CREDENCIAL_ID = 49;
const DELAY_ENTRE_DOWNLOADS = 300; // ms

// ============================================================================
// BUSCAR DOCUMENTOS DO BANCO
// ============================================================================

interface DocDeposito {
  doc_id: number;
  id_pje: number;
  numero_processo: string;
  nome_parte_re: string;
  classe_judicial: string;
  titulo: string;
  tipo: string;
  instancia: string;
  data_doc: string;
  grau_numerico: number;
}

async function buscarDocumentosDeposito(): Promise<DocDeposito[]> {
  const supabase = createServiceClient();

  // Query para buscar documentos de depósito + id_pje do processo
  // Foco em Comprovantes de Depósito Recursal (tipo mais relevante)
  const { data: processos, error } = await supabase
    .from('acervo')
    .select('id, id_pje, numero_processo, nome_parte_re, classe_judicial, timeline_jsonb')
    .eq('trt', 'TST')
    .eq('origem', 'acervo_geral')
    .ilike('nome_parte_autora', '%uber do brasil%')
    .not('timeline_jsonb', 'is', null);

  if (error) throw new Error(`Erro ao buscar processos: ${error.message}`);
  if (!processos || processos.length === 0) throw new Error('Nenhum processo encontrado');

  console.log(`📋 ${processos.length} processos Uber (recorrente) com timeline`);

  const docs: DocDeposito[] = [];

  for (const proc of processos) {
    const timeline = (proc.timeline_jsonb as Record<string, unknown>)?.timeline;
    if (!Array.isArray(timeline)) continue;

    for (const item of timeline) {
      const titulo = (item.titulo || '') as string;
      const tipo = (item.tipo || '') as string;
      const instancia = (item.instancia || '') as string;
      const isDoc = item.documento === true;
      const docId = item.id as number;

      if (!isDoc || !docId) continue;

      // Filtrar documentos relevantes (depósitos recursais)
      const isDeposito =
        tipo === 'Comprovante de Depósito Recursal' ||
        tipo === 'Comprovante de Depósito Judicial' ||
        titulo.toLowerCase().includes('depósito recursal') ||
        titulo.toLowerCase().includes('deposito recursal') ||
        titulo.toLowerCase().includes('comprovante de depósito') ||
        titulo.toLowerCase().includes('comprovante de deposito') ||
        titulo.toLowerCase().includes('siscondj') ||
        titulo.toLowerCase().includes('guia de depósito recursal');

      if (isDeposito) {
        // Determinar grau numérico para o endpoint
        let grau = 1;
        if (instancia.includes('2')) grau = 2;
        else if (instancia.includes('TST') || instancia.includes('Superior')) grau = 3;

        docs.push({
          doc_id: docId,
          id_pje: proc.id_pje as number,
          numero_processo: proc.numero_processo as string,
          nome_parte_re: proc.nome_parte_re as string,
          classe_judicial: proc.classe_judicial as string,
          titulo,
          tipo,
          instancia,
          data_doc: (item.data || '') as string,
          grau_numerico: grau,
        });
      }

      // Também buscar nos anexos
      const anexos = item.anexos as Array<Record<string, unknown>> | undefined;
      if (Array.isArray(anexos)) {
        for (const anexo of anexos) {
          const aTitulo = (anexo.titulo || '') as string;
          const aTipo = (anexo.tipo || '') as string;
          const aInstancia = (anexo.instancia || '') as string;
          const aIsDoc = anexo.documento === true;
          const aDocId = anexo.id as number;

          if (!aIsDoc || !aDocId) continue;

          const aIsDeposito =
            aTipo === 'Comprovante de Depósito Recursal' ||
            aTipo === 'Comprovante de Depósito Judicial' ||
            aTipo === 'Guia de Recolhimento da União (GRU - custas/emolumentos)' ||
            aTitulo.toLowerCase().includes('depósito recursal') ||
            aTitulo.toLowerCase().includes('comprovante de depósito') ||
            aTitulo.toLowerCase().includes('siscondj');

          if (aIsDeposito) {
            let grau = 1;
            if (aInstancia.includes('2')) grau = 2;
            else if (aInstancia.includes('TST') || aInstancia.includes('Superior')) grau = 3;

            docs.push({
              doc_id: aDocId,
              id_pje: proc.id_pje as number,
              numero_processo: proc.numero_processo as string,
              nome_parte_re: proc.nome_parte_re as string,
              classe_judicial: proc.classe_judicial as string,
              titulo: aTitulo,
              tipo: aTipo,
              instancia: aInstancia || instancia,
              data_doc: (item.data || '') as string,
              grau_numerico: grau,
            });
          }
        }
      }
    }
  }

  // Deduplicar por doc_id
  const seen = new Set<number>();
  const deduped = docs.filter(d => {
    if (seen.has(d.doc_id)) return false;
    seen.add(d.doc_id);
    return true;
  });

  console.log(`📄 ${deduped.length} documentos únicos de depósito (de ${docs.length} total)`);
  return deduped;
}

// ============================================================================
// BUSCAR CREDENCIAIS
// ============================================================================

async function buscarCredenciais(): Promise<{ cpf: string; senha: string }> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('credenciais')
    .select('usuario, senha, advogados(cpf)')
    .eq('id', CREDENCIAL_ID)
    .eq('active', true)
    .single();

  if (error || !data) throw new Error(`Credencial ${CREDENCIAL_ID} não encontrada`);

  const advogado = data.advogados as unknown as { cpf: string } | null;
  const cpf = data.usuario || advogado?.cpf;
  if (!cpf || !data.senha) throw new Error('CPF ou senha não encontrados');
  return { cpf, senha: data.senha };
}

// ============================================================================
// SCRIPT PRINCIPAL
// ============================================================================

async function main() {
  const inicio = Date.now();
  let authResult: AuthResult | null = null;

  console.log('\n' + '='.repeat(80));
  console.log('💰 EXTRAÇÃO DE DEPÓSITOS RECURSAIS — UBER NO TST');
  console.log('='.repeat(80) + '\n');

  try {
    // ── FASE 1: BUSCAR DOCUMENTOS DO BANCO ──
    console.log('📋 Fase 1: Buscando documentos de depósito do banco...');
    const docs = await buscarDocumentosDeposito();

    // ── FASE 2: AUTENTICAÇÃO ──
    console.log('\n🔐 Fase 2: Autenticando no PJE do TST...');
    const credenciais = await buscarCredenciais();
    const tribunalConfig = await getTribunalConfig('TST', 'tribunal_superior');

    const credential: CredenciaisTRT = {
      cpf: credenciais.cpf,
      senha: credenciais.senha,
    };

    authResult = await autenticarPJE({
      credential,
      config: tribunalConfig,
      headless: true,
    });

    const { page } = authResult;
    console.log(`✅ Autenticado`);

    // ── FASE 3: BAIXAR PDFs ──
    console.log(`\n📥 Fase 3: Baixando ${docs.length} PDFs...`);
    await mkdir(PDFS_DIR, { recursive: true });

    const resultados: Array<{
      doc_id: number;
      numero_processo: string;
      nome_parte_re: string;
      classe_judicial: string;
      titulo: string;
      tipo: string;
      instancia: string;
      data_doc: string;
      pdf_path: string | null;
      pdf_size: number;
      erro: string | null;
    }> = [];

    let downloadOk = 0;
    let downloadErro = 0;

    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];

      if (i === 0 || (i + 1) % 50 === 0 || i === docs.length - 1) {
        const pct = ((i + 1) / docs.length * 100).toFixed(1);
        console.log(`   📊 Progresso: ${i + 1}/${docs.length} (${pct}%) — ${downloadOk} ok, ${downloadErro} erros`);
      }

      try {
        const buffer = await baixarDocumento(
          page,
          String(doc.id_pje),
          String(doc.doc_id),
          {
            incluirCapa: false,
            incluirAssinatura: false,
            grau: doc.grau_numerico,
          }
        );

        // Salvar PDF
        const pdfFilename = `${doc.numero_processo}_${doc.doc_id}_${doc.instancia.replace(/\s/g, '')}.pdf`;
        const pdfPath = join(PDFS_DIR, pdfFilename);
        await writeFile(pdfPath, buffer);

        resultados.push({
          doc_id: doc.doc_id,
          numero_processo: doc.numero_processo,
          nome_parte_re: doc.nome_parte_re,
          classe_judicial: doc.classe_judicial,
          titulo: doc.titulo,
          tipo: doc.tipo,
          instancia: doc.instancia,
          data_doc: doc.data_doc,
          pdf_path: pdfFilename,
          pdf_size: buffer.length,
          erro: null,
        });
        downloadOk++;
      } catch (e) {
        const erro = e instanceof Error ? e.message : String(e);
        resultados.push({
          doc_id: doc.doc_id,
          numero_processo: doc.numero_processo,
          nome_parte_re: doc.nome_parte_re,
          classe_judicial: doc.classe_judicial,
          titulo: doc.titulo,
          tipo: doc.tipo,
          instancia: doc.instancia,
          data_doc: doc.data_doc,
          pdf_path: null,
          pdf_size: 0,
          erro,
        });
        downloadErro++;
        // Não parar por erro individual
      }

      // Rate limiting
      if (i < docs.length - 1) {
        await new Promise(r => setTimeout(r, DELAY_ENTRE_DOWNLOADS));
      }
    }

    // ── FASE 4: SALVAR RESULTADOS ──
    console.log('\n💾 Fase 4: Salvando mapeamento...');
    const mapeamentoPath = join(RESULTS_DIR, 'mapeamento-docs.json');
    await writeFile(mapeamentoPath, JSON.stringify(resultados, null, 2), 'utf-8');

    const duracao = ((Date.now() - inicio) / 1000).toFixed(2);

    console.log('\n' + '='.repeat(80));
    console.log('🏁 RESUMO');
    console.log('='.repeat(80));
    console.log(`   Documentos processados: ${docs.length}`);
    console.log(`   Downloads OK:           ${downloadOk}`);
    console.log(`   Downloads Erro:         ${downloadErro}`);
    console.log(`   Duração:                ${duracao}s`);
    console.log(`   PDFs em:                ${PDFS_DIR}`);
    console.log(`   Mapeamento:             ${mapeamentoPath}`);
    console.log('='.repeat(80) + '\n');
    console.log('📌 Próximo passo: executar script Python para extrair valores dos PDFs');

  } catch (error) {
    console.error('\n❌ ERRO FATAL:', error);
    throw error;
  } finally {
    if (authResult?.browser) {
      console.log('🚪 Fechando browser...');
      await authResult.browser.close();
    }
  }
}

main()
  .then(async () => {
    await new Promise(r => setTimeout(r, 500));
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('❌ Script falhou:', error);
    await new Promise(r => setTimeout(r, 500));
    process.exit(1);
  });
