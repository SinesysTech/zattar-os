import { TipoVariavel } from '@/types/formsign/template.types';

/**
 * Opção de variável para seleção em combobox
 */
export interface VariableOption {
  value: TipoVariavel;
  label: string;
  category: string;
}

/**
 * Mapeamento de variáveis por categoria
 * - comum: sempre disponível
 * - apps: específico para formulários de apps
 * - trabalhista: específico para formulários trabalhistas
 */
const VARIABLE_MAPPING: Record<string, VariableOption[]> = {
  comum: [
    { value: 'cliente.nome_completo', label: 'Nome Completo', category: 'comum' },
    { value: 'cliente.cpf', label: 'CPF', category: 'comum' },
    { value: 'cliente.rg', label: 'RG', category: 'comum' },
    { value: 'cliente.email', label: 'E-mail', category: 'comum' },
    { value: 'cliente.telefone', label: 'Telefone', category: 'comum' },
    { value: 'cliente.data_nascimento', label: 'Data de Nascimento', category: 'comum' },
    { value: 'cliente.genero', label: 'Gênero', category: 'comum' },
    { value: 'cliente.estado_civil', label: 'Estado Civil', category: 'comum' },
    { value: 'cliente.nacionalidade', label: 'Nacionalidade', category: 'comum' },
    { value: 'cliente.endereco_completo', label: 'Endereço Completo', category: 'comum' },
    { value: 'cliente.endereco_rua', label: 'Rua', category: 'comum' },
    { value: 'cliente.endereco_numero', label: 'Número', category: 'comum' },
    { value: 'cliente.endereco_complemento', label: 'Complemento', category: 'comum' },
    { value: 'cliente.endereco_bairro', label: 'Bairro', category: 'comum' },
    { value: 'cliente.endereco_cidade', label: 'Cidade', category: 'comum' },
    { value: 'cliente.endereco_uf', label: 'UF', category: 'comum' },
    { value: 'cliente.endereco_cep', label: 'CEP', category: 'comum' },
    { value: 'assinatura.assinatura_base64', label: 'Assinatura', category: 'comum' },
    { value: 'assinatura.foto_base64', label: 'Foto', category: 'comum' },
    { value: 'assinatura.latitude', label: 'Latitude', category: 'comum' },
    { value: 'assinatura.longitude', label: 'Longitude', category: 'comum' },
    { value: 'sistema.numero_contrato', label: 'Número do Contrato', category: 'comum' },
    { value: 'sistema.protocolo', label: 'Protocolo', category: 'comum' },
    { value: 'sistema.data_geracao', label: 'Data de Geração', category: 'comum' },
    { value: 'sistema.ip_cliente', label: 'IP do Cliente', category: 'comum' },
    { value: 'sistema.user_agent', label: 'User Agent', category: 'comum' },
    { value: 'sistema.timestamp', label: 'Timestamp', category: 'comum' },
    { value: 'segmento.id', label: 'ID do Segmento', category: 'comum' },
    { value: 'segmento.nome', label: 'Nome do Segmento', category: 'comum' },
    { value: 'segmento.slug', label: 'Slug do Segmento', category: 'comum' },
    { value: 'segmento.descricao', label: 'Descrição do Segmento', category: 'comum' },
  ],
  apps: [
    { value: 'acao.plataforma_id', label: 'ID da Plataforma', category: 'apps' },
    { value: 'acao.plataforma_nome', label: 'Nome da Plataforma', category: 'apps' },
    { value: 'acao.modalidade_id', label: 'ID da Modalidade', category: 'apps' },
    { value: 'acao.modalidade_nome', label: 'Nome da Modalidade', category: 'apps' },
    { value: 'acao.data_inicio_plataforma', label: 'Data de Início na Plataforma', category: 'apps' },
    { value: 'acao.data_bloqueado_plataforma', label: 'Data de Bloqueio na Plataforma', category: 'apps' },
    { value: 'acao.ativo_plataforma', label: 'Ativo na Plataforma', category: 'apps' },
    { value: 'acao.bloqueado_plataforma', label: 'Bloqueado na Plataforma', category: 'apps' },
    { value: 'acao.acidente_trabalho', label: 'Acidente de Trabalho', category: 'apps' },
    { value: 'acao.adoecimento_trabalho', label: 'Adoecimento de Trabalho', category: 'apps' },
    { value: 'acao.anotacao', label: 'Anotação', category: 'apps' },
  ],
  trabalhista: [
    { value: 'acao.nome_empresa_pessoa', label: 'Nome da Empresa/Pessoa', category: 'trabalhista' },
    { value: 'acao.cpf_cnpj_empresa_pessoa', label: 'CPF/CNPJ da Empresa/Pessoa', category: 'trabalhista' },
    { value: 'acao.cep_empresa_pessoa', label: 'CEP da Empresa/Pessoa', category: 'trabalhista' },
    { value: 'acao.logradouro_empresa_pessoa', label: 'Logradouro da Empresa/Pessoa', category: 'trabalhista' },
    { value: 'acao.numero_empresa_pessoa', label: 'Número da Empresa/Pessoa', category: 'trabalhista' },
    { value: 'acao.complemento_empresa_pessoa', label: 'Complemento da Empresa/Pessoa', category: 'trabalhista' },
    { value: 'acao.bairro_empresa_pessoa', label: 'Bairro da Empresa/Pessoa', category: 'trabalhista' },
    { value: 'acao.cidade_empresa_pessoa', label: 'Cidade da Empresa/Pessoa', category: 'trabalhista' },
    { value: 'acao.estado_empresa_pessoa', label: 'Estado da Empresa/Pessoa', category: 'trabalhista' },
    { value: 'acao.data_inicio', label: 'Data de Início', category: 'trabalhista' },
    { value: 'acao.data_rescisao', label: 'Data de Rescisão', category: 'trabalhista' },
    { value: 'acao.observacoes', label: 'Observações', category: 'trabalhista' },
  ],
};

/**
 * Helper para criar VariableOption de forma type-safe
 */
function asVariableOption(value: TipoVariavel, label: string, category: string): VariableOption {
  return { value, label, category };
}

/**
 * Retorna lista filtrada de variáveis disponíveis baseada nos formulários habilitados
 * @param formularios Lista de formulários habilitados (ex: ['apps', 'trabalhista'])
 * @returns Lista de VariableOption ordenada por categoria e label
 */
export function getAvailableVariables(formularios: string[]): VariableOption[] {
  const categories = ['comum']; // Sempre incluir comum

  if (formularios.includes('apps')) {
    categories.push('apps');
  }

  if (formularios.includes('trabalhista')) {
    categories.push('trabalhista');
  }

  const variables: VariableOption[] = [];

  categories.forEach(category => {
    if (VARIABLE_MAPPING[category]) {
      variables.push(...VARIABLE_MAPPING[category]);
    }
  });

  // Ordenar por categoria (comum primeiro, depois apps, trabalhista) e depois por label
  return variables.sort((a, b) => {
    if (a.category !== b.category) {
      const order: Record<string, number> = { comum: 0, apps: 1, trabalhista: 2 };
      return (order[a.category] ?? 99) - (order[b.category] ?? 99);
    }
    return a.label.localeCompare(b.label);
  });
}