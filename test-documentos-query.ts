// Test script para verificar a query de documentos
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase configuration");
  process.exit(1);
}

console.log("Supabase URL:", supabaseUrl);
console.log("Using key:", supabaseKey?.substring(0, 20) + "...");

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function testQuery() {
  console.log("\n=== Testing listDocumentos query ===\n");

  // Test 1: Query simples sem relação
  console.log("Test 1: Query simples (sem relação)");
  const { data: data1, error: error1 } = await supabase
    .from("assinatura_digital_documentos")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  if (error1) {
    console.error("Error 1:", error1);
  } else {
    console.log("Success 1: Found", data1?.length, "documents");
  }

  // Test 2: Query com relação usando nome da tabela
  console.log("\nTest 2: Query com relação (nome da tabela)");
  const { data: data2, error: error2 } = await supabase
    .from("assinatura_digital_documentos")
    .select(`
      *,
      assinatura_digital_documento_assinantes(id, status)
    `)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error2) {
    console.error("Error 2:", error2);
  } else {
    console.log("Success 2: Found", data2?.length, "documents");
    if (data2?.[0]) {
      console.log("First doc assinantes:", data2[0].assinatura_digital_documento_assinantes);
    }
  }

  // Test 3: Query com alias (como está no código atual)
  console.log("\nTest 3: Query com alias");
  const { data: data3, error: error3 } = await supabase
    .from("assinatura_digital_documentos")
    .select(`
      *,
      assinantes:assinatura_digital_documento_assinantes(id, status)
    `)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error3) {
    console.error("Error 3:", error3);
  } else {
    console.log("Success 3: Found", data3?.length, "documents");
    if (data3?.[0]) {
      console.log("First doc assinantes:", data3[0].assinantes);
    }
  }

  // Test 4: Query usando foreign key hint
  console.log("\nTest 4: Query com FK hint");
  const { data: data4, error: error4 } = await supabase
    .from("assinatura_digital_documentos")
    .select(`
      *,
      assinantes:assinatura_digital_documento_assinantes!documento_id(id, status)
    `)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error4) {
    console.error("Error 4:", error4);
  } else {
    console.log("Success 4: Found", data4?.length, "documents");
    if (data4?.[0]) {
      console.log("First doc assinantes:", data4[0].assinantes);
    }
  }
}

testQuery()
  .then(() => {
    console.log("\n=== Test completed ===");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
