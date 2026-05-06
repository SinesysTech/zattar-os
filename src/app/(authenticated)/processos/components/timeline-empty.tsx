/**
 * Timeline Empty State
 *
 * Exibido quando timeline foi capturada mas não contém nenhum item.
 */

'use client';

import { cn } from '@/lib/utils';
import { FileSearch, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heading } from '@/components/ui/typography';

export function TimelineEmpty() {
  const router = useRouter();

  return (
    <Card className={cn(/* design-system-escape: p-12 → usar <Inset> */ "p-12")}>
      <div className={cn("flex flex-col items-center justify-center text-center stack-default")}>
        <div className={cn("rounded-full bg-muted inset-dialog")}>
          <FileSearch className="h-12 w-12 text-muted-foreground" />
        </div>

        <div className={cn("flex flex-col stack-tight")}>
          <Heading level="card">
            Nenhuma movimentação ou documento encontrado
          </Heading>
          <p className="text-muted-foreground max-w-md">
            Este processo não possui timeline no PJE ou os dados ainda não foram
            disponibilizados.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => router.push('/processos')}
          className={cn("flex inline-tight mt-4")}
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Listagem
        </Button>
      </div>
    </Card>
  );
}
