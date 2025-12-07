/**
 * Exportação centralizada dos serviços de orçamento
 */

// Gerenciamento de orçamentos
export {
  criarOrcamento,
  atualizarOrcamento,
  excluirOrcamento,
  adicionarItem,
  adicionarItensEmLote,
  atualizarItem,
  excluirItem,
} from './gerenciar-orcamento.service';

// Aprovação de orçamentos
export {
  aprovarOrcamento,
  verificarPodeAprovar,
  rejeitarOrcamento,
} from './aprovar-orcamento.service';

// Execução de orçamentos
export {
  iniciarExecucao,
  encerrarExecucao,
  verificarPodeIniciarExecucao,
  verificarPodeEncerrar,
  obterStatusExecucao,
} from './executar-orcamento.service';

// Relatórios
export {
  gerarRelatorioCompleto,
  gerarRelatorioComparativo,
  gerarRelatorioExecutivo,
  gerarDadosExportacao,
  gerarResumoDashboard,
  type RelatorioCompleto,
  type RelatorioComparativo,
  type RelatorioExecutivo,
} from './relatorios-orcamento.service';
