/**
 * DEPRECATED: This route has been migrated to Supabase Edge Function
 *
 * MIGRAÇÃO CONCLUÍDA:
 * - Novo endpoint: supabase/functions/alertas-disk-io/index.ts
 * - Agendamento: Supabase Cron Functions (via vercel.json functions config)
 * - Interval: 1h (0 * * * *)
 * - Auth: CRON_SECRET
 *
 * MUDANÇAS:
 * 1. Integração com Supabase Management API para Disk IO real
 * 2. SMTP email para alertas de Disk IO > 80%
 * 3. Execução em Edge Runtime (Deno) ao invés de Node.js
 *
 * Para invocar manualmente:
 * curl -X POST https://<your-project>.supabase.co/functions/v1/alertas-disk-io \
 *   -H "Authorization: Bearer $CRON_SECRET"
 *
 * CLEANUP: Este arquivo pode ser removido após validação da Edge Function
 */

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(_request: NextRequest) {
  return NextResponse.json(
    {
      error: "DEPRECATED",
      message: "Este endpoint foi migrado para uma Supabase Edge Function",
      newEndpoint: "supabase/functions/alertas-disk-io",
      documentation: "Veja https://supabase.com/docs/guides/functions",
    },
    { status: 410 } // 410 Gone
  );
}

export async function GET(request: NextRequest) {
  return POST(request);
}
