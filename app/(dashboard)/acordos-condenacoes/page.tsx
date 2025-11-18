import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function AcordosCondecoesPage() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Acordos e Condenações</h1>
          <p className="text-muted-foreground">
            Gerencie acordos, condenações e custas processuais
          </p>
        </div>
        <Button asChild>
          <Link href="/acordos-condenacoes/novo">
            <Plus className="mr-2 h-4 w-4" />
            Novo Acordo/Condenação
          </Link>
        </Button>
      </div>

      {/* Lista */}
      <Suspense fallback={<div>Carregando...</div>}>
        <AcordosCondenacoesList />
      </Suspense>
    </div>
  );
}

async function AcordosCondenacoesList() {
  // TODO: Fetch data from API
  return (
    <div className="rounded-md border p-8 text-center text-muted-foreground">
      <p>Lista de acordos e condenações será exibida aqui</p>
      <p className="text-sm mt-2">Integre com a API /api/acordos-condenacoes</p>
    </div>
  );
}
