import { buscarProcessosClientePorCpf } from "@/features/acervo/service";
import { listarContratosPorClienteId } from "@/features/contratos/service";
import { listarAudienciasPorBuscaCpf } from "@/features/audiencias/service";
import { listarAcordosPorBuscaCpf } from "@/features/obrigacoes/service";
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
  const processos = (processosResponse.success && processosResponse.data?.processos)
    ? processosResponse.data.processos
    : [];

  // 3. Buscar Contratos, Audiencias e Pagamentos usando helpers
  let contratos, audiencias, pagamentos;
  const errors: Record<string, string> = {};

  try {
    [contratos, audiencias, pagamentos] = await Promise.all([
      listarContratosPorClienteId(cliente.id).catch(e => {
        const errorMsg = e instanceof Error ? e.message : String(e);
        console.error('[Portal] Erro ao buscar contratos:', errorMsg);
        errors.contratos = errorMsg || 'Erro ao carregar contratos';
        return [];
      }),
      listarAudienciasPorBuscaCpf(cpfLimpo).catch(e => {
        const errorMsg = e instanceof Error ? e.message : String(e);
        console.error('[Portal] Erro ao buscar audiências:', errorMsg);
        errors.audiencias = errorMsg || 'Erro ao carregar audiências';
        return [];
      }),
      listarAcordosPorBuscaCpf(cpfLimpo).catch(e => {
        const errorMsg = e instanceof Error ? e.message : String(e);
        console.error('[Portal] Erro ao buscar pagamentos:', errorMsg);
        errors.pagamentos = errorMsg || 'Erro ao carregar pagamentos';
        return [];
      }),
    ]);
  } catch (e) {
    console.error('[Portal] Erro ao buscar dados complementares:', e);
    contratos = [];
    audiencias = [];
    pagamentos = [];
  }

  return {
    cliente: { nome: cliente.nome, cpf: cliente.cpf || cpfLimpo },
    processos,
    contratos,
    audiencias,
    pagamentos,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  };
}
