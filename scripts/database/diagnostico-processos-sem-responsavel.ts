import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

// Carregar variáveis de ambiente
config({ path: ".env.local" });
config(); // Fallback para .env

/**
 * Script de diagnóstico: Processos sem responsável
 * Verifica processos do acervo_geral que não possuem responsável atribuído
 */

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

async function main() {
  ensureEnv();
  const supabase = createSupabaseClient();

  console.log("=".repeat(80));
  console.log("DIAGNÓSTICO: Processos sem Responsável (exceto arquivados)");
  console.log("=".repeat(80));
  console.log();

  // 1. Resumo geral de processos
  console.log("1. RESUMO GERAL DE PROCESSOS NO ACERVO");
  console.log("-".repeat(60));

  const { data: resumo, error: erroResumo } = await supabase
    .from("acervo")
    .select("id, origem, responsavel_id")
    .neq("origem", "arquivado");

  if (erroResumo) {
    console.error("Erro ao buscar resumo:", erroResumo.message);
    return;
  }

  const totalProcessos = resumo?.length || 0;
  const comResponsavel = resumo?.filter((p) => p.responsavel_id !== null).length || 0;
  const semResponsavel = resumo?.filter((p) => p.responsavel_id === null).length || 0;

  console.log(`Total de processos (acervo_geral): ${totalProcessos}`);
  console.log(`Com responsável:                   ${comResponsavel}`);
  console.log(`SEM responsável:                   ${semResponsavel}`);
  console.log();

  // 2. Listar processos sem responsável
  if (semResponsavel > 0) {
    console.log("2. PROCESSOS SEM RESPONSÁVEL (primeiros 50)");
    console.log("-".repeat(60));

    const { data: processosSemResp, error: erroLista } = await supabase
      .from("acervo")
      .select("id, numero_processo, trt, grau, origem, created_at")
      .eq("origem", "acervo_geral")
      .is("responsavel_id", null)
      .order("created_at", { ascending: false })
      .limit(50);

    if (erroLista) {
      console.error("Erro ao buscar lista:", erroLista.message);
    } else if (processosSemResp && processosSemResp.length > 0) {
      console.log();
      console.log(
        "ID".padEnd(8) +
          "Número do Processo".padEnd(28) +
          "TRT".padEnd(8) +
          "Grau".padEnd(16) +
          "Criado em"
      );
      console.log("-".repeat(80));

      for (const p of processosSemResp) {
        console.log(
          String(p.id).padEnd(8) +
            (p.numero_processo || "").padEnd(28) +
            (p.trt || "").padEnd(8) +
            (p.grau || "").padEnd(16) +
            (p.created_at ? new Date(p.created_at).toLocaleDateString("pt-BR") : "")
        );
      }
    }
    console.log();
  }

  // 3. Verificar expedientes vinculados a esses processos
  console.log("3. EXPEDIENTES AFETADOS (vinculados a processos sem responsável)");
  console.log("-".repeat(60));

  // Buscar IDs dos processos sem responsável
  const { data: idsSemResp } = await supabase
    .from("acervo")
    .select("id")
    .eq("origem", "acervo_geral")
    .is("responsavel_id", null);

  if (idsSemResp && idsSemResp.length > 0) {
    const ids = idsSemResp.map((p) => p.id);

    // Buscar expedientes vinculados a esses processos
    const { data: expedientesAfetados, error: erroExp } = await supabase
      .from("expedientes")
      .select("id, processo_id, numero_processo, responsavel_id, baixado_em")
      .in("processo_id", ids)
      .is("baixado_em", null); // apenas pendentes

    if (erroExp) {
      console.error("Erro ao buscar expedientes:", erroExp.message);
    } else {
      const totalExp = expedientesAfetados?.length || 0;
      const expSemResp =
        expedientesAfetados?.filter((e) => e.responsavel_id === null).length || 0;

      console.log(`Total de expedientes pendentes vinculados: ${totalExp}`);
      console.log(`Expedientes SEM responsável:               ${expSemResp}`);
    }
  } else {
    console.log("Nenhum processo sem responsável encontrado.");
  }

  console.log();

  // 4. Resumo de expedientes sem responsável por causa
  console.log("4. EXPEDIENTES SEM RESPONSÁVEL - ANÁLISE POR CAUSA");
  console.log("-".repeat(60));

  // Buscar todos expedientes pendentes sem responsável
  const { data: expPendentes, error: erroExpPend } = await supabase
    .from("expedientes")
    .select("id, processo_id, numero_processo, trt, grau, responsavel_id")
    .is("responsavel_id", null)
    .is("baixado_em", null);

  if (erroExpPend) {
    console.error("Erro ao buscar expedientes pendentes:", erroExpPend.message);
  } else if (expPendentes) {
    // Categorizar por causa
    let semProcessoId = 0;
    let processoNaoEncontrado = 0;
    let processoArquivado = 0;
    let processoSemResponsavel = 0;

    // Buscar processos para análise
    const processosIds = expPendentes
      .filter((e) => e.processo_id !== null)
      .map((e) => e.processo_id);

    let processosMap = new Map<number, { origem: string; responsavel_id: number | null }>();

    if (processosIds.length > 0) {
      const { data: processos } = await supabase
        .from("acervo")
        .select("id, origem, responsavel_id")
        .in("id", processosIds);

      if (processos) {
        for (const p of processos) {
          processosMap.set(p.id, { origem: p.origem, responsavel_id: p.responsavel_id });
        }
      }
    }

    for (const exp of expPendentes) {
      if (exp.processo_id === null) {
        semProcessoId++;
      } else {
        const processo = processosMap.get(exp.processo_id);
        if (!processo) {
          processoNaoEncontrado++;
        } else if (processo.origem !== "acervo_geral") {
          processoArquivado++;
        } else if (processo.responsavel_id === null) {
          processoSemResponsavel++;
        }
      }
    }

    console.log();
    console.log(`Total de expedientes pendentes sem responsável: ${expPendentes.length}`);
    console.log();
    console.log("Causa".padEnd(50) + "Quantidade");
    console.log("-".repeat(60));
    console.log("1. Sem processo_id vinculado".padEnd(50) + semProcessoId);
    console.log("2. Processo não encontrado no acervo".padEnd(50) + processoNaoEncontrado);
    console.log("3. Processo arquivado (origem != acervo_geral)".padEnd(50) + processoArquivado);
    console.log("4. Processo sem responsável definido".padEnd(50) + processoSemResponsavel);
  }

  console.log();

  // 5. Verificar configuração de regiões
  console.log("5. CONFIGURAÇÃO DE REGIÕES (config_regioes_atribuicao)");
  console.log("-".repeat(60));

  const { data: configRegioes, error: erroConfig } = await supabase
    .from("config_regioes_atribuicao")
    .select("*")
    .order("prioridade", { ascending: false });

  if (erroConfig) {
    console.error("Erro ao buscar configuração:", erroConfig.message);
  } else if (configRegioes && configRegioes.length > 0) {
    console.log();
    for (const regiao of configRegioes) {
      console.log(`Região: ${regiao.nome} (ID: ${regiao.id})`);
      console.log(`  Ativo: ${regiao.ativo}`);
      console.log(`  Prioridade: ${regiao.prioridade}`);
      console.log(`  TRTs: ${regiao.trts?.join(", ")}`);
      console.log(`  Responsáveis IDs: ${regiao.responsaveis_ids?.join(", ")}`);
      console.log(`  Método: ${regiao.metodo_balanceamento}`);
      console.log();
    }
  } else {
    console.log("ATENÇÃO: Nenhuma configuração de região encontrada!");
  }

  // 6. Verificar TRTs dos processos sem responsável vs configuração
  console.log("6. TRTs DOS PROCESSOS SEM RESPONSÁVEL vs CONFIGURAÇÃO");
  console.log("-".repeat(60));

  const { data: processosAnalise } = await supabase
    .from("acervo")
    .select("id, trt, created_at")
    .eq("origem", "acervo_geral")
    .is("responsavel_id", null);

  if (processosAnalise && processosAnalise.length > 0) {
    // Agrupar por TRT
    const porTrt = new Map<string, number>();
    for (const p of processosAnalise) {
      const count = porTrt.get(p.trt) || 0;
      porTrt.set(p.trt, count + 1);
    }

    console.log();
    console.log("TRT".padEnd(10) + "Qtd sem resp.".padEnd(18) + "Configurado?");
    console.log("-".repeat(50));

    // Criar set de TRTs configurados
    const trtsConfigurados = new Set<string>();
    for (const regiao of configRegioes || []) {
      for (const trt of regiao.trts || []) {
        if (regiao.ativo) trtsConfigurados.add(trt);
      }
    }

    for (const [trt, count] of Array.from(porTrt).sort()) {
      const configurado = trtsConfigurados.has(trt) ? "SIM" : "NÃO ⚠️";
      console.log(trt.padEnd(10) + String(count).padEnd(18) + configurado);
    }
  }

  console.log();

  // 7. Verificar quando os processos sem responsável foram criados
  console.log("7. ANÁLISE TEMPORAL - Quando foram criados?");
  console.log("-".repeat(60));

  if (processosAnalise && processosAnalise.length > 0) {
    // Data do trigger de config_regioes: 2026-01-08
    const dataTriggerConfig = new Date("2026-01-08");
    // Data do trigger original: 2025-11-24
    const dataTriggerOriginal = new Date("2025-11-24");

    let antesDoTriggerOriginal = 0;
    let entreOsTriggers = 0;
    let depoisDoTriggerConfig = 0;

    for (const p of processosAnalise) {
      const created = new Date(p.created_at);
      if (created < dataTriggerOriginal) {
        antesDoTriggerOriginal++;
      } else if (created < dataTriggerConfig) {
        entreOsTriggers++;
      } else {
        depoisDoTriggerConfig++;
      }
    }

    console.log();
    console.log(`Total de processos sem responsável: ${processosAnalise.length}`);
    console.log();
    console.log(`Criados ANTES do trigger (< 24/11/2025):     ${antesDoTriggerOriginal}`);
    console.log(`Criados entre os triggers (24/11 - 08/01):   ${entreOsTriggers}`);
    console.log(`Criados DEPOIS do trigger config (>= 08/01): ${depoisDoTriggerConfig}`);
    console.log();

    if (antesDoTriggerOriginal > 0) {
      console.log("⚠️  Processos criados ANTES do trigger não receberam atribuição automática.");
      console.log("   Estes precisam ser atribuídos manualmente ou via script de correção.");
    }

    if (depoisDoTriggerConfig > 0) {
      console.log("⚠️  Processos criados DEPOIS do trigger config não receberam atribuição.");
      console.log("   Isso pode indicar um problema na configuração ou no trigger.");
    }
  }

  // 8. Verificar se o trigger está ativo
  console.log();
  console.log("8. VERIFICAR SE O TRIGGER ESTÁ ATIVO");
  console.log("-".repeat(60));

  // Buscar informações do trigger via pg_trigger (precisa de acesso)
  const { data: triggers, error: erroTrigger } = await supabase.rpc("get_acervo_triggers");

  if (erroTrigger) {
    console.log("Não foi possível verificar triggers via RPC.");
    console.log("Execute manualmente no Supabase:");
    console.log(`
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgrelid = 'acervo'::regclass
  AND tgname LIKE '%responsavel%';
`);
  } else if (triggers) {
    console.log("Triggers encontrados:", triggers);
  }

  console.log();
  console.log("=".repeat(80));
  console.log("FIM DO DIAGNÓSTICO");
  console.log("=".repeat(80));
}

main().catch(console.error);
