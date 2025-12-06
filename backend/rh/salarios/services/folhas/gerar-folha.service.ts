/**
 * Serviço de geração de folha de pagamento
 * Cria uma nova folha consolidando todos os salários vigentes do período
 */

import {
  criarFolhaPagamento,
  criarItemFolha,
  atualizarValorTotalFolha,
  buscarFolhaPorId,
  verificarFolhaExistente,
  deletarFolhaPagamento,
} from '../persistence/folhas-pagamento-persistence.service';
import { buscarSalariosVigentesNoMes } from '../persistence/salarios-persistence.service';
import type {
  GerarFolhaDTO,
  FolhaPagamentoComDetalhes,
  validarPeriodoFolha,
} from '@/backend/types/financeiro/salarios.types';

/**
 * Gera uma nova folha de pagamento para o período especificado
 * @param dados Dados da folha (mês, ano, data de pagamento, observações)
 * @param usuarioId ID do usuário que está gerando a folha
 * @returns Folha de pagamento criada com todos os itens
 */
export const gerarFolhaPagamento = async (
  dados: GerarFolhaDTO,
  usuarioId: number
): Promise<FolhaPagamentoComDetalhes> => {
  // Importar função de validação
  const { validarPeriodoFolha, MESES_LABELS } = await import('@/backend/types/financeiro/salarios.types');

  // 1. Validar período
  const validacao = validarPeriodoFolha(dados.mesReferencia, dados.anoReferencia);
  if (!validacao.valido) {
    throw new Error(validacao.erro || 'Período inválido');
  }

  // 2. Verificar se já existe folha para o período
  const existe = await verificarFolhaExistente(dados.mesReferencia, dados.anoReferencia);
  if (existe) {
    const mesNome = MESES_LABELS[dados.mesReferencia] || dados.mesReferencia;
    throw new Error(`Já existe uma folha de pagamento para ${mesNome}/${dados.anoReferencia}`);
  }

  // 3. Buscar salários vigentes no período
  const salariosVigentes = await buscarSalariosVigentesNoMes(
    dados.mesReferencia,
    dados.anoReferencia
  );

  // 4. Validar que existem salários
  if (salariosVigentes.length === 0) {
    throw new Error(
      'Não há funcionários com salário vigente para este período. ' +
      'Cadastre salários antes de gerar a folha de pagamento.'
    );
  }

  // 5. Validar data de pagamento se fornecida
  if (dados.dataPagamento) {
    const primeiroDia = new Date(dados.anoReferencia, dados.mesReferencia - 1, 1);
    const dataPagamento = new Date(dados.dataPagamento);

    if (dataPagamento < primeiroDia) {
      throw new Error('Data de pagamento não pode ser anterior ao mês de referência');
    }
  }

  // 6. Criar a folha de pagamento (status = rascunho)
  let folha;
  try {
    folha = await criarFolhaPagamento(
      {
        mesReferencia: dados.mesReferencia,
        anoReferencia: dados.anoReferencia,
        dataPagamento: dados.dataPagamento,
        observacoes: dados.observacoes,
      },
      usuarioId
    );
  } catch (error) {
    throw new Error(`Erro ao criar folha: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }

  // 7. Criar itens para cada salário vigente
  const erros: Array<{ usuarioId: number; nome: string; erro: string }> = [];

  for (const salario of salariosVigentes) {
    try {
      await criarItemFolha(
        folha.id,
        salario.usuarioId,
        salario.id,
        salario.salarioBruto,
        undefined // Sem observações individuais por enquanto
      );
    } catch (error) {
      erros.push({
        usuarioId: salario.usuarioId,
        nome: salario.usuario?.nomeExibicao || `Usuário ${salario.usuarioId}`,
        erro: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }

  // 8. Se houve erros em todos os itens, cancelar a folha
  if (erros.length === salariosVigentes.length) {
    // Rollback - deletar a folha criada
    try {
      await deletarFolhaPagamento(folha.id);
    } catch {
      // Ignorar erro de rollback
    }
    throw new Error(
      `Não foi possível adicionar nenhum funcionário à folha. Erros: ${erros.map(e => `${e.nome}: ${e.erro}`).join('; ')}`
    );
  }

  // 9. Atualizar valor total da folha
  await atualizarValorTotalFolha(folha.id);

  // 10. Buscar folha completa com itens
  const folhaCompleta = await buscarFolhaPorId(folha.id);

  if (!folhaCompleta) {
    throw new Error('Folha criada mas não encontrada');
  }

  // 11. Log de avisos se houve erros parciais
  if (erros.length > 0) {
    console.warn(
      `Folha ${folha.id} gerada com ${erros.length} erros parciais:`,
      erros
    );
  }

  return folhaCompleta;
};

/**
 * Pré-visualização de geração de folha (não cria a folha, apenas retorna os dados)
 * Útil para mostrar preview antes de confirmar
 */
export const previewGerarFolha = async (
  mesReferencia: number,
  anoReferencia: number
): Promise<{
  salariosVigentes: Array<{
    usuarioId: number;
    nomeExibicao: string;
    cargo?: string;
    salarioBruto: number;
  }>;
  valorTotal: number;
  totalFuncionarios: number;
  periodoLabel: string;
}> => {
  const { validarPeriodoFolha, MESES_LABELS } = await import('@/backend/types/financeiro/salarios.types');

  // Validar período
  const validacao = validarPeriodoFolha(mesReferencia, anoReferencia);
  if (!validacao.valido) {
    throw new Error(validacao.erro || 'Período inválido');
  }

  // Verificar se já existe folha
  const existe = await verificarFolhaExistente(mesReferencia, anoReferencia);
  if (existe) {
    throw new Error(`Já existe uma folha de pagamento para ${MESES_LABELS[mesReferencia]}/${anoReferencia}`);
  }

  // Buscar salários vigentes
  const salariosVigentes = await buscarSalariosVigentesNoMes(mesReferencia, anoReferencia);

  const valorTotal = salariosVigentes.reduce((acc, s) => acc + s.salarioBruto, 0);

  return {
    salariosVigentes: salariosVigentes.map(s => ({
      usuarioId: s.usuarioId,
      nomeExibicao: s.usuario?.nomeExibicao || `Usuário ${s.usuarioId}`,
      cargo: s.usuario?.cargo || s.cargo?.nome,
      salarioBruto: s.salarioBruto,
    })),
    valorTotal,
    totalFuncionarios: salariosVigentes.length,
    periodoLabel: `${MESES_LABELS[mesReferencia]}/${anoReferencia}`,
  };
};
