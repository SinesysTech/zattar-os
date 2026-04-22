import { describe, it, expect } from 'vitest';
import { resolveTemplate } from '../services/variable-resolver';
import type { PrestacaoContasContext } from '../types';

const fixture: PrestacaoContasContext = {
  cliente: { id: 1, nome: 'Maria Silva', cpf: '12345678900' },
  parcela: {
    id: 10,
    numero: 1,
    valor_bruto: 10000,
    valor_bruto_formatado: 'R$ 10.000,00',
    honorarios_contratuais: 3000,
    honorarios_contratuais_formatado: 'R$ 3.000,00',
    honorarios_sucumbenciais: 0,
    honorarios_sucumbenciais_formatado: 'R$ 0,00',
    valor_repasse_liquido: 7000,
    valor_repasse_liquido_formatado: 'R$ 7.000,00',
    valor_repasse_liquido_extenso: 'sete mil reais',
    data_efetivacao: '2026-04-20',
  },
  acordo: {
    id: 5,
    tipo: 'acordo',
    tipo_label: 'Acordo',
    numero_parcelas: 3,
    percentual_escritorio: 30,
  },
  processo: {
    id: 100,
    numero: '1234567-89.2024.5.02.0001',
    orgao_julgador: '1ª Vara do Trabalho de SP',
  },
  banco: {
    codigo: '001',
    nome: 'Banco do Brasil',
    agencia: '1234',
    agencia_digito: null,
    agencia_completa: '1234',
    conta: '56789',
    conta_digito: '0',
    conta_completa: '56789-0',
    tipo_conta: 'corrente',
    tipo_conta_label: 'Conta Corrente',
    chave_pix: null,
    tipo_chave_pix: null,
    titular_nome: 'Maria Silva',
    titular_cpf: '12345678900',
  },
  escritorio: {
    razao_social: 'Synthropic Advocacia',
    oab: 'SP 123.456',
    cidade: 'São Paulo',
  },
  data_assinatura: '2026-04-22',
  data_assinatura_extenso: '22 de abril de 2026',
  cidade: 'São Paulo',
};

describe('resolveTemplate', () => {
  it('resolve variáveis simples', () => {
    const out = resolveTemplate('Olá {{cliente.nome}}, CPF {{cliente.cpf}}', fixture);
    expect(out).toBe('Olá Maria Silva, CPF 12345678900');
  });

  it('omite bloco condicional quando chave_pix é null', () => {
    const tpl =
      'Antes{{#banco.chave_pix}}PIX: {{banco.chave_pix}}{{/banco.chave_pix}}Depois';
    expect(resolveTemplate(tpl, fixture)).toBe('AntesDepois');
  });

  it('renderiza bloco condicional quando chave_pix presente', () => {
    const ctx: PrestacaoContasContext = {
      ...fixture,
      banco: {
        ...fixture.banco,
        chave_pix: '12345678900',
        tipo_chave_pix: 'cpf',
        tipo_chave_pix_label: 'CPF',
      },
    };
    const tpl =
      '{{#banco.chave_pix}}PIX: {{banco.chave_pix}} ({{banco.tipo_chave_pix_label}}){{/banco.chave_pix}}';
    expect(resolveTemplate(tpl, ctx)).toBe('PIX: 12345678900 (CPF)');
  });

  it('não escapa HTML em variáveis simples (saída é Markdown)', () => {
    const ctx: PrestacaoContasContext = {
      ...fixture,
      cliente: { ...fixture.cliente, nome: 'Maria & João' },
    };
    expect(resolveTemplate('{{cliente.nome}}', ctx)).toBe('Maria & João');
  });

  it('retorna string vazia para variável inexistente', () => {
    expect(resolveTemplate('Valor: [{{inexistente.campo}}]', fixture)).toBe('Valor: []');
  });
});
