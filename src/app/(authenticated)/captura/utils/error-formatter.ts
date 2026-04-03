/**
 * Utilitários para formatação de erros de captura
 */

/**
 * Verifica se o erro é um timeout de autenticação (tribunal fora do ar)
 */
export function isAuthTimeoutError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const errorMessage = error.message.toLowerCase();
  const errorName = error.constructor.name;

  // TimeoutError do Playwright
  if (errorName === 'TimeoutError') {
    return true;
  }

  // Mensagens de timeout comuns
  const timeoutPatterns = [
    'timeout',
    'waitforselector',
    'btnssopdpj',
    'exceeded',
    'navigation timeout',
    'networkidle timeout',
  ];

  return timeoutPatterns.some(pattern => errorMessage.includes(pattern));
}

/**
 * Verifica se o erro é um erro de rede/conexão
 */
export function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const errorMessage = error.message.toLowerCase();

  const networkPatterns = [
    'ns_error_net',
    'net::err',
    'network error',
    'connection refused',
    'connection reset',
    'econnrefused',
    'econnreset',
    'enotfound',
    'eai_again',
  ];

  return networkPatterns.some(pattern => errorMessage.includes(pattern));
}

/**
 * Formata mensagem de erro amigável para o usuário
 */
export function formatarErroCaptura(
  error: unknown,
  tribunal?: string,
  grau?: string
): string {
  if (!(error instanceof Error)) {
    return 'Erro desconhecido ao capturar dados';
  }

  // Erro de timeout de autenticação (tribunal fora do ar)
  if (isAuthTimeoutError(error)) {
    const tribunalInfo = tribunal ? ` ${tribunal}${grau ? ` ${grau}` : ''}` : '';
    return `Tribunal${tribunalInfo} fora do ar ou indisponível. O sistema não conseguiu conectar-se ao tribunal dentro do tempo esperado. Tente novamente mais tarde.`;
  }

  // Erro de rede
  if (isNetworkError(error)) {
    const tribunalInfo = tribunal ? ` ${tribunal}${grau ? ` ${grau}` : ''}` : '';
    return `Erro de conexão com o tribunal${tribunalInfo}. Verifique sua conexão com a internet e tente novamente.`;
  }

  // Outros erros - retornar mensagem original
  return error.message;
}

/**
 * Formata mensagem de erro técnica (para logs)
 */
export function formatarErroTecnico(error: unknown): string {
  if (!(error instanceof Error)) {
    return String(error);
  }

  return `${error.constructor.name}: ${error.message}${error.stack ? `\n${error.stack}` : ''}`;
}

