// Store Zustand para gerenciamento de estado do formulário multi-step
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { ClienteAssinaturaDigital } from '@/types/assinatura-digital/cliente-adapter.types';
import type { VisualizacaoPdfData, VisualizacaoMarkdownData } from '@/types/assinatura-digital/formulario.types';
import type { DynamicFormSchema } from '@/types/assinatura-digital/form-schema.types';
import type { Template, MetadadoSeguranca } from '@/types/assinatura-digital/template.types';
import type { DeviceFingerprintData } from '@/backend/types/assinatura-digital/types';
import { DEFAULT_TOTAL_STEPS } from '@/lib/assinatura-digital/constants';

export interface DadosCPF {
  cpf: string;
  clienteExistente: boolean;
  clienteId?: number;
  dadosCliente?: ClienteAssinaturaDigital;
}

/**
 * Dados pessoais do cliente armazenados no store.
 *
 * Todos os campos usam snake_case para compatibilidade com API/n8n.
 */
export interface DadosPessoaisStore {
  cliente_id: number;
  nome_completo: string;
  cpf: string;
  rg?: string;
  data_nascimento: string;
  estado_civil: string;
  genero: string;
  nacionalidade: string;
  email: string;
  celular: string;
  telefone?: string;
  endereco_cep: string;
  endereco_logradouro: string;
  endereco_numero: string;
  endereco_complemento?: string;
  endereco_bairro: string;
  endereco_cidade: string;
  endereco_uf: string;
}

export interface DadosAcaoStore {
  acao_id: number;
  [key: string]: unknown;
}

/**
 * Comment 7: assinatura_id pode ser null quando n8n falha ao salvar metadados
 * mas o PDF é gerado com sucesso (sucesso parcial).
 */
export interface DadosAssinaturaStore {
  assinatura_id: number | null;
  assinatura_base64: string;
  foto_base64: string;
  ip_address: string;
  user_agent: string;
  latitude?: number;
  longitude?: number;
  geolocation_accuracy?: number;
  geolocation_timestamp?: string;
  data_assinatura: string;
  /**
   * Dados brutos de fingerprint do dispositivo coletados no momento da assinatura.
   * Opcional - pode ser null se a coleta falhar ou estiver desabilitada.
   * Usado para auditoria e conformidade legal (MP 2.200-2/2001).
   */
  dispositivo_fingerprint_raw?: DeviceFingerprintData | null;
}

/**
 * Comment 7: assinatura_id pode ser null quando n8n falha ao salvar metadados
 */
export interface PdfGerado {
  template_id: string;
  pdf_url: string;
  protocolo: string;
  assinatura_id: number | null;
}

export interface StepConfig {
  id: string;              // Identificador único da etapa (ex: 'cpf', 'foto', 'geolocation')
  index: number;           // Índice sequencial (0, 1, 2...)
  component: string;       // Nome do componente a renderizar
  required: boolean;       // Se a etapa é obrigatória
  enabled: boolean;        // Se a etapa está habilitada no fluxo atual
}

/**
 * Configuração de controle de fluxo do formulário
 * Define quais etapas são obrigatórias durante o preenchimento
 */
export interface FormularioFlowConfig {
  foto_necessaria?: boolean;
  geolocation_necessaria?: boolean;
  metadados_seguranca?: MetadadoSeguranca[];
}

interface FormularioState {
  // Dados do contexto
  segmentoId: number | null;
  formularioId: number | null;
  templateIds: string[] | null;
  templateIdSelecionado: string | null;

  /**
   * UUID da sessão de assinatura para agrupar múltiplas assinaturas do mesmo formulário.
   * Gerado automaticamente em hydrateContext() usando uuidv4().
   * Todas as assinaturas (templates) da mesma sessão compartilham este ID.
   * Formato: UUID v4 (exemplo: "a1b2c3d4-e5f6-7890-abcd-ef1234567890")
   */
  sessaoId: string | null;

  // Cache de dados do formulário e segmento
  formSchema: DynamicFormSchema | null;
  formularioNome: string | null;
  segmentoNome: string | null;

  /**
   * Configuração de controle de fluxo do formulário
   * Define quais etapas são obrigatórias (captura de foto, geolocalização, metadados)
   */
  formularioFlowConfig: FormularioFlowConfig | null;

  /**
   * Cache de templates fetched para evitar múltiplas chamadas à API.
   * Comment 3: Armazena templates por ID para reutilização entre FormularioContainer e componentes de visualização.
   * Estrutura: Map<templateId, Template>
   */
  cachedTemplates: Map<string, Template>;

  // Etapa atual (0: CPF, 1: Dados Pessoais, 2: Ação, 3: Termos de Aceite, 4: Foto, 5: Visualização PDF, 6: Assinatura, 7: Sucesso)
  etapaAtual: number;

  // Dados das etapas
  dadosCPF: DadosCPF | null;

  dadosPessoais: DadosPessoaisStore | null;
  dadosAcao: DadosAcaoStore | null;

  /**
   * Dados de visualização em PDF (tradicional).
   * Usado quando o template possui apenas PDF configurado.
   */
  dadosVisualizacaoPdf: VisualizacaoPdfData | null;

  /**
   * Dados de visualização em Markdown (alternativa responsiva).
   * Armazenado apenas quando o template possui `conteudo_markdown` definido.
   * Complementa (não substitui) dadosVisualizacaoPdf - o sistema usa um ou outro baseado no template.
   */
  dadosVisualizacaoMarkdown: VisualizacaoMarkdownData | null;

  dadosAssinatura: DadosAssinaturaStore | null;

  /**
   * Array com todos os PDFs gerados para o formulário.
   * Cada template associado ao formulário gera um PDF separado.
   */
  pdfsGerados: PdfGerado[] | null;

  // Dados temporários para navegação entre etapas de assinatura
  fotoBase64: string | null;
  assinaturaBase64: string | null;
  latitude: number | null;
  longitude: number | null;
  geolocationAccuracy: number | null;
  geolocationTimestamp: string | null;

  termosAceite: boolean | null;
  termosVersao: string | null;
  termosDataAceite: string | null;

  // Configuração dinâmica de etapas
  stepConfigs: StepConfig[] | null;

  /**
   * URL do PDF final gerado após assinatura.
   * Persiste além do ciclo de vida do componente para evitar regeneração desnecessária.
   * Resetado apenas em resetAll() quando usuário inicia novo formulário.
   */
  pdfUrlFinal: string | null;

  // Loading states
  isLoading: boolean;
  isSubmitting: boolean;

  // Actions
  setContexto: (segmentoId: number, formularioId: number) => void;
  hydrateContext: (ctx: { segmentoId: number; formularioId: number; templateIds?: string[]; formularioNome?: string; segmentoNome?: string; formSchema?: DynamicFormSchema; flowConfig?: FormularioFlowConfig }) => void;
  setTemplateIds: (templateIds: string[]) => void;
  setTemplateIdSelecionado: (templateId: string) => void;
  setSessaoId: (sessaoId: string) => void;
  setFormSchema: (schema: DynamicFormSchema | null) => void;
  setFormularioFlowConfig: (config: FormularioFlowConfig | null) => void;

  // Comment 3: Template caching methods
  getCachedTemplate: (templateId: string) => Template | undefined;
  setCachedTemplate: (templateId: string, template: Template) => void;
  clearTemplateCache: () => void;
  setEtapaAtual: (etapa: number) => void;
  setDadosCPF: (dados: DadosCPF) => void;
  setDadosPessoais: (dados: DadosPessoaisStore) => void;
  setDadosAcao: (dados: DadosAcaoStore) => void;
  setDadosVisualizacaoPdf: (dados: VisualizacaoPdfData | null) => void;
  setDadosVisualizacaoMarkdown: (dados: VisualizacaoMarkdownData | null) => void;
  setDadosAssinatura: (dados: DadosAssinaturaStore) => void;
  setPdfsGerados: (pdfs: PdfGerado[]) => void;
  setFotoBase64: (foto: string) => void;
  setAssinaturaBase64: (assinatura: string) => void;
  setGeolocation: (latitude: number, longitude: number, accuracy: number, timestamp: string) => void;
  clearGeolocation: () => void;
  setTermosAceite: (aceite: boolean, versao: string, dataAceite: string) => void;
  clearTermosAceite: () => void;
  setStepConfigs: (configs: StepConfig[]) => void;
  getStepByIndex: (index: number) => StepConfig | undefined;
  getTotalSteps: () => number;
  getCurrentStepConfig: () => StepConfig | undefined;
  setPdfUrlFinal: (url: string | null) => void;
  setLoading: (loading: boolean) => void;
  setSubmitting: (submitting: boolean) => void;
  resetFormulario: () => void;
  resetAll: () => void;
  proximaEtapa: () => void;
  etapaAnterior: () => void;
}

export const useFormularioStore = create<FormularioState>((set, get) => ({
  // Estado inicial
  segmentoId: null,
  formularioId: null,
  templateIds: null,
  templateIdSelecionado: null,
  sessaoId: null,
  formSchema: null,
  formularioNome: null,
  segmentoNome: null,
  formularioFlowConfig: null,
  cachedTemplates: new Map<string, Template>(),
  etapaAtual: 0,
  dadosCPF: null,
  dadosPessoais: null,
  dadosAcao: null,
  dadosVisualizacaoPdf: null,
  dadosVisualizacaoMarkdown: null,
  dadosAssinatura: null,
  pdfsGerados: null,
  fotoBase64: null,
  assinaturaBase64: null,
  latitude: null,
  longitude: null,
  geolocationAccuracy: null,
  geolocationTimestamp: null,
  termosAceite: null,
  termosVersao: null,
  termosDataAceite: null,
  stepConfigs: null,
  pdfUrlFinal: null,
  isLoading: false,
  isSubmitting: false,

  // Actions
  // Define apenas o contexto (segmento e formulário) sem resetar o estado.
  // O reset é responsabilidade do componente FormularioPage que chama resetFormulario()
  // antes de setContexto() para garantir estado limpo em cada navegação de rota.
  // NOTA: segmentoId e formularioId substituem escritorioId e tipoAcao na arquitetura agnóstica.
  setContexto: (segmentoId, formularioId) => set({ segmentoId, formularioId }),

  // Combina reset e contexto em uma única atualização atômica para evitar estados intermediários
  hydrateContext: (ctx) => {
    const currentSessaoId = get().sessaoId;
    set({
      etapaAtual: 0,
      dadosCPF: null,
      dadosPessoais: null,
      dadosAcao: null,
      dadosVisualizacaoPdf: null,
      dadosVisualizacaoMarkdown: null,
      dadosAssinatura: null,
      pdfsGerados: null,
      fotoBase64: null,
      assinaturaBase64: null,
      latitude: null,
      longitude: null,
      geolocationAccuracy: null,
      geolocationTimestamp: null,
      termosAceite: null,
      termosVersao: null,
      termosDataAceite: null,
      stepConfigs: null,
      pdfUrlFinal: null, // Clear PDF URL on context hydration
      isLoading: false,
      isSubmitting: false,
      segmentoId: ctx.segmentoId,
      formularioId: ctx.formularioId,
      sessaoId: currentSessaoId ?? uuidv4(), // Gerar UUID único somente quando sessaoId for null
      templateIds: ctx.templateIds || null,
      templateIdSelecionado: ctx.templateIds && ctx.templateIds.length === 1 ? ctx.templateIds[0] : null,
      formularioNome: ctx.formularioNome || null,
      segmentoNome: ctx.segmentoNome || null,
      formSchema: ctx.formSchema || null,
      formularioFlowConfig: ctx.flowConfig || null,
    });
  },

  setTemplateIds: (templateIds) => set({ templateIds }),

  setTemplateIdSelecionado: (templateId) => set({
    templateIdSelecionado: templateId,
    dadosVisualizacaoPdf: null,
    dadosVisualizacaoMarkdown: null,
  }),

  setSessaoId: (sessaoId) => set({ sessaoId }),

  setFormSchema: (schema: DynamicFormSchema | null) => set({ formSchema: schema }),

  setFormularioFlowConfig: (config: FormularioFlowConfig | null) => set({ formularioFlowConfig: config }),

  // Comment 3: Template caching implementation to avoid duplicate fetches
  getCachedTemplate: (templateId: string) => {
    const { cachedTemplates } = get();
    return cachedTemplates.get(templateId);
  },

  setCachedTemplate: (templateId: string, template: Template) => {
    set((state) => {
      const newCache = new Map(state.cachedTemplates);
      newCache.set(templateId, template);
      return { cachedTemplates: newCache };
    });
  },

  clearTemplateCache: () => {
    set({ cachedTemplates: new Map<string, Template>() });
  },

  setEtapaAtual: (etapa) => set({ etapaAtual: etapa }),

  setDadosCPF: (dados) => set({ dadosCPF: dados }),

  setDadosPessoais: (dados) => set({ dadosPessoais: dados }),

  setDadosAcao: (dados) => set({ dadosAcao: dados }),

  setDadosVisualizacaoPdf: (dados) => set(() => ({
    dadosVisualizacaoPdf: dados,
    ...(dados ? { dadosVisualizacaoMarkdown: null } : {}),
  })),

  setDadosVisualizacaoMarkdown: (dados) => set(() => ({
    dadosVisualizacaoMarkdown: dados,
    ...(dados ? { dadosVisualizacaoPdf: null } : {}),
  })),

  setDadosAssinatura: (dados) => set({ dadosAssinatura: dados }),

  setPdfsGerados: (pdfs) => set({ pdfsGerados: pdfs }),

  setFotoBase64: (foto) => set({ fotoBase64: foto }),

  setAssinaturaBase64: (assinatura) => set({ assinaturaBase64: assinatura }),

  setGeolocation: (latitude, longitude, accuracy, timestamp) => set({
    latitude,
    longitude,
    geolocationAccuracy: accuracy,
    geolocationTimestamp: timestamp,
  }),

  clearGeolocation: () => set({
    latitude: null,
    longitude: null,
    geolocationAccuracy: null,
    geolocationTimestamp: null,
  }),

  setTermosAceite: (aceite, versao, dataAceite) => set({
    termosAceite: aceite,
    termosVersao: versao,
    termosDataAceite: dataAceite,
  }),

  clearTermosAceite: () => set({
    termosAceite: null,
    termosVersao: null,
    termosDataAceite: null,
  }),

  setStepConfigs: (configs) => set({ stepConfigs: configs }),

  getStepByIndex: (index) => {
    const { stepConfigs } = get();
    return stepConfigs?.find(s => s.index === index);
  },

  getTotalSteps: () => {
    const { stepConfigs } = get();
    return stepConfigs?.length || DEFAULT_TOTAL_STEPS; // Fallback para 8 etapas (fluxo completo padrão com TermosAceiteStep)
  },

  getCurrentStepConfig: () => {
    const { etapaAtual, stepConfigs } = get();
    return stepConfigs?.find(s => s.index === etapaAtual);
  },

  setPdfUrlFinal: (url) => set({ pdfUrlFinal: url }),

  setLoading: (isLoading) => set({ isLoading }),

  setSubmitting: (isSubmitting) => set({ isSubmitting }),

  resetFormulario: () => set({
    etapaAtual: 0,
    dadosCPF: null,
    dadosPessoais: null,
    dadosAcao: null,
    dadosVisualizacaoPdf: null,
    dadosVisualizacaoMarkdown: null,
    dadosAssinatura: null,
    pdfsGerados: null,
    fotoBase64: null,
    assinaturaBase64: null,
    latitude: null,
    longitude: null,
    geolocationAccuracy: null,
    geolocationTimestamp: null,
    termosAceite: null,
    termosVersao: null,
    termosDataAceite: null,
    stepConfigs: null,
    sessaoId: null,
    formularioFlowConfig: null,
    pdfUrlFinal: null, // Reset PDF URL when resetting form data
    isLoading: false,
    isSubmitting: false,
    // Keep template cache when only resetting form data (allows reuse within same form session)
  }),

  // Reset completo incluindo contexto (segmento, formulário, templates)
  resetAll: () => set({
    segmentoId: null,
    formularioId: null,
    templateIds: null,
    templateIdSelecionado: null,
    sessaoId: null,
    formSchema: null,
    formularioNome: null,
    segmentoNome: null,
    formularioFlowConfig: null,
    cachedTemplates: new Map<string, Template>(), // Clear cache on full reset
    etapaAtual: 0,
    dadosCPF: null,
    dadosPessoais: null,
    dadosAcao: null,
    dadosVisualizacaoPdf: null,
    dadosVisualizacaoMarkdown: null,
    dadosAssinatura: null,
    pdfsGerados: null,
    fotoBase64: null,
    assinaturaBase64: null,
    latitude: null,
    longitude: null,
    geolocationAccuracy: null,
    geolocationTimestamp: null,
    termosAceite: null,
    termosVersao: null,
    termosDataAceite: null,
    stepConfigs: null,
    pdfUrlFinal: null, // Clear final PDF URL on complete reset
    isLoading: false,
    isSubmitting: false,
  }),

  proximaEtapa: () => {
    const { etapaAtual, stepConfigs } = get();
    const totalSteps = stepConfigs?.length || DEFAULT_TOTAL_STEPS;
    if (etapaAtual < totalSteps - 1) {
      set({ etapaAtual: etapaAtual + 1 });
    }
  },

  etapaAnterior: () => {
    const { etapaAtual } = get();
    if (etapaAtual > 0) {
      set({ etapaAtual: etapaAtual - 1 });
    }
  },
}));