import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { AssistentesTiposConfig } from '@/features/assistentes-tipos';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

async function getAssistentes() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('assistentes')
    .select('id, nome, tipo')
    .order('nome');

  if (error) {
    console.error('Erro ao buscar assistentes:', error);
    return [];
  }

  return data || [];
}

async function getTiposExpedientes() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('tipos_expedientes')
    .select('id, nome')
    .order('nome');

  if (error) {
    console.error('Erro ao buscar tipos de expedientes:', error);
    return [];
  }

  return data || [];
}

function LoadingState() {
  return (
    <Card>
      <CardContent className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </CardContent>
    </Card>
  );
}

export default async function AssistentesTiposPage() {
  const [assistentes, tiposExpedientes] = await Promise.all([
    getAssistentes(),
    getTiposExpedientes(),
  ]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Geração Automática de Peças</h1>
        <p className="text-muted-foreground mt-2">
          Configure quais assistentes Dify devem ser executados automaticamente ao criar
          expedientes de determinados tipos
        </p>
      </div>

      <Suspense fallback={<LoadingState />}>
        <AssistentesTiposConfig
          assistentes={assistentes}
          tiposExpedientes={tiposExpedientes}
        />
      </Suspense>
    </div>
  );
}
