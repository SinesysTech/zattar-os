import { notFound } from 'next/navigation';

import { CapturaResult, type CapturaResultData } from '@/features/captura';
import { buscarCapturaLog } from '@/features/captura/server';
import { PageShell } from '@/components/shared/page-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CapturaDetalhesPage({ params }: PageProps) {
  const { id } = await params;
  const capturaId = parseInt(id, 10);

  if (isNaN(capturaId)) {
    notFound();
  }

  const captura = await buscarCapturaLog(capturaId);

  if (!captura) {
    notFound();
  }

  return (
    <PageShell
      title={`Detalhes da Captura #${captura.id}`}
      actions={
        <Button variant="outline" size="sm" asChild>
          <Link href="/captura/historico">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Link>
        </Button>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Informações da Captura</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
            <div className="space-y-1">
              <span className="text-sm font-medium text-muted-foreground">Status</span>
              <p className="text-sm font-medium">{captura.status}</p>
            </div>
            <div className="space-y-1">
              <span className="text-sm font-medium text-muted-foreground">Iniciado em</span>
              <p className="text-sm">{new Date(captura.iniciado_em).toLocaleString('pt-BR')}</p>
            </div>
            <div className="space-y-1">
              <span className="text-sm font-medium text-muted-foreground">Concluído em</span>
              <p className="text-sm">
                {captura.concluido_em ? new Date(captura.concluido_em).toLocaleString('pt-BR') : '-'}
              </p>
            </div>
          </div>

          <CapturaResult
            success={captura.status === 'completed'}
            error={captura.erro || undefined}
            data={captura.resultado as CapturaResultData}
            captureId={captura.id}
          />

          {captura.resultado && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Dados Brutos</h3>
              <pre className="p-4 rounded-lg bg-muted overflow-auto max-h-[500px] text-xs">
                {JSON.stringify(captura.resultado, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}
