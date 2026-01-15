import { ProcessoRespostaIA } from "@/features/acervo/domain";
import { Contrato } from "@/features/contratos/domain";
import { Audiencia } from "@/features/audiencias/domain";
import { AcordoComParcelas } from "@/features/obrigacoes/types";

// Alias types for usage in Portal Cliente to abstract source
export type ProcessoPortal = ProcessoRespostaIA;
export type ContratoPortal = Contrato;
export type AudienciaPortal = Audiencia;
export type PagamentoPortal = AcordoComParcelas;

export interface DashboardData {
  cliente: { nome: string; cpf: string };
  processos: ProcessoPortal[];
  contratos: ContratoPortal[];
  audiencias: AudienciaPortal[];
  pagamentos: PagamentoPortal[];
}
