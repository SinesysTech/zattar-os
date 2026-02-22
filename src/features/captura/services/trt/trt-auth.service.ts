// Autenticação PJE - Código comum validado para TRT
// Baseado no código validado de trt-auth-common.ts
// Adaptado para integração com o serviço de captura TRT

import 'server-only';

import { Browser, BrowserContext, Page } from 'playwright';
import { getDefaultOTP } from '@/lib/integrations/twofauth/';
import type { CredenciaisTRT, ConfigTRT } from '../../types/trt-types';
import { getFirefoxConnection } from '../../services/browser/browser-connection.service';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface AdvogadoInfo {
  idAdvogado: string;
  cpf: string;
  nome?: string;
}

export interface AuthTokens {
  accessToken: string;
  xsrfToken?: string;
}

export interface AuthResult {
  page: Page;
  browser: Browser;
  browserContext: BrowserContext;
  advogadoInfo: AdvogadoInfo;
  tokens: AuthTokens;
}

export interface TRTAuthOptions {
  credential: CredenciaisTRT;
  config: ConfigTRT;
  headless?: boolean;
}

type LogLevel = 'info' | 'success' | 'warn' | 'error';

// ============================================================================
// UTILITÁRIOS
// ============================================================================

function log(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const prefix = level === 'error' ? '❌' : level === 'success' ? '✅' : level === 'warn' ? '⚠️' : 'ℹ️';
  const ctxStr = context ? ` ${JSON.stringify(context)}` : '';
  console.log(`${prefix} [${level.toUpperCase()}] ${message}${ctxStr}`);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// CONFIGURAÇÕES ANTI-DETECÇÃO
// ============================================================================

/**
 * Aplica configurações anti-detecção na página do Firefox
 * Remove flags que identificam automação de browser
 */
async function aplicarConfiguracoesAntiDeteccao(page: Page): Promise<void> {
  const stealthScript = () => {
    // Remove webdriver flag (identifica automação)
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
    });

    // Sobrescreve o plugins array
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5],
    });

    // Sobrescreve languages para português brasileiro
    Object.defineProperty(navigator, 'languages', {
      get: () => ['pt-BR', 'pt', 'en-US', 'en'],
    });
  };

  await page.addInitScript(stealthScript);
}

// ============================================================================
// PROCESSAMENTO DE OTP
// ============================================================================

async function processOTP(
  page: Page,
  targetHost: string
): Promise<void> {
  log('info', '🔍 Aguardando campo OTP aparecer...', { url: await page.url() });

  // Aguardar página estabilizar (seguindo lógica do auth-helpers.ts validado)
  const timeout = 30000;
  await page.waitForLoadState('networkidle', { timeout }).catch(() => {
    // Não bloquear se não conseguir networkidle
  });
  await delay(2000);

  // Aguardar campo OTP aparecer e ficar visível (OTP sempre será necessário)
  let otpFieldVisible = false;
  let retries = 0;
  const MAX_OTP_CHECK_RETRIES = 10; // Aguardar até 20 segundos (10 tentativas x 2s)

  while (!otpFieldVisible && retries < MAX_OTP_CHECK_RETRIES) {
    const otpFieldInfo = await page.evaluate(() => {
      const field = document.querySelector('#otp') || document.querySelector('input[name="otp"]');
      if (!field) return { exists: false, visible: false };

      const rect = field.getBoundingClientRect();
      const isVisible = !!(rect.width && rect.height && (field as HTMLElement).offsetParent !== null);

      return { exists: true, visible: isVisible };
    });

    if (otpFieldInfo.exists && otpFieldInfo.visible) {
      otpFieldVisible = true;
      break;
    }

    retries++;
    if (retries < MAX_OTP_CHECK_RETRIES) {
      log('info', `⏳ Campo OTP ainda não visível, aguardando... (${retries}/${MAX_OTP_CHECK_RETRIES})`);
      await delay(2000);
    }
  }

  if (!otpFieldVisible) {
    throw new Error('Campo OTP não apareceu após aguardar. Verifique se o login foi concluído corretamente.');
  }

  log('info', '📱 Campo OTP detectado, obtendo código...');

  // Obter OTP atual e próximo (configuração carregada do banco de dados)
  const otpResult = await getDefaultOTP();
  const currentOtp = otpResult.password;
  const nextOtp = otpResult.nextPassword;

  log('success', `✅ OTP obtido: ${currentOtp}`);
  if (nextOtp) {
    log('info', `📱 Próximo OTP disponível: ${nextOtp} (será usado se o atual falhar)`);
  }

  await delay(1000);

  const otpField = page.locator('#otp').first();
  await otpField.focus();
  await otpField.fill(currentOtp);

  log('success', '✅ OTP preenchido no campo');

  await page.evaluate(() => {
    const btn = document.querySelector('#kc-login');
    if (btn) btn.removeAttribute('disabled');
  });

  log('info', '🖱️ Clicando em validar OTP...');

  const urlBeforeSubmit = await page.url();

  await page.evaluate(() => {
    const btn = document.querySelector('#kc-login');
    if (btn) (btn as HTMLButtonElement).click();
  });

  await delay(5000);

  const urlAfterSubmit = await page.url();

  // Verificar se OTP foi aceito (redirecionou para fora do SSO)
  if (!urlAfterSubmit.includes('sso.cloud.pje.jus.br') && urlAfterSubmit !== urlBeforeSubmit) {
    log('success', '✅ OTP aceito! Redirecionando...');
  } else {
    // Verificar se há erro de OTP inválido
    const hasError = await page.evaluate(() => {
      const errorElements = document.querySelectorAll('.pf-c-alert__description, .kc-feedback-text, .alert-error, [role="alert"]');
      for (const el of errorElements) {
        const text = el.textContent?.toLowerCase() || '';
        if (text.includes('inválido') || text.includes('invalid') || text.includes('código') || text.includes('incorreto')) {
          return true;
        }
      }
      return false;
    });

    if (hasError && nextOtp) {
      // Se o OTP atual falhou e temos o próximo, usar ele
      log('warn', '⚠️ OTP atual inválido, usando próximo código...');
      await otpField.clear();
      await otpField.fill(nextOtp);
      log('success', `✅ Próximo OTP preenchido: ${nextOtp}`);
      await delay(500);

      // Tentar novamente com o próximo código
      await page.evaluate(() => {
        const btn = document.querySelector('#kc-login');
        if (btn) (btn as HTMLButtonElement).click();
      });

      await delay(5000);

      const urlAfterRetry = await page.url();
      if (!urlAfterRetry.includes('sso.cloud.pje.jus.br') && urlAfterRetry !== urlBeforeSubmit) {
        log('success', '✅ Próximo OTP aceito! Redirecionando...');
      } else {
        throw new Error('Falha ao validar OTP: ambos os códigos (atual e próximo) foram rejeitados');
      }
    } else if (hasError) {
      throw new Error('OTP inválido e próximo código não disponível');
    } else {
      // Sem erro detectado, provavelmente aceito
      log('success', '✅ OTP provavelmente aceito (sem erro detectado)');
    }
  }

  log('info', '⏳ Aguardando redirects do SSO...');

  // Aguardar até a URL conter o domínio PJE (não mais sso.cloud)
  await esperarSaidaSSO(page, targetHost, 120000);

  const currentUrlAfterOTP = await page.url();
  log('success', `✅ Redirecionado para domínio PJE`, { url: currentUrlAfterOTP });

  // Aguardar página estabilizar após redirects
  await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {
    // Não bloquear se não conseguir networkidle
  });
  await delay(3000);
}

async function esperarSaidaSSO(
  page: Page,
  targetHost: string,
  timeout: number = 120000
): Promise<void> {
  const targetHostname = new URL(`https://${targetHost}`).hostname;
  const startTime = Date.now();
  const checkInterval = 2000; // Verificar a cada 2 segundos

  while (Date.now() - startTime < timeout) {
    try {
      // Verificar se já saiu do SSO
      const currentUrl = page.url();
      const currentHostname = new URL(currentUrl).hostname;

      if (currentHostname.includes(targetHostname) && !currentHostname.includes('sso.')) {
        log('success', `✅ Redirecionado para ${currentHostname}`);
        return;
      }

      // Verificar se há erro na página (conexão recusada, etc)
      const hasNetworkError = await page.evaluate(() => {
        const body = document.body?.innerText?.toLowerCase() || '';
        return body.includes('connection') ||
               body.includes('refused') ||
               body.includes('error') ||
               body.includes('unavailable');
      }).catch(() => false);

      if (hasNetworkError) {
        log('warn', '⚠️ Possível erro de rede detectado na página');
      }

      // Aguardar antes de verificar novamente
      await delay(checkInterval);

    } catch (error) {
      // Se der erro ao verificar URL, página pode ter sido fechada ou crashou
      log('warn', `⚠️ Erro ao verificar URL: ${error instanceof Error ? error.message : 'desconhecido'}`);
      await delay(checkInterval);
    }
  }

  // Se chegou aqui, deu timeout
  let finalUrl = 'URL não disponível';
  try {
    finalUrl = page.url();
  } catch {
    // Ignorar erro se página foi fechada
  }
  throw new Error(`Timeout ao aguardar saída do SSO. URL atual: ${finalUrl}. Esperado domínio: ${targetHostname}`);
}

// ============================================================================
// LOGIN SSO GOV.BR
// ============================================================================

async function realizarLogin(
  page: Page,
  loginUrl: string,
  baseUrl: string,
  cpf: string,
  senha: string,
): Promise<void> {
  log('info', '🌐 Navegando para página de login...', { url: loginUrl });
  await page.goto(loginUrl, { waitUntil: 'networkidle', timeout: 60000 });
  await delay(2000);

  log('info', '🔑 Buscando botão SSO PDPJ...');
  await page.waitForSelector('#btnSsoPdpj', { state: 'visible', timeout: 60000 });
  log('success', '✅ Botão SSO encontrado');

  log('info', '🖱️ Clicando em SSO PDPJ...');

  // Tentar clique com retry em caso de erro de rede
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await Promise.all([
        page.waitForURL((url) => url.hostname.includes('sso.') || url.hostname.includes('gov.br'), { timeout: 60000 }),
        page.click('#btnSsoPdpj'),
      ]);
      log('success', '✅ Redirecionado para página de login PDPJ');
      lastError = null;
      break;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const isNetworkError = lastError.message.includes('NS_ERROR_NET_EMPTY_RESPONSE') ||
                             lastError.message.includes('net::ERR') ||
                             lastError.message.includes('Navigation failed');

      if (isNetworkError && attempt < maxRetries) {
        log('warn', `⚠️ Erro de rede ao clicar SSO (tentativa ${attempt}/${maxRetries}): ${lastError.message}`);
        log('info', '🔄 Aguardando antes de tentar novamente...');
        await delay(5000); // Aguardar 5 segundos antes de retry

        // Recarregar página de login
        await page.goto(loginUrl, { waitUntil: 'networkidle', timeout: 60000 });
        await delay(2000);
        await page.waitForSelector('#btnSsoPdpj', { state: 'visible', timeout: 60000 });
      } else {
        throw lastError;
      }
    }
  }

  if (lastError) {
    throw lastError;
  }

  log('info', '📝 Preenchendo credenciais...');
  await page.waitForSelector('#username', { state: 'visible', timeout: 60000 });
  await page.fill('#username', cpf);
  log('success', '✅ CPF preenchido');
  await delay(2000);

  await page.waitForSelector('#password', { state: 'visible', timeout: 60000 });
  await page.fill('#password', senha);
  log('success', '✅ Senha preenchida');
  await delay(2000);

  log('info', '🚀 Submetendo login...');
  const targetHost = new URL(baseUrl).hostname;
  
  // Usar Promise.all como no standalone validado - permite aguardar tanto redirecionamento quanto OTP
  await Promise.all([
    page.waitForURL((url) => {
      return url.hostname.includes(targetHost) || url.hostname.includes('sso.');
    }, { timeout: 120000 }),
    page.click('#kc-login'),
  ]);
  log('success', '✅ Login submetido');
  await delay(3000);

  // Processar OTP (sempre necessário para TRT)
  // Configuração 2FAuth é carregada do banco de dados automaticamente
  await processOTP(page, targetHost);

  await page.waitForLoadState('networkidle', { timeout: 60000 });
  await delay(3000);
}

// ============================================================================
// CAPTURA DE TOKENS E COOKIES
// ============================================================================

export async function obterTokens(page: Page): Promise<AuthTokens> {
  const cookies = await page.context().cookies();
  const accessTokenCookie = cookies.find((c) => c.name === 'access_token');
  const xsrfTokenCookie = cookies.find((c) =>
    c.name === 'Xsrf-Token' ||
    c.name === 'XSRF-TOKEN' ||
    c.name.toLowerCase() === 'xsrf-token'
  );

  if (!accessTokenCookie) {
    throw new Error('Token JWT (access_token) não encontrado nos cookies');
  }

  log('success', '✅ Tokens capturados', {
    accessToken: `${accessTokenCookie.value.substring(0, 30)}...`,
    xsrfToken: xsrfTokenCookie ? 'presente' : 'ausente',
  });

  return {
    accessToken: accessTokenCookie.value,
    xsrfToken: xsrfTokenCookie?.value,
  };
}

// ============================================================================
// EXTRAÇÃO DE INFORMAÇÕES DO ADVOGADO DO JWT
// ============================================================================

export async function obterIdAdvogado(
  page: Page
): Promise<AdvogadoInfo> {
  log('info', '🔑 Extraindo JWT do cookie...');

  const currentUrl = await page.url();
  const currentHostname = await page.evaluate(() => window.location.hostname);
  log('info', `📍 URL atual: ${currentUrl}`, { hostname: currentHostname });

  let finalIdAdvogado: string | undefined;

  log('info', '⏳ Aguardando cookie access_token...');
  let accessTokenCookie = null;

  const browserContext = page.context();
  const baseHostname = currentHostname.replace(/^pje\./, '').replace(/^www\./, '');

  interface Cookie {
    name: string;
    domain: string;
    path?: string;
    value: string;
  }

  for (let i = 0; i < 40; i++) {
    const cookies = await browserContext.cookies() as Cookie[];
    accessTokenCookie = cookies.find((c) => 
      c.name === 'access_token' && 
      (c.domain.includes(baseHostname) || c.domain.includes(currentHostname))
    );

    if (accessTokenCookie) {
      log('success', '✅ Cookie access_token encontrado!', { 
        domain: accessTokenCookie.domain,
        path: accessTokenCookie.path
      });
      break;
    }

    if (i === 0 || i % 5 === 0) {
      log('info', `📋 Cookies disponíveis (tentativa ${i + 1}/40): ${cookies.map((c) => `${c.name} (domain: ${c.domain})`).join(', ')}`);
    }

    await delay(500);
  }

  if (!accessTokenCookie) {
    const allCookies = await browserContext.cookies() as Cookie[];
    log('warn', `⚠️ Cookie access_token não encontrado após 20 segundos`);
    log('info', `📋 Total de cookies: ${allCookies.length}`);
    log('info', `📋 Cookies finais: ${allCookies.map((c) => `${c.name} (domain: ${c.domain}, path: ${c.path || ''})`).join(', ')}`);
    log('info', `🌐 Hostname atual: ${currentHostname}`);
    
    log('info', '🔄 Tentando novamente após 3 segundos...');
    await delay(3000);
    const retryCookies = await browserContext.cookies() as Cookie[];
    accessTokenCookie = retryCookies.find((c) => 
      c.name === 'access_token' && 
      (c.domain.includes(baseHostname) || c.domain.includes(currentHostname))
    );
    if (accessTokenCookie) {
      log('success', '✅ Cookie access_token encontrado no retry!');
    }
  }

  if (accessTokenCookie) {
    try {
      const parts = accessTokenCookie.value.split('.');
      if (parts.length >= 2) {
        const decodedPayload = Buffer.from(parts[1], 'base64').toString('utf8');
        const payload = JSON.parse(decodedPayload);
        if (payload.id) {
          finalIdAdvogado = payload.id;
          log('success', `✅ ID advogado do JWT: ${finalIdAdvogado}`);
        }
        if (payload.cpf) {
          log('info', `👤 CPF do JWT: ${payload.cpf}`);
        }
        if (payload.name) {
          log('info', `👤 Nome do JWT: ${payload.name}`);
        }
      }
    } catch {
      log('warn', '⚠️ Erro ao decodificar JWT');
    }
  }

  if (!finalIdAdvogado) {
    throw new Error('ID do advogado não encontrado no JWT. Verifique se o login foi concluído com sucesso.');
  }

  log('info', `👤 ID Advogado: ${finalIdAdvogado}`);

  let cpf = '';
  let nome: string | undefined;
  
  if (accessTokenCookie) {
    try {
      const parts = accessTokenCookie.value.split('.');
      if (parts.length >= 2) {
        const decodedPayload = Buffer.from(parts[1], 'base64').toString('utf8');
        const payload = JSON.parse(decodedPayload);
        cpf = payload.cpf || '';
        nome = payload.name || payload.nome;
      }
    } catch {
      // Ignorar erro
    }
  }

  return {
    idAdvogado: String(finalIdAdvogado),
    cpf,
    nome,
  };
}

// ============================================================================
// FUNÇÃO PRINCIPAL DE AUTENTICAÇÃO
// ============================================================================

/**
 * Autentica no PJE e retorna página autenticada com tokens e informações do advogado
 * 
 * Esta função realiza todo o fluxo de autenticação:
 * 1. Inicializa browser com configurações anti-detecção
 * 2. Faz login SSO gov.br (usuário e senha)
 * 3. Processa OTP se necessário (via 2FAuth)
 * 4. Captura tokens e cookies (access_token, XSRF-Token)
 * 5. Extrai informações do advogado do JWT
 * 
 * @param options Opções de autenticação
 * @returns Objeto com página autenticada, browser, tokens e informações do advogado
 */
export async function autenticarPJE(options: TRTAuthOptions): Promise<AuthResult> {
  const {
    credential,
    config,
    headless = true,
  } = options;

  log('info', '🚀 Iniciando autenticação PJE...', {
    loginUrl: config.loginUrl,
    headless,
  });

  // Obter conexão com browser (remoto ou local)
  // Em produção: conecta ao Browserless (Chromium)
  // Em desenvolvimento: lança Firefox local
  const { browser, browserContext, page, isRemote } = await getFirefoxConnection({
    headless,
    viewport: { width: 1920, height: 1080 },
  });
  
  log('success', `✅ Firefox ${isRemote ? 'remoto' : 'local'} conectado`);

  // Aplicar configurações anti-detecção
  await aplicarConfiguracoesAntiDeteccao(page);

  // Realizar login
  await realizarLogin(page, config.loginUrl, config.baseUrl, credential.cpf, credential.senha);

  // Obter ID do advogado e tokens do JWT
  const advogadoInfo = await obterIdAdvogado(page);
  const tokens = await obterTokens(page);

  // CPF vem da credencial (é o que usamos para logar)
  advogadoInfo.cpf = credential.cpf;

  log('success', '✅ Autenticação concluída com sucesso!', {
    idAdvogado: advogadoInfo.idAdvogado,
    cpf: advogadoInfo.cpf,
    nome: advogadoInfo.nome,
  });

  return {
    page,
    browser,
    browserContext,
    advogadoInfo,
    tokens,
  };
}

