/**
 * Componente Client para Visualização de Processo
 * 
 * TODO: Implementar hook use-processo-timeline e componentes relacionados
 * Atualmente exibe mensagem de desenvolvimento.
 */

'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProcessoVisualizacaoProps {
  acervoId: number;
}

export function ProcessoVisualizacao({ acervoId }: ProcessoVisualizacaoProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-semibold">Visualização de Processo #{acervoId}</h2>
        <p className="text-muted-foreground">
          Esta funcionalidade está em desenvolvimento.
        </p>
        <p className="text-sm text-muted-foreground">
          Hook <code className="bg-muted px-2 py-1 rounded">use-processo-timeline</code> precisa ser implementado.
        </p>
        <Button variant="outline" onClick={() => router.push('/processos')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar para Processos
        </Button>
      </div>
    </div>
  );
}
