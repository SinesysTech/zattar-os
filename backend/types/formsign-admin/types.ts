export interface FormsignTemplate {
  id: number;
  template_uuid: string;
  nome: string;
  descricao?: string | null;
  arquivo_original: string;
  arquivo_nome: string;
  arquivo_tamanho: number;
  status: string;
  versao: number;
  ativo: boolean;
  campos: string;
  conteudo_markdown?: string | null;
  criado_por?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface FormsignTemplateList {
  templates: FormsignTemplate[];
  total: number;
}

export interface ListTemplatesParams {
  search?: string;
  ativo?: boolean;
}

export interface UpsertTemplateInput {
  nome: string;
  arquivo_original: string;
  arquivo_nome: string;
  arquivo_tamanho: number;
  template_uuid?: string;
  descricao?: string | null;
  status?: string;
  versao?: number;
  ativo?: boolean;
  campos?: string;
  conteudo_markdown?: string | null;
  criado_por?: string | null;
}

export interface FormsignSegmento {
  id: number;
  nome: string;
  slug: string;
  descricao?: string | null;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ListSegmentosParams {
  ativo?: boolean;
  search?: string;
}

export interface FormsignSegmentoList {
  segmentos: FormsignSegmento[];
  total: number;
}

export interface UpsertSegmentoInput {
  nome: string;
  slug: string;
  descricao?: string | null;
  ativo?: boolean;
}

export interface FormsignFormulario {
  id: number;
  formulario_uuid: string;
  nome: string;
  slug: string;
  descricao?: string | null;
  segmento_id: number;
  form_schema?: unknown;
  schema_version?: string;
  template_ids?: string[];
  ativo: boolean;
  ordem?: number | null;
  foto_necessaria?: boolean;
  geolocation_necessaria?: boolean;
  metadados_seguranca?: string;
  criado_por?: string | null;
  created_at?: string;
  updated_at?: string;
  segmento?: FormsignSegmento;
}

export interface ListFormulariosParams {
  segmento_id?: number;
  ativo?: boolean;
  search?: string;
}

export interface FormsignFormularioList {
  formularios: FormsignFormulario[];
  total: number;
}

export interface UpsertFormularioInput {
  nome: string;
  slug: string;
  segmento_id: number;
  descricao?: string | null;
  form_schema?: unknown;
  schema_version?: string;
  template_ids?: string[];
  ativo?: boolean;
  ordem?: number | null;
  foto_necessaria?: boolean;
  geolocation_necessaria?: boolean;
  metadados_seguranca?: string;
  criado_por?: string | null;
}

export interface FormsignDashboardStats {
  templatesAtivos: number;
  assinaturasHoje: number;
  totalAssinaturasHoje: number;
  pdfsGeradosHoje: number;
  taxaSucesso: number;
  ultimaAtualizacao: string;
}
