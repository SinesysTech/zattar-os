import { pangeaBuscaResponseSchema, type PangeaBuscaResponse } from './domain';

const PANGEA_PRECEDENTES_URL = 'https://pangeabnp.pdpj.jus.br/api/v1/precedentes';

export interface PangeaBuscarPrecedentesParams {
  filtro: Record<string, unknown>;
}

export async function buscarPrecedentesRaw(
  params: PangeaBuscarPrecedentesParams
): Promise<PangeaBuscaResponse> {
  const response = await fetch(PANGEA_PRECEDENTES_URL, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
    // Importante: endpoint público upstream. Mantemos server-side.
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(
      `Falha ao consultar Pangea (${response.status}). ${text ? `Resposta: ${text}` : ''}`.trim()
    );
  }

  const json: unknown = await response.json();
  const parsed = pangeaBuscaResponseSchema.safeParse(json);
  if (!parsed.success) {
    const keys =
      json && typeof json === 'object'
        ? Object.keys(json as Record<string, unknown>).slice(0, 20).join(', ')
        : typeof json;
    const firstIssue = parsed.error.issues[0];
    const issueHint = firstIssue
      ? ` issue: ${firstIssue.path.join('.')} (${firstIssue.code})`
      : '';
    throw new Error(`Resposta do Pangea em formato inesperado. (keys: ${keys})${issueHint}`);
  }

  return parsed.data;
}


