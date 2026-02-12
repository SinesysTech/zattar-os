import * as dotenv from "dotenv";
dotenv.config();

import { createServiceClient } from "./src/lib/supabase/service-client";

async function debugUpsert() {
  const supabase = createServiceClient();
  const id_pje = 3204636; // One of the failing IDs
  const trt = "TRT3";
  const grau = "primeiro_grau";
  const numeroProcesso = ""; // Simulate failing to find number
  const numero = 0;

  const payload = {
    id_pje,
    advogado_id: 11254, // Existing lawyer ID from logs
    origem: "acervo_geral",
    trt,
    grau,
    numero_processo: numeroProcesso,
    numero,
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

  console.log("Tentando upsert com payload:", payload);

  const { data, error } = await supabase
    .from("acervo")
    .upsert([payload], {
      onConflict: "acervo_id_pje_trt_grau_numero_processo_key",
      ignoreDuplicates: false,
    })
    .select("id, id_pje");

  if (error) {
    console.error("❌ Erro no upsert:", error);
  } else {
    console.log("✅ Upsert sucesso:", data);
  }
}

debugUpsert();
