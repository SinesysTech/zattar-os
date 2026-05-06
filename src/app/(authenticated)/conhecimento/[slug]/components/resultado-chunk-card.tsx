'use client';

import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CountBadge } from '@/components/ui/semantic-badge';
import { gerarUrlAssinada } from '../../actions/gerar-signed-url.action';
import { toast } from 'sonner';
import type { KnowledgeChunk } from '../../domain';
import { normalizarTextoExtraido } from '@/lib/conhecimento';

export function ResultadoChunkCard({ chunk }: { chunk: KnowledgeChunk }) {
  async function abrir() {
    try {
      const { url } = await gerarUrlAssinada({ document_id: chunk.document_id });
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao abrir');
    }
  }

  const textoNormalizado = normalizarTextoExtraido(chunk.conteudo);

  return (
    <article className="rounded-2xl border bg-card p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{chunk.base_nome}</span>
          {' · '}
          <span>{chunk.document_nome}</span>
          {' · '}
          <span>chunk {chunk.posicao}</span>
        </p>
        <CountBadge>{(chunk.similarity * 100).toFixed(1)}%</CountBadge>
      </div>
      <p className="text-sm leading-relaxed whitespace-pre-line text-pretty">
        {textoNormalizado}
      </p>
      <Button size="sm" variant="ghost" onClick={abrir} className="rounded-xl">
        <ExternalLink className="size-3.5" />
        Abrir documento
      </Button>
    </article>
  );
}
