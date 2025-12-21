'use client';

/**
 * Página de Detalhes da Obrigação
 * Redireciona para a página de acordo/condenação no módulo de obrigações
 */

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Typography } from '@/components/ui/typography';
import { ArrowLeft } from 'lucide-react';
import { actionBuscarAcordo } from '@/features/obrigacoes';

export default function ObrigacaoDetalhesPage() {
  const router = useRouter();
  const params = useParams();
  const obrigacaoId = params.id as string;
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function carregarObrigacao() {
      try {
        // Tentar buscar como acordo/condenação
        const result = await actionBuscarAcordo(parseInt(obrigacaoId, 10));
        if (result.success && result.data) {
          // Redirecionar para a página de acordos no módulo de obrigações
          router.replace(`/financeiro/obrigacoes/acordos/${obrigacaoId}`);
          return;
        }
        setError('Obrigação não encontrada');
      } catch {
        setError('Erro ao carregar obrigação');
      } finally {
        setIsLoading(false);
      }
    }
    carregarObrigacao();
  }, [obrigacaoId, router]);

  const handleVoltar = () => {
    router.push('/financeiro/obrigacoes');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleVoltar}
          className="rounded-full bg-background"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
          <Typography.P className="font-semibold">Erro</Typography.P>
          <Typography.P>{error}</Typography.P>
        </div>
      </div>
    );
  }

  return null;
}
