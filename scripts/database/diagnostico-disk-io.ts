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

type _Section = {
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

// Direct PostgREST query helper - queries catalog views directly without RPC
async function _runPostgrestQuery<T = Record<string, unknown>>(
  table: string,
  select: string,
  options?: { order?: string; limit?: number }
): Promise<SqlResult<T>> {
  const supabase = createSupabaseClient();

  try {
    let query = supabase.from(table).select(select);

    if (options?.order) {
      const [column, direction] = options.order.split(' ');
      query = query.order(column, { ascending: direction?.toLowerCase() !== 'desc' });
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      return { error: error.message };
    }

    return { data: (data as T[]) || [] };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

async function obterVersaoPostgres(): Promise<string> {
  const supabase = createSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('pg_settings')
      .select('setting')
      .eq('name', 'server_version')
      .single();

    if (error || !data) {
      return "Desconhecida";
    }

    return String(data.setting);
  } catch {
    return "Desconhecida";
  }
}

async function verificarCacheHitRate() {
  const supabase = createSupabaseClient();

  try {
    const { data, error } = await supabase.from('pg_statio_user_tables').select('heap_blks_hit,heap_blks_read,idx_blks_hit,idx_blks_read');

    if (error || !data || data.length === 0) {
      return { error: error?.message || 'No data returned' };
    }

    // Calculate aggregates manually
    let totalHeapHit = 0;
    let totalHeapRead = 0;
    let totalIdxHit = 0;
    let totalIdxRead = 0;

    for (const row of data) {
      totalHeapHit += Number(row.heap_blks_hit || 0);
      totalHeapRead += Number(row.heap_blks_read || 0);
      totalIdxHit += Number(row.idx_blks_hit || 0);
      totalIdxRead += Number(row.idx_blks_read || 0);
    }

    const tableHitRate = totalHeapHit + totalHeapRead > 0
      ? (totalHeapHit / (totalHeapHit + totalHeapRead)) * 100
      : 0;

    const indexHitRate = totalIdxHit + totalIdxRead > 0
      ? (totalIdxHit / (totalIdxHit + totalIdxRead)) * 100
      : 0;

    return {
      data: [
        {
          table_hit_rate: Math.round(tableHitRate * 100) / 100,
          index_hit_rate: Math.round(indexHitRate * 100) / 100,
        },
      ],
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

async function identificarQueriesLentas() {
  const supabase = createSupabaseClient();

  try {
    // Query pg_stat_statements directly
    const { data: statements, error: statementsError } = await supabase
      .from('pg_stat_statements')
      .select('userid,query,calls,total_exec_time,total_plan_time,mean_exec_time,mean_plan_time,max_exec_time,max_plan_time')
      .gt('calls', 0)
      .order('max_exec_time', { ascending: false })
      .limit(20);

    if (statementsError || !statements) {
      return { error: statementsError?.message || 'No data from pg_stat_statements' };
    }

    // Get role names
    const userids = [...new Set(statements.map((s: any) => s.userid))];
    const { data: roles } = await supabase
      .from('pg_roles')
      .select('oid,rolname')
      .in('oid', userids);

    const roleMap = new Map((roles || []).map((r: any) => [r.oid, r.rolname]));

    // Format results
    const formattedData = statements.map((s: any) => {
      const totalTime = (Number(s.total_exec_time || 0) + Number(s.total_plan_time || 0));
      const meanTime = (Number(s.mean_exec_time || 0) + Number(s.mean_plan_time || 0));
      const maxTime = (Number(s.max_exec_time || 0) + Number(s.max_plan_time || 0));

      return {
        role: roleMap.get(s.userid) || 'unknown',
        query: String(s.query || '').substring(0, 180),
        calls: s.calls,
        total_time_ms: Math.round(totalTime * 100) / 100,
        mean_time_ms: Math.round(meanTime * 100) / 100,
        max_time_ms: Math.round(maxTime * 100) / 100,
      };
    });

    // Sort by max_time_ms descending
    formattedData.sort((a, b) => b.max_time_ms - a.max_time_ms);

    return { data: formattedData };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

async function verificarSequentialScans() {
  const supabase = createSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('pg_stat_user_tables')
      .select('relname,seq_scan,seq_tup_read,idx_scan,n_live_tup')
      .order('seq_tup_read', { ascending: false })
      .limit(20);

    if (error || !data) {
      return { error: error?.message || 'No data returned' };
    }

    // Calculate avg_seq_tup for each row
    const formattedData = data.map((row: any) => {
      const avgSeqTup = row.seq_scan > 0
        ? Math.round((Number(row.seq_tup_read) / Number(row.seq_scan)) * 100) / 100
        : 0;

      return {
        table: row.relname,
        seq_scan: row.seq_scan,
        seq_tup_read: row.seq_tup_read,
        idx_scan: row.idx_scan,
        avg_seq_tup: avgSeqTup,
        n_live_tup: row.n_live_tup,
      };
    });

    return { data: formattedData };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
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
