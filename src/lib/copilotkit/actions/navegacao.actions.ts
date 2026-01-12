'use client';

/**
 * CopilotKit Actions - Navegação
 *
 * Ações para navegação entre páginas do sistema
 */

import { useCopilotAction } from '@copilotkit/react-core';
import { useRouter } from 'next/navigation';

import type { ModuloSistema } from './types';

/**
 * Hook para registrar ações de navegação
 */
export function useNavegacaoActions() {
  const router = useRouter();

  // Mapeamento de módulos para rotas
  const rotasModulos: Record<ModuloSistema, string> = {
    dashboard: '/dashboard',
    processos: '/processos',
    audiencias: '/audiencias/semana',
    expedientes: '/expedientes/lista',
    'acordos-condenacoes': '/acordos-condenacoes/lista',
    contratos: '/contratos',
    assistentes: '/assistentes',
    clientes: '/partes/clientes',
    usuarios: '/usuarios',
    captura: '/captura/historico',
    financeiro: '/financeiro/plano-contas',
    rh: '/rh/salarios',
  };

  // Ação: Navegar para página
  useCopilotAction({
    name: 'navegarPara',
    description:
      'Navega para uma página específica do sistema Sinesys. Use para ir a módulos como processos, audiências, expedientes, dashboard, etc.',
    parameters: [
      {
        name: 'pagina',
        type: 'string',
        description:
          'Módulo/página de destino: dashboard, processos, audiencias, expedientes, acordos-condenacoes, contratos, assistentes, clientes, usuarios, captura, financeiro, rh',
        required: true,
      },
      {
        name: 'id',
        type: 'number',
        description: 'ID do registro específico para ver detalhes (opcional)',
        required: false,
      },
    ],
    handler: async ({ pagina, id }: { pagina: string; id?: number }) => {
      const modulo = pagina.toLowerCase() as ModuloSistema;
      const rotaBase = rotasModulos[modulo];

      if (!rotaBase) {
        return `Página "${pagina}" não encontrada. Páginas disponíveis: ${Object.keys(rotasModulos).join(', ')}`;
      }

      // Se tem ID, navega para detalhes
      if (id) {
        // Ajusta rota para detalhes baseado no módulo
        const rotaDetalhes = modulo === 'audiencias' || modulo === 'expedientes'
          ? `/${modulo.replace('-', '/')}/${id}`
          : `/${modulo}/${id}`;
        router.push(rotaDetalhes);
        return `Navegando para detalhes de ${modulo} #${id}`;
      }

      router.push(rotaBase);
      return `Navegando para ${modulo}`;
    },
  });

  // Ação: Mudar visualização de período
  useCopilotAction({
    name: 'mudarVisualizacaoPeriodo',
    description:
      'Altera a visualização de audiências, expedientes ou acordos entre semana, mês, ano ou lista',
    parameters: [
      {
        name: 'modulo',
        type: 'string',
        description: 'Módulo: audiencias, expedientes ou acordos-condenacoes',
        required: true,
      },
      {
        name: 'visualizacao',
        type: 'string',
        description: 'Tipo de visualização: semana, mes, ano ou lista',
        required: true,
      },
    ],
    handler: async ({
      modulo,
      visualizacao,
    }: {
      modulo: string;
      visualizacao: string;
    }) => {
      const modulosPermitidos = ['audiencias', 'expedientes', 'acordos-condenacoes'];
      const visualizacoesPermitidas = ['semana', 'mes', 'ano', 'lista'];

      if (!modulosPermitidos.includes(modulo)) {
        return `Módulo "${modulo}" não suporta visualização por período. Use: ${modulosPermitidos.join(', ')}`;
      }

      if (!visualizacoesPermitidas.includes(visualizacao)) {
        return `Visualização "${visualizacao}" inválida. Use: ${visualizacoesPermitidas.join(', ')}`;
      }

      router.push(`/${modulo}/${visualizacao}`);
      return `Alterando visualização de ${modulo} para ${visualizacao}`;
    },
  });

  // Ação: Voltar para página anterior
  useCopilotAction({
    name: 'voltarPagina',
    description: 'Volta para a página anterior no histórico de navegação',
    parameters: [],
    handler: async () => {
      router.back();
      return 'Voltando para página anterior';
    },
  });

  // Ação: Ir para o Dashboard
  useCopilotAction({
    name: 'irParaDashboard',
    description: 'Navega diretamente para o dashboard principal',
    parameters: [],
    handler: async () => {
      router.push('/dashboard');
      return 'Navegando para o dashboard';
    },
  });
}
