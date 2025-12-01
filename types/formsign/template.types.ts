/**
 * Tipos TypeScript para o Sistema de Templates e Geração de PDF
 * Arquivo: template.types.ts
 */

import { ClienteFormsign } from './cliente-adapter.types';
import { Acao, AcaoApps, AcaoTrabalhista } from './acao-adapter.types';
import { DynamicFormSchema } from './form-schema.types';
import { Segmento } from './segmento.types';

// Interface para detalhes de erro estruturados
export interface DetalhesErro {
  stack?: string;
  code?: string;
  context?: Record<string, unknown>;
  campo?: string;
  valor?: unknown;
}

// Tipos de campo disponíveis para mapeamento
export type TipoCampo =
  | 'texto'           // Texto simples
  | 'cpf'            // CPF formatado
  | 'cnpj'           // CNPJ formatado
  | 'data'           // Data formatada
  | 'telefone'       // Telefone formatado
  | 'endereco'       // Endereço completo
  | 'assinatura'     // Imagem da assinatura
  | 'foto'           // Foto do cliente
  | 'sistema'        // Campos gerados pelo sistema
  | 'segmento'       // Dados do segmento/área de negócio
  | 'texto_composto'; // Texto rico com variáveis intercaladas

// Status possíveis para um template
export type StatusTemplate = 'ativo' | 'inativo' | 'rascunho';

/**
 * Tipos de metadados de segurança disponíveis para captura
 *
 * Define os valores permitidos para configuração de metadados que devem ser
 * capturados automaticamente durante o processo de assinatura digital.
 */
export type MetadadoSeguranca = 'ip' | 'user_agent' | 'device_info';

/**
 * Array de metadados de segurança permitidos
 *
 * Constante utilizada para validação de valores em runtime.
 * Deve ser mantida sincronizada com o tipo MetadadoSeguranca.
 */
export const ALLOWED_METADATA: MetadadoSeguranca[] = ['ip', 'user_agent', 'device_info'];

/**
 * Tipo de variável disponível para mapeamento
 *
 * NOTA: Estes são exemplos de variáveis disponíveis no sistema.
 * Algumas variáveis (como acao.plataforma_id, acao.modalidade_id) são específicas
 * do domínio jurídico mas mantidas como exemplos de variáveis comuns.
 * Em versões futuras, este tipo pode se tornar mais genérico ou dinâmico.
 */
export type TipoVariavel =
  // Dados do Cliente
  | 'cliente.nome_completo'
  | 'cliente.cpf'
  | 'cliente.rg'
  | 'cliente.email'
  | 'cliente.telefone'
  | 'cliente.data_nascimento'
  | 'cliente.genero'
  | 'cliente.estado_civil'
  | 'cliente.nacionalidade'
  | 'cliente.endereco_completo'
  | 'cliente.endereco_rua'
  | 'cliente.endereco_numero'
  | 'cliente.endereco_complemento'
  | 'cliente.endereco_bairro'
  | 'cliente.endereco_cidade'
  | 'cliente.endereco_uf'
  | 'cliente.endereco_cep'
  // Dados da Ação Apps
  | 'acao.plataforma_id'
  | 'acao.plataforma_nome'
  | 'acao.modalidade_id'
  | 'acao.modalidade_nome'
  | 'acao.data_inicio_plataforma'
  | 'acao.data_bloqueado_plataforma'
  | 'acao.ativo_plataforma'
  | 'acao.bloqueado_plataforma'
  | 'acao.acidente_trabalho'
  | 'acao.adoecimento_trabalho'
  | 'acao.anotacao'
  // Dados da Ação Trabalhista
  | 'acao.nome_empresa_pessoa'
  | 'acao.cpf_cnpj_empresa_pessoa'
  | 'acao.cep_empresa_pessoa'
  | 'acao.logradouro_empresa_pessoa'
  | 'acao.numero_empresa_pessoa'
  | 'acao.complemento_empresa_pessoa'
  | 'acao.bairro_empresa_pessoa'
  | 'acao.cidade_empresa_pessoa'
  | 'acao.estado_empresa_pessoa'
  | 'acao.data_inicio'
  | 'acao.data_rescisao'
  | 'acao.observacoes'
  // Dados da Assinatura
  | 'assinatura.assinatura_base64'
  | 'assinatura.foto_base64'
  /** Coordenada de latitude GPS capturada durante a assinatura. Formato: número decimal entre -90 e 90. */
  | 'assinatura.latitude'
  /** Coordenada de longitude GPS capturada durante a assinatura. Formato: número decimal entre -180 e 180. */
  | 'assinatura.longitude'
  // Dados do Sistema
  | 'sistema.numero_contrato'
  | 'sistema.protocolo'
  /** Data de geração do documento em formato extenso brasileiro (ex: "16 de outubro de 2025"). Ideal para contratos e documentos formais. */
  | 'sistema.data_geracao'
  | 'sistema.ip_cliente'
  /** Informações do navegador e sistema operacional do cliente (User-Agent header). Útil para auditoria e rastreabilidade. */
  | 'sistema.user_agent'
  /** Carimbo de data/hora da geração do documento (ex: "16/10/2025 às 14:30:45"). Inclui horário exato para fins de auditoria. */
  | 'sistema.timestamp'
  // Dados do Segmento
  /** ID numérico do segmento no n8n Data Tables. Útil para integrações e relatórios. */
  | 'segmento.id'
  /** Nome do segmento/área de negócio (ex: 'Jurídico', 'RH', 'Vendas'). */
  | 'segmento.nome'
  /** Slug único do segmento no formato kebab-case (ex: 'juridico-sp'). */
  | 'segmento.slug'
  /** Descrição opcional do segmento. Pode ser null ou undefined. */
  | 'segmento.descricao';

// Posição de um campo no PDF (coordenadas)
export interface PosicaoCampo {
  x: number;          // Posição X no PDF
  y: number;          // Posição Y no PDF
  width: number;      // Largura do campo
  height: number;     // Altura do campo
  pagina: number;     // Número da página (1-indexed)
}

// Configuração de estilo para um campo
export interface EstiloCampo {
  fonte?: string;         // Nome da fonte
  tamanho_fonte?: number; // Tamanho da fonte
  cor?: string;          // Cor em hex (#000000)
  negrito?: boolean;     // Texto em negrito
  italico?: boolean;     // Texto em itálico
  alinhamento?: 'left' | 'center' | 'right'; // Alinhamento
}

// Conteúdo de um campo composto (texto rico com variáveis)
// IMPORTANTE: Este objeto deve ser persistido completo no backend (n8n Data Tables)
// O campo `json` armazena o estado do editor Tiptap para edição futura
// O campo `template` contém a string processada com {{variavel}} para geração de PDF
export interface ConteudoComposto {
  json: Record<string, unknown>; // JSON do editor Tiptap - pode conter nodes 'mention' (legado) ou 'variable' (novo)
  template: string;              // String com placeholders {{variavel}} - formato compatível com ambas implementações
}

// Definição de um campo mapeado no template
export interface TemplateCampo {
  id: string;                    // ID único do campo (normalizado para string pelo n8nService, mesmo que backend retorne number)
  template_id: string;           // ID do template pai
  nome: string;                  // Nome descritivo do campo
  variavel?: TipoVariavel;       // Variável que será mapeada (opcional para texto_composto - usa conteudo_composto)
  tipo: TipoCampo;              // Tipo do campo
  posicao: PosicaoCampo;        // Posição no PDF
  estilo?: EstiloCampo;         // Configurações de estilo
  obrigatorio: boolean;         // Campo obrigatório
  formato?: string;             // Formato específico (ex: dd/MM/yyyy para datas)
  valor_padrao?: string;        // Valor padrão se variável vazia
  ordem?: number;               // Ordem de exibição do campo (1, 2, 3...)
  condicional?: {               // Condições para exibir o campo
    variavel: TipoVariavel;
    operador: '=' | '!=' | '>' | '<' | 'contains';
    valor: string;
  };
  conteudo_composto?: ConteudoComposto; // Conteúdo de campo composto (apenas para tipo 'texto_composto')
  criado_em: Date;
  atualizado_em: Date;
}

/**
 * Definição de um template PDF
 *
 * Templates são agnósticos e reutilizáveis:
 * - Não pertencem diretamente a segmentos ou formulários
 * - Relação N:N gerenciada via FormularioEntity.template_ids
 * - `campos: TemplateCampo[]` mapeia variáveis → posições no PDF
 * - Templates definem APENAS o que será renderizado no documento final
 * - Configurações de fluxo (captura de foto, geolocalização, metadados)
 *   são responsabilidade da entidade Formulário
 */
export interface Template {
  id: string;                   // ID único do template (sempre string)
  template_uuid?: string;       // UUID do template (opcional)
  nome: string;                 // Nome descritivo
  descricao?: string;           // Descrição do template
  arquivo_original: string;     // URL/caminho do arquivo PDF original
  arquivo_nome: string;         // Nome original do arquivo
  arquivo_tamanho: number;      // Tamanho do arquivo em bytes
  status: StatusTemplate;       // Status atual
  versao: number;              // Versão do template
  ativo: boolean;              // Template ativo/inativo
  campos: TemplateCampo[];     // Campos mapeados (variáveis → placeholders do PDF)
  /**
   * Conteúdo completo do documento em formato Markdown (opcional)
   *
   * Campo opcional usado para templates que preferem renderização Markdown responsiva
   * ao invés de PDF tradicional. Quando presente e não vazio, o sistema renderizará
   * o documento usando este conteúdo Markdown na etapa de visualização.
   *
   * **Suporte a Variáveis:**
   * - Suporta placeholders no formato `{{variavel}}` (ex: `{{cliente.nome_completo}}`, `{{acao.plataforma_nome}}`)
   * - As variáveis são substituídas automaticamente durante a renderização usando o mesmo
   *   sistema de interpolação do `ConteudoComposto`
   * - Todas as variáveis disponíveis estão definidas no tipo `TipoVariavel` deste arquivo
   *
   * **Compatibilidade Retroativa:**
   * - Templates sem este campo continuam usando o fluxo tradicional de PDF com campos
   *   mapeados via `TemplateCampo[]`
   * - O PDF final ainda é gerado após a assinatura, mesmo para templates Markdown (para arquivo legal)
   *
   * **Nullability:**
   * - Aceita `string` (conteúdo Markdown válido), `null` (explicitamente sem Markdown), ou `undefined` (campo ausente)
   * - Essa tipagem garante compatibilidade com respostas do n8n que podem retornar `null` para campos nullable
   *
   * **Exemplo de uso:**
   * ```markdown
   * # Contrato de Prestação de Serviços
   *
   * Contratante: **{{cliente.nome_completo}}**
   * CPF: {{cliente.cpf}}
   * Data: {{sistema.data_geracao}}
   *
   * ## Cláusula 1
   * O contratante, residente em {{cliente.endereco_completo}}, contrata os serviços...
   * ```
   */
  conteudo_markdown?: string | null;
  createdAt?: string;          // Timestamp do n8n (ISO string)
  updatedAt?: string;          // Timestamp do n8n (ISO string)
  criado_por?: string;         // Usuário que criou
}

/**
 * IMPORTANTE - IDs são sempre strings:
 * O n8n Data Tables retorna IDs como integers, mas o n8nService converte automaticamente
 * para string para evitar bugs de comparação. Toda a aplicação assume IDs como strings.
 */
// Dados para geração de PDF
export interface DadosGeracao {
  template_id: string;
  cliente: Partial<ClienteFormsign>;
  acao: Partial<Acao>;
  assinatura: {
    assinatura_base64: string;
    /** Foto em base64. Obrigatório apenas se template.foto_necessaria = true. */
    foto_base64?: string;
    /** Coordenada de latitude GPS. Formato: número decimal entre -90 e 90. Disponível apenas se template.geolocation_necessaria = true. */
    latitude?: number;
    /** Coordenada de longitude GPS. Formato: número decimal entre -180 e 180. Disponível apenas se template.geolocation_necessaria = true. */
    longitude?: number;
    /** Precisão da geolocalização em metros. Disponível apenas se template.geolocation_necessaria = true. */
    geolocation_accuracy?: number;
    /** Timestamp ISO 8601 da captura de geolocalização. Disponível apenas se template.geolocation_necessaria = true. */
    geolocation_timestamp?: string;
  };
  sistema: {
    numero_contrato?: string;
    protocolo?: string;
    data_geracao: string;
    ip_cliente?: string;
    /** User-Agent do navegador do cliente. Informações sobre navegador e sistema operacional. */
    user_agent?: string;
    timestamp: string;
  };
  /**
   * Dados do segmento/área de negócio.
   *
   * Substitui o conceito de 'escritorio' na arquitetura agnóstica.
   * Permite que o sistema seja usado por diferentes domínios de negócio.
   *
   * Reutiliza o tipo Segmento para garantir consistência com a definição completa.
   * Os campos 'slug' e 'descricao' são tornados opcionais via Partial para manter compatibilidade
   * com o contrato atual onde nem sempre estão disponíveis.
   *
   * @example
   * // Segmento Jurídico
   * segmento: { id: 1, nome: 'Jurídico SP', slug: 'juridico-sp', descricao: 'Escritório de advocacia' }
   *
   * // Segmento RH
   * segmento: { id: 2, nome: 'Recursos Humanos', slug: 'rh', descricao: 'Departamento de RH' }
   */
  segmento: Pick<Segmento, 'id' | 'nome'> & Partial<Pick<Segmento, 'slug' | 'descricao'>>;
}

// Resultado da geração de PDF
export interface ResultadoGeracao {
  sucesso: boolean;
  arquivo_url?: string;        // URL do arquivo gerado
  arquivo_nome?: string;       // Nome do arquivo gerado
  template_usado: string;      // ID do template utilizado
  dados_processados: number;   // Quantidade de campos processados
  tempo_geracao: number;       // Tempo em milissegundos
  erro?: string;              // Mensagem de erro se falhou
  detalhes_erro?: DetalhesErro;        // Detalhes técnicos do erro
  /**
   * Número de campos de texto composto que excederam a altura disponível e tiveram linhas cortadas
   */
  campos_cortados?: number;
  /**
   * Lista de variáveis no formato {{variavel}} que não foram encontradas nos dados fornecidos
   */
  variaveis_nao_encontradas?: string[];
  /**
   * Avisos não-críticos sobre a geração do PDF que podem indicar problemas de formatação
   */
  avisos?: string[];
}

// Configuração de storage para arquivos
export interface ConfigStorage {
  tipo: 'local' | 's3' | 'azure' | 'gcp';
  configuracao: Record<string, unknown>;
}

// Estatísticas de uso dos templates
export interface EstatisticasTemplate {
  template_id: string;
  total_geracoes: number;
  ultima_geracao: Date;
  tempo_medio_geracao: number;
  taxa_sucesso: number;
  erros_comuns: {
    erro: string;
    quantidade: number;
  }[];
}

// Request para API de geração
export interface RequestGerarPdf {
  template_id: string;
  dados: DadosGeracao;
  opcoes?: {
    nome_arquivo?: string;
    formato_data?: string;
    incluir_timestamp?: boolean;
    qualidade_imagem?: 'baixa' | 'media' | 'alta';
  };
}

// Response da API de geração
export interface ResponseGerarPdf {
  sucesso: boolean;
  resultado?: ResultadoGeracao;
  erro?: {
    codigo: string;
    mensagem: string;
    detalhes?: DetalhesErro;
  };
}

// Response da API de preview de teste
export interface ApiPreviewTestResponse {
  success: boolean;
  arquivo_url?: string;
  arquivo_nome?: string;
  is_preview?: boolean;
  dados_processados?: number;
  tempo_geracao?: number;
  avisos?: string[];
  error?: string;
  detalhes?: string | DetalhesErro;
}

// Validação de template
export interface ValidacaoTemplate {
  template_id: string;
  valido: boolean;
  erros: {
    campo?: string;
    tipo: 'erro' | 'aviso';
    mensagem: string;
    sugestao?: string;
  }[];
  avisos: string[];
}

// Log de operações
export interface LogOperacao {
  id: string;
  tipo: 'upload' | 'geracao' | 'edicao' | 'exclusao';
  template_id?: string;
  usuario?: string;
  detalhes: Record<string, unknown>;
  sucesso: boolean;
  tempo_execucao: number;
  erro?: string;
  timestamp: Date;
}

// Histórico de alterações de templates
export interface TemplateHistorico {
  id: string;
  template_id: string;
  versao: number;
  alteracoes: Record<string, { antes: unknown; depois: unknown }>;
  alterado_por?: string;
  criado_em: Date | string;
}