/**
 * debug-expedientes-trt3-direto.ts
 *
 * Script de diagnóstico de captura de expedientes TRT3 (1º grau).
 * Opera diretamente via Playwright + Supabase — sem passar pela API HTTP do Next.js
 * e SEM persistir nada no banco.
 *
 * Objetivo: verificar se o PJE está retornando IDs duplicados de expedientes
 * e comparar o que é retornado vs o que está persistido no banco.
 *
 * Uso:
 *   npx tsx scripts/captura/pendentes/debug-expedientes-trt3-direto.ts
 *
 * Saída: test-expedientes/<timestamp>_*.json + test-expedientes/<timestamp>_00_log.txt
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
const OUTPUT_DIR = path.join(process.cwd(), 'test-expedientes');
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

  // Estratégia 1: JOIN via relação tribunal_id -> tribunais
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
    return {
      loginUrl: data.url_login_seam,
      baseUrl: data.url_base,
      apiUrl: data.url_api,
    };
  }

  // Estratégia 2: lookup via tabela tribunais separado
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
  return {
    loginUrl: cfg.url_login_seam,
    baseUrl: cfg.url_base,
    apiUrl: cfg.url_api,
  };
}

interface Credencial {
  cpf: string;
  senha: string;
}

async function getCredencialTRT3(): Promise<Credencial> {
  log('🔑 Buscando credencial TRT3 ativa no banco...');

  const { data, error } = await supabase
    .from('credenciais')
    .select(`
      usuario,
      senha,
      advogados (
        cpf
      )
    `)
    .eq('tribunal', 'TRT3')
    .eq('grau', 'primeiro_grau')
    .eq('active', true)
    .limit(1)
    .single();

  if (error || !data) {
    throw new Error(`Credencial TRT3 não encontrada: ${error?.message ?? 'resultado vazio'}`);
  }

  // usuario = CPF de login; se não preenchido, usa advogados.cpf
  const advogadoRaw = data.advogados;
  const advogado = Array.isArray(advogadoRaw) ? advogadoRaw[0] : advogadoRaw;
  const cpf = data.usuario || (advogado as { cpf: string } | null)?.cpf || '';

  if (!cpf) throw new Error('CPF não encontrado na credencial TRT3');

  log(`✅ Credencial carregada | CPF: ***${cpf.slice(-4)}`);
  return { cpf, senha: data.senha };
}

// ── 2FAuth / OTP ──────────────────────────────────────────────────────────────
interface OTPResult {
  password: string;
  nextPassword?: string;
}

async function getOTP(): Promise<OTPResult> {
  if (!TWOFAUTH_API_URL || !TWOFAUTH_API_TOKEN) {
    throw new Error('TWOFAUTH_API_URL e TWOFAUTH_API_TOKEN são obrigatórias para OTP');
  }

  log('📱 Buscando OTP do 2FAuth...');

  const url = `${TWOFAUTH_API_URL}/twofaccounts/${TWOFAUTH_ACCOUNT_ID}/otp`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${TWOFAUTH_API_TOKEN}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`2FAuth API erro ${response.status}: ${await response.text()}`);
  }

  const data = (await response.json()) as { password: string; next_password?: string };
  log(`✅ OTP obtido com sucesso`);
  return {
    password: data.password,
    nextPassword: data.next_password,
  };
}

// ── Auth (Playwright) ─────────────────────────────────────────────────────────
function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

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
    } catch {
      // URL pode ser about:blank durante redirect
    }
    await delay(2000);
  }
  throw new Error(`Timeout ao aguardar saída do SSO. URL atual: ${page.url()}`);
}

async function autenticar(
  page: Page,
  loginUrl: string,
  baseUrl: string,
  cpf: string,
  senha: string,
): Promise<{ idAdvogado: string }> {
  const targetHostname = new URL(baseUrl).hostname;

  // Anti-detecção
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

  // Clique SSO com retry para erros de rede transitórios
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

  // Campo OTP
  log('⏳ Aguardando campo OTP...');
  const OTP_SELECTORS = [
    '#otp',
    '#totp',
    'input[name="otp"]',
    'input[name="totp"]',
    '#kc-otp-login-form input[type="text"]',
  ];
  let otpSelector: string | null = null;

  for (let i = 0; i < 10 && !otpSelector; i++) {
    for (const sel of OTP_SELECTORS) {
      const el = await page.$(sel);
      if (el && (await el.isVisible())) {
        otpSelector = sel;
        break;
      }
    }
    if (!otpSelector) await delay(2000);
  }

  if (!otpSelector) {
    const debugInputs = await page.evaluate(() =>
      Array.from(document.querySelectorAll('input')).map((el) => ({
        id: el.id,
        name: el.name,
        type: el.type,
      })),
    );
    log(`⚠️ Inputs presentes na página: ${JSON.stringify(debugInputs)}`);
    throw new Error('Campo OTP não encontrado após 20s. Verifique o fluxo de login.');
  }

  log(`✅ Campo OTP encontrado: ${otpSelector}`);

  const { password: otp, nextPassword } = await getOTP();
  await page.fill(otpSelector, otp);
  await delay(1000);

  const urlAntesOTP = page.url();
  await page.evaluate(() => {
    const btn = document.querySelector<HTMLButtonElement>('#kc-login');
    if (btn) {
      btn.removeAttribute('disabled');
      btn.click();
    }
  });
  await delay(5000);

  // Verificar se OTP foi aceito; tentar próximo se houver erro
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
      const otpField = page.locator(otpSelector).first();
      await otpField.fill(nextPassword);
      await delay(500);
      await page.evaluate(() => {
        const btn = document.querySelector<HTMLButtonElement>('#kc-login');
        if (btn) {
          btn.removeAttribute('disabled');
          btn.click();
        }
      });
      await delay(5000);
    }
  }

  await esperarSaidaSSO(page, targetHostname);
  await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {});
  await delay(3000);

  // Extrair idAdvogado do JWT cookie
  const ctx = page.context();
  const baseHostname = targetHostname.replace(/^pje\./, '').replace(/^www\./, '');
  let accessTokenCookie: { name: string; value: string; domain: string } | null = null;

  for (let i = 0; i < 40 && !accessTokenCookie; i++) {
    const cookies = await ctx.cookies();
    const found = cookies.find(
      (c) =>
        c.name === 'access_token' &&
        (c.domain.includes(baseHostname) || c.domain.includes(targetHostname)),
    );
    if (found) {
      accessTokenCookie = found;
    } else {
      await delay(500);
    }
  }

  if (!accessTokenCookie) {
    const allCookies = await ctx.cookies();
    log(`⚠️ Cookies disponíveis: ${allCookies.map((c) => `${c.name}(${c.domain})`).join(', ')}`);
    throw new Error('Cookie access_token não encontrado após auth. Login pode ter falhado.');
  }

  const parts = accessTokenCookie.value.split('.');
  if (parts.length < 2) throw new Error('JWT access_token mal formatado');

  const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8')) as {
    id?: string | number;
    cpf?: string;
    name?: string;
  };

  if (!payload.id) throw new Error('Campo id não encontrado no JWT. Verifique advogado logado.');

  const idAdvogado = String(payload.id);
  log(`✅ Autenticado | idAdvogado=${idAdvogado} | nome=${payload.name ?? 'N/A'}`);

  return { idAdvogado };
}

// ── API PJE ───────────────────────────────────────────────────────────────────
interface PagedResponse {
  pagina: number;
  tamanhoPagina: number;
  qtdPaginas: number;
  totalRegistros: number;
  resultado: Record<string, unknown>[];
}

async function fetchExpedientesPage(
  page: Page,
  idAdvogado: number,
  pagina: number,
  agrupadorExpediente: 'N' | 'I',
): Promise<PagedResponse> {
  const endpoint = `/pje-comum-api/api/paineladvogado/${idAdvogado}/processos`;
  const params: Record<string, string | number | boolean> = {
    idAgrupamentoProcessoTarefa: 2,
    pagina,
    tamanhoPagina: 100,
    agrupadorExpediente,
    tipoPainelAdvogado: 2,
    idPainelAdvogadoEnum: 2,
    ordenacaoCrescente: false,
  };

  return page.evaluate(
    async ({ endpoint, params }) => {
      const qs = new URLSearchParams(
        Object.entries(params).reduce(
          (acc, [k, v]) => {
            acc[k] = String(v);
            return acc;
          },
          {} as Record<string, string>,
        ),
      ).toString();

      const url = `${window.location.origin}${endpoint}?${qs}`;
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
        pagina: number;
        tamanhoPagina: number;
        qtdPaginas: number;
        totalRegistros: number;
        resultado: Record<string, unknown>[];
      }>;
    },
    { endpoint, params },
  );
}

async function fetchTodosExpedientes(
  page: Page,
  idAdvogado: number,
  agrupadorExpediente: 'N' | 'I',
  label: string,
): Promise<{
  processos: Record<string, unknown>[];
  paginasRaw: PagedResponse[];
}> {
  log(`\n📡 Buscando expedientes [${label}] (agrupador=${agrupadorExpediente})...`);

  const paginasRaw: PagedResponse[] = [];

  const primeira = await fetchExpedientesPage(page, idAdvogado, 1, agrupadorExpediente);
  paginasRaw.push(primeira);

  log(
    `   Página 1: ${primeira.resultado?.length ?? 0} registros | ` +
      `qtdPaginas=${primeira.qtdPaginas} | totalRegistros=${primeira.totalRegistros}`,
  );

  if (!Array.isArray(primeira.resultado) || primeira.resultado.length === 0) {
    log(`   ℹ️ Nenhum expediente [${label}]`);
    return { processos: [], paginasRaw };
  }

  const todos: Record<string, unknown>[] = [...primeira.resultado];

  // qtdPaginas=0 significa 1 página (quirk do PJE)
  const qtdPaginas = primeira.qtdPaginas > 0 ? primeira.qtdPaginas : 1;

  for (let p = 2; p <= qtdPaginas; p++) {
    await delay(500);
    const pagina = await fetchExpedientesPage(page, idAdvogado, p, agrupadorExpediente);
    paginasRaw.push(pagina);
    log(`   Página ${p}: ${pagina.resultado?.length ?? 0} registros`);
    todos.push(...(pagina.resultado ?? []));
  }

  log(`✅ Total [${label}]: ${todos.length} expedientes`);
  return { processos: todos, paginasRaw };
}

async function fetchTotalizadores(page: Page, idAdvogado: number): Promise<unknown> {
  return page.evaluate(
    async ({ idAdvogado }) => {
      const url = `${window.location.origin}/pje-comum-api/api/paineladvogado/${idAdvogado}/totalizadores?tipoPainelAdvogado=2`;
      const resp = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!resp.ok) return { erro: `HTTP ${resp.status}` };
      return resp.json();
    },
    { idAdvogado },
  );
}

// ── Análise de duplicatas ─────────────────────────────────────────────────────
interface Duplicata {
  id: number;
  count: number;
  numeroProcesso: string;
  idDocumento: (number | null)[];
  agrupadores: string[];
}

interface AnaliseResult {
  resumo: {
    total: number;
    idsUnicos: number;
    idsDuplicados: number;
    processosComIdRepetido: number;
    processosIdDuplicadoComNumerosDiferentes: number;
  };
  duplicatas: Duplicata[];
}

function analisarDuplicatas(
  processos: Record<string, unknown>[],
  agrupador: Record<number, string>,
): AnaliseResult {
  const mapa = new Map<
    number,
    { nums: Set<string>; count: number; idDocumento: Set<number | null>; agrupadores: Set<string> }
  >();

  for (const p of processos) {
    const id = Number(p['id']);
    if (!id) continue;

    const num = String(p['numeroProcesso'] ?? p['numero'] ?? '').trim();
    const docId = p['idDocumento'] != null ? Number(p['idDocumento']) : null;
    const agr = agrupador[id] ?? 'desconhecido';

    const entry = mapa.get(id) ?? {
      nums: new Set<string>(),
      count: 0,
      idDocumento: new Set<number | null>(),
      agrupadores: new Set<string>(),
    };
    entry.count++;
    if (num) entry.nums.add(num);
    entry.idDocumento.add(docId);
    entry.agrupadores.add(agr);
    mapa.set(id, entry);
  }

  const duplicatas: Duplicata[] = Array.from(mapa.entries())
    .filter(([, v]) => v.count > 1)
    .map(([id, v]) => ({
      id,
      count: v.count,
      numeroProcesso: Array.from(v.nums).join(' | '),
      idDocumento: Array.from(v.idDocumento),
      agrupadores: Array.from(v.agrupadores),
    }))
    .sort((a, b) => b.count - a.count);

  const comNumerosDiferentes = duplicatas.filter((d) => d.numeroProcesso.includes(' | ')).length;

  return {
    resumo: {
      total: processos.length,
      idsUnicos: mapa.size,
      idsDuplicados: duplicatas.length,
      processosComIdRepetido: duplicatas.reduce((s, d) => s + d.count, 0),
      processosIdDuplicadoComNumerosDiferentes: comNumerosDiferentes,
    },
    duplicatas,
  };
}

// ── Comparação com banco ──────────────────────────────────────────────────────
async function compararComBanco(
  processos: Record<string, unknown>[],
  trt: string,
  grau: string,
): Promise<{
  totalNoBanco: number;
  totalCapturado: number;
  idsPjeCapturados: number[];
  idsPjeNoBanco: number[];
  apenasNoCapturado: number[];
  apenasNoBanco: number[];
}> {
  log('\n🔍 Comparando com banco de dados...');

  const idsPjeCapturados = Array.from(new Set(processos.map((p) => Number(p['id'])).filter(Boolean)));

  const { data: expedientesBanco, error } = await supabase
    .from('expedientes')
    .select('id_pje')
    .eq('trt', trt)
    .eq('grau', grau)
    .in('id_pje', idsPjeCapturados);

  if (error) {
    log(`⚠️ Erro ao consultar banco: ${error.message}`);
    return {
      totalNoBanco: 0,
      totalCapturado: idsPjeCapturados.length,
      idsPjeCapturados,
      idsPjeNoBanco: [],
      apenasNoCapturado: idsPjeCapturados,
      apenasNoBanco: [],
    };
  }

  const idsPjeNoBanco = (expedientesBanco ?? []).map((r) => Number(r.id_pje)).filter(Boolean);
  const setBanco = new Set(idsPjeNoBanco);
  const setCapturado = new Set(idsPjeCapturados);

  const apenasNoCapturado = idsPjeCapturados.filter((id) => !setBanco.has(id));
  const apenasNoBanco = idsPjeNoBanco.filter((id) => !setCapturado.has(id));

  log(
    `   Capturados agora: ${idsPjeCapturados.length} IDs únicos | ` +
      `No banco: ${idsPjeNoBanco.length} | ` +
      `Apenas no capturado (novos): ${apenasNoCapturado.length} | ` +
      `Apenas no banco (sumidos): ${apenasNoBanco.length}`,
  );

  return {
    totalNoBanco: idsPjeNoBanco.length,
    totalCapturado: idsPjeCapturados.length,
    idsPjeCapturados,
    idsPjeNoBanco,
    apenasNoCapturado,
    apenasNoBanco,
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const iniciado = new Date().toISOString();

  log('═══════════════════════════════════════════════════════════');
  log('  DEBUG: Captura direta de expedientes TRT3 (1º grau)');
  log(`  Iniciado: ${iniciado}`);
  log('  Sem persistência | Sem download de documentos');
  log('═══════════════════════════════════════════════════════════');

  let browser: Browser | null = null;

  try {
    // ── 1. Config e credenciais ─────────────────────────────────────────────
    const config = await getTRT3Config();
    salvar('01_config_trt3', config);
    log(`✅ Config | loginUrl=${config.loginUrl} | apiUrl=${config.apiUrl}`);

    const credencial = await getCredencialTRT3();

    // ── 2. Browser ──────────────────────────────────────────────────────────
    log('\n🌐 Lançando Chromium local (headless)...');
    browser = await chromium.launch({ headless: true });
    const ctx = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    });
    const page = await ctx.newPage();

    // ── 3. Autenticação ─────────────────────────────────────────────────────
    log('\n🔐 Fase 1: Autenticando no PJE TRT3...');
    const { idAdvogado } = await autenticar(
      page,
      config.loginUrl,
      config.baseUrl,
      credencial.cpf,
      credencial.senha,
    );
    const idAdvogadoNum = parseInt(idAdvogado, 10);

    // ── 4. Totalizadores ────────────────────────────────────────────────────
    log('\n📊 Fase 2: Buscando totalizadores...');
    const totalizadores = await fetchTotalizadores(page, idAdvogadoNum);
    salvar('02_totalizadores', totalizadores);
    log(`   ${JSON.stringify(totalizadores)?.slice(0, 300)}`);

    // ── 5. Expedientes no prazo (N) ─────────────────────────────────────────
    log('\n📡 Fase 3: Expedientes no_prazo (agrupador=N)...');
    const { processos: noPrazo, paginasRaw: paginasNoPrazo } = await fetchTodosExpedientes(
      page,
      idAdvogadoNum,
      'N',
      'no_prazo',
    );

    salvar('03_no_prazo_processos', {
      meta: {
        agrupador: 'N',
        label: 'no_prazo',
        capturado_em: new Date().toISOString(),
        total: noPrazo.length,
      },
      processos: noPrazo,
    });
    salvar('03_no_prazo_paginas_raw', { paginas: paginasNoPrazo });

    // ── 6. Expedientes sem prazo (I) ────────────────────────────────────────
    log('\n📡 Fase 4: Expedientes sem_prazo (agrupador=I)...');
    await delay(1000);
    const { processos: semPrazo, paginasRaw: paginasSemPrazo } = await fetchTodosExpedientes(
      page,
      idAdvogadoNum,
      'I',
      'sem_prazo',
    );

    salvar('04_sem_prazo_processos', {
      meta: {
        agrupador: 'I',
        label: 'sem_prazo',
        capturado_em: new Date().toISOString(),
        total: semPrazo.length,
      },
      processos: semPrazo,
    });
    salvar('04_sem_prazo_paginas_raw', { paginas: paginasSemPrazo });

    // ── 7. Análise de duplicatas ────────────────────────────────────────────
    log('\n🔎 Fase 5: Analisando duplicatas de IDs...');

    // Mapear qual agrupador cada processo veio
    const agrupadorPorId: Record<number, string> = {};
    for (const p of noPrazo) agrupadorPorId[Number(p['id'])] = 'N';
    for (const p of semPrazo) {
      const id = Number(p['id']);
      agrupadorPorId[id] = agrupadorPorId[id] ? `${agrupadorPorId[id]}+I` : 'I';
    }

    const todosProcessos = [...noPrazo, ...semPrazo];
    const analiseDuplicatas = analisarDuplicatas(todosProcessos, agrupadorPorId);
    salvar('05_analise_duplicatas', analiseDuplicatas);

    log(`   Total: ${analiseDuplicatas.resumo.total} processos`);
    log(`   IDs únicos: ${analiseDuplicatas.resumo.idsUnicos}`);
    log(`   IDs duplicados: ${analiseDuplicatas.resumo.idsDuplicados}`);
    log(`   Processos com ID repetido: ${analiseDuplicatas.resumo.processosComIdRepetido}`);
    log(`   IDs duplicados com números DIFERENTES: ${analiseDuplicatas.resumo.processosIdDuplicadoComNumerosDiferentes}`);

    if (analiseDuplicatas.duplicatas.length > 0) {
      log(`\n   ⚠️  TOP 10 IDs duplicados:`);
      analiseDuplicatas.duplicatas.slice(0, 10).forEach((d) => {
        log(`      id=${d.id} count=${d.count} agrupadores=[${d.agrupadores.join(',')}] nums="${d.numeroProcesso}" idDocumento=${JSON.stringify(d.idDocumento)}`);
      });
    }

    // ── 8. Comparação com banco ─────────────────────────────────────────────
    log('\n🗄️  Fase 6: Comparando com banco de dados...');
    const comparacaoBanco = await compararComBanco(todosProcessos, 'TRT3', 'primeiro_grau');
    salvar('06_comparacao_banco', comparacaoBanco);

    // ── 9. Relatório final ──────────────────────────────────────────────────
    const relatorio = {
      iniciado,
      finalizado: new Date().toISOString(),
      duracao_segundos: (Date.now() - new Date(iniciado).getTime()) / 1000,
      trt: 'TRT3',
      grau: 'primeiro_grau',
      idAdvogado,
      totais: {
        no_prazo: noPrazo.length,
        sem_prazo: semPrazo.length,
        total: todosProcessos.length,
      },
      analise_ids: analiseDuplicatas.resumo,
      comparacao_banco: {
        capturado_agora: comparacaoBanco.totalCapturado,
        ja_no_banco: comparacaoBanco.totalNoBanco,
        novos_nao_no_banco: comparacaoBanco.apenasNoCapturado.length,
        sumidos_apenas_no_banco: comparacaoBanco.apenasNoBanco.length,
      },
    };

    salvar('07_relatorio_final', relatorio);

    log('\n═══════════════════════════════════════════════════════════');
    log('✅ Diagnóstico concluído!');
    log(`   No prazo:           ${noPrazo.length} expedientes`);
    log(`   Sem prazo:          ${semPrazo.length} expedientes`);
    log(`   Total:              ${todosProcessos.length}`);
    log(`   IDs duplicados:     ${analiseDuplicatas.resumo.idsDuplicados}`);
    log(`   Novos (não no BD):  ${comparacaoBanco.apenasNoCapturado.length}`);
    log(`   Pasta de saída:     ${OUTPUT_DIR}`);
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
