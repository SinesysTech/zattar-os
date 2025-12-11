/**
 * Tipos para documentos do PJE/TRT
 */

export interface FetchDocumentoParams {
  processoId: string;
  documentoId: string;
  expedienteId?: number;
  numeroProcesso?: string;
  trt: string;
  grau: string;
  advogadoId?: number;
  baixarPdf?: boolean;
}

