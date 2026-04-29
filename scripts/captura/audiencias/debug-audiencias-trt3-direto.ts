/**
 * debug-audiencias-trt3-direto.ts
 *
 * Script de diagnóstico de captura de audiências TRT3 (1º grau).
 * Opera diretamente via Playwright + Supabase — sem passar pela API HTTP do Next.js
 * e SEM persistir nada no banco.
 *
 * Objetivo: verificar se o PJE retorna IDs duplicados de audiências,
 * múltiplas audiências por processo, e comparar o que é retornado vs
 * o que está persistido no banco. Análogo ao script de expedientes.
 *
 * Uso:
 *   npx tsx scripts/captura/audiencias/debug-audiencias-trt3-direto.ts
 *
 * Saída: test-audiencias/<timestamp>_*.json + test-audiencias/<timestamp>_00_log.txt
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
const OUTPUT_DIR = path.join(process.cwd(), 'test-audiencias');
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
    return {
      loginUrl: data.url_login_seam,
      baseUrl: data.url_base,
      apiUrl: data.url_api,
    };
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

// ── API PJE — Audiências ──────────────────────────────────────────────────────
interface PagedResponse {
  pagina: number;
  tamanhoPagina: number;
  qtdPaginas: number;
  totalRegistros: number;
  resultado: Record<string, unknown>[];
}

async function fetchAudienciasPage(
  page: Page,
  dataInicio: string,
  dataFim: string,
  numeroPagina: number,
  codigoSituacao: string,
): Promise<PagedResponse> {
  const endpoint = '/pje-comum-api/api/pauta-usuarios-externos';
  const params: Record<string, string | number> = {
    dataInicio,
    dataFim,
    numeroPagina,
    tamanhoPagina: 100,
    codigoSituacao,
    ordenacao: 'asc',
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

async function fetchTodasAudiencias(
  page: Page,
  dataInicio: string,
  dataFim: string,
  codigoSituacao: string,
  label: string,
): Promise<{
  audiencias: Record<string, unknown>[];
  paginasRaw: PagedResponse[];
}> {
  log(`\n📡 Buscando audiências [${label}] (situacao=${codigoSituacao})...`);

  const paginasRaw: PagedResponse[] = [];

  const primeira = await fetchAudienciasPage(page, dataInicio, dataFim, 1, codigoSituacao);
  paginasRaw.push(primeira);

  log(
    `   Página 1: ${primeira.resultado?.length ?? 0} registros | ` +
    `qtdPaginas=${primeira.qtdPaginas} | totalRegistros=${primeira.totalRegistros}`,
  );

  if (!Array.isArray(primeira.resultado) || primeira.resultado.length === 0) {
    log(`   ℹ️ Nenhuma audiência [${label}]`);
    return { audiencias: [], paginasRaw };
  }

  const todas: Record<string, unknown>[] = [...primeira.resultado];

  // qtdPaginas=0 significa 1 página (quirk do PJE idêntico ao de expedientes)
  const qtdPaginas = primeira.qtdPaginas > 0 ? primeira.qtdPaginas : 1;

  for (let p = 2; p <= qtdPaginas; p++) {
    await delay(500);
    const pagina = await fetchAudienciasPage(page, dataInicio, dataFim, p, codigoSituacao);
    paginasRaw.push(pagina);
    log(`   Página ${p}: ${pagina.resultado?.length ?? 0} registros`);
    todas.push(...(pagina.resultado ?? []));
  }

  log(`✅ Total [${label}]: ${todas.length} audiências`);
  return { audiencias: todas, paginasRaw };
}

// ── Análise de audiências ─────────────────────────────────────────────────────
interface AudienciaDuplicata {
  id: number;
  count: number;
  nrProcesso: string[];
  dataInicio: string[];
  situacao: string;
}

interface AudienciasPorProcesso {
  idProcesso: number;
  nrProcesso: string;
  audiencias: Array<{
    id: number;
    dataInicio: string;
    dataFim: string;
    status: string;
  }>;
}

interface AnaliseResult {
  resumo: {
    total: number;
    idsUnicos: number;
    idsDuplicados: number;
    audienciasComIdRepetido: number;
    // Quantos IDs aparecem com número de processo diferente (ID reuse análogo ao de expedientes)
    idsDuplicadosComProcessosDiferentes: number;
    // Quantos processos têm mais de 1 audiência (esperado/válido)
    processosComMultiplasAudiencias: number;
    // Audiências com nrProcesso vazio (risco de falso conflito na constraint)
    audienciasComNrProcessoVazio: number;
  };
  duplicatas: AudienciaDuplicata[];
  processosComMultiplasAudiencias: AudienciasPorProcesso[];
  audienciasComNrProcessoVazio: Record<string, unknown>[];
}

function analisarAudiencias(audiencias: Record<string, unknown>[]): AnaliseResult {
  // 1. Duplicatas de id
  const mapaIds = new Map<
    number,
    { nrs: Set<string>; count: number; datas: Set<string>; status: string }
  >();

  // 2. Múltiplas audiências por processo
  const mapaProcessos = new Map<
    number,
    { nr: string; audiencias: Array<{ id: number; dataInicio: string; dataFim: string; status: string }> }
  >();

  // 3. nrProcesso vazio
  const comNrVazio: Record<string, unknown>[] = [];

  for (const a of audiencias) {
    const id = Number(a['id']);
    if (!id) continue;

    // Extrair nrProcesso de diferentes campos possíveis
    const nrProcesso = (
      (a['nrProcesso'] as string) ??
      (a['processo'] as Record<string, unknown> | undefined)?.['numero'] as string ??
      ''
    ).trim();

    const dataInicio = String(a['dataInicio'] ?? '');
    const dataFim = String(a['dataFim'] ?? '');
    const status = String(a['status'] ?? '');
    const idProcesso = Number(
      a['idProcesso'] ??
      (a['processo'] as Record<string, unknown> | undefined)?.['id'] ??
      0
    );

    // Mapa de IDs (detecta duplicatas)
    const entryId = mapaIds.get(id) ?? { nrs: new Set<string>(), count: 0, datas: new Set<string>(), status };
    entryId.count++;
    if (nrProcesso) entryId.nrs.add(nrProcesso);
    entryId.datas.add(dataInicio);
    mapaIds.set(id, entryId);

    // Mapa de processos (detecta múltiplas audiências por processo)
    if (idProcesso) {
      const entryProc = mapaProcessos.get(idProcesso) ?? { nr: nrProcesso, audiencias: [] };
      entryProc.audiencias.push({ id, dataInicio, dataFim, status });
      mapaProcessos.set(idProcesso, entryProc);
    }

    // nrProcesso vazio
    if (!nrProcesso) {
      comNrVazio.push(a);
    }
  }

  const duplicatas: AudienciaDuplicata[] = Array.from(mapaIds.entries())
    .filter(([, v]) => v.count > 1)
    .map(([id, v]) => ({
      id,
      count: v.count,
      nrProcesso: Array.from(v.nrs),
      dataInicio: Array.from(v.datas),
      situacao: v.status,
    }))
    .sort((a, b) => b.count - a.count);

  const idsDuplicadosComProcessosDiferentes = duplicatas.filter((d) => d.nrProcesso.length > 1).length;

  const processosComMultiplasAudiencias: AudienciasPorProcesso[] = Array.from(mapaProcessos.entries())
    .filter(([, v]) => v.audiencias.length > 1)
    .map(([idProcesso, v]) => ({
      idProcesso,
      nrProcesso: v.nr,
      audiencias: v.audiencias.sort((a, b) => a.dataInicio.localeCompare(b.dataInicio)),
    }))
    .sort((a, b) => b.audiencias.length - a.audiencias.length);

  return {
    resumo: {
      total: audiencias.length,
      idsUnicos: mapaIds.size,
      idsDuplicados: duplicatas.length,
      audienciasComIdRepetido: duplicatas.reduce((s, d) => s + d.count, 0),
      idsDuplicadosComProcessosDiferentes,
      processosComMultiplasAudiencias: processosComMultiplasAudiencias.length,
      audienciasComNrProcessoVazio: comNrVazio.length,
    },
    duplicatas,
    processosComMultiplasAudiencias: processosComMultiplasAudiencias.slice(0, 20),
    audienciasComNrProcessoVazio: comNrVazio,
  };
}

// ── Verificação da constraint de unicidade ────────────────────────────────────
interface ConflitoPotencial {
  chave: string;
  audiencias: Array<{
    id: number;
    nrProcesso: string;
    dataInicio: string;
    status: string;
  }>;
}

function verificarConstraintUnicidade(
  audiencias: Record<string, unknown>[],
): {
  conflitos: ConflitoPotencial[];
  totalConflitos: number;
} {
  // Constraint: UNIQUE (id_pje, trt, grau, numero_processo)
  // Como trt e grau são fixos neste script, a chave efetiva é (id, nrProcesso)
  const mapa = new Map<string, Array<{ id: number; nrProcesso: string; dataInicio: string; status: string }>>();

  for (const a of audiencias) {
    const id = Number(a['id']);
    if (!id) continue;

    const nrProcesso = (
      (a['nrProcesso'] as string) ??
      (a['processo'] as Record<string, unknown> | undefined)?.['numero'] as string ??
      ''
    ).trim();

    const dataInicio = String(a['dataInicio'] ?? '');
    const status = String(a['status'] ?? '');
    const chave = `${id}::${nrProcesso}`;

    const lista = mapa.get(chave) ?? [];
    lista.push({ id, nrProcesso, dataInicio, status });
    mapa.set(chave, lista);
  }

  const conflitos: ConflitoPotencial[] = Array.from(mapa.entries())
    .filter(([, v]) => v.length > 1)
    .map(([chave, audiencias]) => ({ chave, audiencias }));

  return { conflitos, totalConflitos: conflitos.length };
}

// ── Comparação com banco ──────────────────────────────────────────────────────
async function compararComBanco(
  audiencias: Record<string, unknown>[],
  trt: string,
  grau: string,
): Promise<{
  totalNoBanco: number;
  totalCapturado: number;
  idsPjeCapturados: number[];
  idsPjeNoBanco: number[];
  apenasNoCapturado: number[];
  apenasNoBanco: number[];
  conflitosConstraintNoBanco: Array<{
    id_pje: number;
    numero_processo: string;
    trt: string;
    grau: string;
    rows: number;
  }>;
}> {
  log('\n🔍 Comparando com banco de dados...');

  const idsPjeCapturados = Array.from(
    new Set(audiencias.map((a) => Number(a['id'])).filter(Boolean))
  );

  // Buscar audiências existentes no banco
  const { data: audienciasBanco, error } = await supabase
    .from('audiencias')
    .select('id_pje, numero_processo')
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
      conflitosConstraintNoBanco: [],
    };
  }

  const idsPjeNoBanco = Array.from(
    new Set((audienciasBanco ?? []).map((r) => Number(r.id_pje)).filter(Boolean))
  );
  const setBanco = new Set(idsPjeNoBanco);
  const setCapturado = new Set(idsPjeCapturados);

  const apenasNoCapturado = idsPjeCapturados.filter((id) => !setBanco.has(id));
  const apenasNoBanco = idsPjeNoBanco.filter((id) => !setCapturado.has(id));

  // Detectar se há múltiplas linhas para o mesmo (id_pje, numero_processo) no banco
  // (violação da constraint não deveria acontecer, mas vamos verificar)
  const contadorBanco = new Map<string, number>();
  for (const r of audienciasBanco ?? []) {
    const chave = `${r.id_pje}::${r.numero_processo}`;
    contadorBanco.set(chave, (contadorBanco.get(chave) ?? 0) + 1);
  }
  const conflitosConstraintNoBanco = Array.from(contadorBanco.entries())
    .filter(([, count]) => count > 1)
    .map(([chave, rows]) => {
      const [id_pje, numero_processo] = chave.split('::');
      return { id_pje: Number(id_pje), numero_processo: numero_processo ?? '', trt, grau, rows };
    });

  log(
    `   Capturadas agora: ${idsPjeCapturados.length} IDs únicos | ` +
    `No banco: ${idsPjeNoBanco.length} | ` +
    `Apenas no capturado (novas): ${apenasNoCapturado.length} | ` +
    `Apenas no banco (sumidas): ${apenasNoBanco.length}`,
  );

  if (conflitosConstraintNoBanco.length > 0) {
    log(`   ⚠️ CONFLITOS DE CONSTRAINT NO BANCO: ${conflitosConstraintNoBanco.length}`);
  }

  return {
    totalNoBanco: idsPjeNoBanco.length,
    totalCapturado: idsPjeCapturados.length,
    idsPjeCapturados,
    idsPjeNoBanco,
    apenasNoCapturado,
    apenasNoBanco,
    conflitosConstraintNoBanco,
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const iniciado = new Date().toISOString();

  // Período: hoje até 1 ano (padrão do sistema para audiências designadas)
  const hoje = new Date();
  const umAnoDepois = new Date(hoje);
  umAnoDepois.setFullYear(umAnoDepois.getFullYear() + 1);
  const dataInicio = hoje.toISOString().split('T')[0]!;
  const dataFim = umAnoDepois.toISOString().split('T')[0]!;

  log('═══════════════════════════════════════════════════════════');
  log('  DEBUG: Captura direta de audiências TRT3 (1º grau)');
  log(`  Iniciado: ${iniciado}`);
  log(`  Período: ${dataInicio} a ${dataFim} | Situação: M (designadas)`);
  log('  Sem persistência | Somente leitura');
  log('═══════════════════════════════════════════════════════════');

  let browser: Browser | null = null;

  try {
    // ── 1. Config e credenciais ─────────────────────────────────────────────
    const trt3Config = await getTRT3Config();
    salvar('01_config_trt3', trt3Config);
    log(`✅ Config | loginUrl=${trt3Config.loginUrl} | apiUrl=${trt3Config.apiUrl}`);

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
      trt3Config.loginUrl,
      trt3Config.baseUrl,
      credencial.cpf,
      credencial.senha,
    );

    // ── 4. Audiências designadas (M) ────────────────────────────────────────
    log('\n📡 Fase 2: Buscando audiências designadas (M)...');
    const { audiencias: designadas, paginasRaw: paginasDesignadas } = await fetchTodasAudiencias(
      page,
      dataInicio,
      dataFim,
      'M',
      'designadas',
    );

    salvar('02_designadas_audiencias', {
      meta: {
        situacao: 'M',
        label: 'designadas',
        periodo: { dataInicio, dataFim },
        capturado_em: new Date().toISOString(),
        total: designadas.length,
      },
      audiencias: designadas,
    });
    salvar('02_designadas_paginas_raw', { paginas: paginasDesignadas });

    // ── 5. Análise de duplicatas e padrões ──────────────────────────────────
    log('\n🔎 Fase 3: Analisando audiências capturadas...');
    const analise = analisarAudiencias(designadas);
    salvar('03_analise_audiencias', analise);

    log(`   Total: ${analise.resumo.total} audiências`);
    log(`   IDs únicos: ${analise.resumo.idsUnicos}`);
    log(`   IDs duplicados: ${analise.resumo.idsDuplicados}`);
    log(`   Audiências com ID repetido: ${analise.resumo.audienciasComIdRepetido}`);
    log(`   IDs duplicados com processos DIFERENTES: ${analise.resumo.idsDuplicadosComProcessosDiferentes}`);
    log(`   Processos com múltiplas audiências: ${analise.resumo.processosComMultiplasAudiencias}`);
    log(`   Audiências com nrProcesso vazio: ${analise.resumo.audienciasComNrProcessoVazio}`);

    if (analise.duplicatas.length > 0) {
      log(`\n   ⚠️ TOP 10 IDs duplicados:`);
      analise.duplicatas.slice(0, 10).forEach((d) => {
        log(`      id=${d.id} count=${d.count} nrProcesso=[${d.nrProcesso.join(' | ')}] dataInicio=[${d.dataInicio.join(', ')}]`);
      });
    }

    if (analise.resumo.processosComMultiplasAudiencias > 0) {
      log(`\n   ℹ️ TOP 5 processos com múltiplas audiências (esperado/válido):`);
      analise.processosComMultiplasAudiencias.slice(0, 5).forEach((p) => {
        log(`      idProcesso=${p.idProcesso} nr="${p.nrProcesso}" count=${p.audiencias.length}`);
      });
    }

    // ── 6. Verificação da constraint de unicidade ────────────────────────────
    log('\n🔐 Fase 4: Verificando violações potenciais da constraint UNIQUE...');
    const constraintCheck = verificarConstraintUnicidade(designadas);
    salvar('04_constraint_check', constraintCheck);

    if (constraintCheck.totalConflitos === 0) {
      log(`   ✅ Nenhum conflito de constraint encontrado na resposta da API`);
    } else {
      log(`   ⚠️ ${constraintCheck.totalConflitos} conflitos potenciais de constraint!`);
      constraintCheck.conflitos.slice(0, 10).forEach((c) => {
        log(`      chave="${c.chave}" count=${c.audiencias.length}`);
      });
    }

    // ── 7. Comparação com banco ─────────────────────────────────────────────
    log('\n🗄️  Fase 5: Comparando com banco de dados...');
    const comparacaoBanco = await compararComBanco(designadas, 'TRT3', 'primeiro_grau');
    salvar('05_comparacao_banco', comparacaoBanco);

    // ── 8. Relatório final ──────────────────────────────────────────────────
    const relatorio = {
      iniciado,
      finalizado: new Date().toISOString(),
      duracao_segundos: (Date.now() - new Date(iniciado).getTime()) / 1000,
      trt: 'TRT3',
      grau: 'primeiro_grau',
      idAdvogado,
      periodo: { dataInicio, dataFim },
      totais: {
        designadas: designadas.length,
      },
      analise_ids: analise.resumo,
      constraint_check: {
        conflitos: constraintCheck.totalConflitos,
        status: constraintCheck.totalConflitos === 0 ? 'OK' : 'ATENÇÃO — conflitos detectados',
      },
      comparacao_banco: {
        capturado_agora: comparacaoBanco.totalCapturado,
        ja_no_banco: comparacaoBanco.totalNoBanco,
        novas_nao_no_banco: comparacaoBanco.apenasNoCapturado.length,
        sumidas_apenas_no_banco: comparacaoBanco.apenasNoBanco.length,
        conflitos_constraint_no_banco: comparacaoBanco.conflitosConstraintNoBanco.length,
      },
      diagnostico: {
        // Problema análogo aos expedientes: mesmo id_pje com nrProcesso diferentes
        // indicaria reuso de ID pelo PJE. Se houver, a constraint atual garante
        // que seriam linhas separadas (correto), mas o UPDATE WHERE usaria ambas.
        reuso_de_ids_detectado: analise.resumo.idsDuplicadosComProcessosDiferentes > 0,
        // IDs duplicados dentro da MESMA resposta (sem diferença de processo)
        // indicam que o PJE retornou a mesma audiência mais de uma vez.
        // Nesse caso o último UPDATE sobrescreve o anterior (sem perda de dados,
        // mas gera falso-positivo de "atualizado").
        ids_duplicados_sem_diferenca: analise.resumo.idsDuplicados - analise.resumo.idsDuplicadosComProcessosDiferentes,
      },
    };

    salvar('06_relatorio_final', relatorio);

    log('\n═══════════════════════════════════════════════════════════');
    log('✅ Diagnóstico concluído!');
    log(`   Designadas:              ${designadas.length} audiências`);
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
