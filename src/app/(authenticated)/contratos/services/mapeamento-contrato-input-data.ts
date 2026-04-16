import type { ClienteBasico } from '@/shared/assinatura-digital/services/data.service';

export interface DadosContratoParaMapping {
  contrato: { id: number; segmento_id: number | null; cliente_id: number };
  cliente: {
    id: number;
    nome: string;
    tipo_pessoa?: string | null;
    cpf?: string | null;
    cnpj?: string | null;
    rg?: string | null;
    nacionalidade?: string | null;
    estado_civil?: string | null;
    ddd_celular?: string | null;
    numero_celular?: string | null;
    emails?: string[] | null;
    endereco?: {
      logradouro?: string | null;
      numero?: string | null;
      bairro?: string | null;
      municipio?: string | null;
      estado_sigla?: string | null;
      cep?: string | null;
      complemento?: string | null;
    } | null;
  } | null;
  partes: Array<{
    papel_contratual: string;
    nome_snapshot: string | null;
    ordem: number;
  }>;
}

export interface InputDataMapeado {
  cliente: ClienteBasico;
  parteContrariaNome: string;
  ctxExtras: Record<string, string>;
}

const ESTADO_CIVIL_LABELS: Record<string, string> = {
  solteiro: 'Solteiro(a)',
  casado: 'Casado(a)',
  divorciado: 'Divorciado(a)',
  viuvo: 'Viúvo(a)',
  separado: 'Separado(a) judicialmente',
  uniao_estavel: 'União estável',
};

function formatarCpf(cpf: string): string {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return cpf;
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function formatarCep(cep: string): string {
  const digits = cep.replace(/\D/g, '');
  if (digits.length !== 8) return cep;
  return digits.replace(/(\d{5})(\d{3})/, '$1-$2');
}

function formatarCelular(num: string): string {
  const digits = num.replace(/\D/g, '');
  if (digits.length === 9) return digits.replace(/(\d{5})(\d{4})/, '$1-$2');
  if (digits.length === 8) return digits.replace(/(\d{4})(\d{4})/, '$1-$2');
  return num;
}

function concatenarPartesContrarias(
  partes: DadosContratoParaMapping['partes'],
): string {
  const nomes = partes
    .filter(p => p.papel_contratual === 'parte_contraria')
    .sort((a, b) => a.ordem - b.ordem)
    .map(p => (p.nome_snapshot ?? '').trim())
    .filter(n => n.length > 0);

  if (nomes.length === 0) return '';
  return new Intl.ListFormat('pt-BR', { style: 'long', type: 'conjunction' }).format(nomes);
}

export function contratoParaInputData(dados: DadosContratoParaMapping): InputDataMapeado {
  const { cliente } = dados;

  if (!cliente) {
    throw new Error('Contrato sem cliente vinculado');
  }

  if (cliente.tipo_pessoa && cliente.tipo_pessoa !== 'pf') {
    throw new Error(
      'Templates trabalhistas exigem cliente Pessoa Física. Altere o cadastro do cliente ou use outro tipo de contrato.',
    );
  }

  const clienteMapeado: ClienteBasico = {
    id: cliente.id,
    nome: (cliente.nome ?? '').trim(),
    tipo_pessoa: cliente.tipo_pessoa ?? null,
    cpf: cliente.cpf ? formatarCpf(cliente.cpf) : null,
    cnpj: null,
    rg: cliente.rg ?? null,
    emails: cliente.emails ?? null,
    ddd_celular: cliente.ddd_celular ?? null,
    numero_celular: cliente.numero_celular ? formatarCelular(cliente.numero_celular) : null,
    estado_civil: cliente.estado_civil
      ? ESTADO_CIVIL_LABELS[cliente.estado_civil] ?? cliente.estado_civil
      : null,
    nacionalidade: cliente.nacionalidade ?? null,
    endereco: cliente.endereco
      ? {
          logradouro: cliente.endereco.logradouro ?? null,
          numero: cliente.endereco.numero ?? null,
          bairro: cliente.endereco.bairro ?? null,
          municipio: cliente.endereco.municipio ?? null,
          estado_sigla: cliente.endereco.estado_sigla ?? null,
          cep: cliente.endereco.cep ? formatarCep(cliente.endereco.cep) : null,
          complemento: cliente.endereco.complemento ?? null,
        }
      : null,
  };

  const parteContrariaNome = concatenarPartesContrarias(dados.partes);
  const primeiroEmail = cliente.emails?.[0] ?? '';

  const ctxExtras: Record<string, string> = {
    'acao.nome_empresa_pessoa': parteContrariaNome,
    'cliente.email': primeiroEmail,
  };

  return { cliente: clienteMapeado, parteContrariaNome, ctxExtras };
}
