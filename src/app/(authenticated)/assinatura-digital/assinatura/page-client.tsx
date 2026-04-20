"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/loading-state"
/**
 * AssinaturaPageClient - Redireciona para o novo fluxo de documentos
 *
 * O antigo formulário AssinaturaFluxoForm foi substituído pelo novo fluxo
 * de 3 etapas: Upload → Configurar → Revisar
 */
export default function AssinaturaPageClient() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/app/assinatura-digital/documentos/novo");
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-100 gap-4">
      <LoadingSpinner className="size-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        Redirecionando para o novo fluxo de assinatura...
      </p>
    </div>
  );
}
