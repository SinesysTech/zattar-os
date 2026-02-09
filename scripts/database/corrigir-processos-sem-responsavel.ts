import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

// Carregar variáveis de ambiente
config({ path: ".env.local" });
config(); // Fallback para .env

/**
 * Script de correção: Atribuir responsáveis a processos legados
 * Usa a mesma lógica do trigger (balanceamento por contagem de processos)
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

interface ConfigRegiao {
  id: number;
  nome: string;
  trts: string[];
  responsaveis_ids: number[];
  metodo_balanceamento: string;
  ativo: boolean;
  prioridade: number;
}

interface ProcessoSemResponsavel {
  id: number;
  numero_processo: string;
  trt: string;
}

async function contarProcessosPorResponsavel(
  supabase: ReturnType<typeof createSupabaseClient>,
  responsavelId: number
): Promise<number> {
  const { count } = await supabase
    .from("acervo")
    .select("numero_processo", { count: "exact", head: true })
    .eq("origem", "acervo_geral")
    .eq("responsavel_id", responsavelId);

  return count || 0;
}

async function encontrarResponsavelComMenosCarga(
  supabase: ReturnType<typeof createSupabaseClient>,
  responsaveisIds: number[]
): Promise<number> {
  let menorCarga = Infinity;
  let responsavelEscolhido = responsaveisIds[0];

  for (const responsavelId of responsaveisIds) {
    const carga = await contarProcessosPorResponsavel(supabase, responsavelId);
    if (carga < menorCarga) {
      menorCarga = carga;
      responsavelEscolhido = responsavelId;
    }
  }

  return responsavelEscolhido;
}

async function main() {
  ensureEnv();
  const supabase = createSupabaseClient();

  console.log("=".repeat(80));
  console.log("CORREÇÃO: Atribuir responsáveis a processos legados");
  console.log("=".repeat(80));
  console.log();

  // 1. Buscar configuração de regiões
  console.log("1. Carregando configuração de regiões...");
  const { data: configRegioes, error: erroConfig } = await supabase
    .from("config_regioes_atribuicao")
    .select("*")
    .eq("ativo", true)
    .order("prioridade", { ascending: false });

  if (erroConfig || !configRegioes) {
    console.error("Erro ao buscar configuração:", erroConfig?.message);
    return;
  }

  console.log(`   Encontradas ${configRegioes.length} regiões ativas.`);

  // Criar mapa de TRT -> região
  const trtParaRegiao = new Map<string, ConfigRegiao>();
  for (const regiao of configRegioes as ConfigRegiao[]) {
    for (const trt of regiao.trts) {
      // Só adiciona se ainda não existe (prioridade já está ordenada)
      if (!trtParaRegiao.has(trt)) {
        trtParaRegiao.set(trt, regiao);
      }
    }
  }

  // 2. Buscar processos sem responsável
  console.log();
  console.log("2. Buscando processos sem responsável...");
  const { data: processosSemResp, error: erroProcessos } = await supabase
    .from("acervo")
    .select("id, numero_processo, trt")
    .eq("origem", "acervo_geral")
    .is("responsavel_id", null);

  if (erroProcessos || !processosSemResp) {
    console.error("Erro ao buscar processos:", erroProcessos?.message);
    return;
  }

  console.log(`   Encontrados ${processosSemResp.length} processos sem responsável.`);

  if (processosSemResp.length === 0) {
    console.log();
    console.log("Nenhum processo para corrigir.");
    return;
  }

  // 3. Buscar nomes dos responsáveis
  const todosResponsaveisIds = new Set<number>();
  for (const regiao of configRegioes as ConfigRegiao[]) {
    for (const id of regiao.responsaveis_ids) {
      todosResponsaveisIds.add(id);
    }
  }

  const { data: usuarios } = await supabase
    .from("usuarios")
    .select("id, nome_exibicao")
    .in("id", Array.from(todosResponsaveisIds));

  const nomeUsuario = new Map<number, string>();
  for (const u of usuarios || []) {
    nomeUsuario.set(u.id, u.nome_exibicao);
  }

  // 4. Processar cada processo
  console.log();
  console.log("3. Atribuindo responsáveis...");
  console.log("-".repeat(60));

  let sucesso = 0;
  let erros = 0;
  let semRegiao = 0;

  // Agrupar por região para otimizar balanceamento
  const processosPorRegiao = new Map<string, ProcessoSemResponsavel[]>();

  for (const processo of processosSemResp as ProcessoSemResponsavel[]) {
    const regiao = trtParaRegiao.get(processo.trt);
    if (!regiao) {
      console.log(`   ⚠️  Processo ${processo.id} (${processo.trt}): Sem região configurada`);
      semRegiao++;
      continue;
    }

    const key = regiao.nome;
    if (!processosPorRegiao.has(key)) {
      processosPorRegiao.set(key, []);
    }
    processosPorRegiao.get(key)!.push(processo);
  }

  // Processar por região
  for (const [nomeRegiao, processos] of processosPorRegiao) {
    const regiao = configRegioes.find((r) => r.nome === nomeRegiao) as ConfigRegiao;
    console.log();
    console.log(`   Região: ${nomeRegiao} (${processos.length} processos)`);

    for (const processo of processos) {
      // Encontrar responsável com menor carga
      const responsavelId = await encontrarResponsavelComMenosCarga(
        supabase,
        regiao.responsaveis_ids
      );

      // Atualizar processo
      const { error: erroUpdate } = await supabase
        .from("acervo")
        .update({ responsavel_id: responsavelId })
        .eq("id", processo.id);

      if (erroUpdate) {
        console.log(`   ❌ Processo ${processo.id}: Erro - ${erroUpdate.message}`);
        erros++;
      } else {
        console.log(
          `   ✓ Processo ${processo.id} (${processo.trt}): Atribuído a ${nomeUsuario.get(responsavelId)} (ID: ${responsavelId})`
        );
        sucesso++;
      }
    }
  }

  // 5. Resumo final
  console.log();
  console.log("=".repeat(80));
  console.log("RESUMO DA CORREÇÃO");
  console.log("=".repeat(80));
  console.log();
  console.log(`Total de processos processados: ${processosSemResp.length}`);
  console.log(`Atribuídos com sucesso:         ${sucesso}`);
  console.log(`Erros:                          ${erros}`);
  console.log(`Sem região configurada:         ${semRegiao}`);
  console.log();

  // 6. Verificar contagem final por responsável
  console.log("CONTAGEM FINAL POR RESPONSÁVEL:");
  console.log("-".repeat(60));

  for (const responsavelId of Array.from(todosResponsaveisIds)) {
    const carga = await contarProcessosPorResponsavel(supabase, responsavelId);
    console.log(`   ${nomeUsuario.get(responsavelId)?.padEnd(20)} (ID ${responsavelId}): ${carga} processos`);
  }

  console.log();
  console.log("=".repeat(80));
  console.log("FIM DA CORREÇÃO");
  console.log("=".repeat(80));
}

main().catch(console.error);
