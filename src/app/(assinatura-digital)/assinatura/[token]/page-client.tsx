"use client";

import { useParams } from "next/navigation";
import { PublicSignatureFlow } from "@/app/(dashboard)/assinatura-digital/feature";

export function AssinaturaPublicaClient() {
  const params = useParams<{ token: string }>();
  const token = params?.token;

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <p className="text-red-600 dark:text-red-400 font-medium">Token inválido ou não fornecido.</p>
      </div>
    );
  }

  return <PublicSignatureFlow token={token} />;
}
