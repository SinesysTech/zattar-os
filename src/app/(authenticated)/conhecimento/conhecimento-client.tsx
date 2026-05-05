'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Heading, Text } from '@/components/ui/typography';
import { useAgentContext } from '@copilotkit/react-core/v2';
import { NovaBaseDialog } from './components/nova-base-dialog';
import type { KnowledgeBase } from './domain';

interface Props {
  bases: KnowledgeBase[];
  isSuperAdmin: boolean;
}

export function ConhecimentoClient({ bases, isSuperAdmin }: Props) {
  const [novaAberto, setNovaAberto] = useState(false);

  useAgentContext({
    description: 'Tela de bases de conhecimento — lista de coleções disponíveis para busca semântica',
    value: {
      total_bases: bases.length,
      bases: bases.map((b) => ({ slug: b.slug, nome: b.nome, total_documentos: b.total_documentos })),
    },
  });

  const totalDocs = bases.reduce((sum, b) => sum + b.total_documentos, 0);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <header className="flex items-start justify-between">
        <div>
          <Heading level="page">Conhecimento</Heading>
          <Text variant="body" className="text-muted-foreground">
            {bases.length} {bases.length === 1 ? 'base' : 'bases'} · {totalDocs} {totalDocs === 1 ? 'documento' : 'documentos'} indexados
          </Text>
        </div>
        {isSuperAdmin && (
          <Button size="sm" className="rounded-xl" onClick={() => setNovaAberto(true)}>
            <Plus className="size-3.5" />
            Nova base
          </Button>
        )}
      </header>

      {bases.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BookOpen className="size-12 text-muted-foreground mb-4" />
          <Heading level="card">Nenhuma base de conhecimento ainda</Heading>
          <Text variant="body" className="text-muted-foreground max-w-md mt-2">
            {isSuperAdmin
              ? 'Crie sua primeira base para começar a indexar jurisprudências, modelos e doutrina.'
              : 'Aguarde um administrador criar bases de conhecimento.'}
          </Text>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bases.map((base) => (
            <Link
              key={base.id}
              href={`/conhecimento/${base.slug}`}
              className="group rounded-2xl border bg-card p-6 transition hover:border-primary/50"
            >
              <div className="flex items-start justify-between">
                <Heading level="card">{base.nome}</Heading>
                {base.cor && (
                  <span className="size-3 rounded-full" style={{ backgroundColor: base.cor }} />
                )}
              </div>
              {base.descricao && (
                <Text variant="body-sm" className="text-muted-foreground mt-2 line-clamp-2">{base.descricao}</Text>
              )}
              <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                <span>{base.total_documentos} docs</span>
                <span>{base.total_chunks} chunks</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <NovaBaseDialog open={novaAberto} onOpenChange={setNovaAberto} />
    </div>
  );
}
