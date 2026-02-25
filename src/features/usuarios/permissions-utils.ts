
import { MATRIZ_PERMISSOES, obterTotalPermissoes as obterTotal } from './types/types';
import type { Permissao, PermissaoMatriz } from './domain';

export { obterTotal as obterTotalPermissoes };

/**
 * Transforma array de permissões em matriz agrupada por recurso
 */
export function formatarPermissoesParaMatriz(
  permissoes: Permissao[]
): PermissaoMatriz[] {
  const recursos = Object.keys(MATRIZ_PERMISSOES).sort((a, b) =>
    formatarNomeRecurso(a).localeCompare(formatarNomeRecurso(b), 'pt-BR')
  );

  return recursos.map((recurso) => {
    const operacoesDoRecurso = MATRIZ_PERMISSOES[recurso as keyof typeof MATRIZ_PERMISSOES];
    const operacoes: { [operacao: string]: boolean } = {};

    operacoesDoRecurso.forEach((operacao) => {
      const permissaoEncontrada = permissoes.find(
        (p) => p.recurso === recurso && p.operacao === operacao
      );
      operacoes[operacao] = permissaoEncontrada?.permitido ?? false;
    });

    return {
      recurso,
      operacoes,
    };
  });
}

/**
 * Transforma matriz de volta para array de permissões
 */
export function formatarMatrizParaPermissoes(
  matriz: PermissaoMatriz[]
): Permissao[] {
  const permissoes: Permissao[] = [];

  matriz.forEach((item) => {
    Object.entries(item.operacoes).forEach(([operacao, permitido]) => {
      if (permitido) {
        permissoes.push({
          recurso: item.recurso,
          operacao,
          permitido: true,
        });
      }
    });
  });

  return permissoes;
}

/**
 * Capitaliza primeira letra de uma string
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Formata nome do recurso para exibição
 */
export function formatarNomeRecurso(recurso: string): string {
  const nomes: Record<string, string> = {
    acervo: 'Acervo',
    acordos_condenacoes: 'Acordos e Condenações',
    advogados: 'Advogados',
    agendamentos: 'Agendamentos',
    assinatura_digital: 'Assinatura Digital',
    assistentes: 'Assistentes',
    audiencias: 'Audiências',
    captura: 'Captura',
    cargos: 'Cargos',
    clientes: 'Clientes',
    comunica_cnj: 'Comunica CNJ',
    conciliacao_bancaria: 'Conciliação Bancária',
    contas_pagar: 'Contas a Pagar',
    contas_receber: 'Contas a Receber',
    contratos: 'Contratos',
    credenciais: 'Credenciais',
    documentos: 'Documentos',
    dre: 'DRE',
    enderecos: 'Endereços',
    expedientes_manuais: 'Expedientes Manuais',
    folhas_pagamento: 'Folhas de Pagamento',
    lancamentos_financeiros: 'Lançamentos Financeiros',
    obrigacoes: 'Obrigações',
    orcamentos: 'Orçamentos',
    pangea: 'Pangea',
    parcelas: 'Parcelas',
    partes_contrarias: 'Partes Contrárias',
    pendentes: 'Pendentes',
    plano_contas: 'Plano de Contas',
    processo_partes: 'Processo Partes',
    representantes: 'Representantes',
    salarios: 'Salários',
    terceiros: 'Terceiros',
    tipos_expedientes: 'Tipos de Expedientes',
    usuarios: 'Usuários',
  };

  return nomes[recurso] || capitalize(recurso.replace(/_/g, ' '));
}

/**
 * Formata nome da operação para exibição
 */
export function formatarNomeOperacao(operacao: string): string {
  const nomes: Record<string, string> = {
    anexar_comprovante: 'Anexar Comprovante',
    aprovar: 'Aprovar',
    associar_processo: 'Associar Processo',
    ativar_desativar: 'Ativar/Desativar',
    atribuir_responsavel: 'Atribuir Responsável',
    baixar_expediente: 'Baixar Expediente',
    cancelar: 'Cancelar',
    capturar: 'Capturar',
    conciliar: 'Conciliar',
    confirmar: 'Confirmar',
    consultar: 'Consultar',
    criar: 'Criar',
    deletar: 'Deletar',
    desassociar_processo: 'Desassociar Processo',
    desatribuir_responsavel: 'Desatribuir Responsável',
    desconciliar: 'Desconciliar',
    editar: 'Editar',
    editar_tipo_descricao: 'Editar Tipo/Descrição',
    editar_url_virtual: 'Editar URL Virtual',
    editar_valores: 'Editar Valores',
    encerrar: 'Encerrar',
    estornar: 'Estornar',
    executar: 'Executar',
    executar_acervo_geral: 'Executar Acervo Geral',
    executar_arquivados: 'Executar Arquivados',
    executar_audiencias: 'Executar Audiências',
    executar_pendentes: 'Executar Pendentes',
    exportar: 'Exportar',
    forcar_sincronizacao: 'Forçar Sincronização',
    gerar_recorrentes: 'Gerar Recorrentes',
    gerenciar_credenciais: 'Gerenciar Credenciais',
    gerenciar_parcelas: 'Gerenciar Parcelas',
    gerenciar_permissoes: 'Gerenciar Permissões',
    importar: 'Importar',
    iniciar_execucao: 'Iniciar Execução',
    listar: 'Listar',
    marcar_como_paga: 'Marcar como Paga',
    marcar_como_recebida: 'Marcar como Recebida',
    pagar: 'Pagar',
    receber: 'Receber',
    receber_pagamento: 'Receber Pagamento',
    registrar_repasse: 'Registrar Repasse',
    reverter_baixa: 'Reverter Baixa',
    sincronizar: 'Sincronizar',
    transferir_responsavel: 'Transferir Responsável',
    verificar_consistencia: 'Verificar Consistência',
    vincular_parte: 'Vincular Parte',
    desvincular_parte: 'Desvincular Parte',
    visualizar: 'Visualizar',
    visualizar_historico: 'Visualizar Histórico',
    visualizar_todos: 'Visualizar Todos',
  };

  return nomes[operacao] || capitalize(operacao.replace(/_/g, ' '));
}

/**
 * Conta total de permissões ativas
 */
export function contarPermissoesAtivas(matriz: PermissaoMatriz[]): number {
  return matriz.reduce((total, item) => {
    const ativas = Object.values(item.operacoes).filter(Boolean).length;
    return total + ativas;
  }, 0);
}

/**
 * Verifica se houve mudança entre duas matrizes
 */
export function detectarMudancas(
  matrizOriginal: PermissaoMatriz[],
  matrizAtual: PermissaoMatriz[]
): boolean {
  if (matrizOriginal.length !== matrizAtual.length) return true;

  return matrizOriginal.some((itemOriginal, index) => {
    const itemAtual = matrizAtual[index];
    if (itemOriginal.recurso !== itemAtual.recurso) return true;

    const operacoesOriginais = Object.entries(itemOriginal.operacoes);

    return operacoesOriginais.some(([operacao, valor]) => {
      return itemAtual.operacoes[operacao] !== valor;
    });
  });
}
