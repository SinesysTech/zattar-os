/**
 * Tipos para o módulo de Recursos Humanos
 *
 * Este arquivo re-exporta tipos do domain.ts para manter compatibilidade
 * com imports que usam '../types'
 */

export type {
  // Salários
  Salario,
  SalarioComDetalhes,
  CriarSalarioDTO,
  AtualizarSalarioDTO,
  ListarSalariosParams,
  ListarSalariosResponse,

  // Folhas de Pagamento
  FolhaPagamento,
  FolhaPagamentoComDetalhes,
  ItemFolhaPagamento as ItemFolha,
  ItemFolhaComDetalhes,
  GerarFolhaDTO,
  AprovarFolhaDTO,
  PagarFolhaDTO,
  ListarFolhasParams,
  ListarFolhasResponse,

  // Status e Enums
  StatusFolhaPagamento,
  FormaPagamentoFolha,

  // Resumos
  UsuarioResumo,
  CargoResumo,
  ContaContabilResumo,
  CentroCustoResumo,
  ContaBancariaResumo,
  LancamentoFinanceiroResumo,

  // Totais
  TotaisFolhasPorStatus,
} from './domain';

