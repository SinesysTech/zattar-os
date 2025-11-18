'use client';

import { useRouter } from 'next/navigation';
import { AcordoCondenacaoForm } from '@/components/acordos-condenacoes/acordo-condenacao-form';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function NovoAcordoCondenacaoPage() {
  const router = useRouter();

  const handleSuccess = (data: any) => {
    // Redirecionar para detalhes do acordo criado
    router.push(`/acordos-condenacoes/${data.acordo.id}`);
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
        <AcordoCondenacaoForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
