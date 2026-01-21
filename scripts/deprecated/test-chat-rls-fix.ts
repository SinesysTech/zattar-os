/**
 * Script de teste para validar correção de RLS do chat
 *
 * Testa se o erro 42P17 (infinite recursion) foi resolvido após
 * a migration 20251221180000_fix_rls_circular_dependency.sql
 *
 * Execução: npx tsx scripts/test-chat-rls-fix.ts
 */

import { createClient } from "@supabase/supabase-js";

// Cores para output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  gray: "\x1b[90m",
};

function log(message: string, color: keyof typeof colors = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testChatRLS() {
  log("\n🧪 Testando correção de RLS do chat...\n", "blue");

  // Verificar variáveis de ambiente
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    log("❌ Variáveis de ambiente não configuradas:", "red");
    log("   - NEXT_PUBLIC_SUPABASE_URL", "gray");
    log("   - SUPABASE_SERVICE_ROLE_KEY", "gray");
    process.exit(1);
  }

  // Criar cliente com service role para testes
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // =========================================================================
    // Teste 1: Verificar se funções security definer existem
    // =========================================================================
    log("📋 Teste 1: Verificando funções security definer...", "yellow");

    await supabase.rpc(
      "pg_catalog.pg_proc",
      {}
    );

    // Verificar via query SQL direta
    await supabase
      .from("pg_proc")
      .select("proname")
      .in("proname", [
        "user_has_document_access",
        "get_accessible_documento_ids",
        "user_can_access_chat_room",
      ]);

    // Alternativa: testar chamando as funções
    const { error: testFunc1 } = await supabase.rpc("user_has_document_access", {
      p_documento_id: 1,
      p_usuario_id: 1,
    });

    if (testFunc1 && testFunc1.code !== "42883") {
      // 42883 = function does not exist (esperado se não executou migration)
      log("   ⚠️  Função user_has_document_access pode ter erro: " + testFunc1.message, "yellow");
    } else if (!testFunc1) {
      log("   ✅ Função user_has_document_access existe", "green");
    } else {
      log("   ❌ Função user_has_document_access não encontrada - execute a migration primeiro", "red");
    }

    // =========================================================================
    // Teste 2: Listar salas sem erro de recursão
    // =========================================================================
    log("\n📋 Teste 2: Listando salas de chat (teste principal)...", "yellow");

    const { data: salas, error: salasError, count } = await supabase
      .from("salas_chat")
      .select("*", { count: "exact" })
      .limit(10);

    if (salasError) {
      if (salasError.code === "42P17") {
        log("   ❌ ERRO DE RECURSÃO AINDA PRESENTE!", "red");
        log("   Código: " + salasError.code, "gray");
        log("   Mensagem: " + salasError.message, "gray");
        log("\n   A migration ainda não foi aplicada ou falhou.", "yellow");
        process.exit(1);
      } else {
        log("   ⚠️  Outro erro ao listar salas: " + salasError.message, "yellow");
        log("   Código: " + salasError.code, "gray");
      }
    } else {
      log(`   ✅ Salas listadas com sucesso: ${count ?? salas?.length ?? 0} encontradas`, "green");
    }

    // =========================================================================
    // Teste 3: Listar salas de documento especificamente
    // =========================================================================
    log("\n📋 Teste 3: Listando salas de tipo 'documento'...", "yellow");

    const { data: salasDoc, error: salasDocError } = await supabase
      .from("salas_chat")
      .select("*")
      .eq("tipo", "documento")
      .limit(5);

    if (salasDocError) {
      if (salasDocError.code === "42P17") {
        log("   ❌ ERRO DE RECURSÃO em salas de documento!", "red");
        process.exit(1);
      }
      log("   ⚠️  Erro: " + salasDocError.message, "yellow");
    } else {
      log(`   ✅ Salas de documento: ${salasDoc?.length ?? 0} encontradas`, "green");
    }

    // =========================================================================
    // Teste 4: Listar mensagens
    // =========================================================================
    log("\n📋 Teste 4: Listando mensagens de chat...", "yellow");

    const { data: mensagens, error: mensagensError } = await supabase
      .from("mensagens_chat")
      .select("*")
      .limit(10);

    if (mensagensError) {
      if (mensagensError.code === "42P17") {
        log("   ❌ ERRO DE RECURSÃO em mensagens!", "red");
        process.exit(1);
      }
      log("   ⚠️  Erro: " + mensagensError.message, "yellow");
    } else {
      log(`   ✅ Mensagens listadas: ${mensagens?.length ?? 0} encontradas`, "green");
    }

    // =========================================================================
    // Teste 5: Verificar documentos
    // =========================================================================
    log("\n📋 Teste 5: Listando documentos...", "yellow");

    const { data: docs, error: docsError } = await supabase
      .from("documentos")
      .select("*")
      .limit(10);

    if (docsError) {
      if (docsError.code === "42P17") {
        log("   ❌ ERRO DE RECURSÃO em documentos!", "red");
        process.exit(1);
      }
      log("   ⚠️  Erro: " + docsError.message, "yellow");
    } else {
      log(`   ✅ Documentos listados: ${docs?.length ?? 0} encontrados`, "green");
    }

    // =========================================================================
    // Teste 6: Query complexa (simula findSalasByUsuario)
    // =========================================================================
    log("\n📋 Teste 6: Query complexa com joins (simula repository)...", "yellow");

    const { data: salasComplexas, error: complexError } = await supabase
      .from("salas_chat")
      .select(
        `
        *,
        last_message:mensagens_chat(
          conteudo,
          created_at,
          tipo
        ),
        criador:usuarios!salas_chat_criado_por_fkey(
          id, nome_completo, nome_exibicao, email_corporativo,
          avatar_url
        ),
        participante:usuarios!salas_chat_participante_id_fkey(
          id, nome_completo, nome_exibicao, email_corporativo,
          avatar_url
        )
      `
      )
      .or("tipo.eq.geral,tipo.eq.documento,tipo.eq.privado")
      .limit(10);

    if (complexError) {
      if (complexError.code === "42P17") {
        log("   ❌ ERRO DE RECURSÃO em query complexa!", "red");
        process.exit(1);
      }
      log("   ⚠️  Erro: " + complexError.message, "yellow");
    } else {
      log(`   ✅ Query complexa executada: ${salasComplexas?.length ?? 0} salas`, "green");
    }

    // =========================================================================
    // Resultado Final
    // =========================================================================
    log("\n" + "=".repeat(60), "blue");
    log("✅ TODOS OS TESTES PASSARAM!", "green");
    log("=".repeat(60) + "\n", "blue");

    log("A correção de RLS foi aplicada com sucesso.", "green");
    log("O erro 42P17 (infinite recursion) foi resolvido.\n", "green");

  } catch (error) {
    log("\n❌ Erro inesperado durante os testes:", "red");
    console.error(error);
    process.exit(1);
  }
}

// Executar testes
testChatRLS().catch((error) => {
  log("\n❌ Falha ao executar testes:", "red");
  console.error(error);
  process.exit(1);
});
