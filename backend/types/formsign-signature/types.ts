export interface PreviewPayload {
  cliente_id: number;
  acao_id: number;
  template_id: string;
  foto_base64?: string | null;
  request_id?: string | null;
}

export interface FinalizePayload {
  cliente_id: number;
  acao_id: number;
  template_id: string;
  segmento_id: number;
  segmento_nome?: string;
  formulario_id: number;
  assinatura_base64: string;
  foto_base64?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  geolocation_accuracy?: number | null;
  geolocation_timestamp?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  sessao_id?: string | null;
  request_id?: string | null;
}

export interface FinalizeResult {
  assinatura_id: number;
  protocolo: string;
  pdf_url: string;
}

export interface PreviewResult {
  pdf_url: string;
}

export interface ListSessoesParams {
  segmento_id?: number;
  formulario_id?: number;
  status?: string;
  data_inicio?: string;
  data_fim?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface SessaoAssinaturaRecord {
  id: number;
  acao_id: number | null;
  sessao_uuid: string;
  status: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  device_info?: Record<string, unknown> | null;
  geolocation?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
  expires_at?: string | null;
}

export interface ListSessoesResult {
  sessoes: SessaoAssinaturaRecord[];
  total: number;
  page: number;
  pageSize: number;
}
