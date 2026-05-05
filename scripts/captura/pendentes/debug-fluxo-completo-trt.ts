/**
 * debug-fluxo-completo-trt.ts
 *
 * Reproduz o FLUXO COMPLETO de login do PJE (igual produção), não só o GET
 * inicial. Compara com o GET-only para descobrir se o WAF detecta a automação
 * no GET inicial ou se só dispara depois (em redirects, no SSO, etc).
 *
 * Faz para um TRT por vez:
 *   1) GET loginUrl com waitUntil: 'networkidle' (igual prod)
 *   2) Anti-detection scripts (igual prod)
 *   3) waitForSelector('#btnSsoPdpj')
 *   4) click no botão e aguarda redirect para sso.cloud.pje.jus.br
 *   5) Reporta em qual etapa falhou
 *
 * Uso:
 *   npx tsx scripts/captura/pendentes/debug-fluxo-completo-trt.ts TRT2
 *   npx tsx scripts/captura/pendentes/debug-fluxo-completo-trt.ts TRT5 --headed
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });
config();

import { chromium } from 'playwright';

const args = process.argv.slice(2);
const TRT = (args.find((a) => !a.startsWith('--')) || 'TRT2').toUpperCase();
const HEADED = args.includes('--headed');

const loginUrl = `https://pje.${TRT.toLowerCase()}.jus.br/primeirograu/login.seam`;

function log(etapa: string, msg: string) {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] [${etapa}] ${msg}`);
}

async function main() {
  log('init', `═══ FLUXO COMPLETO ${TRT} ═══`);
  log('init', `URL: ${loginUrl}`);
  log('init', `Headed: ${HEADED}`);

  const browser = await chromium.launch({ headless: !HEADED });
  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    extraHTTPHeaders: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'Sec-Ch-Ua': '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
    },
  });
  const page = await ctx.newPage();

  // Anti-detection (igual produção)
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
    Object.defineProperty(navigator, 'languages', { get: () => ['pt-BR', 'pt', 'en-US', 'en'] });
  });

  try {
    // ETAPA 1: GET com networkidle (igual prod)
    log('etapa1', '🌐 Navegando com waitUntil=networkidle, timeout=60s...');
    const inicio1 = Date.now();
    const response = await page.goto(loginUrl, { waitUntil: 'networkidle', timeout: 60000 });
    log('etapa1', `   ✅ goto OK em ${Date.now() - inicio1}ms | status=${response?.status()}`);

    // Captura estado após goto
    const t1 = await page.title();
    const u1 = page.url();
    log('etapa1', `   Title: "${t1}" | URL: ${u1}`);

    if (response && response.status() >= 400) {
      const body = await page.evaluate(() => (document.body?.innerText || '').slice(0, 300));
      log('etapa1', `   ❌ HTTP ${response.status()} | body: "${body}"`);
      throw new Error(`HTTP ${response.status()}`);
    }

    // ETAPA 2: aguardar 2s (igual prod)
    log('etapa2', '⏳ Aguardando 2s (igual produção)...');
    await page.waitForTimeout(2000);

    // ETAPA 3: waitForSelector('#btnSsoPdpj')
    log('etapa3', '🔍 Aguardando #btnSsoPdpj (timeout 20s)...');
    const inicio3 = Date.now();
    await page.waitForSelector('#btnSsoPdpj', { state: 'visible', timeout: 20000 });
    log('etapa3', `   ✅ #btnSsoPdpj visível em ${Date.now() - inicio3}ms`);

    // ETAPA 4: click no SSO + esperar redirect (igual prod)
    log('etapa4', '🖱️ Clicando no botão SSO PDPJ + aguardando redirect (timeout 60s)...');
    const inicio4 = Date.now();
    await Promise.all([
      page.waitForURL(
        (url) => url.hostname.includes('sso.') || url.hostname.includes('gov.br'),
        { timeout: 60000 },
      ),
      page.click('#btnSsoPdpj'),
    ]);
    log('etapa4', `   ✅ Redirect SSO OK em ${Date.now() - inicio4}ms`);

    const t4 = await page.title();
    const u4 = page.url();
    log('etapa4', `   Title: "${t4}" | URL: ${u4}`);

    // ETAPA 5: aguardar form de login do SSO aparecer
    log('etapa5', '🔍 Aguardando #username (form SSO, timeout 60s)...');
    const inicio5 = Date.now();
    await page.waitForSelector('#username', { state: 'visible', timeout: 60000 });
    log('etapa5', `   ✅ Form SSO visível em ${Date.now() - inicio5}ms`);

    log('done', '✅✅✅ FLUXO COMPLETO PASSOU. WAF NÃO BLOQUEOU.');
  } catch (e) {
    const err = e as Error;
    log('error', `❌ Falhou: ${err.message.slice(0, 300)}`);

    // Diagnóstico no momento do erro
    try {
      const url = page.url();
      const title = await page.title().catch(() => '');
      const body = await page.evaluate(() => (document.body?.innerText || '').slice(0, 500)).catch(() => '');
      const status = await page
        .evaluate(() => {
          const meta = document.querySelector('meta[http-equiv="Status"]') as HTMLMetaElement | null;
          return meta?.content || null;
        })
        .catch(() => null);
      log('diag', `   URL: ${url}`);
      log('diag', `   Title: "${title}"`);
      log('diag', `   Status meta: ${status}`);
      log('diag', `   Body: "${body.slice(0, 200)}"`);

      const tituloLow = title.toLowerCase();
      const corpoLow = body.toLowerCase();
      const ehBloqueio =
        tituloLow.includes('403') ||
        tituloLow.includes('forbidden') ||
        tituloLow.includes('the request could not be satisfied') ||
        tituloLow.includes('access denied') ||
        corpoLow.includes('cloudfront');
      if (ehBloqueio) {
        log('diag', `   🛡️ DETECTADO BLOQUEIO WAF/CDN`);
      }
    } catch {
      log('diag', '   (não foi possível capturar diagnóstico)');
    }
  } finally {
    await ctx.close();
    await browser.close();
  }
}

main().catch(console.error);
