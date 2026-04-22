'use server';

import { z } from 'zod';
import { authenticatedAction } from '@/lib/safe-action';
import { createServiceClient } from '@/lib/supabase/service-client';

const schema = z.object({ parcelaId: z.number().int().positive() });

export type StatusPrestacaoContas =
  | { estado: 'sem_link' }
  | {
      estado: 'link_ativo';
      token: string;
      url: string;
      expiresAt: string | null;
    }
  | { estado: 'assinado'; pdfUrl: string; dataAssinatura: string | null }
  | { estado: 'cancelado' };

export const actionStatusPrestacaoContas = authenticatedAction(
  schema,
  async ({ parcelaId }): Promise<StatusPrestacaoContas> => {
    const supabase = createServiceClient();

    const { data: parcela } = await supabase
      .from('parcelas')
      .select(
        'documento_assinatura_id, arquivo_declaracao_prestacao_contas, data_declaracao_anexada' as never,
      )
      .eq('id', parcelaId)
      .single();

    const row = parcela as {
      documento_assinatura_id?: number | null;
      arquivo_declaracao_prestacao_contas?: string | null;
      data_declaracao_anexada?: string | null;
    } | null;

    if (row?.arquivo_declaracao_prestacao_contas) {
      return {
        estado: 'assinado',
        pdfUrl: row.arquivo_declaracao_prestacao_contas,
        dataAssinatura: row.data_declaracao_anexada ?? null,
      };
    }

    if (!row?.documento_assinatura_id) return { estado: 'sem_link' };

    const { data: doc } = await supabase
      .from('assinatura_digital_documentos')
      .select('id, status')
      .eq('id', row.documento_assinatura_id)
      .single();

    if (!doc) return { estado: 'sem_link' };
    if (doc.status === 'cancelado') return { estado: 'cancelado' };
    if (doc.status === 'concluido') {
      // Edge: status concluido mas URL não gravada na parcela ainda — improvável
      return { estado: 'sem_link' };
    }

    const { data: ass } = await supabase
      .from('assinatura_digital_documento_assinantes')
      .select('token, expires_at')
      .eq('documento_id', doc.id)
      .eq('status', 'pendente')
      .limit(1)
      .maybeSingle();

    if (!ass) return { estado: 'sem_link' };

    return {
      estado: 'link_ativo',
      token: ass.token,
      url: `/prestacao-contas/${ass.token}`,
      expiresAt: ass.expires_at ?? null,
    };
  },
);
