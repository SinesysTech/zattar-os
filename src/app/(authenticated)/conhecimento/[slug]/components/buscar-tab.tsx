'use client';

import { useState, useTransition } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ResultadoChunkCard } from './resultado-chunk-card';
import { buscarConhecimento } from '../../actions/buscar-conhecimento.action';
import { toast } from 'sonner';
import type { KnowledgeBase, KnowledgeChunk } from '../../domain';

export function BuscarTab({ base }: { base: KnowledgeBase }) {
  const [query, setQuery] = useState('');
  const [threshold, setThreshold] = useState(0.7);
  const [limit, setLimit] = useState(8);
  const [resultados, setResultados] = useState<KnowledgeChunk[] | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim().length < 3) {
      toast.error('Query deve ter pelo menos 3 caracteres');
      return;
    }
    startTransition(async () => {
      try {
        const r = await buscarConhecimento({
          query: query.trim(),
          base_ids: [base.id],
          limit,
          threshold,
        });
        setResultados(r);
        if (r.length === 0) toast.info('Nenhum resultado acima do threshold');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erro na busca');
      }
    });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="query">Pergunta ou trecho a buscar</Label>
          <Textarea
            id="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={3}
            placeholder="Ex: o que diz a Súmula 331 sobre terceirização?"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground">
              Threshold (similaridade mínima): {threshold.toFixed(2)}
              {threshold < 0.3 && <span className="ml-2 text-warning">amplo — pode trazer ruído</span>}
            </Label>
            <Slider value={[threshold]} onValueChange={(v) => setThreshold(v[0])} min={0.1} max={0.95} step={0.05} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Resultados: {limit}</Label>
            <Slider value={[limit]} onValueChange={(v) => setLimit(v[0])} min={1} max={20} step={1} />
          </div>
        </div>
        <Button type="submit" size="sm" className="rounded-xl" disabled={pending || query.trim().length < 3}>
          <Search className="size-3.5" />
          {pending ? 'Buscando...' : 'Buscar'}
        </Button>
      </form>

      {resultados && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{resultados.length} {resultados.length === 1 ? 'resultado' : 'resultados'}</p>
          {resultados.map((chunk) => (
            <ResultadoChunkCard key={chunk.chunk_id} chunk={chunk} />
          ))}
        </div>
      )}
    </div>
  );
}
