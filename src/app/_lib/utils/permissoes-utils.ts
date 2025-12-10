/**
 * Utilidades para manipulação de permissões
 */

import type { Permissao, PermissaoMatriz } from '@/app/_lib/types/usuarios';
import { MATRIZ_PERMISSOES } from '@/backend/types/permissoes/types';

/**
 * Transforma array de permissões em matriz agrupada por recurso
 */
export function formatarPermissoesParaMatriz(
  permissoes: Permissao[]
): PermissaoMatriz[] {
  const recursos = Object.keys(MATRIZ_PERMISSOES);

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
    advogados: 'Advogados',
    credenciais: 'Credenciais',
    acervo: 'Acervo',
    audiencias: 'Audiências',
    pendentes: 'Pendentes',
    usuarios: 'Usuários',
    clientes: 'Clientes',
    partes_contrarias: 'Partes Contrárias',
    contratos: 'Contratos',
    agendamentos: 'Agendamentos',
    captura: 'Captura',
    tipos_expedientes: 'Tipos de Expedientes',
    cargos: 'Cargos',
    assistentes: 'Assistentes',
  };

  return nomes[recurso] || capitalize(recurso);
}

/**
 * Formata nome da operação para exibição
 */
export function formatarNomeOperacao(operacao: string): string {
  const nomes: Record<string, string> = {
    listar: 'Listar',
    visualizar: 'Visualizar',
    criar: 'Criar',
    editar: 'Editar',
    deletar: 'Deletar',
    ativar_desativar: 'Ativar/Desativar',
    atribuir_responsavel: 'Atribuir Responsável',
    desatribuir_responsavel: 'Desatribuir Responsável',
    transferir_responsavel: 'Transferir Responsável',
    editar_url_virtual: 'Editar URL Virtual',
    baixar_expediente: 'Baixar Expediente',
    reverter_baixa: 'Reverter Baixa',
    editar_tipo_descricao: 'Editar Tipo/Descrição',
    gerenciar_permissoes: 'Gerenciar Permissões',
    sincronizar: 'Sincronizar',
    associar_processo: 'Associar Processo',
    desassociar_processo: 'Desassociar Processo',
    executar: 'Executar',
    executar_acervo_geral: 'Executar Acervo Geral',
    executar_arquivados: 'Executar Arquivados',
    executar_audiencias: 'Executar Audiências',
    executar_pendentes: 'Executar Pendentes',
    visualizar_historico: 'Visualizar Histórico',
    gerenciar_credenciais: 'Gerenciar Credenciais',
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
