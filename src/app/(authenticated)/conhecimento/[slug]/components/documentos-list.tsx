'use client';

import { useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Trash2, RotateCw, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { deletarDocumento } from '../../actions/deletar-documento.action';
import { reindexarDocumento } from '../../actions/reindexar-documento.action';
import { gerarUrlAssinada } from '../../actions/gerar-signed-url.action';
import { createClient } from '@/lib/supabase/client';
import type { KnowledgeDocument, StatusDocumento } from '../../domain';

interface Props {
  baseSlug: string;
  documentos: KnowledgeDocument[];
  isSuperAdmin: boolean;
}

const STATUS_LABEL: Record<StatusDocumento, string> = {
  pending: 'Pendente',
  processing: 'Indexando',
  indexed: 'Indexado',
  failed: 'Falha',
};

const STATUS_VARIANT: Record<StatusDocumento, 'default' | 'secondary' | 'destructive'> = {
  pending: 'secondary',
  processing: 'default',
  indexed: 'default',
  failed: 'destructive',
};

export function DocumentosList({ baseSlug, documentos, isSuperAdmin }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // Realtime: refresh when document status changes
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`knowledge_documents:${baseSlug}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'knowledge_documents' },
        () => router.refresh()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [baseSlug, router]);

  function handleDeletar(documentId: number) {
    if (!confirm('Tem certeza que quer deletar este documento? Os chunks indexados também serão removidos.')) return;
    startTransition(async () => {
      try {
        await deletarDocumento({ document_id: documentId, base_slug: baseSlug });
        toast.success('Documento removido');
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erro ao deletar');
      }
    });
  }

  function handleReindexar(documentId: number) {
    startTransition(async () => {
      try {
        await reindexarDocumento({ document_id: documentId, base_slug: baseSlug });
        toast.success('Reindexação iniciada');
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erro ao reindexar');
      }
    });
  }

  async function handleAbrir(documentId: number) {
    try {
      const { url } = await gerarUrlAssinada({ document_id: documentId });
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao abrir documento');
    }
  }

  if (documentos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FileText className="size-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Nenhum documento ainda</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card">
      <table className="w-full text-sm">
        <thead className="border-b text-left text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Nome</th>
            <th className="px-4 py-3">Tipo</th>
            <th className="px-4 py-3">Tamanho</th>
            <th className="px-4 py-3">Chunks</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {documentos.map((doc) => (
            <tr key={doc.id} className="border-b last:border-0">
              <td className="px-4 py-3 font-medium">{doc.nome}</td>
              <td className="px-4 py-3 uppercase text-muted-foreground">{doc.arquivo_tipo}</td>
              <td className="px-4 py-3 text-muted-foreground">{formatBytes(doc.arquivo_tamanho_bytes)}</td>
              <td className="px-4 py-3 text-muted-foreground">{doc.total_chunks}</td>
              <td className="px-4 py-3">
                <Badge variant={STATUS_VARIANT[doc.status]}>
                  {STATUS_LABEL[doc.status]}
                </Badge>
                {doc.status === 'failed' && doc.ultimo_erro && (
                  <p className="mt-1 text-xs text-destructive max-w-xs truncate" title={doc.ultimo_erro}>
                    {doc.ultimo_erro}
                  </p>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-1">
                  <Button size="icon" variant="ghost" onClick={() => handleAbrir(doc.id)} title="Abrir">
                    <Download className="size-3.5" />
                  </Button>
                  {isSuperAdmin && (
                    <>
                      <Button size="icon" variant="ghost" onClick={() => handleReindexar(doc.id)} disabled={pending} title="Reindexar">
                        <RotateCw className="size-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDeletar(doc.id)} disabled={pending} title="Deletar">
                        <Trash2 className="size-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
