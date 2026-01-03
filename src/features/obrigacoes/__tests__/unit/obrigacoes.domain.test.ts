// @ts-nocheck
import { describe, it, expect } from '@jest/globals';
import {
  calcularSplitPagamento,
  podeSerSincronizada,
  determinarStatusAcordo,
  validarIntegridadeParcela,
} from '../../domain';
import {
  criarParcelaMock,
  criarParcelaRecebidaMock,
  criarParcelaCanceladaMock,
} from '../fixtures';

describe('Obrigações Domain', () => {
  describe('calcularSplitPagamento', () => {
    it('deve calcular split com percentual padrão (30%)', () => {
      // Arrange
      const valorTotal = 10000;
      const percentualEscritorio = 30;

      // Act
      const result = calcularSplitPagamento(valorTotal, percentualEscritorio);

      // Assert
      expect(result.valorEscritorio).toBe(3000);
      expect(result.valorCliente).toBe(7000);
      expect(result.valorEscritorio + result.valorCliente).toBe(valorTotal);
    });

    it('deve calcular split com percentual customizado', () => {
      // Arrange
      const valorTotal = 5000;
      const percentualEscritorio = 40;

      // Act
      const result = calcularSplitPagamento(valorTotal, percentualEscritorio);

      // Assert
      expect(result.valorEscritorio).toBe(2000);
      expect(result.valorCliente).toBe(3000);
      expect(result.valorEscritorio + result.valorCliente).toBe(valorTotal);
    });

    it('deve incluir honorários sucumbenciais no escritório', () => {
      // Arrange
      const valorTotal = 10000;
      const percentualEscritorio = 30;
      const honorariosSucumbenciais = 2000;

      // Act
      const result = calcularSplitPagamento(
        valorTotal,
        percentualEscritorio,
        honorariosSucumbenciais
      );

      // Assert
      expect(result.valorEscritorio).toBe(5000); // 3000 + 2000
      expect(result.valorCliente).toBe(7000);
      expect(result.honorariosSucumbenciais).toBe(2000);
    });

    it('deve calcular repasse cliente corretamente', () => {
      // Arrange
      const valorTotal = 15000;
      const percentualEscritorio = 25;

      // Act
      const result = calcularSplitPagamento(valorTotal, percentualEscritorio);

      // Assert
      expect(result.valorEscritorio).toBe(3750);
      expect(result.valorCliente).toBe(11250);
      expect(result.percentualCliente).toBe(75);
    });
  });

  describe('podeSerSincronizada', () => {
    it('deve retornar true para parcela recebida', () => {
      // Arrange
      const parcela = criarParcelaRecebidaMock();

      // Act
      const result = podeSerSincronizada(parcela);

      // Assert
      expect(result).toBe(true);
    });

    it('deve retornar false para parcela cancelada', () => {
      // Arrange
      const parcela = criarParcelaCanceladaMock();

      // Act
      const result = podeSerSincronizada(parcela);

      // Assert
      expect(result).toBe(false);
    });

    it('deve retornar false para parcela pendente', () => {
      // Arrange
      const parcela = criarParcelaMock({
        status: 'pendente',
      });

      // Act
      const result = podeSerSincronizada(parcela);

      // Assert
      expect(result).toBe(false);
    });

    it('deve retornar false para parcela atrasada', () => {
      // Arrange
      const parcela = criarParcelaMock({
        status: 'atrasado',
      });

      // Act
      const result = podeSerSincronizada(parcela);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('determinarStatusAcordo', () => {
    it('deve retornar pago_total quando todas pagas', () => {
      // Arrange
      const parcelas = [
        criarParcelaRecebidaMock({ id: 1, numeroParcela: 1 }),
        criarParcelaRecebidaMock({ id: 2, numeroParcela: 2 }),
        criarParcelaRecebidaMock({ id: 3, numeroParcela: 3 }),
      ];

      // Act
      const result = determinarStatusAcordo(parcelas);

      // Assert
      expect(result).toBe('pago_total');
    });

    it('deve retornar pago_parcial quando algumas pagas', () => {
      // Arrange
      const parcelas = [
        criarParcelaRecebidaMock({ id: 1, numeroParcela: 1 }),
        criarParcelaMock({ id: 2, numeroParcela: 2, status: 'pendente' }),
        criarParcelaMock({ id: 3, numeroParcela: 3, status: 'pendente' }),
      ];

      // Act
      const result = determinarStatusAcordo(parcelas);

      // Assert
      expect(result).toBe('pago_parcial');
    });

    it('deve retornar atrasado quando alguma vencida', () => {
      // Arrange
      const hoje = new Date();
      const ontem = new Date(hoje);
      ontem.setDate(ontem.getDate() - 1);

      const parcelas = [
        criarParcelaMock({
          id: 1,
          numeroParcela: 1,
          status: 'atrasado',
          dataVencimento: ontem,
        }),
        criarParcelaMock({ id: 2, numeroParcela: 2, status: 'pendente' }),
      ];

      // Act
      const result = determinarStatusAcordo(parcelas);

      // Assert
      expect(result).toBe('atrasado');
    });

    it('deve retornar pendente quando nenhuma paga', () => {
      // Arrange
      const parcelas = [
        criarParcelaMock({ id: 1, numeroParcela: 1, status: 'pendente' }),
        criarParcelaMock({ id: 2, numeroParcela: 2, status: 'pendente' }),
        criarParcelaMock({ id: 3, numeroParcela: 3, status: 'pendente' }),
      ];

      // Act
      const result = determinarStatusAcordo(parcelas);

      // Assert
      expect(result).toBe('pendente');
    });

    it('deve retornar cancelado quando todas canceladas', () => {
      // Arrange
      const parcelas = [
        criarParcelaCanceladaMock({ id: 1, numeroParcela: 1 }),
        criarParcelaCanceladaMock({ id: 2, numeroParcela: 2 }),
      ];

      // Act
      const result = determinarStatusAcordo(parcelas);

      // Assert
      expect(result).toBe('cancelado');
    });

    it('deve priorizar atrasado sobre pendente', () => {
      // Arrange
      const ontem = new Date();
      ontem.setDate(ontem.getDate() - 1);

      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);

      const parcelas = [
        criarParcelaMock({
          id: 1,
          status: 'atrasado',
          dataVencimento: ontem,
        }),
        criarParcelaMock({
          id: 2,
          status: 'pendente',
          dataVencimento: amanha,
        }),
      ];

      // Act
      const result = determinarStatusAcordo(parcelas);

      // Assert
      expect(result).toBe('atrasado');
    });
  });

  describe('validarIntegridadeParcela', () => {
    it('deve validar parcela recebida com forma de pagamento', () => {
      // Arrange
      const parcela = criarParcelaRecebidaMock({
        formaPagamento: 'pix',
      });

      // Act
      const result = validarIntegridadeParcela(parcela);

      // Assert
      expect(result.valida).toBe(true);
      expect(result.erros).toEqual([]);
    });

    it('deve retornar erro se parcela recebida sem forma de pagamento', () => {
      // Arrange
      const parcela = criarParcelaRecebidaMock({
        formaPagamento: null,
      });

      // Act
      const result = validarIntegridadeParcela(parcela);

      // Assert
      expect(result.valida).toBe(false);
      expect(result.erros).toContain('Parcela recebida deve ter forma de pagamento');
    });

    it('deve validar status de repasse', () => {
      // Arrange
      const parcela = criarParcelaRecebidaMock({
        dataEfetivacao: new Date(),
        valorEfetivado: 5000,
      });

      // Act
      const result = validarIntegridadeParcela(parcela);

      // Assert
      expect(result.valida).toBe(true);
    });

    it('deve retornar erro se parcela recebida sem data de efetivação', () => {
      // Arrange
      const parcela = criarParcelaRecebidaMock({
        dataEfetivacao: null,
      });

      // Act
      const result = validarIntegridadeParcela(parcela);

      // Assert
      expect(result.valida).toBe(false);
      expect(result.erros).toContain('Parcela recebida deve ter data de efetivação');
    });

    it('deve retornar erro se parcela recebida sem valor efetivado', () => {
      // Arrange
      const parcela = criarParcelaRecebidaMock({
        valorEfetivado: null,
      });

      // Act
      const result = validarIntegridadeParcela(parcela);

      // Assert
      expect(result.valida).toBe(false);
      expect(result.erros).toContain('Parcela recebida deve ter valor efetivado');
    });

    it('deve retornar múltiplos erros quando aplicável', () => {
      // Arrange
      const parcela = criarParcelaRecebidaMock({
        formaPagamento: null,
        dataEfetivacao: null,
        valorEfetivado: null,
      });

      // Act
      const result = validarIntegridadeParcela(parcela);

      // Assert
      expect(result.valida).toBe(false);
      expect(result.erros.length).toBeGreaterThan(1);
      expect(result.erros).toContain('Parcela recebida deve ter forma de pagamento');
      expect(result.erros).toContain('Parcela recebida deve ter data de efetivação');
      expect(result.erros).toContain('Parcela recebida deve ter valor efetivado');
    });
  });
});
