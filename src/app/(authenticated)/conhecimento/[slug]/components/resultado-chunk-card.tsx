'use client';

import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CountBadge } from '@/components/ui/semantic-badge';
import { gerarUrlAssinada } from '../../actions/gerar-signed-url.action';
import { toast } from 'sonner';
import type { KnowledgeChunk } from '../../domain';

/**
 * Normaliza texto extraído de PDF para apresentação:
 * - Remove marcadores de página tipo "-- 492 of 579 --"
 * - Junta hifenizações de quebra de linha ("empre-\ngados" → "empregados")
 * - Colapsa espaços múltiplos em um só
 * - Converte quebras de linha simples em espaço (junta linhas dentro de parágrafo)
 * - Mantém parágrafos (\n\n)
 *
 * O texto armazenado em DB e usado na busca vetorial NÃO é alterado —
 * apenas a renderização. Preserva fidelidade pra futuro reindex.
 */
function normalizeChunkText(text: string): string {
  return text
    .replace(/--\s*\d+\s+of\s+\d+\s*--/gi, '')
    .replace(/(\w)-\n(\w)/g, '$1$2')
    .replace(/[ \t]+/g, ' ')
    .replace(/(?<!\n)\n(?!\n)/g, ' ')
    .replace(/ *\n\n */g, '\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function ResultadoChunkCard({ chunk }: { chunk: KnowledgeChunk }) {
  async function abrir() {
    try {
      const { url } = await gerarUrlAssinada({ document_id: chunk.document_id });
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao abrir');
    }
  }

  const textoNormalizado = normalizeChunkText(chunk.conteudo);

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
