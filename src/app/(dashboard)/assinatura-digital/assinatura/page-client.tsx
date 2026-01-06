"use client";

import { AssinaturaFluxoForm } from "../feature";

export default function AssinaturaPageClient() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Fluxo de Assinatura</h1>
        <p className="text-sm text-muted-foreground">
          Gere preview e finalize assinaturas usando templates e dados internos.
        </p>
      </div>

      <AssinaturaFluxoForm />
    </div>
  );
}
