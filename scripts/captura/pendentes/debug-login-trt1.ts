/**
 * debug-login-trt1.ts
 *
 * Diagnóstico do erro de login TRT1:
 *   page.waitForSelector: Timeout 60000ms exceeded.
 *   Call log: - waiting for locator('#btnSsoPdpj') to be visible
 *
 * O script para no momento em que o seletor falha e tira:
 *   - screenshot da página (.png)
 *   - dump de HTML
 *   - lista de todos os botões/links/inputs visíveis
 *   - lista de iframes
 *   - URL atual + hostname (saber se houve redirect)
 *
 * Uso:
 *   npx tsx scripts/captura/pendentes/debug-login-trt1.ts
 *
 * Saída: test-expedientes/<timestamp>_trt1_*.{json,html,png,txt}
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });
config();

import * as fs from 'node:fs';
import * as path from 'node:path';
import { chromium, type Browser, type Page } from 'playwright';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY ?? '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY são obrigatórias no .env.local');
  process.exit(1);
}

const TRIBUNAL = 'TRT1';
const GRAU = 'primeiro_grau';
const OUTPUT_DIR = path.join(process.cwd(), 'test-expedientes');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const RUN_TS = new Date().toISOString().replace(/[:.]/g, '-');
const LOGS: string[] = [];

function log(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  LOGS.push(line);
}

function fileName(suffix: string): string {
  return path.join(OUTPUT_DIR, `${RUN_TS}_trt1_${suffix}`);
}

function salvarJson(suffix: string, dados: unknown) {
  const f = fileName(`${suffix}.json`);
  fs.writeFileSync(f, JSON.stringify(dados, null, 2), 'utf-8');
  log(`💾 ${f}`);
}

function salvarTexto(suffix: string, conteudo: string) {
  const f = fileName(suffix);
  fs.writeFileSync(f, conteudo, 'utf-8');
  log(`💾 ${f}`);
}

function salvarLogs() {
  const f = fileName('00_log.txt');
  fs.writeFileSync(f, LOGS.join('\n') + '\n', 'utf-8');
  console.log(`📄 Log: ${f}`);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface TRTConfig {
  loginUrl: string;
  baseUrl: string;
  apiUrl: string;
}

async function getConfig(): Promise<TRTConfig> {
  log(`📋 Buscando config ${TRIBUNAL} ${GRAU}...`);
  const { data: tribunal } = await supabase
    .from('tribunais')
    .select('id')
    .eq('codigo', TRIBUNAL)
    .single();

  if (!tribunal) throw new Error(`Tribunal ${TRIBUNAL} não encontrado`);

  const { data: cfg, error } = await supabase
    .from('tribunais_config')
    .select('url_login_seam, url_base, url_api')
    .eq('tribunal_id', tribunal.id)
    .eq('tipo_acesso', GRAU)
    .single();

  if (error || !cfg) throw new Error(`Config ${TRIBUNAL}/${GRAU} não encontrada: ${error?.message}`);

  return { loginUrl: cfg.url_login_seam, baseUrl: cfg.url_base, apiUrl: cfg.url_api };
}

async function dumpPageState(page: Page, fase: string) {
  log(`\n🩺 [${fase}] Capturando estado da página...`);

  const url = page.url();
  let hostname = '';
  try {
    hostname = new URL(url).hostname;
  } catch {
    /* ignore */
  }
  log(`   URL: ${url}`);
  log(`   Hostname: ${hostname}`);

  // Screenshot
  try {
    const screenshotPath = fileName(`${fase}_screenshot.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    log(`   📸 Screenshot: ${screenshotPath}`);
  } catch (e) {
    log(`   ⚠️ Erro ao capturar screenshot: ${(e as Error).message}`);
  }

  // HTML
  try {
    const html = await page.content();
    salvarTexto(`${fase}_page.html`, html);
  } catch (e) {
    log(`   ⚠️ Erro ao capturar HTML: ${(e as Error).message}`);
  }

  // Diagnóstico DOM (botões, inputs, iframes, links com SSO/PDPJ)
  try {
    // page.evaluate executado como string para evitar bug de serialização do tsx (__name not defined)
    const diag = await page.evaluate(`(() => {
      const visivelFn = function(el) {
        const rect = el.getBoundingClientRect();
        return !!(rect.width && rect.height && el.offsetParent !== null);
      };

      const botoes = Array.from(document.querySelectorAll('button')).map(function(el) {
        return {
          id: el.id,
          text: (el.textContent || '').trim().slice(0, 80),
          type: el.type,
          visible: visivelFn(el),
        };
      });

      const inputs = Array.from(document.querySelectorAll('input')).map(function(el) {
        return {
          id: el.id,
          name: el.name,
          type: el.type,
          visible: visivelFn(el),
        };
      });

      const links = Array.from(document.querySelectorAll('a')).map(function(el) {
        return {
          id: el.id,
          href: el.href,
          text: (el.textContent || '').trim().slice(0, 80),
          visible: visivelFn(el),
        };
      });

      const iframes = Array.from(document.querySelectorAll('iframe')).map(function(el) {
        return { id: el.id, name: el.name, src: el.src };
      });

      const refsSSO = [];
      const all = document.querySelectorAll('*');
      for (let i = 0; i < all.length; i++) {
        const el = all[i];
        const text = (el.textContent || '').toLowerCase();
        const idLow = (el.id || '').toLowerCase();
        if ((text.includes('sso') || text.includes('pdpj') || idLow.includes('sso') || idLow.includes('pdpj')) && el.children.length === 0) {
          refsSSO.push({
            tag: el.tagName,
            id: el.id,
            text: (el.textContent || '').trim().slice(0, 120),
            visible: visivelFn(el),
          });
        }
      }

      const linksComSSO = links.filter(function(l) {
        return l.href.toLowerCase().includes('sso') ||
               l.href.toLowerCase().includes('pdpj') ||
               l.text.toLowerCase().includes('pdpj') ||
               l.text.toLowerCase().includes('sso');
      });

      return {
        title: document.title,
        readyState: document.readyState,
        bodyTextSample: (document.body && document.body.innerText ? document.body.innerText : '').slice(0, 800),
        botoes: botoes,
        inputs: inputs,
        linksComSSO: linksComSSO,
        iframes: iframes,
        refsSSO: refsSSO.slice(0, 30),
      };
    })()`) as {
      title: string;
      readyState: string;
      bodyTextSample: string;
      botoes: { id: string; text: string; type: string; visible: boolean }[];
      inputs: { id: string; name: string; type: string; visible: boolean }[];
      linksComSSO: { id: string; href: string; text: string; visible: boolean }[];
      iframes: { id: string; name: string; src: string }[];
      refsSSO: { tag: string; id: string; text: string; visible: boolean }[];
    };

    salvarJson(`${fase}_dom_diag`, diag);

    log(`   📊 Title: "${diag.title}" | readyState: ${diag.readyState}`);
    log(`   📊 Botões: ${diag.botoes.length} | Inputs: ${diag.inputs.length} | Iframes: ${diag.iframes.length}`);
    log(`   📊 Links/refs com SSO/PDPJ: ${diag.linksComSSO.length} links + ${diag.refsSSO.length} refs no DOM`);

    if (diag.iframes.length > 0) {
      log(`   ⚠️ A página tem ${diag.iframes.length} iframe(s) — o botão pode estar dentro de um deles:`);
      diag.iframes.forEach((f) => log(`      - id=${f.id} src=${f.src}`));
    }

    if (diag.linksComSSO.length > 0) {
      log(`   🔗 Links/botões com SSO/PDPJ encontrados:`);
      diag.linksComSSO.slice(0, 5).forEach((l) =>
        log(`      - href=${l.href} text="${l.text}" visible=${l.visible}`),
      );
    }

    if (diag.botoes.length > 0) {
      log(`   🔘 Primeiros botões da página:`);
      diag.botoes.slice(0, 10).forEach((b) =>
        log(`      - id=${b.id || '(sem id)'} text="${b.text}" visible=${b.visible}`),
      );
    }
  } catch (e) {
    log(`   ⚠️ Erro no diag DOM: ${(e as Error).message}`);
  }
}

async function main() {
  log('═══════════════════════════════════════════════════════════');
  log(`  DEBUG LOGIN ${TRIBUNAL} ${GRAU}`);
  log(`  Iniciado: ${new Date().toISOString()}`);
  log('═══════════════════════════════════════════════════════════');

  let browser: Browser | null = null;

  try {
    const cfg = await getConfig();
    salvarJson('01_config', cfg);
    log(`✅ Config | loginUrl=${cfg.loginUrl}`);

    // Reproduzir EXATAMENTE o ambiente de produção: browser remoto via Playwright Browser Server
    const wsEndpoint = process.env.BROWSER_WS_ENDPOINT;
    const browserToken = process.env.BROWSER_SERVICE_TOKEN;

    if (!wsEndpoint) {
      log('❌ BROWSER_WS_ENDPOINT não configurado. Não é possível reproduzir o ambiente de produção.');
      log('   Adicione BROWSER_WS_ENDPOINT e BROWSER_SERVICE_TOKEN no .env.local');
      process.exit(1);
    }

    let finalEndpoint = wsEndpoint;
    if (browserToken && !wsEndpoint.includes(browserToken)) {
      finalEndpoint = wsEndpoint.endsWith('/') ? `${wsEndpoint}${browserToken}` : `${wsEndpoint}/${browserToken}`;
    }

    log(`\n🌐 Conectando ao browser remoto (igual produção)...`);
    log(`   Endpoint: ${wsEndpoint.replace(/\/[^\/]+$/, '/***')}`);
    browser = await chromium.connect(finalEndpoint, { timeout: 60000 });
    log(`   ✅ Conectado ao Chromium remoto`);

    const ctx = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    });
    const page = await ctx.newPage();

    // Anti-detecção (igual à produção)
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, 'languages', { get: () => ['pt-BR', 'pt', 'en-US', 'en'] });
    });

    log(`\n🌐 Navegando para ${cfg.loginUrl}...`);
    try {
      await page.goto(cfg.loginUrl, { waitUntil: 'networkidle', timeout: 60000 });
    } catch (e) {
      log(`⚠️ goto retornou: ${(e as Error).message} — continuando para inspecionar a página assim mesmo`);
    }
    log(`   URL após goto: ${page.url()}`);

    // Estado imediatamente após navegação
    await dumpPageState(page, '02_apos_goto');

    // Tentar achar #btnSsoPdpj com timeout reduzido (15s) — se falhar, capturar tudo
    log(`\n🔍 Tentando localizar #btnSsoPdpj (timeout 15s)...`);
    let achouSelector = false;
    try {
      await page.waitForSelector('#btnSsoPdpj', { state: 'visible', timeout: 15000 });
      achouSelector = true;
      log(`✅ Selector #btnSsoPdpj encontrado e visível!`);
    } catch (e) {
      log(`❌ Selector #btnSsoPdpj NÃO apareceu em 15s: ${(e as Error).message}`);
    }

    // Se não achou, tirar dump completo
    if (!achouSelector) {
      // Aguardar mais um pouco caso seja só lentidão
      log(`\n⏳ Aguardando mais 10s antes do dump final (caso seja só lentidão)...`);
      await page.waitForTimeout(10000);
      await dumpPageState(page, '03_falhou_seletor');

      // Verificar se já está numa página gov.br ou SSO PDPJ (redirect direto)
      const urlFinal = page.url();
      const hostnameFinal = (() => {
        try {
          return new URL(urlFinal).hostname;
        } catch {
          return '';
        }
      })();

      log(`\n🧭 Hipóteses:`);
      log(`   1) URL final: ${urlFinal}`);
      log(`   2) Hostname final: ${hostnameFinal}`);

      const redirectouParaSSO = hostnameFinal.includes('sso.') || hostnameFinal.includes('gov.br');
      const aindaNoTRT = hostnameFinal.includes('trt1.jus.br');

      if (redirectouParaSSO) {
        log(`   ✅ Hipótese A confirmada: TRT1 redirecionou DIRETO para SSO/gov.br`);
        log(`      → o código de produção que clica em #btnSsoPdpj está obsoleto para TRT1`);
        log(`      → solução: detectar redirect automático e pular a etapa do botão`);
      } else if (aindaNoTRT) {
        log(`   ⚠️ Hipótese B: ainda no TRT1 mas sem #btnSsoPdpj visível`);
        log(`      → checar dom_diag para ver botões/iframes presentes`);
      } else {
        log(`   ⚠️ Hipótese C: redirecionou para hostname inesperado: ${hostnameFinal}`);
      }
    } else {
      log(`\n✅ #btnSsoPdpj funciona normalmente em ${TRIBUNAL}. O problema deve ser intermitente.`);
    }

    log('\n═══════════════════════════════════════════════════════════');
    log(`✅ Diagnóstico concluído | Pasta: ${OUTPUT_DIR}`);
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
