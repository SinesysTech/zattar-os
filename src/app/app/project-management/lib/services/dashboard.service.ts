import { type Result } from "@/types/result";
import type {
  DashboardSummary,
  ProjetosPorPeriodo,
  DistribuicaoPorStatus,
  ComparativoAnual,
  MembroAtivo,
} from "../domain";
import * as dashboardRepo from "../repositories/dashboard.repository";

export async function obterResumo(): Promise<Result<DashboardSummary>> {
  return dashboardRepo.getDashboardSummary();
}

export async function obterProjetosPorPeriodo(
  meses?: number
): Promise<Result<ProjetosPorPeriodo[]>> {
  return dashboardRepo.getProjetosPorPeriodo(meses);
}

export async function obterDistribuicaoPorStatus(): Promise<Result<DistribuicaoPorStatus[]>> {
  return dashboardRepo.getDistribuicaoPorStatus();
}

export async function obterComparativoAnual(): Promise<Result<ComparativoAnual[]>> {
  return dashboardRepo.getComparativoAnual();
}

export async function obterMembrosAtivos(limite?: number): Promise<Result<MembroAtivo[]>> {
  return dashboardRepo.getMembrosAtivos(limite);
}
