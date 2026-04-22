export type TipoConta = 'corrente' | 'poupanca' | 'pagamento';
export type TipoChavePix = 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria';
export type OrigemDadosBancarios = 'prestacao_contas' | 'cadastro_manual' | 'importacao';

export interface DadosBancariosCliente {
  id: number;
  clienteId: number;
  bancoCodigo: string;
  bancoNome: string;
  agencia: string;
  agenciaDigito: string | null;
  conta: string;
  contaDigito: string | null;
  tipoConta: TipoConta;
  chavePix: string | null;
  tipoChavePix: TipoChavePix | null;
  titularCpf: string;
  titularNome: string;
  ativo: boolean;
  observacoes: string | null;
  origem: OrigemDadosBancarios;
  createdAt: string;
  updatedAt: string;
}

export interface DadosBancariosInput {
  bancoCodigo: string;
  bancoNome: string;
  agencia: string;
  agenciaDigito?: string | null;
  conta: string;
  contaDigito?: string | null;
  tipoConta: TipoConta;
  chavePix?: string | null;
  tipoChavePix?: TipoChavePix | null;
  titularCpf: string;
  titularNome: string;
}

export interface DadosBancariosSnapshot extends DadosBancariosInput {
  capturadoEm: string;
  dadosBancariosClienteId: number;
}

export interface PrestacaoContasContext {
  cliente: { id: number; nome: string; cpf: string; email?: string | null };
  parcela: {
    id: number;
    numero: number;
    valor_bruto: number;
    valor_bruto_formatado: string;
    honorarios_contratuais: number;
    honorarios_contratuais_formatado: string;
    honorarios_sucumbenciais: number;
    honorarios_sucumbenciais_formatado: string;
    valor_repasse_liquido: number;
    valor_repasse_liquido_formatado: string;
    valor_repasse_liquido_extenso: string;
    data_efetivacao: string;
  };
  acordo: {
    id: number;
    tipo: string;
    tipo_label: string;
    numero_parcelas: number;
    percentual_escritorio: number;
  };
  processo: { id: number; numero: string; orgao_julgador: string };
  banco: {
    codigo: string;
    nome: string;
    agencia: string;
    agencia_digito?: string | null;
    agencia_completa: string;
    conta: string;
    conta_digito?: string | null;
    conta_completa: string;
    tipo_conta: TipoConta;
    tipo_conta_label: string;
    chave_pix?: string | null;
    tipo_chave_pix?: TipoChavePix | null;
    tipo_chave_pix_label?: string;
    titular_nome: string;
    titular_cpf: string;
  };
  escritorio: { razao_social: string; oab: string; cidade: string };
  data_assinatura: string;
  data_assinatura_extenso: string;
  cidade: string;
}

export interface LinkPrestacaoContas {
  url: string;
  token: string;
  expiresAt: string;
  documentoId: number;
}
