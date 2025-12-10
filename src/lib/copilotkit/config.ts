/**
 * Configurações do CopilotKit
 *
 * Labels, opções de UI e outras configurações
 */

export const COPILOTKIT_CONFIG = {
  /** URL do runtime endpoint */
  runtimeUrl: '/api/copilotkit',

  /** Labels da UI */
  labels: {
    title: 'Pedrinho',
    placeholder: 'Pergunte algo sobre o processo...',
    initial: 'Olá! Sou o Pedrinho, seu assistente jurídico. Como posso ajudar?',
  },

  /** Configurações da sidebar */
  sidebar: {
    defaultOpen: false,
  },
} as const;
