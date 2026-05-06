'use client';

import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { AcordoForm } from '@/app/(authenticated)/obrigacoes';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Heading } from '@/components/ui/typography';

export default function NovaObrigacaoClient() {
  const router = useRouter();

  const handleSuccess = (data?: { id: number; acordo?: unknown; parcelas?: unknown[] }) => {
    const id = (data?.acordo as { id?: number } | undefined)?.id ?? data?.id;
    if (id) {
      router.push(`/obrigacoes/${id}`);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className={cn("py-8 stack-loose max-w-4xl mx-auto")}>
      {/* Header */}
      <div className={cn("flex items-center inline-default")}>
        <Button variant="ghost" size="icon" aria-label="Voltar" asChild>
          <Link href="/obrigacoes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <Heading level="page">Nova Obrigação</Heading>
        </div>
      </div>

      {/* Formulario */}
      <div className={cn("rounded-lg border bg-card inset-dialog")}>
        <AcordoForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
