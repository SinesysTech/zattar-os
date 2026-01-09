import { createClient } from "@supabase/supabase-js";
import { spawnSync } from "child_process";
import { writeFileSync } from "fs";
import { join } from "path";

// Script de diagnóstico de Disk I/O no Supabase.
// Coleta métricas principais (cache hit rate, queries lentas, sequential scans)
// e executa inspeções via Supabase CLI (bloat e índices não utilizados),
// salvando um relatório em Markdown na raiz do projeto.

type SqlResult<T = Record<string, unknown>> = {
  data?: T[];
  error?: string;
};

type Section = {
  title: string;
  content: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;

function ensureEnv() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      "Variáveis de ambiente ausentes: configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY"
    );
  }
}

function createSupabaseClient() {
  return createClient(supabaseUrl!, supabaseServiceKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function runSql<T = Record<string, unknown>>(sql: string): Promise<SqlResult<T>> {
  const supabase = createSupabaseClient();

  try {
    const { data, error } = await supabase.rpc("query", { query: sql });

    if (error) {
      return { error: error.message };
    }

    if (!data) {
      return { data: [] };
    }

    return { data: Array.isArray(data) ? (data as T[]) : [data as T] };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

async function obterVersaoPostgres(): Promise<string> {
  const result = await runSql<{ server_version: string }>("SHOW server_version;");

  if (result.error || !result.data?.length) {
    return "Desconhecida";
  }

  const versionValue =
    (result.data[0] as Record<string, unknown>)["server_version"] ?? "Desconhecida";

  return String(versionValue);
}

async function verificarCacheHitRate() {
  const sql = `
    SELECT
      ROUND((SUM(idx_blks_hit)::numeric / NULLIF(SUM(idx_blks_hit) + SUM(idx_blks_read), 0)) * 100, 2) AS index_hit_rate,
      ROUND((SUM(blks_hit)::numeric / NULLIF(SUM(blks_hit) + SUM(blks_read), 0)) * 100, 2) AS table_hit_rate
    FROM pg_statio_user_tables;
  `;

  return runSql(sql);
}

async function identificarQueriesLentas() {
  const sql = `
    SELECT
      r.rolname AS role,
      LEFT(s.query, 180) AS query,
      s.calls,
      ROUND(s.total_time, 2) AS total_time_ms,
      ROUND(s.mean_time, 2) AS mean_time_ms,
      ROUND(s.max_time, 2) AS max_time_ms
    FROM pg_stat_statements s
    JOIN pg_roles r ON r.oid = s.userid
    WHERE s.calls > 0
    ORDER BY s.max_time DESC
    LIMIT 20;
  `;

  return runSql(sql);
}

async function verificarSequentialScans() {
  const sql = `
    SELECT
      relname AS table,
      seq_scan,
      seq_tup_read,
      idx_scan,
      ROUND(CASE WHEN seq_scan > 0 THEN seq_tup_read::numeric / seq_scan ELSE 0 END, 2) AS avg_seq_tup,
      n_live_tup
    FROM pg_stat_user_tables
    ORDER BY seq_tup_read DESC
    LIMIT 20;
  `;

  return runSql(sql);
}

function executarSupabaseCLI(args: string[]) {
  const cliResult = spawnSync("npx", ["supabase", ...args], {
    encoding: "utf-8",
    shell: process.platform === "win32",
  });

  if (cliResult.error) {
    return {
      success: false,
      output: "",
      error: cliResult.error.message,
    };
  }

  if (cliResult.status !== 0) {
    return {
      success: false,
      output: cliResult.stdout ?? "",
      error: cliResult.stderr || `Processo retornou status ${cliResult.status}`,
    };
  }

  return {
    success: true,
    output: cliResult.stdout ?? "",
  };
}

function formatTable(rows?: Array<Record<string, unknown>>): string {
  if (!rows || rows.length === 0) {
    return "Nenhum dado retornado.\n";
  }

  const headers = Object.keys(rows[0]);

  const normalize = (value: unknown) => {
    if (value === null || value === undefined) return "";
    if (typeof value === "number") return value.toString();
    return String(value).replace(/\n+/g, " ").replace(/\|/g, "\\|");
  };

  const headerLine = `| ${headers.join(" | ")} |`;
  const separator = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows
    .map((row) => {
      const values = headers.map((header) => normalize((row as Record<string, unknown>)[header]));
      return `| ${values.join(" | ")} |`;
    })
    .join("\n");

  return `${headerLine}\n${separator}\n${body}\n`;
}

function formatCacheSection(rows?: Array<Record<string, unknown>>): string {
  if (!rows || rows.length === 0) {
    return "❌ Falha ao calcular cache hit rate.\n";
  }

  const { index_hit_rate, table_hit_rate } = rows[0] as Record<string, unknown>;
  const indexRate = Number(index_hit_rate ?? 0);
  const tableRate = Number(table_hit_rate ?? 0);

  const classify = (value: number) => {
    if (value >= 99) return "✅ Ótimo";
    if (value >= 95) return "⚠️ Atenção";
    return "❌ Crítico";
  };

  const table = formatTable([
    { "Métrica": "Index Hit Rate", "Valor (%)": indexRate.toFixed(2), Status: classify(indexRate) },
    { "Métrica": "Table Hit Rate", "Valor (%)": tableRate.toFixed(2), Status: classify(tableRate) },
  ]);

  return `${table}\nInterpretação: ✅ >99% (ótimo) | ⚠️ 95-99% (atenção) | ❌ <95% (crítico). Cache abaixo de 99% indica consultas indo ao disco; verifique índices e tamanho do working set.\n`;
}

function formatCliSection(title: string, result: { success: boolean; output: string; error?: string }): string {
  if (result.success) {
    return `## ${title}\n\n\n${"```"}\n${result.output.trim() || "(sem saída)"}\n${"```"}\n`;
  }

  return `## ${title}\n\n❌ Falha ao executar comando.\n\n${"```"}\n${(result.error || "Erro desconhecido").trim()}\n${"```"}\n`;
}

function gerarRelatorioMarkdown(
  metadata: { dataExecucao: string; postgresVersion: string; computeTier: string },
  cacheSection: string,
  queriesSection: string,
  seqScanSection: string,
  bloatSection: string,
  unusedIndexesSection: string
) {
  return `# Diagnóstico de Disk I/O - Supabase

**Data:** ${metadata.dataExecucao}  
**Postgres:** ${metadata.postgresVersion}  
**Compute:** ${metadata.computeTier}  
**Referência:** https://supabase.com/docs/guides/platform/database-usage#disk-io

## 1. Cache Hit Rate

${cacheSection}

## 2. Top 20 Queries Mais Lentas

${queriesSection}

Queries críticas (>1000ms) merecem revisão: evitar SELECT *, limitar colunas, adicionar índices em filtros/joins.

## 3. Tabelas com Sequential Scans

${seqScanSection}

Priorizar índices para tabelas com \`seq_scan\` alto e \`n_live_tup\` elevado.

${bloatSection}

${unusedIndexesSection}

## 6. Recomendações Prioritárias

1. Revisar queries com \`max_time_ms\` > 1000ms e remover SELECT *.
2. Adicionar índices para tabelas com muitos sequential scans (ver colunas filtradas/ordenadas nas queries).
3. Executar VACUUM/REINDEX se bloat elevado; avaliar autovacuum.
4. Reavaliar plano de compute caso cache hit rate permaneça <99% após otimizações.
`;
}

function formatSqlSection(title: string, rows?: Array<Record<string, unknown>>, error?: string): string {
  if (error) {
    return `## ${title}\n\n❌ ${error}\n`;
  }

  return `## ${title}\n\n${formatTable(rows)}\n`;
}

async function main() {
  ensureEnv();

  console.log("🔎 Iniciando diagnóstico de Disk I/O do Supabase...\n");

  const dataExecucao = new Date().toISOString();
  const postgresVersion = await obterVersaoPostgres();

  const computeTier = "Indisponível (necessária Management API)";

  const [cacheHitRate, slowQueries, sequentialScans] = await Promise.all([
    verificarCacheHitRate(),
    identificarQueriesLentas(),
    verificarSequentialScans(),
  ]);

  const bloat = executarSupabaseCLI(["inspect", "db", "bloat", "--linked"]);
  const unusedIndexes = executarSupabaseCLI(["inspect", "db", "unused-indexes", "--linked"]);

  const cacheSection = cacheHitRate.error
    ? `❌ ${cacheHitRate.error}\n`
    : formatCacheSection(cacheHitRate.data as Array<Record<string, unknown>>);

  const queriesSection = formatSqlSection(
    "Top 20 queries por max_time",
    slowQueries.data as Array<Record<string, unknown>>, 
    slowQueries.error
  );

  const seqScanSection = formatSqlSection(
    "Tabelas com maior seq_tup_read",
    sequentialScans.data as Array<Record<string, unknown>>, 
    sequentialScans.error
  );

  const bloatSection = formatCliSection("4. Bloat (Dead Tuples)", bloat);
  const unusedIndexesSection = formatCliSection("5. Índices Não Utilizados", unusedIndexes);

  const relatorio = gerarRelatorioMarkdown(
    { dataExecucao, postgresVersion, computeTier },
    cacheSection,
    queriesSection,
    seqScanSection,
    bloatSection,
    unusedIndexesSection
  );

  const outputPath = join(process.cwd(), "DIAGNOSTICO_DISK_IO.md");
  writeFileSync(outputPath, relatorio, { encoding: "utf-8" });

  console.log(`✅ Diagnóstico concluído. Relatório salvo em: ${outputPath}`);
}

main().catch((error) => {
  console.error("❌ Erro ao executar diagnóstico:", error.message);
  process.exit(1);
});
