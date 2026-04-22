import { createServiceClient } from '@/lib/supabase/service-client';

export type DocumentoAssinaturaStatus =
  | 'rascunho'
  | 'pronto'
  | 'enviado'
  | 'concluido'
  | 'cancelado'
  | 'expirado';

export interface AssinanteResumo {
  tipo: string;
  nome: string;
  concluido: boolean;
  concluido_em: string | null;
  token: string | null;
}

export interface DocumentoAssinaturaDoContrato {
  id: number;
  documento_uuid: string;
  titulo: string;
  status: DocumentoAssinaturaStatus;
  criado_em: string;
  assinado_em: string | null;
  pdf_original_url: string | null;
  pdf_final_url: string | null;
  assinantes: AssinanteResumo[];
}

export interface PacoteAtivoResumo {
  token: string;
  expira_em: string;
}

export interface DocumentosDoContratoResultado {
  documentos: DocumentoAssinaturaDoContrato[];
  pacoteAtivo: PacoteAtivoResumo | null;
}

function extrairNomeDoSnapshot(snapshot: unknown): string {
  if (!snapshot || typeof snapshot !== 'object') return 'Assinante';
  const s = snapshot as Record<string, unknown>;
  const nome = s.nome_completo ?? s.nome ?? s.razao_social;
  return typeof nome === 'string' && nome.trim() ? nome.trim() : 'Assinante';
}

function normalizarStatus(value: unknown): DocumentoAssinaturaStatus {
  const v = String(value ?? 'rascunho').toLowerCase();
  if (
    v === 'rascunho' ||
    v === 'pronto' ||
    v === 'enviado' ||
    v === 'concluido' ||
    v === 'cancelado' ||
    v === 'expirado'
  ) {
    return v;
  }
  return 'rascunho';
}

export async function listarDocumentosAssinaturaDoContrato(
  contratoId: number,
): Promise<DocumentosDoContratoResultado> {
  const supabase = createServiceClient();

  const [docsRes, pacoteRes] = await Promise.all([
    supabase
      .from('assinatura_digital_documentos')
      .select(
        `
        id,
        documento_uuid,
        titulo,
        status,
        created_at,
        pdf_original_url,
        pdf_final_url,
        assinantes:assinatura_digital_documento_assinantes (
          assinante_tipo,
          dados_snapshot,
          concluido_em,
          token
        )
      `,
      )
      .eq('contrato_id', contratoId)
      .order('created_at', { ascending: false }),
    supabase
      .from('assinatura_digital_pacotes')
      .select('token_compartilhado, expira_em, status')
      .eq('contrato_id', contratoId)
      .eq('status', 'ativo')
      .gt('expira_em', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (docsRes.error) {
    throw new Error(
      `Falha ao listar documentos de assinatura: ${docsRes.error.message}`,
    );
  }

  const documentos: DocumentoAssinaturaDoContrato[] = (docsRes.data ?? []).map(
    (row) => {
      const assinantesRaw = (row.assinantes ?? []) as Array<{
        assinante_tipo: string;
        dados_snapshot: unknown;
        concluido_em: string | null;
        token: string;
      }>;

      const assinantes: AssinanteResumo[] = assinantesRaw.map((a) => ({
        tipo: a.assinante_tipo,
        nome: extrairNomeDoSnapshot(a.dados_snapshot),
        concluido: a.concluido_em !== null,
        concluido_em: a.concluido_em,
        token: a.token ?? null,
      }));

      const concluidos = assinantes
        .map((a) => a.concluido_em)
        .filter((d): d is string => d !== null)
        .sort();

      const assinadoEm = concluidos.length > 0 ? concluidos[concluidos.length - 1] : null;

      return {
        id: row.id,
        documento_uuid: row.documento_uuid,
        titulo: row.titulo ?? 'Documento sem título',
        status: normalizarStatus(row.status),
        criado_em: row.created_at ?? new Date().toISOString(),
        assinado_em: assinadoEm,
        pdf_original_url: row.pdf_original_url ?? null,
        pdf_final_url: row.pdf_final_url ?? null,
        assinantes,
      };
    },
  );

  const pacoteAtivo: PacoteAtivoResumo | null = pacoteRes.data
    ? {
        token: pacoteRes.data.token_compartilhado,
        expira_em: pacoteRes.data.expira_em,
      }
    : null;

  return { documentos, pacoteAtivo };
}
