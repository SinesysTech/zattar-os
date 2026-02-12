import * as dotenv from "dotenv";
dotenv.config();

import { createServiceClient } from "./src/lib/supabase/service-client";

async function checkConstraints() {
  const supabase = createServiceClient();

  console.log("Fetching indexes for acervo...");

  // Method 1: Query pg_indexes (needs raw SQL or rpc, which service client can do if rpc exposed,
  // but we can try to inspect via error message or just try standard names)

  // Method 2: Actually, Supabase JS client doesn't expose metadata easily without rpc.
  // Let's try to infer from error message? The previous error said "constraint ... does not exist".

  // Let's try to query a known unique row and see if we can trigger a constraint violation error that names the constraint?
  // But we want UPSERT to work.

  // Let's try to just SELECT * limit 1 and look at the structure? No.

  // Let's assume standard supabase naming: <table>_<col>_key for single, <table>_<col1>_<col2>_key for composite.
  // We tried acervo_id_pje_trt_grau_numero_processo_key.
  // Maybe it's `acervo_id_pje_trt_grau_numero_processo_idx`?
  // Or maybe valid unique constraints are only created if explicitly named?

  // Let's try to find the constraint name by looking at `04_acervo.sql` again.
  // It says: `unique (id_pje, trt, grau, numero_processo)`.
  // It does NOT name it. Postgres auto-names it.

  // Let's try to force an error that reveals the constraint name.
  // We can try to INSERT a duplicate and catch the error.

  try {
    const payload = {
      id_pje: 123456,
      advogado_id: 11254,
      origem: "acervo_geral",
      trt: "TRT3",
      grau: "primeiro_grau",
      numero_processo: "0000000-00.2026.5.03.0000",
      numero: 0,
      descricao_orgao_julgador: "TESTE",
      classe_judicial: "TESTE",
      segredo_justica: false,
      codigo_status_processo: "",
      prioridade_processual: 0,
      nome_parte_autora: "TESTE",
      qtde_parte_autora: 1,
      nome_parte_re: "TESTE",
      qtde_parte_re: 1,
      data_autuacao: new Date().toISOString(),
      juizo_digital: false,
      tem_associacao: false,
    };

    // Insert once
    await supabase.from("acervo").insert(payload);

    // Insert again to fail
    await supabase.from("acervo").insert(payload);
  } catch (e) {
    console.log("Error object:", e);
  }
}

checkConstraints();
