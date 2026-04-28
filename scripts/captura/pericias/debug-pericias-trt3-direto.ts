/**
 * debug-pericias-trt3-direto.ts
 *
 * Script de diagnóstico de captura de perícias TRT3 (1º grau).
 * Opera diretamente via Playwright + Supabase — sem passar pela API HTTP do Next.js
 * e SEM persistir nada no banco.
 *
 * Objetivo: verificar se o PJE retorna IDs duplicados de perícias,
 * múltiplas perícias por processo, e comparar com o banco.
 *
 * Uso:
 *   npx tsx scripts/captura/pericias/debug-pericias-trt3-direto.ts
 *
 * Saída: test-pericias/<timestamp>_*.json + test-pericias/<timestamp>_00_log.txt
 */

// ── Env ──────────────────────────────────────────────────────────────────────
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });
config();

// ── Dependências ─────────────────────────────────────────────────────────────
import * as fs from 'node:fs';
import * as path from 'node:path';
import { chromium, type Browser, type Page } from 'playwright';
import { createClient } from '@supabase/supabase-js';

// ── Variáveis de ambiente ─────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY ?? '';
const TWOFAUTH_API_URL = process.env.TWOFAUTH_API_URL ?? '';
const TWOFAUTH_API_TOKEN = process.env.TWOFAUTH_API_TOKEN ?? '';
const TWOFAUTH_ACCOUNT_ID = Number(process.env.TWOFAUTH_ACCOUNT_ID ?? '3');

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY são obrigatórias no .env.local');
  process.exit(1);
}

// ── Saída ─────────────────────────────────────────────────────────────────────
const OUTPUT_DIR = path.join(process.cwd(), 'test-pericias');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const RUN_TS = new Date().toISOString().replace(/[:.]/g, '-');
const LOGS: string[] = [];

function log(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  LOGS.push(line);
}

function salvar(nome: string, dados: unknown): string {
  const arquivo = path.join(OUTPUT_DIR, `${RUN_TS}_${nome}.json`);
  fs.writeFileSync(arquivo, JSON.stringify(dados, null, 2), 'utf-8');
  log(`💾 Salvo: ${arquivo}`);
  return arquivo;
}

function salvarLogs() {
  const arquivo = path.join(OUTPUT_DIR, `${RUN_TS}_00_log.txt`);
  fs.writeFileSync(arquivo, LOGS.join('\n') + '\n', 'utf-8');
  console.log(`📄 Log: ${arquivo}`);
}

// ── Supabase ──────────────────────────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface TRT3Config {
  loginUrl: string;
  baseUrl: string;
  apiUrl: string;
}

async function getTRT3Config(): Promise<TRT3Config> {
  log('📋 Buscando config TRT3 (primeiro_grau) no banco...');

  const { data, error } = await supabase
    .from('tribunais_config')
    .select(`
      url_login_seam,
      url_base,
      url_api,
      tribunais!inner (
        codigo
      )
    `)
    .eq('tipo_acesso', 'primeiro_grau')
    .eq('tribunais.codigo', 'TRT3')
    .single();

  if (!error && data) {
    log(`✅ Config TRT3 encontrada (estratégia JOIN)`);
    return { loginUrl: data.url_login_seam, baseUrl: data.url_base, apiUrl: data.url_api };
  }

  log(`⚠️ Estratégia JOIN falhou (${error?.message}), tentando lookup direto...`);

  const { data: tribunal } = await supabase
    .from('tribunais')
    .select('id')
    .eq('codigo', 'TRT3')
    .single();

  if (!tribunal) throw new Error('Tribunal TRT3 não encontrado na tabela tribunais');

  const { data: cfg, error: cfgError } = await supabase
    .from('tribunais_config')
    .select('url_login_seam, url_base, url_api')
    .eq('tribunal_id', tribunal.id)
    .eq('tipo_acesso', 'primeiro_grau')
    .single();

  if (cfgError || !cfg) {
    throw new Error(`Config TRT3 não encontrada: ${cfgError?.message ?? 'resultado vazio'}`);
  }

  log(`✅ Config TRT3 encontrada (lookup direto)`);
  return { loginUrl: cfg.url_login_seam, baseUrl: cfg.url_base, apiUrl: cfg.url_api };
}

async function getCredencialTRT3(): Promise<{ cpf: string; senha: string }> {
  log('🔑 Buscando credencial TRT3 ativa no banco...');

  const { data, error } = await supabase
    .from('credenciais')
    .select(`usuario, senha, advogados (cpf)`)
    .eq('tribunal', 'TRT3')
    .eq('grau', 'primeiro_grau')
    .eq('active', true)
    .limit(1)
    .single();

  if (error || !data) {
    throw new Error(`Credencial TRT3 não encontrada: ${error?.message ?? 'resultado vazio'}`);
  }

  const advogadoRaw = data.advogados;
  const advogado = Array.isArray(advogadoRaw) ? advogadoRaw[0] : advogadoRaw;
  const cpf = data.usuario || (advogado as { cpf: string } | null)?.cpf || '';
  if (!cpf) throw new Error('CPF não encontrado na credencial TRT3');

  log(`✅ Credencial carregada | CPF: ***${cpf.slice(-4)}`);
  return { cpf, senha: data.senha };
}

// ── 2FAuth / OTP ──────────────────────────────────────────────────────────────
async function getOTP(): Promise<{ password: string; nextPassword?: string }> {
  if (!TWOFAUTH_API_URL || !TWOFAUTH_API_TOKEN) {
    throw new Error('TWOFAUTH_API_URL e TWOFAUTH_API_TOKEN são obrigatórias para OTP');
  }
  log('📱 Buscando OTP do 2FAuth...');
  const response = await fetch(`${TWOFAUTH_API_URL}/twofaccounts/${TWOFAUTH_ACCOUNT_ID}/otp`, {
    headers: { Authorization: `Bearer ${TWOFAUTH_API_TOKEN}`, Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`2FAuth API erro ${response.status}: ${await response.text()}`);
  const data = (await response.json()) as { password: string; next_password?: string };
  log(`✅ OTP obtido com sucesso`);
  return { password: data.password, nextPassword: data.next_password };
}

// ── Auth (Playwright) ─────────────────────────────────────────────────────────
function delay(ms: number) { return new Promise<void>((r) => setTimeout(r, ms)); }

async function esperarSaidaSSO(page: Page, targetHostname: string, timeout = 120000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const url = page.url();
      const hostname = new URL(url).hostname;
      if (hostname.includes(targetHostname) && !hostname.includes('sso.')) {
        log(`✅ Saiu do SSO: ${hostname}`);
        return;
      }
    } catch { /* URL pode ser about:blank durante redirect */ }
    await delay(2000);
  }
  throw new Error(`Timeout ao aguardar saída do SSO. URL atual: ${page.url()}`);
}

async function autenticar(
  page: Page, loginUrl: string, baseUrl: string, cpf: string, senha: string,
): Promise<{ idAdvogado: string }> {
  const targetHostname = new URL(baseUrl).hostname;

  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
    Object.defineProperty(navigator, 'languages', { get: () => ['pt-BR', 'pt', 'en-US', 'en'] });
  });

  log(`🌐 Navegando para ${loginUrl}`);
  await page.goto(loginUrl, { waitUntil: 'networkidle', timeout: 60000 });
  await delay(2000);

  log('🔑 Clicando em SSO PDPJ...');
  await page.waitForSelector('#btnSsoPdpj', { state: 'visible', timeout: 60000 });

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await Promise.all([
        page.waitForURL(
          (url) => url.hostname.includes('sso.') || url.hostname.includes('gov.br'),
          { timeout: 60000 },
        ),
        page.click('#btnSsoPdpj'),
      ]);
      break;
    } catch (e) {
      if (attempt === 3) throw e;
      log(`⚠️ Retry SSO clique ${attempt}/3...`);
      await delay(5000);
      await page.goto(loginUrl, { waitUntil: 'networkidle', timeout: 60000 });
      await delay(2000);
      await page.waitForSelector('#btnSsoPdpj', { state: 'visible', timeout: 60000 });
    }
  }

  log('📝 Preenchendo CPF e senha...');
  await page.waitForSelector('#username', { state: 'visible', timeout: 60000 });
  await page.fill('#username', cpf);
  await delay(2000);
  await page.fill('#password', senha);
  await delay(2000);

  log('🚀 Submetendo login...');
  await Promise.all([
    page.waitForURL(
      (url) => url.hostname.includes(targetHostname) || url.hostname.includes('sso.'),
      { timeout: 120000 },
    ),
    page.click('#kc-login'),
  ]);
  await delay(3000);

  log('⏳ Aguardando campo OTP...');
  const OTP_SELECTORS = ['#otp', '#totp', 'input[name="otp"]', 'input[name="totp"]', '#kc-otp-login-form input[type="text"]'];
  let otpSelector: string | null = null;
  for (let i = 0; i < 10 && !otpSelector; i++) {
    for (const sel of OTP_SELECTORS) {
      const el = await page.$(sel);
      if (el && (await el.isVisible())) { otpSelector = sel; break; }
    }
    if (!otpSelector) await delay(2000);
  }
  if (!otpSelector) throw new Error('Campo OTP não encontrado após 20s.');

  log(`✅ Campo OTP encontrado: ${otpSelector}`);
  const { password: otp, nextPassword } = await getOTP();
  await page.fill(otpSelector, otp);
  await delay(1000);

  const urlAntesOTP = page.url();
  await page.evaluate(() => {
    const btn = document.querySelector<HTMLButtonElement>('#kc-login');
    if (btn) { btn.removeAttribute('disabled'); btn.click(); }
  });
  await delay(5000);

  const urlDepoisOTP = page.url();
  if (urlDepoisOTP.includes('sso.cloud.pje.jus.br') && urlDepoisOTP === urlAntesOTP && nextPassword) {
    const hasError = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('[role="alert"], .kc-feedback-text, .pf-c-alert__description'));
      for (const el of els) {
        const txt = (el.textContent ?? '').toLowerCase();
        if (txt.includes('inválid') || txt.includes('invalid') || txt.includes('incorreto')) return true;
      }
      return false;
    });
    if (hasError) {
      log('⚠️ OTP inválido, tentando próximo código...');
      await page.locator(otpSelector).first().fill(nextPassword);
      await delay(500);
      await page.evaluate(() => {
        const btn = document.querySelector<HTMLButtonElement>('#kc-login');
        if (btn) { btn.removeAttribute('disabled'); btn.click(); }
      });
      await delay(5000);
    }
  }

  await esperarSaidaSSO(page, targetHostname);
  await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {});
  await delay(3000);

  const ctx = page.context();
  const baseHostname = targetHostname.replace(/^pje\./, '').replace(/^www\./, '');
  let accessTokenCookie: { name: string; value: string; domain: string } | null = null;
  for (let i = 0; i < 40 && !accessTokenCookie; i++) {
    const cookies = await ctx.cookies();
    const found = cookies.find(
      (c) => c.name === 'access_token' &&
        (c.domain.includes(baseHostname) || c.domain.includes(targetHostname)),
    );
    if (found) accessTokenCookie = found; else await delay(500);
  }
  if (!accessTokenCookie) throw new Error('Cookie access_token não encontrado após auth.');

  const parts = accessTokenCookie.value.split('.');
  if (parts.length < 2) throw new Error('JWT access_token mal formatado');
  const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8')) as {
    id?: string | number; name?: string;
  };
  if (!payload.id) throw new Error('Campo id não encontrado no JWT.');

  const idAdvogado = String(payload.id);
  log(`✅ Autenticado | idAdvogado=${idAdvogado} | nome=${payload.name ?? 'N/A'}`);
  return { idAdvogado };
}

// ── API PJE — Perícias ────────────────────────────────────────────────────────
interface PagedResponse {
  pagina: number;
  tamanhoPagina: number;
  qtdPaginas: number;
  totalRegistros: number;
  resultado: Record<string, unknown>[];
}

// A API de perícias usa múltiplos parâmetros situacao (não suportado por URLSearchParams)
const SITUACOES = ['S', 'L', 'C', 'F', 'P', 'R'];
const SITUACOES_QUERY = SITUACOES.map((s) => `situacao=${s}`).join('&');

async function fetchPericiasPagina(page: Page, pagina: number): Promise<PagedResponse> {
  const endpoint = '/pje-comum-api/api/pericias';

  return page.evaluate(
    async ({ endpoint, situacoesQuery, pagina }) => {
      const url = `${window.location.origin}${endpoint}?${situacoesQuery}&pagina=${pagina}&tamanhoPagina=100`;
      const resp = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`HTTP ${resp.status}: ${txt.slice(0, 300)}`);
      }
      return resp.json() as Promise<{
        pagina: number; tamanhoPagina: number; qtdPaginas: number;
        totalRegistros: number; resultado: Record<string, unknown>[];
      }>;
    },
    { endpoint, situacoesQuery: SITUACOES_QUERY, pagina },
  );
}

async function fetchTodasPericias(page: Page): Promise<{
  pericias: Record<string, unknown>[];
  paginasRaw: PagedResponse[];
}> {
  log('\n📡 Buscando perícias (situações: S, L, C, F, P, R)...');
  const paginasRaw: PagedResponse[] = [];

  const primeira = await fetchPericiasPagina(page, 1);
  paginasRaw.push(primeira);

  log(`   Página 1: ${primeira.resultado?.length ?? 0} registros | qtdPaginas=${primeira.qtdPaginas} | totalRegistros=${primeira.totalRegistros}`);

  if (!Array.isArray(primeira.resultado) || primeira.resultado.length === 0) {
    log(`   ℹ️ Nenhuma perícia encontrada`);
    return { pericias: [], paginasRaw };
  }

  const todas: Record<string, unknown>[] = [...primeira.resultado];
  const qtdPaginas = primeira.qtdPaginas > 0 ? primeira.qtdPaginas : 1;

  for (let p = 2; p <= qtdPaginas; p++) {
    await delay(500);
    const pagina = await fetchPericiasPagina(page, p);
    paginasRaw.push(pagina);
    log(`   Página ${p}: ${pagina.resultado?.length ?? 0} registros`);
    todas.push(...(pagina.resultado ?? []));
  }

  log(`✅ Total: ${todas.length} perícias`);
  return { pericias: todas, paginasRaw };
}

// ── Análise ───────────────────────────────────────────────────────────────────
interface AnaliseResult {
  resumo: {
    total: number;
    idsUnicos: number;
    idsDuplicados: number;
    periciasComIdRepetido: number;
    idsDuplicadosComProcessosDiferentes: number;
    processosComMultiplasPericias: number;
    periciasComNrProcessoVazio: number;
  };
  duplicatas: Array<{
    id: number;
    count: number;
    numeroProcesso: string[];
    situacao: string[];
  }>;
  processosComMultiplasPericias: Array<{
    idProcesso: number;
    numeroProcesso: string;
    pericias: Array<{ id: number; situacao: string; prazoEntrega: string }>;
  }>;
  distribuicaoPorSituacao: Record<string, number>;
}

function analisarPericias(pericias: Record<string, unknown>[]): AnaliseResult {
  const mapaIds = new Map<
    number,
    { nrs: Set<string>; count: number; situacoes: Set<string> }
  >();
  const mapaProcessos = new Map<
    number,
    { nr: string; pericias: Array<{ id: number; situacao: string; prazoEntrega: string }> }
  >();
  const distribuicaoPorSituacao: Record<string, number> = {};
  const comNrVazio: Record<string, unknown>[] = [];

  for (const p of pericias) {
    const id = Number(p['id']);
    if (!id) continue;

    const nrProcesso = String(p['numeroProcesso'] ?? '').trim();
    const situacaoObj = p['situacao'] as Record<string, unknown> | undefined;
    const situacao = String(situacaoObj?.['codigo'] ?? p['situacaoPericia'] ?? '');
    const idProcesso = Number(p['idProcesso'] ?? 0);
    const prazoEntrega = String(p['prazoEntrega'] ?? '');

    // Contagem por situação
    distribuicaoPorSituacao[situacao] = (distribuicaoPorSituacao[situacao] ?? 0) + 1;

    // Mapa de IDs
    const entryId = mapaIds.get(id) ?? { nrs: new Set<string>(), count: 0, situacoes: new Set<string>() };
    entryId.count++;
    if (nrProcesso) entryId.nrs.add(nrProcesso);
    entryId.situacoes.add(situacao);
    mapaIds.set(id, entryId);

    // Mapa de processos
    if (idProcesso) {
      const entryProc = mapaProcessos.get(idProcesso) ?? { nr: nrProcesso, pericias: [] };
      entryProc.pericias.push({ id, situacao, prazoEntrega });
      mapaProcessos.set(idProcesso, entryProc);
    }

    if (!nrProcesso) comNrVazio.push(p);
  }

  const duplicatas = Array.from(mapaIds.entries())
    .filter(([, v]) => v.count > 1)
    .map(([id, v]) => ({
      id,
      count: v.count,
      numeroProcesso: Array.from(v.nrs),
      situacao: Array.from(v.situacoes),
    }))
    .sort((a, b) => b.count - a.count);

  const idsDuplicadosComProcessosDiferentes = duplicatas.filter((d) => d.numeroProcesso.length > 1).length;

  const processosComMultiplasPericias = Array.from(mapaProcessos.entries())
    .filter(([, v]) => v.pericias.length > 1)
    .map(([idProcesso, v]) => ({
      idProcesso,
      numeroProcesso: v.nr,
      pericias: v.pericias.sort((a, b) => a.prazoEntrega.localeCompare(b.prazoEntrega)),
    }))
    .sort((a, b) => b.pericias.length - a.pericias.length);

  return {
    resumo: {
      total: pericias.length,
      idsUnicos: mapaIds.size,
      idsDuplicados: duplicatas.length,
      periciasComIdRepetido: duplicatas.reduce((s, d) => s + d.count, 0),
      idsDuplicadosComProcessosDiferentes,
      processosComMultiplasPericias: processosComMultiplasPericias.length,
      periciasComNrProcessoVazio: comNrVazio.length,
    },
    duplicatas,
    processosComMultiplasPericias: processosComMultiplasPericias.slice(0, 20),
    distribuicaoPorSituacao,
  };
}

// ── Verificação da constraint ─────────────────────────────────────────────────
function verificarConstraint(pericias: Record<string, unknown>[]): {
  conflitos: Array<{ chave: string; count: number }>;
  totalConflitos: number;
} {
  const mapa = new Map<string, number>();
  for (const p of pericias) {
    const id = Number(p['id']);
    if (!id) continue;
    const nrProcesso = String(p['numeroProcesso'] ?? '').trim();
    const chave = `${id}::${nrProcesso}`;
    mapa.set(chave, (mapa.get(chave) ?? 0) + 1);
  }
  const conflitos = Array.from(mapa.entries())
    .filter(([, count]) => count > 1)
    .map(([chave, count]) => ({ chave, count }));
  return { conflitos, totalConflitos: conflitos.length };
}

// ── Comparação com banco ──────────────────────────────────────────────────────
async function compararComBanco(
  pericias: Record<string, unknown>[],
  trt: string,
  grau: string,
) {
  log('\n🔍 Comparando com banco de dados...');
  const idsPjeCapturados = Array.from(new Set(pericias.map((p) => Number(p['id'])).filter(Boolean)));

  const { data: periciasBanco, error } = await supabase
    .from('pericias')
    .select('id_pje, numero_processo, situacao_codigo')
    .eq('trt', trt)
    .eq('grau', grau)
    .in('id_pje', idsPjeCapturados);

  if (error) {
    log(`⚠️ Erro ao consultar banco: ${error.message}`);
    return { totalNoBanco: 0, totalCapturado: idsPjeCapturados.length, idsPjeCapturados, idsPjeNoBanco: [], apenasNoCapturado: idsPjeCapturados, apenasNoBanco: [] };
  }

  const idsPjeNoBanco = Array.from(new Set((periciasBanco ?? []).map((r) => Number(r.id_pje)).filter(Boolean)));
  const setBanco = new Set(idsPjeNoBanco);
  const setCapturado = new Set(idsPjeCapturados);

  const apenasNoCapturado = idsPjeCapturados.filter((id) => !setBanco.has(id));
  const apenasNoBanco = idsPjeNoBanco.filter((id) => !setCapturado.has(id));

  log(`   Capturadas agora: ${idsPjeCapturados.length} IDs únicos | No banco: ${idsPjeNoBanco.length} | Novas: ${apenasNoCapturado.length} | Sumidas: ${apenasNoBanco.length}`);

  // Distribuição de situações no banco
  const distribuicaoBanco: Record<string, number> = {};
  for (const r of periciasBanco ?? []) {
    const sit = String(r.situacao_codigo ?? '');
    distribuicaoBanco[sit] = (distribuicaoBanco[sit] ?? 0) + 1;
  }

  return { totalNoBanco: idsPjeNoBanco.length, totalCapturado: idsPjeCapturados.length, idsPjeCapturados, idsPjeNoBanco, apenasNoCapturado, apenasNoBanco, distribuicaoBanco };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const iniciado = new Date().toISOString();

  log('═══════════════════════════════════════════════════════════');
  log('  DEBUG: Captura direta de perícias TRT3 (1º grau)');
  log(`  Iniciado: ${iniciado}`);
  log(`  Situações: ${SITUACOES.join(', ')} | Sem persistência`);
  log('═══════════════════════════════════════════════════════════');

  let browser: Browser | null = null;

  try {
    // ── 1. Config e credenciais ─────────────────────────────────────────────
    const trt3Config = await getTRT3Config();
    salvar('01_config_trt3', trt3Config);

    const credencial = await getCredencialTRT3();

    // ── 2. Browser ──────────────────────────────────────────────────────────
    log('\n🌐 Lançando Chromium local (headless)...');
    browser = await chromium.launch({ headless: true });
    const ctx = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    });
    const page = await ctx.newPage();

    // ── 3. Autenticação ─────────────────────────────────────────────────────
    log('\n🔐 Fase 1: Autenticando no PJE TRT3...');
    const { idAdvogado } = await autenticar(page, trt3Config.loginUrl, trt3Config.baseUrl, credencial.cpf, credencial.senha);

    // ── 4. Captura das perícias ─────────────────────────────────────────────
    log('\n📡 Fase 2: Buscando perícias...');
    const { pericias, paginasRaw } = await fetchTodasPericias(page);

    salvar('02_pericias_raw', {
      meta: { capturado_em: new Date().toISOString(), total: pericias.length, situacoes: SITUACOES },
      pericias,
    });
    salvar('02_paginas_raw', { paginas: paginasRaw });

    // ── 5. Análise ──────────────────────────────────────────────────────────
    log('\n🔎 Fase 3: Analisando perícias capturadas...');
    const analise = analisarPericias(pericias);
    salvar('03_analise_pericias', analise);

    log(`   Total: ${analise.resumo.total}`);
    log(`   IDs únicos: ${analise.resumo.idsUnicos}`);
    log(`   IDs duplicados: ${analise.resumo.idsDuplicados}`);
    log(`   Perícias com ID repetido: ${analise.resumo.periciasComIdRepetido}`);
    log(`   IDs duplicados com processos diferentes: ${analise.resumo.idsDuplicadosComProcessosDiferentes}`);
    log(`   Processos com múltiplas perícias: ${analise.resumo.processosComMultiplasPericias}`);
    log(`   nrProcesso vazio: ${analise.resumo.periciasComNrProcessoVazio}`);
    log(`   Distribuição por situação: ${JSON.stringify(analise.distribuicaoPorSituacao)}`);

    if (analise.duplicatas.length > 0) {
      log(`\n   ⚠️ TOP 10 IDs duplicados:`);
      analise.duplicatas.slice(0, 10).forEach((d) => {
        log(`      id=${d.id} count=${d.count} situacao=[${d.situacao.join(',')}] nrProcesso=[${d.numeroProcesso.join(' | ')}]`);
      });
    }

    if (analise.resumo.processosComMultiplasPericias > 0) {
      log(`\n   ℹ️ TOP 5 processos com múltiplas perícias:`);
      analise.processosComMultiplasPericias.slice(0, 5).forEach((p) => {
        log(`      idProcesso=${p.idProcesso} nr="${p.numeroProcesso}" count=${p.pericias.length} situacoes=[${p.pericias.map((x) => x.situacao).join(',')}]`);
      });
    }

    // ── 6. Constraint check ─────────────────────────────────────────────────
    log('\n🔐 Fase 4: Verificando violações potenciais da constraint UNIQUE...');
    const constraintCheck = verificarConstraint(pericias);
    salvar('04_constraint_check', constraintCheck);
    if (constraintCheck.totalConflitos === 0) {
      log(`   ✅ Nenhum conflito de constraint encontrado na resposta da API`);
    } else {
      log(`   ⚠️ ${constraintCheck.totalConflitos} conflitos potenciais!`);
      constraintCheck.conflitos.slice(0, 10).forEach((c) => log(`      chave="${c.chave}" count=${c.count}`));
    }

    // ── 7. Comparação com banco ─────────────────────────────────────────────
    log('\n🗄️  Fase 5: Comparando com banco de dados...');
    const comparacaoBanco = await compararComBanco(pericias, 'TRT3', 'primeiro_grau');
    salvar('05_comparacao_banco', comparacaoBanco);

    // ── 8. Relatório final ──────────────────────────────────────────────────
    const relatorio = {
      iniciado,
      finalizado: new Date().toISOString(),
      duracao_segundos: (Date.now() - new Date(iniciado).getTime()) / 1000,
      trt: 'TRT3',
      grau: 'primeiro_grau',
      idAdvogado,
      analise_ids: analise.resumo,
      distribuicao_situacoes: analise.distribuicaoPorSituacao,
      constraint_check: {
        conflitos: constraintCheck.totalConflitos,
        status: constraintCheck.totalConflitos === 0 ? 'OK' : 'ATENÇÃO',
      },
      comparacao_banco: {
        capturado_agora: comparacaoBanco.totalCapturado,
        ja_no_banco: comparacaoBanco.totalNoBanco,
        novas_nao_no_banco: comparacaoBanco.apenasNoCapturado.length,
        sumidas_apenas_no_banco: comparacaoBanco.apenasNoBanco.length,
        distribuicao_banco: comparacaoBanco.distribuicaoBanco,
      },
      diagnostico: {
        reuso_de_ids_detectado: analise.resumo.idsDuplicadosComProcessosDiferentes > 0,
        ids_duplicados_sem_diferenca: analise.resumo.idsDuplicados - analise.resumo.idsDuplicadosComProcessosDiferentes,
      },
    };

    salvar('06_relatorio_final', relatorio);

    log('\n═══════════════════════════════════════════════════════════');
    log('✅ Diagnóstico concluído!');
    log(`   Total capturado:         ${pericias.length} perícias`);
    log(`   IDs duplicados:          ${analise.resumo.idsDuplicados}`);
    log(`   Reuso de IDs (ID≠proc):  ${analise.resumo.idsDuplicadosComProcessosDiferentes}`);
    log(`   Conflitos constraint:    ${constraintCheck.totalConflitos}`);
    log(`   Novas (não no BD):       ${comparacaoBanco.apenasNoCapturado.length}`);
    log(`   Pasta de saída:          ${OUTPUT_DIR}`);
    log('═══════════════════════════════════════════════════════════\n');
  } finally {
    if (browser) {
      await browser.close();
      log('🔒 Browser fechado');
    }
    salvarLogs();
  }
}

main().catch((err: unknown) => {
  console.error('❌ Erro fatal:', err);
  salvarLogs();
  process.exit(1);
});
