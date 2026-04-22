import extenso from 'extenso';
import type {
  PrestacaoContasContext,
  TipoConta,
  TipoChavePix,
} from '../types';
import { TIPO_CONTA_LABELS, TIPO_CHAVE_PIX_LABELS } from '../constants';

const TIPO_ACORDO_LABELS: Record<string, string> = {
  acordo: 'Acordo',
  condenacao: 'Condenação',
  custas_processuais: 'Custas Processuais',
};

const MESES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

function formatarBRL(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

function valorExtenso(valor: number): string {
  // `extenso` aceita string no formato "1234,56"
  return extenso(valor.toFixed(2).replace('.', ','), {
    mode: 'currency',
    currency: { type: 'BRL' },
  });
}

function dataExtenso(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

function agenciaCompleta(ag: string, dig: string | null | undefined): string {
  return dig ? `${ag}-${dig}` : ag;
}

function contaCompleta(ct: string, dig: string | null | undefined): string {
  return dig ? `${ct}-${dig}` : ct;
}

export interface MontarContextoInput {
  cliente: { id: number; nome: string; cpf: string; email?: string | null };
  parcela: {
    id: number;
    numeroParcela: number;
    valorBrutoCreditoPrincipal: number;
    honorariosContratuais: number;
    honorariosSucumbenciais: number;
    dataEfetivacao: string;
  };
  acordo: {
    id: number;
    tipo: string;
    numeroParcelas: number;
    percentualEscritorio: number;
  };
  processo: { id: number; numero: string; orgaoJulgador: string };
  dadosBancarios: {
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
  };
  escritorio: { razaoSocial: string; oab: string; cidade: string };
  dataAssinatura: string;
}

export function montarContexto(input: MontarContextoInput): PrestacaoContasContext {
  const { parcela, dadosBancarios } = input;
  const valorLiquido =
    parcela.valorBrutoCreditoPrincipal - parcela.honorariosContratuais;

  return {
    cliente: input.cliente,
    parcela: {
      id: parcela.id,
      numero: parcela.numeroParcela,
      valor_bruto: parcela.valorBrutoCreditoPrincipal,
      valor_bruto_formatado: formatarBRL(parcela.valorBrutoCreditoPrincipal),
      honorarios_contratuais: parcela.honorariosContratuais,
      honorarios_contratuais_formatado: formatarBRL(parcela.honorariosContratuais),
      honorarios_sucumbenciais: parcela.honorariosSucumbenciais,
      honorarios_sucumbenciais_formatado: formatarBRL(parcela.honorariosSucumbenciais),
      valor_repasse_liquido: valorLiquido,
      valor_repasse_liquido_formatado: formatarBRL(valorLiquido),
      valor_repasse_liquido_extenso: valorExtenso(valorLiquido),
      data_efetivacao: parcela.dataEfetivacao,
    },
    acordo: {
      id: input.acordo.id,
      tipo: input.acordo.tipo,
      tipo_label: TIPO_ACORDO_LABELS[input.acordo.tipo] ?? input.acordo.tipo,
      numero_parcelas: input.acordo.numeroParcelas,
      percentual_escritorio: input.acordo.percentualEscritorio,
    },
    processo: {
      id: input.processo.id,
      numero: input.processo.numero,
      orgao_julgador: input.processo.orgaoJulgador,
    },
    banco: {
      codigo: dadosBancarios.bancoCodigo,
      nome: dadosBancarios.bancoNome,
      agencia: dadosBancarios.agencia,
      agencia_digito: dadosBancarios.agenciaDigito ?? null,
      agencia_completa: agenciaCompleta(
        dadosBancarios.agencia,
        dadosBancarios.agenciaDigito,
      ),
      conta: dadosBancarios.conta,
      conta_digito: dadosBancarios.contaDigito ?? null,
      conta_completa: contaCompleta(
        dadosBancarios.conta,
        dadosBancarios.contaDigito,
      ),
      tipo_conta: dadosBancarios.tipoConta,
      tipo_conta_label: TIPO_CONTA_LABELS[dadosBancarios.tipoConta],
      chave_pix: dadosBancarios.chavePix ?? null,
      tipo_chave_pix: dadosBancarios.tipoChavePix ?? null,
      tipo_chave_pix_label: dadosBancarios.tipoChavePix
        ? TIPO_CHAVE_PIX_LABELS[dadosBancarios.tipoChavePix]
        : undefined,
      titular_nome: dadosBancarios.titularNome,
      titular_cpf: dadosBancarios.titularCpf,
    },
    escritorio: {
      razao_social: input.escritorio.razaoSocial,
      oab: input.escritorio.oab,
      cidade: input.escritorio.cidade,
    },
    data_assinatura: input.dataAssinatura,
    data_assinatura_extenso: dataExtenso(input.dataAssinatura),
    cidade: input.escritorio.cidade,
  };
}
