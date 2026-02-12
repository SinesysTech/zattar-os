/**
 * Script de debug para reproduzir a falha de inserção do id_pje 3192019
 */
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { createServiceClient } from "@/lib/supabase/service-client";

const supabase = createServiceClient();

async function run() {
  console.log("🚀 Debugging insert for id_pje: 3192019");

  const processoMinimo = {
    id_pje: 3192019,
    advogado_id: 1, // Assumes logic uses existing advogado or safe default?
    // In audiencias.service.ts, advogadoDb.id is used. I'll use 1.
    origem: "acervo_geral",
    trt: "TRT3",
    grau: "primeiro_grau",
    numero_processo: "0010057-12.2026.5.03.0114",
    numero: 10057,
    descricao_orgao_julgador: "",
    classe_judicial: "Não informada",
    segredo_justica: false,
    codigo_status_processo: "",
    prioridade_processual: 0,
    nome_parte_autora: "",
    qtde_parte_autora: 1,
    nome_parte_re: "",
    qtde_parte_re: 1,
    data_autuacao: new Date().toISOString(),
    juizo_digital: false,
    tem_associacao: false,
  };

  console.log("Payload:", JSON.stringify(processoMinimo, null, 2));

  // 1. Try INSERT
  try {
    const { data: inserted, error } = await supabase
      .from("acervo")
      .insert(processoMinimo)
      .select("id, id_pje, trt, grau")
      .single();

    if (error) {
      console.error("❌ INSERT FAILED:", error);
    } else {
      console.log("✅ INSERT SUCCESS:", inserted);
      console.log("Type of inserted.id_pje:", typeof inserted.id_pje);
    }
  } catch (e) {
    console.error("❌ Exception during INSERT:", e);
  }

  // 2. Try SELECT/Check Existence
  console.log("\n🔍 Checking existing record...");
  const { data: found, error: findError } = await supabase
    .from("acervo")
    .select("id, id_pje")
    .eq("id_pje", 3192019)
    .eq("trt", "TRT3")
    .eq("grau", "primeiro_grau");

  if (findError) {
    console.error("❌ FIND FAILED:", findError);
  } else {
    console.log("✅ FIND RESULT:", found);
    if (found && found.length > 0) {
      console.log("Type of found[0].id_pje:", typeof found[0].id_pje);
    } else {
      console.log("⚠️ Not found in DB.");
    }
  }

  // 3. Try SELECT with string ID if needed?
  // Supabase client handles type conversion usually.
}

run();
