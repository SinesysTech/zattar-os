/**
 * Template Types for PDF Generation
 *
 * Types used for template field definitions in PDF generation service.
 * These types match the structure stored in the database JSONB field.
 */

/**
 * Tipo de variável disponível para uso em templates
 */
export type TipoVariavel =
  | "cliente.nome_completo"
  | "cliente.cpf"
  | "cliente.cnpj"
  | "cliente.email"
  | "cliente.telefone"
  | "cliente.data_nascimento"
  | "cliente.endereco_completo"
  | "cliente.endereco_cidade"
  | "cliente.endereco_uf"
  | "cliente.endereco_cep"
  | "segmento.id"
  | "segmento.nome"
  | "segmento.slug"
  | "segmento.descricao"
  | "sistema.protocolo"
  | "sistema.ip_cliente"
  | "sistema.user_agent"
  | "formulario.nome"
  | "formulario.slug"
  | "formulario.id"
  | "acao.data_inicio"
  | "acao.plataforma_nome"
  | "acao.modalidade_nome"
  | "acao.nome_empresa_pessoa"
  | string; // Allow custom variables

/**
 * Posição de um campo no PDF
 */
export interface PosicaoCampo {
  x: number;
  y: number;
  width: number;
  height: number;
  pagina: number;
}

/**
 * Estilo de um campo no PDF
 */
export interface EstiloCampo {
  tamanho_fonte?: number;
  fonte?: string;
  alinhamento?: "left" | "center" | "right";
  cor?: string; // Hex color
  negrito?: boolean;
  italico?: boolean;
}

/**
 * Conteúdo composto para campos de tipo texto_composto
 */
export interface ConteudoComposto {
  template: string; // Template string com variáveis {{variavel}}
  json?: Record<string, unknown>;
}

/**
 * Campo de template PDF
 *
 * Esta estrutura é armazenada como JSONB no banco de dados
 * e usada para renderizar campos dinâmicos em PDFs.
 */
export interface TemplateCampo {
  id: string;
  nome?: string;
  tipo:
    | "texto"
    | "assinatura"
    | "foto"
    | "texto_composto"
    | "data"
    | "cpf"
    | "cnpj";
  variavel?: TipoVariavel;
  posicao?: PosicaoCampo;
  estilo?: EstiloCampo;
  valor_padrao?: string;
  conteudo_composto?: ConteudoComposto;
  obrigatorio?: boolean;
  formato?: string;
  ordem?: number;
}

/**
 * Interface completa do Template (estrutura compatível com DB/JSONB)
 */
export interface Template {
  id: number;
  template_uuid: string;
  nome: string;
  descricao?: string | null;
  tipo_template: "pdf" | "markdown";
  conteudo_markdown?: string | null;
  segmento_id?: number | null;
  pdf_url?: string | null;
  ativo: boolean;
  status: "ativo" | "inativo" | "rascunho";
  versao: number;
  arquivo_original?: string | null;
  arquivo_nome?: string | null;
  arquivo_tamanho?: number | null;
  criado_por?: string | null;
  campos?: string | TemplateCampo[];
  created_at: string;
  updated_at: string;
}
