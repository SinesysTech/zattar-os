import Link from 'next/link';
import { FileQuestion, ArrowLeft, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { GlassPanel } from '@/components/shared/glass-panel';
import { Heading } from '@/components/ui/typography';

export default function ContratoNotFound() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <GlassPanel className="max-w-md w-full p-6">
        <div className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <FileQuestion className="size-6 text-muted-foreground" />
          </div>
          <Heading level="card" className="mb-4">Contrato não encontrado</Heading>
        </div>
        <div className="space-y-4">
          <p className="text-center text-muted-foreground">
            O contrato que você está procurando não existe ou foi removido.
          </p>

          <div className="flex gap-2 justify-center">
            <Button variant="outline" asChild>
              <Link href="/app/contratos">
                <ArrowLeft className="size-4 mr-2" />
                Voltar para lista
              </Link>
            </Button>
            <Button asChild>
              <Link href="/app/contratos?new=true">
                <Search className="size-4 mr-2" />
                Novo contrato
              </Link>
            </Button>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}
