// Data Transfer Objects (DTOs) and helper interfaces for Assinatura Digital module

import type { ClienteAssinaturaDigital } from './cliente-adapter'; // Assuming cliente-adapter.ts is in the same utils folder

export interface VerificarCPFResponse {
  exists: boolean;
  cliente?: ClienteAssinaturaDigital | null;
  error?: string;
}

export interface SalvarClienteResponse {
  success: boolean;
  cliente_id: number;
  message: string;
}

/**
 * Request payload for salvar-acao API endpoint
 * Estrutura completa baseada no mapeamento do n8n Data Tables
 */
export interface SalvarAcaoRequest {
  // Campos principais
  segmentoId: number;
  segmentoNome: string;
  formularioId: string;
  formularioNome: string;
  clienteId: number;
  clienteNome: string;
  clienteCpf: string;
  
  // Campos TRT (calculados a partir de clienteUf)
  trt_id?: number | null;
  trt_nome?: string | null;
  
  // Campos de operação
  operation?: 'insert' | 'update';
  acaoId?: number;
  
  // Dados aninhados (estrutura específica do formulário)
  dados: {
    // Campos de plataforma (para formulários de apps)
    plataforma_id?: number;
    plataforma_nome?: string;
    modalidade_id?: number;
    modalidade_nome?: string;
    ativo_plataforma?: 'V' | 'F';
    bloqueado_plataforma?: 'V' | 'F';
    data_inicio_plataforma?: string;
    data_bloqueado_plataforma?: string | null;
    
    // Campos de saúde/trabalho
    acidente_trabalho?: 'V' | 'F';
    adoecimento_trabalho?: 'V' | 'F';
    
    // Campo de anotações
    anotacao?: string | null;
    
    // Permite outros campos dinâmicos
    [key: string]: unknown;
  };
}

/**
 * NOTA: Na arquitetura agnóstica:
 * - segmentoId substitui escritorioId (dinâmico, não hardcoded)
 * - formularioId substitui tipoAcao (string - slug ou UUID, não union literal)
 * - clienteUf foi removido (TRT enrichment era específico de jurídico)
 */

export interface SalvarAcaoResponse {
  success: boolean;
  acao_id: number;
  message: string;
}

export interface FinalizarAssinaturaResponse {
  success: boolean;
  assinatura_id: number;
  message: string;
}

/**
 * Interface para dados de visualização de documentos renderizados via PDF (fluxo legado/tradicional)
 *
 * Esta interface será usada apenas para templates **sem** conteúdo Markdown (fluxo tradicional).
 * Templates com `conteudo_markdown` definido usarão `VisualizacaoMarkdownData` para visualização responsiva.
 *
 * **Compatibilidade Retroativa:**
 * Mantida para garantir que templates existentes sem Markdown continuem funcionando normalmente.
 * Não será removida - ambos os fluxos (PDF tradicional e Markdown responsivo) coexistirão no sistema.
 */
export interface VisualizacaoPdfData {
  pdfUrl: string;
  templateId: string;
  geradoEm: string;
  temporario: boolean;
}

/**
 * Interface para dados de visualização de documentos renderizados via Markdown (fluxo responsivo)
 *
 * Esta interface armazena dados de visualização de documentos renderizados via **Markdown**,
 * oferecendo uma alternativa responsiva ao PDF tradicional.
 *
 * **Interpolação de Variáveis:**
 * O campo `conteudoMarkdown` contém o Markdown **já processado** - todas as variáveis no formato
 * `{{...}}` foram substituídas pelos valores reais do cliente/ação. Por exemplo:
 * - `{{cliente.nome_completo}}` → "João Silva"
 * - `{{cliente.cpf}}` → "123.456.789-00"
 * - `{{sistema.data_geracao}}` → "14/10/2025"
 *
 * **Uso no Formulário:**
 * - Usado na etapa 3 do formulário quando o template possui `conteudo_markdown` definido
 * - Armazenado no Zustand store (`formularioStore.ts`) para permitir navegação entre etapas sem reprocessamento
 * - Complementa (não substitui) `VisualizacaoPdfData` - o sistema decide qual usar baseado na presença
 *   de `template.conteudo_markdown`
 *
 * **Diferenças em relação a `VisualizacaoPdfData`:**
 * - **Sem campo `temporario`**: Conteúdo Markdown é gerado instantaneamente no cliente e não requer
 *   armazenamento temporário em storage (ao contrário de PDFs preview). Não há URLs com TTL.
 * - **Sem campo `pdfUrl`**: O conteúdo é renderizado diretamente no navegador via componente Markdown,
 *   não requer download ou visualização de arquivo.
 */
export interface VisualizacaoMarkdownData {
  /** Conteúdo Markdown já processado com todas as variáveis substituídas por valores reais */
  conteudoMarkdown: string;
  /** ID do template usado para gerar esta visualização */
  templateId: string;
  /** Timestamp ISO 8601 de quando o conteúdo foi gerado/processado */
  geradoEm: string;
}

export interface GerarPdfPreviewRequest {
  templateId: string;
  clienteId: number;
  acaoId: number;
  fotoBase64?: string; // Opcional - foto é capturada após visualização
  incluirAssinatura: boolean;
}

export interface GerarPdfPreviewResponse {
  success: boolean;
  pdfUrl?: string;
  message: string;
}