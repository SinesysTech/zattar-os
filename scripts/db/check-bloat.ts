/**
 * Script: Verificar Bloat de Tabelas
 * 
 * Executa diagnóstico de bloat e exibe resultados formatados.
 * 
 * Uso:
 *   npx tsx scripts/db/check-bloat.ts
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface BloatDiagnostic {
  tabela: string;
  tamanho_total: string;
  dead_tuples: number;
  live_tuples: number;
  bloat_percent: number;
  last_vacuum: string | null;
  last_autovacuum: string | null;
  requer_vacuum: boolean;
}

async function checkBloat() {
  console.log("🔍 Verificando bloat de tabelas...\n");

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase.rpc("diagnosticar_bloat_tabelas");

  if (error) {
    console.error("❌ Erro ao executar diagnóstico:", error.message);
    process.exit(1);
  }

  const diagnostics = data as BloatDiagnostic[];

  // Tabela formatada
  console.log(
    "┌─────────────────────────────────────────────────────────────────────────────┐"
  );
  console.log(
    "│ Tabela                    │ Tamanho │ Dead │ Bloat % │ VACUUM Requerido │"
  );
  console.log(
    "├─────────────────────────────────────────────────────────────────────────────┤"
  );

  diagnostics.forEach((d) => {
    const status = d.requer_vacuum ? "⚠️  SIM" : "✅ NÃO";
    const bloatColor =
      d.bloat_percent > 50 ? "🔴" : d.bloat_percent > 20 ? "🟡" : "🟢";

    console.log(
      `│ ${d.tabela.padEnd(25)} │ ${d.tamanho_total.padEnd(7)} │ ${String(d.dead_tuples).padEnd(4)} │ ${bloatColor} ${String(d.bloat_percent).padEnd(5)}% │ ${status.padEnd(16)} │`
    );
  });

  console.log(
    "└─────────────────────────────────────────────────────────────────────────────┘\n"
  );

  // Resumo
  const tabelasComBloat = diagnostics.filter((d) => d.requer_vacuum);
  const tabelasCriticas = diagnostics.filter((d) => d.bloat_percent > 50);

  console.log("📊 Resumo:");
  console.log(`  - Total de tabelas: ${diagnostics.length}`);
  console.log(`  - Tabelas com bloat >20%: ${tabelasComBloat.length}`);
  console.log(`  - Tabelas críticas (>50%): ${tabelasCriticas.length}\n`);

  if (tabelasCriticas.length > 0) {
    console.log(
      "⚠️  AÇÃO REQUERIDA: Executar VACUUM FULL em horário de baixo tráfego"
    );
    console.log("   Tabelas críticas:");
    tabelasCriticas.forEach((t) => {
      console.log(`   - ${t.tabela}: ${t.bloat_percent}% bloat`);
    });
  } else if (tabelasComBloat.length > 0) {
    console.log(
      "ℹ️  AÇÃO RECOMENDADA: Executar VACUUM ANALYZE via SQL Editor"
    );
    console.log("   Tabelas com bloat moderado:");
    tabelasComBloat.forEach((t) => {
      console.log(`   - ${t.tabela}: ${t.bloat_percent}% bloat`);
    });
  } else {
    console.log("✅ Todas as tabelas estão saudáveis (bloat <20%)");
  }
}

checkBloat().catch(console.error);
