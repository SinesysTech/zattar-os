'use client';

import { useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { AcordoForm } from '@/features/obrigacoes';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

// Force dynamic rendering to avoid SSG issues with client components
export const dynamic = 'force-dynamic';

function FormLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-[200px] w-full" />
    </div>
  );
}

export default function NovoAcordoCondenacaoPage() {
  const router = useRouter();

  const handleSuccess = (data?: { id: number; acordo?: unknown; parcelas?: unknown[] }) => {
    // Redirecionar para detalhes do acordo criado
    const id = (data?.acordo as { id?: number } | undefined)?.id ?? data?.id;
    if (id) {
      router.push(`/acordos-condenacoes/${id}`);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="container mx-auto py-8 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/acordos-condenacoes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Novo Acordo/Condenação</h1>
          <p className="text-muted-foreground">
            Cadastre um novo acordo, condenação ou custas processuais
          </p>
        </div>
      </div>

      {/* Formulário */}
      <div className="rounded-lg border bg-card p-6">
        <AcordoForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
