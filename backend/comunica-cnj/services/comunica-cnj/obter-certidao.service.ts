/**
 * Serviço para obtenção de certidão (PDF) de comunicação CNJ
 * 
 * ⚠️ SERVIÇO LEGADO - DEPRECATED ⚠️
 * 
 * Este serviço está sendo substituído por `src/core/comunica-cnj/service.ts`.
 * 
 * **MIGRE PARA:**
 * - `obterCertidao()` em `@/core/comunica-cnj`
 * - `listarTribunaisDisponiveis()` em `@/core/comunica-cnj`
 * 
 * @deprecated Use `src/core/comunica-cnj` para novas integrações
 */

import { getComunicaCNJClient } from '../../client/comunica-cnj-client';
import type { CadernoMetadata, MeioComunicacao, TribunalCNJInfo } from '../../types/types';

/**
 * Obtém certidão (PDF) de uma comunicação
 *
 * @param hash - Hash único da comunicação
 * @returns Buffer com o PDF
 */
export async function obterCertidao(hash: string): Promise<Buffer> {
  const client = getComunicaCNJClient();

  console.log('[obter-certidao] Obtendo certidão:', hash);

  const pdfBuffer = await client.obterCertidao(hash);

  console.log('[obter-certidao] Certidão obtida, tamanho:', pdfBuffer.length);

  return pdfBuffer;
}

/**
 * Lista tribunais disponíveis na API do CNJ
 *
 * @returns Lista de tribunais
 */
export async function listarTribunais(): Promise<TribunalCNJInfo[]> {
  const client = getComunicaCNJClient();

  console.log('[obter-certidao] Listando tribunais...');

  const tribunais = await client.listarTribunais();

  console.log('[obter-certidao] Tribunais obtidos:', tribunais.length);

  return tribunais;
}

/**
 * Obtém metadados do caderno de comunicações
 *
 * @param siglaTribunal - Sigla do tribunal
 * @param data - Data (yyyy-mm-dd)
 * @param meio - Meio de comunicação
 * @returns Metadados do caderno
 */
export async function obterCaderno(
  siglaTribunal: string,
  data: string,
  meio: MeioComunicacao
): Promise<CadernoMetadata> {
  const client = getComunicaCNJClient();

  console.log('[obter-certidao] Obtendo caderno:', { siglaTribunal, data, meio });

  const caderno = await client.obterCaderno(siglaTribunal, data, meio);

  console.log('[obter-certidao] Caderno obtido:', caderno);

  return caderno;
}
