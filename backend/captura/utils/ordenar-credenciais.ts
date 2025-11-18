// Utilitário para ordenar credenciais por número do TRT e grau

import type { CredencialCompleta } from '@/backend/captura/credentials/credential.service';

/**
 * Extrai número do TRT para ordenação (TRT1 = 1, TRT10 = 10)
 */
function extrairNumeroTRT(tribunal: string): number {
  const match = tribunal.match(/TRT(\d+)/);
  return match ? parseInt(match[1], 10) : 999;
}

/**
 * Ordena credenciais por número do TRT (crescente) e depois por grau
 * Ordem: TRT1 primeiro_grau, TRT1 segundo_grau, TRT2 primeiro_grau, TRT2 segundo_grau, ...
 */
export function ordenarCredenciaisPorTRT(
  credenciais: CredencialCompleta[]
): CredencialCompleta[] {
  return [...credenciais].sort((a, b) => {
    // Primeiro ordenar por número do TRT
    const numTRTA = extrairNumeroTRT(a.tribunal);
    const numTRTB = extrairNumeroTRT(b.tribunal);
    
    if (numTRTA !== numTRTB) {
      return numTRTA - numTRTB; // Ordem crescente: TRT1, TRT2, ..., TRT10, TRT11, ...
    }
    
    // Se mesmo TRT, ordenar por grau (primeiro_grau antes de segundo_grau)
    if (a.grau !== b.grau) {
      return a.grau === 'primeiro_grau' ? -1 : 1;
    }
    
    return 0;
  });
}

