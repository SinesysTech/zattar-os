/**
 * Script standalone para recuperar documentos PDF de expedientes capturados sem
 * arquivo. Cobre o caso em que a captura do expediente foi bem-sucedida mas o
 * fetch do documento associado falhou (arquivo_nome IS NULL com id_documento
 * preenchido).
 *
 * Fluxo:
 * 1. Busca todos os expedientes com `arquivo_nome IS NULL AND id_documento IS NOT NULL`
 * 2. Agrupa por TRT + grau (uma sessão Playwright por grupo)
 * 3. Para cada grupo: autentica no PJE → itera os expedientes capturando o PDF
 * 4. Faz upload no Backblaze B2 e atualiza o expediente via downloadAndUploadDocumento
 * 5. Persiste estatísticas em `.logs/recuperacao-<timestamp>.jsonl` para auditoria
 *
 * Variáveis de ambiente:
 * - DRY_RUN=1            → Apenas lista o que seria processado, sem autenticar nem capturar.
 * - SOMENTE_TRT=TRT3     → Limita o processamento a um único tribunal.
 * - SOMENTE_GRAU=primeiro_grau → Limita a um grau específico.
 * - LIMITE=10            → Processa apenas N expedientes por grupo (útil para teste).
 *
 * Uso (via npm scripts, recomendado — já injeta mock de `server-only`):
 *   pnpm captura:recuperar-documentos
 *   pnpm captura:recuperar-documentos:dry-run
 *   SOMENTE_TRT=TRT3 pnpm captura:recuperar-documentos
 *   SOMENTE_TRT=TRT3 SOMENTE_GRAU=primeiro_grau LIMITE=5 pnpm captura:recuperar-documentos
 *
 * Uso direto via tsx (precisa do --require para o mock):
 *   pnpm tsx --require ./scripts/mock-server-only.cjs scripts/captura/pendentes/processar-documentos-pendentes.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { mkdirSync, appendFileSync } from 'fs';
import type { Browser, Page } from 'playwright';

import { createServiceClient } from '@/lib/supabase/service-client';
import { getCredentialComplete } from '@/app/(authenticated)/captura/credentials/credential.service';
import {
  autenticarPJE,
  getTribunalConfig,
} from '@/app/(authenticated)/captura/server';
import type {
  FetchDocumentoParams,
  GrauTRT,
} from '@/app/(authenticated)/captura';
import { downloadAndUploadDocumento } from '@/app/(authenticated)/captura/services/pje/pje-expediente-documento.service';

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

const DELAY_ENTRE_DOCUMENTOS = 1000;
const DELAY_ENTRE_TRIBUNAIS = 2000;
const LIMITE_ERROS_CONSECUTIVOS = 3;

const DRY_RUN = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true';
const FILTRO_TRT = process.env.SOMENTE_TRT?.toUpperCase();
const FILTRO_GRAU = process.env.SOMENTE_GRAU as GrauTRT | undefined;
const LIMITE_POR_GRUPO = process.env.LIMITE
  ? Number.parseInt(process.env.LIMITE, 10)
  : null;

// ============================================================================
// TIPOS
// ============================================================================

interface PendenteProcessar {
  id: number;
  id_pje: number;
  numero_processo: string;
  id_documento: number;
  trt: string;
  grau: GrauTRT;
}

interface FalhaRegistrada {
  expediente_id: number;
  id_pje: number;
  id_documento: number;
  numero_processo: string;
  trt: string;
  grau: GrauTRT;
  motivo: string;
}

interface EstatisticasGlobais {
  totalPendentes: number;
  sucessos: number;
  falhas: number;
  semCredencial: number;
  porTribunal: Map<
    string,
    { total: number; sucessos: number; falhas: number; semCredencial: number }
  >;
  falhasDetalhadas: FalhaRegistrada[];
}

// ============================================================================
// LOG ESTRUTURADO (JSONL)
// ============================================================================

const RUN_ID = new Date().toISOString().replace(/[:.]/g, '-');
const LOG_DIR = resolve(process.cwd(), 'scripts/captura/pendentes/.logs');
const LOG_FILE = resolve(LOG_DIR, `recuperacao-${RUN_ID}.jsonl`);

mkdirSync(LOG_DIR, { recursive: true });

function logEvent(payload: Record<string, unknown>): void {
  const linha = JSON.stringify({ ts: new Date().toISOString(), ...payload });
  appendFileSync(LOG_FILE, linha + '\n');
}

// ============================================================================
// QUERIES
// ============================================================================

async function buscarPendentesSemDocumento(): Promise<PendenteProcessar[]> {
  const supabase = createServiceClient();

  console.log('\n📋 Buscando expedientes sem documento (arquivo_nome IS NULL, id_documento NOT NULL)...');

  let query = supabase
    .from('expedientes')
    .select('id, id_pje, numero_processo, id_documento, trt, grau')
    .is('arquivo_nome', null)
    .not('id_documento', 'is', null)
    .order('trt')
    .order('grau')
    .order('id');

  if (FILTRO_TRT) {
    query = query.eq('trt', FILTRO_TRT);
  }
  if (FILTRO_GRAU) {
    query = query.eq('grau', FILTRO_GRAU);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Erro ao buscar expedientes: ${error.message}`);
  }

  console.log(`✅ ${data?.length ?? 0} expedientes elegíveis encontrados`);
  return (data ?? []) as PendenteProcessar[];
}

async function buscarCredencialId(
  trt: string,
  grau: GrauTRT,
): Promise<number | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('credenciais')
    .select('id')
    .eq('tribunal', trt)
    .eq('grau', grau)
    .eq('active', true)
    .limit(1)
    .single();

  if (error || !data) return null;
  return data.id;
}

// ============================================================================
// PROCESSAMENTO
// ============================================================================

function agruparPorTribunal(
  pendentes: PendenteProcessar[],
): Map<string, PendenteProcessar[]> {
  const grupos = new Map<string, PendenteProcessar[]>();
  for (const p of pendentes) {
    const chave = `${p.trt}|${p.grau}`;
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave)!.push(p);
  }
  return grupos;
}

function imprimirPlano(grupos: Map<string, PendenteProcessar[]>): void {
  console.log('\n📊 Plano de execução:');
  console.log('─'.repeat(72));
  let total = 0;
  for (const [chave, lista] of grupos) {
    const [trt, grau] = chave.split('|');
    const exibido = LIMITE_POR_GRUPO ? Math.min(lista.length, LIMITE_POR_GRUPO) : lista.length;
    total += exibido;
    console.log(`   ${trt.padEnd(6)} ${grau.padEnd(20)} → ${exibido} expediente(s)`);
  }
  console.log('─'.repeat(72));
  console.log(`   TOTAL: ${total} expediente(s) em ${grupos.size} grupo(s)`);
  if (DRY_RUN) console.log('   ⚠️  DRY_RUN ativo — nenhuma captura será executada.');
  if (LIMITE_POR_GRUPO) console.log(`   ⚠️  LIMITE=${LIMITE_POR_GRUPO} por grupo aplicado.`);
}

async function processarGrupo(
  trt: string,
  grau: GrauTRT,
  pendentes: PendenteProcessar[],
  estatisticas: EstatisticasGlobais,
): Promise<void> {
  const chave = `${trt}|${grau}`;
  estatisticas.porTribunal.set(chave, {
    total: pendentes.length,
    sucessos: 0,
    falhas: 0,
    semCredencial: 0,
  });

  console.log(`\n${'='.repeat(80)}`);
  console.log(`📍 ${trt} ${grau} — ${pendentes.length} expediente(s)`);
  console.log('='.repeat(80));

  const credencialId = await buscarCredencialId(trt, grau);
  if (!credencialId) {
    console.log(`⚠️  Nenhuma credencial ativa para ${trt} ${grau}, pulando ${pendentes.length} expediente(s)`);
    estatisticas.semCredencial += pendentes.length;
    estatisticas.porTribunal.get(chave)!.semCredencial = pendentes.length;
    logEvent({ tipo: 'grupo_pulado', motivo: 'sem_credencial', trt, grau, qtd: pendentes.length });
    return;
  }

  const credencialCompleta = await getCredentialComplete(credencialId);
  if (!credencialCompleta) {
    console.log(`❌ Falha ao obter credencial ${credencialId} (${trt} ${grau})`);
    estatisticas.semCredencial += pendentes.length;
    estatisticas.porTribunal.get(chave)!.semCredencial = pendentes.length;
    return;
  }

  const tribunalConfig = await getTribunalConfig(
    credencialCompleta.tribunal,
    credencialCompleta.grau,
  );
  if (!tribunalConfig) {
    console.log(`❌ Configuração não encontrada para ${trt} ${grau}`);
    estatisticas.semCredencial += pendentes.length;
    return;
  }

  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    console.log(`🔐 Autenticando no ${trt} ${grau}...`);
    const authResult = await autenticarPJE({
      credential: credencialCompleta.credenciais,
      config: tribunalConfig,
      headless: true,
    });
    browser = authResult.browser;
    page = authResult.page;
    console.log('✅ Autenticado');
    logEvent({ tipo: 'autenticacao_ok', trt, grau });

    let errosConsecutivos = 0;
    const limiteEfetivo = LIMITE_POR_GRUPO ?? pendentes.length;

    for (let i = 0; i < Math.min(pendentes.length, limiteEfetivo); i++) {
      const pendente = pendentes[i];
      const progresso = `[${i + 1}/${Math.min(pendentes.length, limiteEfetivo)}]`;

      console.log(
        `\n${progresso} 📄 expediente=${pendente.id} processo=${pendente.numero_processo} doc=${pendente.id_documento}`,
      );

      const params: FetchDocumentoParams = {
        processoId: String(pendente.id_pje),
        documentoId: String(pendente.id_documento),
        expedienteId: pendente.id,
        numeroProcesso: pendente.numero_processo,
        trt: pendente.trt,
        grau: pendente.grau,
      };

      try {
        const resultado = await downloadAndUploadDocumento(page, params);

        if (resultado.success) {
          estatisticas.sucessos++;
          estatisticas.porTribunal.get(chave)!.sucessos++;
          errosConsecutivos = 0;
          console.log(`      ✅ ${resultado.arquivoInfo?.arquivo_nome}`);
          logEvent({
            tipo: 'sucesso',
            expediente_id: pendente.id,
            arquivo_key: resultado.arquivoInfo?.arquivo_key,
            trt,
            grau,
          });
        } else {
          throw new Error(resultado.error ?? 'Falha desconhecida');
        }
      } catch (err) {
        const motivo = err instanceof Error ? err.message : String(err);
        estatisticas.falhas++;
        estatisticas.porTribunal.get(chave)!.falhas++;
        estatisticas.falhasDetalhadas.push({
          expediente_id: pendente.id,
          id_pje: pendente.id_pje,
          id_documento: pendente.id_documento,
          numero_processo: pendente.numero_processo,
          trt,
          grau,
          motivo,
        });
        errosConsecutivos++;
        console.log(`      ❌ ${motivo}`);
        logEvent({
          tipo: 'falha',
          expediente_id: pendente.id,
          motivo,
          trt,
          grau,
        });
      }

      if (errosConsecutivos >= LIMITE_ERROS_CONSECUTIVOS) {
        console.log(
          `\n⚠️  ${LIMITE_ERROS_CONSECUTIVOS} erros consecutivos em ${trt} ${grau}. Abortando este grupo.`,
        );
        logEvent({ tipo: 'grupo_abortado', motivo: 'erros_consecutivos', trt, grau });
        break;
      }

      if (i < Math.min(pendentes.length, limiteEfetivo) - 1) {
        await new Promise((r) => setTimeout(r, DELAY_ENTRE_DOCUMENTOS));
      }
    }
  } catch (err) {
    const motivo = err instanceof Error ? err.message : String(err);
    console.log(`❌ Erro fatal no grupo ${trt} ${grau}: ${motivo}`);
    logEvent({ tipo: 'erro_fatal_grupo', motivo, trt, grau });
  } finally {
    if (browser) {
      await browser.close();
      console.log(`🧹 Navegador fechado (${trt} ${grau})`);
    }
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  console.log('\n🚀 Recuperação de documentos faltantes em expedientes');
  console.log(`   Run ID: ${RUN_ID}`);
  console.log(`   Log:    ${LOG_FILE}`);
  if (DRY_RUN) console.log('   Modo:   DRY_RUN');
  if (FILTRO_TRT) console.log(`   Filtro: TRT=${FILTRO_TRT}`);
  if (FILTRO_GRAU) console.log(`   Filtro: GRAU=${FILTRO_GRAU}`);
  if (LIMITE_POR_GRUPO) console.log(`   Limite: ${LIMITE_POR_GRUPO} por grupo`);

  const inicio = Date.now();

  const pendentes = await buscarPendentesSemDocumento();
  if (pendentes.length === 0) {
    console.log('\n✅ Nada a fazer — nenhum expediente elegível encontrado.');
    return;
  }

  const grupos = agruparPorTribunal(pendentes);
  imprimirPlano(grupos);

  if (DRY_RUN) {
    console.log('\n✅ DRY_RUN concluído. Nenhuma alteração foi feita.');
    logEvent({ tipo: 'dry_run', total: pendentes.length, grupos: grupos.size });
    return;
  }

  const estatisticas: EstatisticasGlobais = {
    totalPendentes: pendentes.length,
    sucessos: 0,
    falhas: 0,
    semCredencial: 0,
    porTribunal: new Map(),
    falhasDetalhadas: [],
  };

  let i = 0;
  for (const [chave, lista] of grupos) {
    i++;
    const [trt, grauStr] = chave.split('|');
    const grau = grauStr as GrauTRT;
    await processarGrupo(trt, grau, lista, estatisticas);

    if (i < grupos.size) {
      console.log(`\n⏳ Aguardando ${DELAY_ENTRE_TRIBUNAIS}ms antes do próximo grupo...`);
      await new Promise((r) => setTimeout(r, DELAY_ENTRE_TRIBUNAIS));
    }
  }

  // Resumo
  const duracao = ((Date.now() - inicio) / 1000).toFixed(2);
  const tentados = estatisticas.totalPendentes - estatisticas.semCredencial;
  const taxa = tentados > 0 ? ((estatisticas.sucessos / tentados) * 100).toFixed(2) : '0.00';

  console.log('\n' + '='.repeat(80));
  console.log('📊 RESUMO FINAL');
  console.log('='.repeat(80));
  console.log(`⏱️  Duração: ${duracao}s`);
  console.log(`📋 Total elegíveis:  ${estatisticas.totalPendentes}`);
  console.log(`✅ Sucessos:         ${estatisticas.sucessos}`);
  console.log(`❌ Falhas:           ${estatisticas.falhas}`);
  console.log(`⚠️  Sem credencial:  ${estatisticas.semCredencial}`);
  console.log(`📈 Taxa de sucesso:  ${taxa}% (${estatisticas.sucessos}/${tentados})`);

  if (estatisticas.porTribunal.size > 0) {
    console.log('\nPor tribunal/grau:');
    for (const [chave, s] of estatisticas.porTribunal) {
      const [trt, grau] = chave.split('|');
      console.log(
        `   ${trt.padEnd(6)} ${grau.padEnd(20)} total=${s.total} ok=${s.sucessos} fail=${s.falhas} sem_cred=${s.semCredencial}`,
      );
    }
  }

  if (estatisticas.falhasDetalhadas.length > 0) {
    console.log('\nIDs em falha (para reprocessar via SOMENTE_TRT/SOMENTE_GRAU):');
    const porMotivo = new Map<string, number[]>();
    for (const f of estatisticas.falhasDetalhadas) {
      if (!porMotivo.has(f.motivo)) porMotivo.set(f.motivo, []);
      porMotivo.get(f.motivo)!.push(f.expediente_id);
    }
    for (const [motivo, ids] of porMotivo) {
      console.log(`   • ${motivo} → ${ids.length} expediente(s): [${ids.join(', ')}]`);
    }
  }

  console.log('\n📝 Log estruturado: ' + LOG_FILE);
  console.log('='.repeat(80));

  logEvent({
    tipo: 'resumo_final',
    duracao_s: Number(duracao),
    ...estatisticas,
    porTribunal: Array.from(estatisticas.porTribunal.entries()),
  });
}

main().catch((err) => {
  console.error('\n❌ Erro fatal:', err);
  logEvent({ tipo: 'erro_fatal_top_level', motivo: err instanceof Error ? err.message : String(err) });
  process.exit(1);
});
