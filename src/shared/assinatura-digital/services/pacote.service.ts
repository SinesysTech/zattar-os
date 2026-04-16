import { createServiceClient } from '@/lib/supabase/service-client';
import { randomBytes } from 'crypto';
import { createDocumentoFromUploadedPdf } from './documentos.service';
import type { TemplateBasico } from './data.service';

const DURACAO_PACOTE_DIAS = Number(process.env.PACOTE_DURACAO_DIAS ?? 7);

function gerarTokenCompartilhado(): string {
  return randomBytes(32).toString('hex');
}

export interface CriarPacoteInput {
  contratoId: number;
  formularioId: number;
  templatesComPdfs: Array<{ template: TemplateBasico; pdfBuffer: Buffer; titulo: string }>;
  clienteDadosSnapshot: { nome: string; cpf: string | null; email: string | null };
  userId: number | null;
  overrides?: Record<string, string>;
}

export interface CriarPacoteResult {
  status: 'criado' | 'reaproveitado';
  token: string;
  expiraEm: string;
  quantidadeDocs: number;
}

export async function criarPacote(input: CriarPacoteInput): Promise<CriarPacoteResult> {
  const supabase = createServiceClient();

  // 1. Check for existing active pacote
  const { data: existente } = await supabase
    .from('assinatura_digital_pacotes')
    .select('id, token_compartilhado, expira_em')
    .eq('contrato_id', input.contratoId)
    .eq('status', 'ativo')
    .gt('expira_em', new Date().toISOString())
    .maybeSingle();

  if (existente) {
    const { count } = await supabase
      .from('assinatura_digital_pacote_documentos')
      .select('id', { count: 'exact', head: true })
      .eq('pacote_id', existente.id);
    return {
      status: 'reaproveitado',
      token: existente.token_compartilhado,
      expiraEm: existente.expira_em,
      quantidadeDocs: count ?? 0,
    };
  }

  // 2. Create pacote
  const token = gerarTokenCompartilhado();
  const expiraEm = new Date();
  expiraEm.setDate(expiraEm.getDate() + DURACAO_PACOTE_DIAS);

  const { data: pacote, error: pacoteErr } = await supabase
    .from('assinatura_digital_pacotes')
    .insert({
      token_compartilhado: token,
      contrato_id: input.contratoId,
      formulario_id: input.formularioId,
      status: 'ativo',
      criado_por: input.userId,
      expira_em: expiraEm.toISOString(),
    })
    .select('id, token_compartilhado, expira_em')
    .single();

  if (pacoteErr || !pacote) {
    throw new Error(`Falha ao criar pacote: ${pacoteErr?.message ?? 'desconhecido'}`);
  }

  // 3. For each template: create document + assinante + junction row
  for (let i = 0; i < input.templatesComPdfs.length; i++) {
    const { pdfBuffer, titulo } = input.templatesComPdfs[i];

    const doc = await createDocumentoFromUploadedPdf({
      titulo,
      selfie_habilitada: false,
      pdfBuffer,
      created_by: input.userId,
      assinantes: [
        {
          assinante_tipo: 'cliente',
          dados_snapshot: input.clienteDadosSnapshot as unknown as Record<string, unknown>,
        },
      ],
    });

    // Link document to contrato (contrato_id isn't part of create schema)
    await supabase
      .from('assinatura_digital_documentos')
      .update({ contrato_id: input.contratoId })
      .eq('id', doc.documento.id);

    // Insert junction row
    await supabase.from('assinatura_digital_pacote_documentos').insert({
      pacote_id: pacote.id,
      documento_id: doc.documento.id,
      ordem: i + 1,
    });
  }

  return {
    status: 'criado',
    token: pacote.token_compartilhado,
    expiraEm: pacote.expira_em,
    quantidadeDocs: input.templatesComPdfs.length,
  };
}
