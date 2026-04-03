// Script de teste para captura de Audiências via API HTTP
// Simula requisições externas/front-end fazendo POST para todos os TRTs

// Carregar variáveis de ambiente do .env.local
import { config } from "dotenv";
import { resolve, join, dirname } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
config(); // Carregar .env também se existir

import type { CodigoTRT } from "@/app/(authenticated)/captura";
import { writeFile, mkdir } from "fs/promises";
import { fileURLToPath } from "url";

/**
 * Obter __dirname em módulos ES
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Diretório de resultados
 */
const RESULTS_DIR = join(__dirname, "results", "api-audiencias");

/**
 * API Base URL
 */
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";
const SERVICE_API_KEY = process.env.SERVICE_API_KEY || "";

/**
 * Valores fixos (simulam requisição externa/front-end)
 */
const ADVOGADO_ID = 1; // ID do advogado na tabela advogados

/**
 * Calcular datas: hoje até o mesmo dia do ano que vem
 */
function calcularDatas(): { dataInicio: string; dataFim: string } {
  const hoje = new Date();
  const anoQueVem = new Date(hoje);
  anoQueVem.setFullYear(hoje.getFullYear() + 1);

  // Formatar como YYYY-MM-DD
  const formatarData = (data: Date): string => {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
  };

  return {
    dataInicio: formatarData(hoje),
    dataFim: formatarData(anoQueVem),
  };
}

const { dataInicio, dataFim } = calcularDatas();

/**
 * Lista de TRTs que apresentaram erro no teste anterior
 * Testando apenas estes TRTs em ambos os graus para verificar se o erro persiste
 */
const TRTS_COM_ERRO: CodigoTRT[] = ["TRT3"];

/**
 * Graus para testar (primeiro grau primeiro, depois segundo grau)
 */
const GRAUS: Array<"primeiro_grau" | "segundo_grau"> = [
  "primeiro_grau",
  "segundo_grau",
];

/**
 * Função para fazer requisição HTTP para um TRT específico
 */
async function testarAudienciasTRT(
  trtCodigo: CodigoTRT,
  grau: "primeiro_grau" | "segundo_grau",
  dataInicio?: string,
  dataFim?: string,
) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  try {
    console.log(`\n🚀 Testando API HTTP - Audiências - ${trtCodigo}\n`);

    // Validar SERVICE_API_KEY
    if (!SERVICE_API_KEY) {
      throw new Error(
        "SERVICE_API_KEY não configurada. Defina a variável de ambiente SERVICE_API_KEY.",
      );
    }

    // Preparar body da requisição
    const body: Record<string, unknown> = {
      advogado_id: ADVOGADO_ID,
      trt_codigo: trtCodigo,
      grau,
    };

    // Adicionar datas se fornecidas
    if (dataInicio) body.dataInicio = dataInicio;
    if (dataFim) body.dataFim = dataFim;

    // Fazer requisição HTTP para a API
    const inicio = Date.now();
    const response = await fetch(`${API_BASE_URL}/api/captura/trt/audiencias`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-service-api-key": SERVICE_API_KEY,
      },
      body: JSON.stringify(body),
    });

    const duracao = ((Date.now() - inicio) / 1000).toFixed(2);

    // Validar resposta
    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error", raw: "Could not parse JSON" }));
      console.error(
        "❌ API Error Details:",
        JSON.stringify(errorData, null, 2),
      );
      throw new Error(
        `API Error ${response.status}: ${errorData.error || response.statusText}`,
      );
    }

    const resultado = await response.json();

    // Mostrar resultados
    console.log(`✅ ${trtCodigo} - API respondeu com sucesso!`);
    console.log(`⏱️  Duração: ${duracao} segundos`);
    console.log(`📊 Total de audiências: ${resultado.data?.total || 0}`);

    if (resultado.data?.dataInicio && resultado.data?.dataFim) {
      console.log(
        `📅 Período: ${resultado.data.dataInicio} até ${resultado.data.dataFim}`,
      );
    }

    if (resultado.data?.persistencia) {
      console.log(
        `  - Persistência: ${resultado.data.persistencia.total} processados, ${resultado.data.persistencia.atualizados} atualizados, ${resultado.data.persistencia.erros} erros`,
      );
    }

    // Salvar resultado
    const trtDir = join(RESULTS_DIR, trtCodigo.toLowerCase());
    await mkdir(trtDir, { recursive: true });
    const resultadoPath = join(trtDir, `resultado-${timestamp}.json`);

    const resultadoCompleto = {
      timestamp,
      trtCodigo,
      grau,
      advogadoId: ADVOGADO_ID,
      periodo: dataInicio && dataFim ? { dataInicio, dataFim } : undefined,
      duracaoSegundos: parseFloat(duracao),
      resultado,
    };

    await writeFile(
      resultadoPath,
      JSON.stringify(resultadoCompleto, null, 2),
      "utf-8",
    );

    return {
      sucesso: true,
      trtCodigo,
      resultado,
      duracaoSegundos: parseFloat(duracao),
    };
  } catch (error) {
    console.error(`\n❌ ${trtCodigo} - Erro ao testar API:`);
    if (error instanceof Error) {
      console.error(`  Mensagem: ${error.message}`);
    } else {
      console.error("  Erro desconhecido:", error);
    }
    return {
      sucesso: false,
      trtCodigo,
      erro: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Função principal - testa apenas os TRTs que apresentaram erro, em ambos os graus
 */
async function main() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  console.log(
    "\n🚀 Iniciando testes de API HTTP - Audiências - TRTs com Erro (1º e 2º Grau)\n",
  );
  console.log(`Total de TRTs: ${TRTS_COM_ERRO.length}`);
  console.log(`TRTs: ${TRTS_COM_ERRO.join(", ")}`);
  console.log(`Graus: ${GRAUS.join(" → ")}`);
  console.log(
    `Total de testes: ${TRTS_COM_ERRO.length * GRAUS.length} (${TRTS_COM_ERRO.length} TRTs × ${GRAUS.length} graus)`,
  );
  console.log(`📅 Período: ${dataInicio} até ${dataFim} (1 ano)`);
  console.log(`🔍 Código Situação: M (Marcadas/Designadas)`);
  console.log(`API URL: ${API_BASE_URL}\n`);

  const resultados: Array<{
    trt: CodigoTRT;
    grau: "primeiro_grau" | "segundo_grau";
    sucesso: boolean;
    totalAudiencias?: number;
    duracaoSegundos?: number;
    erro?: string;
  }> = [];

  let contadorTotal = 0;
  const totalTestes = TRTS_COM_ERRO.length * GRAUS.length;

  // Primeiro: todos os TRTs no primeiro grau
  // Depois: todos os TRTs no segundo grau
  for (let g = 0; g < GRAUS.length; g++) {
    const grau = GRAUS[g];

    console.log(`\n${"=".repeat(80)}`);
    console.log(
      `📋 FASE ${g + 1}/${GRAUS.length}: ${grau === "primeiro_grau" ? "1º GRAU" : "2º GRAU"}`,
    );
    console.log(`${"=".repeat(80)}\n`);

    for (let i = 0; i < TRTS_COM_ERRO.length; i++) {
      const trtCodigo = TRTS_COM_ERRO[i];
      contadorTotal++;
      const progresso = `[${contadorTotal}/${totalTestes}]`;

      console.log(`\n${"=".repeat(80)}`);
      console.log(
        `${progresso} Processando ${trtCodigo} - ${grau === "primeiro_grau" ? "1º Grau" : "2º Grau"}`,
      );
      console.log(`${"=".repeat(80)}`);

      // Passar datas explícitas: hoje até o mesmo dia do ano que vem
      const resultado = await testarAudienciasTRT(
        trtCodigo,
        grau,
        dataInicio,
        dataFim,
      );

      resultados.push({
        trt: trtCodigo,
        grau,
        sucesso: resultado.sucesso,
        totalAudiencias: resultado.sucesso
          ? resultado.resultado?.data?.total
          : undefined,
        duracaoSegundos: resultado.duracaoSegundos,
        erro: resultado.erro,
      });

      // Delay entre testes para evitar sobrecarga
      if (contadorTotal < totalTestes) {
        console.log("\n⏳ Aguardando 2 segundos antes do próximo teste...\n");
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  // Salvar resumo geral
  await mkdir(RESULTS_DIR, { recursive: true });
  const resumoPath = join(
    RESULTS_DIR,
    "resumo-geral-trt-com-erro-ambos-graus.json",
  );
  const resumo = {
    timestamp,
    trtsComErro: TRTS_COM_ERRO,
    graus: GRAUS,
    advogadoId: ADVOGADO_ID,
    periodo: {
      dataInicio,
      dataFim,
    },
    codigoSituacao: "M", // Marcadas/Designadas
    totalTRTs: TRTS_COM_ERRO.length,
    totalTestes: totalTestes,
    sucessos: resultados.filter((r) => r.sucesso).length,
    falhas: resultados.filter((r) => !r.sucesso).length,
    totalAudienciasCapturadas: resultados
      .filter((r) => r.sucesso)
      .reduce((sum, r) => sum + (r.totalAudiencias || 0), 0),
    duracaoTotalSegundos: resultados
      .filter((r) => r.sucesso)
      .reduce((sum, r) => sum + (r.duracaoSegundos || 0), 0),
    resultados,
  };

  await writeFile(resumoPath, JSON.stringify(resumo, null, 2), "utf-8");

  // Mostrar resumo final
  console.log(`\n${"=".repeat(80)}`);
  console.log("📊 RESUMO FINAL");
  console.log(`${"=".repeat(80)}`);
  console.log(
    `Total de testes realizados: ${totalTestes} (${TRTS_COM_ERRO.length} TRTs × ${GRAUS.length} graus)`,
  );
  console.log(`✅ Sucessos: ${resumo.sucessos}`);
  console.log(`❌ Falhas: ${resumo.falhas}`);
  console.log(
    `📦 Total de audiências capturadas: ${resumo.totalAudienciasCapturadas}`,
  );
  console.log(
    `⏱️  Duração total: ${(resumo.duracaoTotalSegundos / 60).toFixed(2)} minutos`,
  );
  console.log(`\n💾 Resumo salvo em: ${resumoPath}`);

  // Mostrar resumo por grau
  console.log(`\n📊 Resumo por Grau:`);
  for (const grau of GRAUS) {
    const resultadosGrau = resultados.filter((r) => r.grau === grau);
    const sucessosGrau = resultadosGrau.filter((r) => r.sucesso).length;
    const falhasGrau = resultadosGrau.filter((r) => !r.sucesso).length;
    console.log(
      `  ${grau === "primeiro_grau" ? "1º Grau" : "2º Grau"}: ${sucessosGrau} sucessos, ${falhasGrau} falhas`,
    );
  }

  if (resumo.falhas > 0) {
    console.log(`\n⚠️  Testes com falha:`);
    resultados
      .filter((r) => !r.sucesso)
      .forEach((r) => {
        console.log(
          `  - ${r.trt} (${r.grau === "primeiro_grau" ? "1º" : "2º"} grau): ${r.erro}`,
        );
      });
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main()
    .then(() => {
      console.log("\n✅ Teste concluído com sucesso!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Teste falhou:", error);
      process.exit(1);
    });
}

export { testarAudienciasTRT };
