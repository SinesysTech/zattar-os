import { buscarProcessosClientePorCpf } from "@/features/acervo/service";
import { listarContratos } from "@/features/contratos/service";
import { listarAudiencias } from "@/features/audiencias/service";
import { listarAcordos } from "@/features/obrigacoes/service";
import { buscarClientePorCpf } from "@/features/partes/service";
import { DashboardData } from "./types";

export async function obterDashboardCliente(
  cpf: string
): Promise<DashboardData> {
  const cpfLimpo = cpf.replace(/\D/g, "");

  // 1. Buscar dados do cliente (principalmente ID)
  // We need the ID for other services
  const cliente = await buscarClientePorCpf(cpfLimpo);
  if (!cliente) {
    throw new Error("Cliente não encontrado");
  }

  // 2. Buscar Processos (Acervo) - CPF based
  // Note: acervo service handles the search by CPF directly and returns formatted 'View Model'
  const processosResponse = await buscarProcessosClientePorCpf(cpfLimpo);
  const processos = processosResponse.success
    ? processosResponse.data.processos
    : [];

  // 3. Buscar Contratos - Requires ID
  const contratosResult = await listarContratos({
    clienteId: cliente.id,
    limite: 100,
  });
  const contratos = contratosResult.success
    ? contratosResult.data.contratos
    : [];

  // 4. Buscar Audiencias
  // Assuming 'busca' works as filter for text search, we pass CPF.
  // Ideally filtering by Process IDs or Client ID is better if supported.
  const audienciasResult = await listarAudiencias({
    busca: cpfLimpo,
    limite: 100,
  });
  const audiencias = audienciasResult.success
    ? audienciasResult.data.audiencias
    : [];

  // 5. Buscar Pagamentos (Acordos) - Requires known param
  // Using 'any' cast to pass clienteId as discussed in plan strategy
  const acordosResult = await listarAcordos({
    clienteId: cliente.id,
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
