import { buscarProcessosClientePorCpf } from "@/features/acervo/service";
import { listarContratos } from "@/features/contratos/service";
import { listarAudiencias } from "@/features/audiencias/service";
import { listarAcordos } from "@/features/obrigacoes/service";
import { buscarClientePorDocumento } from "@/features/partes/service";
import { DashboardData } from "./types";

export async function obterDashboardCliente(
  cpf: string
): Promise<DashboardData> {
  const cpfLimpo = cpf.replace(/\D/g, "");

  // 1. Buscar dados do cliente (principalmente ID)
  const clienteResult = await buscarClientePorDocumento(cpfLimpo);
  if (!clienteResult.success || !clienteResult.data) {
    throw new Error("Cliente não encontrado");
  }
  const cliente = clienteResult.data;

  // 2. Buscar Processos (Acervo)
  const processosResponse = await buscarProcessosClientePorCpf(cpfLimpo);
  const processos = processosResponse.success
    ? processosResponse.data.processos
    : [];

  // 3. Buscar Contratos - Requires ID
  const contratosResult = await listarContratos({
    clienteId: cliente.id,
    limite: 100,
  });
  // Verifica se contratosResult.data existe e se tem propriedade data (array) ou contratos (legacy)
  // PaginatedResponse<T> tem .data: T[]
  const contratos =
    contratosResult.success && contratosResult.data
      ? Array.isArray(contratosResult.data.data)
        ? contratosResult.data.data
        : (contratosResult.data as any).contratos || []
      : [];

  // 4. Buscar Audiencias
  const audienciasResult = await listarAudiencias({
    busca: cpfLimpo,
    limite: 100,
  });
  const audiencias =
    audienciasResult.success && audienciasResult.data
      ? Array.isArray(audienciasResult.data.data)
        ? audienciasResult.data.data
        : (audienciasResult.data as any).audiencias || []
      : [];

  // 5. Buscar Pagamentos
  const acordosResult = await listarAcordos({
    busca: cpfLimpo,
    limite: 100,
  } as any);
  const pagamentos = (acordosResult as any)?.acordos || [];

  return {
    cliente: { nome: cliente.nome, cpf: cliente.cpf },
    processos,
    contratos,
    audiencias,
    pagamentos,
  };
}
