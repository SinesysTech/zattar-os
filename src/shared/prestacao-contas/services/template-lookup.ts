import { createServiceClient } from '@/lib/supabase/service-client';
import { TEMPLATE_PRESTACAO_CONTAS_SLUG } from '../constants';

export interface TemplatePrestacaoContas {
  id: number;
  templateUuid: string;
  nome: string;
  conteudoMarkdown: string;
  pdfUrl: string | null;
  arquivoOriginal: string;
  versao: number;
}

export async function buscarTemplatePrestacaoContas(): Promise<TemplatePrestacaoContas> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('assinatura_digital_templates')
    // `slug` e `sistema` foram adicionados em migration 20260422120300;
    // cast porque `database.types.ts` é regenerado separadamente.
    .select('id, template_uuid, nome, conteudo_markdown, pdf_url, arquivo_original, versao')
    .eq('slug' as never, TEMPLATE_PRESTACAO_CONTAS_SLUG as never)
    .eq('ativo', true)
    .single();

  if (error || !data) {
    throw new Error(
      `Template de prestação de contas não encontrado (slug=${TEMPLATE_PRESTACAO_CONTAS_SLUG}). Rode 'npm run seed:prestacao-contas'.`,
    );
  }
  if (!data.conteudo_markdown) {
    throw new Error('Template de prestação de contas sem conteudo_markdown.');
  }

  return {
    id: data.id,
    templateUuid: data.template_uuid,
    nome: data.nome,
    conteudoMarkdown: data.conteudo_markdown,
    pdfUrl: data.pdf_url,
    arquivoOriginal: data.arquivo_original,
    versao: data.versao ?? 1,
  };
}
