'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Heading, Text } from '@/components/ui/typography';
import { deletarBase } from '../../actions/deletar-base.action';
import { toast } from 'sonner';
import type { KnowledgeBase } from '../../domain';

interface Props {
  base: KnowledgeBase;
  isSuperAdmin: boolean;
}

export function ConfiguracoesTab({ base, isSuperAdmin }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDeletar() {
    if (!confirm(`Deletar base "${base.nome}"? Todos os documentos e chunks serão removidos. Esta ação não pode ser desfeita.`)) {
      return;
    }
    startTransition(async () => {
      try {
        await deletarBase({ id: base.id });
        toast.success('Base removida');
        router.push('/conhecimento');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erro ao deletar');
      }
    });
  }

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <Heading level="card">Informações</Heading>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-muted-foreground">Slug</dt>
          <dd className="font-medium">{base.slug}</dd>
          <dt className="text-muted-foreground">Total de documentos</dt>
          <dd className="font-medium">{base.total_documentos}</dd>
          <dt className="text-muted-foreground">Total de chunks</dt>
          <dd className="font-medium">{base.total_chunks}</dd>
          <dt className="text-muted-foreground">Criada em</dt>
          <dd className="font-medium">{new Date(base.created_at).toLocaleString('pt-BR')}</dd>
          <dt className="text-muted-foreground">Última atualização</dt>
          <dd className="font-medium">{new Date(base.updated_at).toLocaleString('pt-BR')}</dd>
        </dl>
      </section>

      {isSuperAdmin && (
        <section className="space-y-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
          <Heading level="card">Zona de perigo</Heading>
          <Text variant="body-sm" className="text-muted-foreground">
            Deletar esta base remove permanentemente todos os documentos e chunks indexados.
          </Text>
          <Button variant="destructive" size="sm" onClick={handleDeletar} disabled={pending} className="rounded-xl">
            <Trash2 className="size-3.5" />
            {pending ? 'Deletando...' : 'Deletar base'}
          </Button>
        </section>
      )}
    </div>
  );
}
