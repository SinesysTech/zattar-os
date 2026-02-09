import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

// Carregar variáveis de ambiente
config({ path: ".env.local" });
config(); // Fallback para .env

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Variáveis de ambiente ausentes");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Processos informados pela Tamiris
const numerosProcessos = [
  "0010049-34.2026.5.03.0179",
  "0010032-59.2026.5.03.0094",
  "0010056-24.2026.5.03.0018",
  "0010055-51.2026.5.03.0014",
  "0010058-82.2026.5.03.0021",
  "0000075-40.2026.5.13.0002",
  "0000094-18.2026.5.21.0004",
  "1000106-59.2026.5.02.0710",
];

async function main() {
  console.log("=".repeat(100));
  console.log("VERIFICAÇÃO: Processos e Audiências informados pela Tamiris");
  console.log("=".repeat(100));
  console.log();

  // 1. Buscar processos no acervo
  console.log("1. VERIFICANDO PROCESSOS NO ACERVO");
  console.log("-".repeat(80));

  const { data: processos, error: erroProcessos } = await supabase
    .from("acervo")
    .select("id, numero_processo, trt, grau, responsavel_id, origem")
    .in("numero_processo", numerosProcessos);

  if (erroProcessos) {
    console.error("Erro:", erroProcessos.message);
    return;
  }

  const processosEncontrados = new Set(processos?.map((p) => p.numero_processo) || []);

  console.log();
  for (const num of numerosProcessos) {
    if (processosEncontrados.has(num)) {
      const proc = processos?.find((p) => p.numero_processo === num);
      console.log(`✓ ${num} - Cadastrado (ID: ${proc?.id}, Resp: ${proc?.responsavel_id || "N/A"})`);
    } else {
      console.log(`❌ ${num} - NÃO CADASTRADO NO ACERVO`);
    }
  }

  console.log();

  // 2. Buscar audiências
  console.log("2. VERIFICANDO AUDIÊNCIAS");
  console.log("-".repeat(80));

  const { data: audiencias, error: erroAudiencias } = await supabase
    .from("audiencias")
    .select("id, numero_processo, data_inicio, status, responsavel_id, tipo_audiencia_id")
    .in("numero_processo", numerosProcessos)
    .order("data_inicio", { ascending: true });

  if (erroAudiencias) {
    console.error("Erro:", erroAudiencias.message);
    return;
  }

  const processosComAudiencia = new Set(audiencias?.map((a) => a.numero_processo) || []);

  console.log();
  for (const num of numerosProcessos) {
    const audsDoProcesso = audiencias?.filter((a) => a.numero_processo === num) || [];
    if (audsDoProcesso.length > 0) {
      console.log(`✓ ${num} - ${audsDoProcesso.length} audiência(s):`);
      for (const aud of audsDoProcesso) {
        const dt = new Date(aud.data_inicio);
        console.log(`    - ${dt.toLocaleDateString("pt-BR")} ${dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} | Status: ${aud.status || "N/A"}`);
      }
    } else {
      console.log(`❌ ${num} - NENHUMA AUDIÊNCIA CADASTRADA`);
    }
  }

  console.log();

  // 3. Resumo
  console.log("=".repeat(100));
  console.log("RESUMO");
  console.log("=".repeat(100));
  console.log();
  console.log(`Total de processos verificados:    ${numerosProcessos.length}`);
  console.log(`Cadastrados no acervo:             ${processosEncontrados.size}`);
  console.log(`NÃO cadastrados no acervo:         ${numerosProcessos.length - processosEncontrados.size}`);
  console.log(`Com audiências cadastradas:        ${processosComAudiencia.size}`);
  console.log(`SEM audiências cadastradas:        ${numerosProcessos.length - processosComAudiencia.size}`);

  // Listar os não cadastrados
  const naoCadastrados = numerosProcessos.filter((n) => !processosEncontrados.has(n));
  if (naoCadastrados.length > 0) {
    console.log();
    console.log("PROCESSOS NÃO CADASTRADOS NO ACERVO:");
    for (const n of naoCadastrados) {
      console.log(`   - ${n}`);
    }
  }

  const semAudiencia = numerosProcessos.filter((n) => !processosComAudiencia.has(n));
  if (semAudiencia.length > 0) {
    console.log();
    console.log("PROCESSOS SEM AUDIÊNCIAS:");
    for (const n of semAudiencia) {
      console.log(`   - ${n}`);
    }
  }

  console.log();
}

main().catch(console.error);
