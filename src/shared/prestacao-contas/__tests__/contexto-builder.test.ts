import { describe, it, expect } from 'vitest';
import { montarContexto } from '../services/contexto-builder';

describe('montarContexto', () => {
  it('formata valores em BRL, calcula líquido e dá extenso', () => {
    const ctx = montarContexto({
      cliente: { id: 1, nome: 'João Silva', cpf: '00000000000', email: null },
      parcela: {
        id: 10,
        numeroParcela: 2,
        valorBrutoCreditoPrincipal: 10000,
        honorariosContratuais: 3000,
        honorariosSucumbenciais: 500,
        dataEfetivacao: '2026-04-20',
      },
      acordo: {
        id: 5,
        tipo: 'acordo',
        numeroParcelas: 3,
        percentualEscritorio: 30,
      },
      processo: { id: 100, numero: '123', orgaoJulgador: '1VT' },
      dadosBancarios: {
        bancoCodigo: '001',
        bancoNome: 'BB',
        agencia: '1234',
        agenciaDigito: null,
        conta: '5678',
        contaDigito: '9',
        tipoConta: 'corrente',
        chavePix: null,
        tipoChavePix: null,
        titularCpf: '00000000000',
        titularNome: 'João Silva',
      },
      escritorio: {
        razaoSocial: 'Synthropic',
        oab: 'SP 123',
        cidade: 'São Paulo',
      },
      dataAssinatura: '2026-04-22',
    });

    expect(ctx.parcela.valor_repasse_liquido).toBe(7000);
    expect(ctx.parcela.valor_repasse_liquido_formatado.replace(/ /g, ' ')).toBe(
      'R$ 7.000,00',
    );
    expect(ctx.parcela.valor_repasse_liquido_extenso.toLowerCase()).toContain(
      'sete mil',
    );
    expect(ctx.banco.agencia_completa).toBe('1234');
    expect(ctx.banco.conta_completa).toBe('5678-9');
    expect(ctx.banco.tipo_conta_label).toBe('Conta Corrente');
    expect(ctx.data_assinatura_extenso).toBe('22 de abril de 2026');
    expect(ctx.acordo.tipo_label).toBe('Acordo');
  });

  it('resolve label de chave pix quando informada', () => {
    const ctx = montarContexto({
      cliente: { id: 1, nome: 'A', cpf: '00000000000' },
      parcela: {
        id: 1,
        numeroParcela: 1,
        valorBrutoCreditoPrincipal: 100,
        honorariosContratuais: 30,
        honorariosSucumbenciais: 0,
        dataEfetivacao: '2026-01-01',
      },
      acordo: { id: 1, tipo: 'condenacao', numeroParcelas: 1, percentualEscritorio: 30 },
      processo: { id: 1, numero: 'x', orgaoJulgador: 'y' },
      dadosBancarios: {
        bancoCodigo: '001',
        bancoNome: 'BB',
        agencia: '1',
        conta: '2',
        tipoConta: 'poupanca',
        chavePix: 'a@b.com',
        tipoChavePix: 'email',
        titularCpf: '00000000000',
        titularNome: 'A',
      },
      escritorio: { razaoSocial: 'S', oab: 'SP', cidade: 'SP' },
      dataAssinatura: '2026-01-01',
    });

    expect(ctx.banco.tipo_chave_pix_label).toBe('E-mail');
    expect(ctx.banco.tipo_conta_label).toBe('Poupança');
    expect(ctx.acordo.tipo_label).toBe('Condenação');
  });
});
