/**
 * Parser heurístico de FormData → objeto Zod-compatível.
 *
 * Usado pelo `actionAtualizarExpediente` para normalizar payload antes da
 * validação. O parsing é intencionalmente heurístico (convenção sobre
 * configuração) — as regras refletem o contrato do schema `updateExpedienteSchema`:
 *
 * - String 'true' / 'false' → boolean
 * - Chaves que terminam em 'Id' (responsavelId, tipoExpedienteId, …) →
 *   number (ou null se vazio / "0")
 * - Chaves `qtde*`, `pagina`, `limite` → number
 * - String vazia → null
 * - Demais strings → string trim
 *
 * Vive na feature (não em src/lib) porque só há um consumidor por enquanto.
 * Se um segundo surgir, promover para helper compartilhado.
 */

export function parseFormDataHeuristico(
  formData: FormData
): Record<string, unknown> {
  const rawData: Record<string, unknown> = {};

  for (const [key, value] of formData.entries()) {
    if (typeof value !== 'string') {
      rawData[key] = value;
      continue;
    }

    const trimmed = value.trim();

    if (trimmed === 'true') {
      rawData[key] = true;
      continue;
    }
    if (trimmed === 'false') {
      rawData[key] = false;
      continue;
    }
    if (key.includes('Id')) {
      if (trimmed === '' || trimmed === '0') {
        rawData[key] = null;
      } else {
        const num = Number.parseInt(trimmed, 10);
        if (!Number.isNaN(num)) {
          rawData[key] = num;
        }
      }
      continue;
    }
    if (
      !Number.isNaN(Number(trimmed)) &&
      trimmed !== '' &&
      (key.includes('qtde') || key.includes('pagina') || key.includes('limite'))
    ) {
      rawData[key] = Number.parseInt(trimmed, 10);
      continue;
    }
    if (trimmed === '') {
      rawData[key] = null;
      continue;
    }
    rawData[key] = trimmed;
  }

  return rawData;
}
