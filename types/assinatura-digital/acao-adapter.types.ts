/**
 * Adaptador de tipos para Acao (específico do domínio jurídico do Assinatura Digital).
 *
 * Estes tipos são necessários apenas para compatibilidade com templates existentes
 * do Assinatura Digital. O Sinesys não possui conceito de "Acao" nativo, pois é multi-domínio.
 *
 * Em versões futuras, o sistema de variáveis de template pode se tornar mais dinâmico,
 * tornando estes tipos obsoletos.
 */

/**
 * Status possíveis para uma ação.
 */
export enum StatusAcao {
  CADASTRO_INCOMPLETO = 'cadastro_incompleto',
  AGUARDANDO_ASSINATURA = 'aguardando_assinatura',
  ASSINADO = 'assinado',
  EM_ELABORACAO = 'em_elaboracao',
  CONCLUIDO = 'concluido',
}

/**
 * Interface genérica para dados de ação/processo.
 * Usada para compatibilidade com templates que podem ter campos dinâmicos.
 */
export interface AcaoFormsign {
  id: number;
  tipo_acao?: string;
  tipo_acao_id?: number;
  // Campos dinâmicos (podem variar por domínio)
  [key: string]: unknown;
}

/**
 * @deprecated - Específico do domínio jurídico do Assinatura Digital.
 * Mantido apenas para compatibilidade com templates existentes.
 * Representação backend para ações de marketplace de aplicativos.
 */
export interface AcaoApps {
  id: number;
  tipo_acao: string;
  tipo_acao_id: number;
  cliente_id: number;
  cliente_nome?: string;
  cliente_cpf?: string;
  escritorio_id: number;
  escritorio_nome?: string;
  trt_id?: number | null;
  trt_nome?: string | null;
  plataforma_id: number;
  plataforma_nome: string;
  modalidade_id: number;
  modalidade_nome: string;
  ativo_plataforma: 'V' | 'F';
  bloqueado_plataforma: 'V' | 'F';
  data_inicio_plataforma: string;
  data_bloqueado_plataforma: string | null;
  acidente_trabalho: 'V' | 'F';
  adoecimento_trabalho: 'V' | 'F';
  anotacao: string | null;
  status: StatusAcao;
  created_at: string;
  updated_at: string;
}

/**
 * @deprecated - Específico do domínio jurídico do Assinatura Digital.
 * Mantido apenas para compatibilidade com templates existentes.
 * Representação backend para ações trabalhistas.
 */
export interface AcaoTrabalhista {
  id: number;
  tipo_acao: string;
  tipo_acao_id: number;
  cliente_id: number;
  escritorio_id: number;
  nome_empresa_pessoa: string;
  cpf_cnpj_empresa_pessoa: string | null;
  cep_empresa_pessoa: string;
  logradouro_empresa_pessoa: string;
  numero_empresa_pessoa: string;
  complemento_empresa_pessoa: string | null;
  bairro_empresa_pessoa: string;
  cidade_empresa_pessoa: string;
  estado_empresa_pessoa: string;
  estado_empresa_pessoa_txt?: string;
  data_inicio: string;
  data_rescisao: string | null;
  observacoes: string | null;
  status: StatusAcao;
  created_at: string;
  updated_at: string;
}

/**
 * Union type para todas as variações de Acao suportadas.
 */
export type Acao = AcaoApps | AcaoTrabalhista | AcaoFormsign;