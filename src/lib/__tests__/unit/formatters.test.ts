/**
 * Testes Property-Based para Formatadores Brasileiros
 *
 * Utiliza fast-check para validar propriedades invariantes das funções
 * de formatação, garantindo comportamento correto com milhares de casos gerados.
 */

import * as fc from 'fast-check';
import {
  formatCurrency,
  formatCPF,
  formatCNPJ,
  formatDate,
  formatPhone,
} from '@/lib/formatters';

describe('Formatters - Property-Based Tests', () => {
  describe('formatCurrency', () => {
    it('Property: sempre retorna formato BRL válido para números válidos', () => {
      fc.assert(
        fc.property(
          fc.double({ min: -1000000, max: 1000000, noNaN: true }),
          (value) => {
            const result = formatCurrency(value);
            // Formato esperado: -?R$[\s\u00A0]\d{1,3}(.\d{3})*,\d{2}
            // Aceita sinal antes do R$, espaço normal ou NBSP (char 160)
            expect(result).toMatch(/^-?R\$[\s\u00A0]\d{1,3}(\.\d{3})*,\d{2}$/);
          }
        ),
        { numRuns: 1000 }
      );
    });

    it('Property: valores negativos sempre têm sinal de menos', () => {
      fc.assert(
        fc.property(
          fc.double({ min: -1000000, max: -0.01, noNaN: true }),
          (value) => {
            const result = formatCurrency(value);
            expect(result).toContain('-');
          }
        ),
        { numRuns: 500 }
      );
    });

    it('Property: valores positivos nunca têm sinal de menos', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.01, max: 1000000, noNaN: true }),
          (value) => {
            const result = formatCurrency(value);
            expect(result).not.toContain('-');
          }
        ),
        { numRuns: 500 }
      );
    });

    it('deve formatar zero corretamente', () => {
      const result = formatCurrency(0);
      expect(result).toMatch(/^R\$[\s\u00A0]0,00$/);
    });

    it('deve retornar valor formatado para null', () => {
      const result = formatCurrency(null);
      expect(result).toMatch(/^R\$[\s\u00A0]0,00$/);
    });

    it('deve retornar valor formatado para undefined', () => {
      const result = formatCurrency(undefined);
      expect(result).toMatch(/^R\$[\s\u00A0]0,00$/);
    });

    it('deve formatar valores grandes corretamente', () => {
      const result = formatCurrency(1234567.89);
      expect(result).toMatch(/^R\$[\s\u00A0]1\.234\.567,89$/);
    });

    it('deve formatar valores negativos corretamente', () => {
      const result = formatCurrency(-1234.56);
      expect(result).toMatch(/^-R\$[\s\u00A0]1\.234,56$/);
    });

    it('deve arredondar para 2 casas decimais', () => {
      expect(formatCurrency(10.999)).toMatch(/^R\$[\s\u00A0]11,00$/);
      expect(formatCurrency(10.994)).toMatch(/^R\$[\s\u00A0]10,99$/);
    });
  });

  describe('formatCPF', () => {
    it('Property: CPF com 11 dígitos sempre retorna formato válido', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 11, maxLength: 11 }),
          (digits) => {
            const cpf = digits.join('');
            const result = formatCPF(cpf);
            // Formato esperado: 000.000.000-00
            expect(result).toMatch(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/);
          }
        ),
        { numRuns: 1000 }
      );
    });

    it('Property: CPF formatado sempre tem 14 caracteres', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 11, maxLength: 11 }),
          (digits) => {
            const cpf = digits.join('');
            const result = formatCPF(cpf);
            expect(result).toHaveLength(14);
          }
        ),
        { numRuns: 1000 }
      );
    });

    it('deve retornar string vazia para null', () => {
      expect(formatCPF(null)).toBe('');
    });

    it('deve retornar string vazia para undefined', () => {
      expect(formatCPF(undefined)).toBe('');
    });

    it('deve retornar string vazia para string vazia', () => {
      expect(formatCPF('')).toBe('');
    });

    it('deve formatar CPF válido corretamente', () => {
      expect(formatCPF('12345678901')).toBe('123.456.789-01');
      expect(formatCPF('00000000000')).toBe('000.000.000-00');
      expect(formatCPF('99999999999')).toBe('999.999.999-99');
    });

    it('deve retornar string vazia para CPF com menos de 11 dígitos', () => {
      expect(formatCPF('123456789')).toBe('');
      expect(formatCPF('1234567890')).toBe('');
    });

    it('deve retornar string vazia para CPF com mais de 11 dígitos', () => {
      expect(formatCPF('123456789012')).toBe('');
      expect(formatCPF('1234567890123')).toBe('');
    });

    it('deve retornar string vazia para CPF com caracteres não numéricos', () => {
      expect(formatCPF('123.456.789-01')).toBe('');
      expect(formatCPF('abc12345678')).toBe('');
    });
  });

  describe('formatCNPJ', () => {
    it('Property: CNPJ com 14 dígitos sempre retorna formato válido', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 14, maxLength: 14 }),
          (digits) => {
            const cnpj = digits.join('');
            const result = formatCNPJ(cnpj);
            // Formato esperado: 00.000.000/0000-00
            expect(result).toMatch(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/);
          }
        ),
        { numRuns: 1000 }
      );
    });

    it('Property: CNPJ formatado sempre tem 18 caracteres', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 14, maxLength: 14 }),
          (digits) => {
            const cnpj = digits.join('');
            const result = formatCNPJ(cnpj);
            expect(result).toHaveLength(18);
          }
        ),
        { numRuns: 1000 }
      );
    });

    it('deve retornar string vazia para null', () => {
      expect(formatCNPJ(null)).toBe('');
    });

    it('deve retornar string vazia para undefined', () => {
      expect(formatCNPJ(undefined)).toBe('');
    });

    it('deve retornar string vazia para string vazia', () => {
      expect(formatCNPJ('')).toBe('');
    });

    it('deve formatar CNPJ válido corretamente', () => {
      expect(formatCNPJ('12345678000195')).toBe('12.345.678/0001-95');
      expect(formatCNPJ('00000000000000')).toBe('00.000.000/0000-00');
      expect(formatCNPJ('99999999999999')).toBe('99.999.999/9999-99');
    });

    it('deve retornar string vazia para CNPJ com menos de 14 dígitos', () => {
      expect(formatCNPJ('1234567800019')).toBe('');
      expect(formatCNPJ('123456780001')).toBe('');
    });

    it('deve retornar string vazia para CNPJ com mais de 14 dígitos', () => {
      expect(formatCNPJ('123456780001955')).toBe('');
      expect(formatCNPJ('12345678000195555')).toBe('');
    });

    it('deve retornar string vazia para CNPJ com caracteres não numéricos', () => {
      expect(formatCNPJ('12.345.678/0001-95')).toBe('');
      expect(formatCNPJ('abc1234567800019')).toBe('');
    });
  });

  describe('formatDate', () => {
    it('Property: datas válidas sempre retornam formato dd/MM/yyyy', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('1900-01-01'), max: new Date('2100-12-31') }),
          (date) => {
            const result = formatDate(date);
            // Formato esperado: dd/MM/yyyy
            expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
          }
        ),
        { numRuns: 1000 }
      );
    });

    it('Property: formatação de strings ISO válidas sempre retorna formato dd/MM/yyyy', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('1900-01-01'), max: new Date('2100-12-31') }),
          (date) => {
            const isoString = date.toISOString();
            const result = formatDate(isoString);
            expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
          }
        ),
        { numRuns: 500 }
      );
    });

    it('deve retornar string vazia para null', () => {
      expect(formatDate(null)).toBe('');
    });

    it('deve retornar string vazia para undefined', () => {
      expect(formatDate(undefined)).toBe('');
    });

    it('deve formatar Date object corretamente', () => {
      const date = new Date('2024-01-15T00:00:00.000Z');
      expect(formatDate(date)).toBe('15/01/2024');
    });

    it('deve formatar string ISO corretamente', () => {
      expect(formatDate('2024-01-15T00:00:00.000Z')).toBe('15/01/2024');
      expect(formatDate('2024-12-31T23:59:59.999Z')).toBe('31/12/2024');
    });

    it('deve retornar string vazia para data inválida', () => {
      expect(formatDate('invalid-date')).toBe('');
      expect(formatDate('2024-13-45')).toBe('');
      expect(formatDate(new Date('invalid'))).toBe('');
    });

    it('deve formatar datas limite corretamente', () => {
      expect(formatDate('1900-01-01T00:00:00.000Z')).toBe('01/01/1900');
      expect(formatDate('2099-12-31T23:59:59.999Z')).toBe('31/12/2099');
    });

    it('deve usar timezone UTC para evitar problemas de fuso horário', () => {
      // Testa que a data não "volta um dia" devido a timezone
      const date = new Date('2024-01-15T00:00:00.000Z');
      expect(formatDate(date)).toBe('15/01/2024');

      // Testa com horário próximo à meia-noite
      const dateNearMidnight = new Date('2024-01-15T23:59:59.999Z');
      expect(formatDate(dateNearMidnight)).toBe('15/01/2024');
    });
  });

  describe('formatPhone', () => {
    it('Property: telefone com 10 dígitos sempre retorna formato válido', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 10, maxLength: 10 }),
          (digits) => {
            const phone = digits.join('');
            const result = formatPhone(phone);
            // Formato esperado: (00) 0000-0000
            expect(result).toMatch(/^\(\d{2}\) \d{4}-\d{4}$/);
          }
        ),
        { numRuns: 500 }
      );
    });

    it('Property: telefone com 11 dígitos sempre retorna formato válido', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 11, maxLength: 11 }),
          (digits) => {
            const phone = digits.join('');
            const result = formatPhone(phone);
            // Formato esperado: (00) 00000-0000
            expect(result).toMatch(/^\(\d{2}\) \d{5}-\d{4}$/);
          }
        ),
        { numRuns: 500 }
      );
    });

    it('deve retornar string vazia para null', () => {
      expect(formatPhone(null)).toBe('');
    });

    it('deve retornar string vazia para undefined', () => {
      expect(formatPhone(undefined)).toBe('');
    });

    it('deve retornar string vazia para string vazia', () => {
      expect(formatPhone('')).toBe('');
    });

    it('deve formatar telefone fixo (10 dígitos) corretamente', () => {
      expect(formatPhone('1234567890')).toBe('(12) 3456-7890');
      expect(formatPhone('0000000000')).toBe('(00) 0000-0000');
      expect(formatPhone('9999999999')).toBe('(99) 9999-9999');
    });

    it('deve formatar celular (11 dígitos) corretamente', () => {
      expect(formatPhone('12345678901')).toBe('(12) 34567-8901');
      expect(formatPhone('11987654321')).toBe('(11) 98765-4321');
      expect(formatPhone('00000000000')).toBe('(00) 00000-0000');
    });

    it('deve retornar string vazia para telefone com menos de 10 dígitos', () => {
      expect(formatPhone('123456789')).toBe('');
      expect(formatPhone('12345')).toBe('');
    });

    it('deve retornar string vazia para telefone com mais de 11 dígitos', () => {
      expect(formatPhone('123456789012')).toBe('');
      expect(formatPhone('12345678901234')).toBe('');
    });

    it('deve retornar string vazia para telefone com caracteres não numéricos', () => {
      expect(formatPhone('(12) 3456-7890')).toBe('');
      expect(formatPhone('abc1234567890')).toBe('');
    });
  });

  describe('Edge Cases - Casos Extremos', () => {
    describe('formatCurrency', () => {
      it('deve lidar com números muito pequenos', () => {
        expect(formatCurrency(0.01)).toBe('R$ 0,01');
        expect(formatCurrency(0.001)).toBe('R$ 0,00');
      });

      it('deve lidar com números muito grandes', () => {
        expect(formatCurrency(999999999.99)).toBe('R$ 999.999.999,99');
      });

      it('deve lidar com precisão de ponto flutuante', () => {
        expect(formatCurrency(0.1 + 0.2)).toBe('R$ 0,30');
      });
    });

    describe('formatDate', () => {
      it('deve lidar com strings vazias', () => {
        expect(formatDate('')).toBe('');
      });

      it('deve lidar com objetos Date inválidos', () => {
        const invalidDate = new Date('not a date');
        expect(formatDate(invalidDate)).toBe('');
      });

      it('deve lidar com timestamps', () => {
        const timestamp = 1705276800000; // 2024-01-15
        const date = new Date(timestamp);
        expect(formatDate(date)).toBe('15/01/2024');
      });
    });

    describe('Valores null/undefined consistentes', () => {
      it('formatCurrency deve tratar null e undefined igualmente', () => {
        expect(formatCurrency(null)).toBe(formatCurrency(undefined));
      });

      it('formatCPF deve tratar null e undefined igualmente', () => {
        expect(formatCPF(null)).toBe(formatCPF(undefined));
      });

      it('formatCNPJ deve tratar null e undefined igualmente', () => {
        expect(formatCNPJ(null)).toBe(formatCNPJ(undefined));
      });

      it('formatDate deve tratar null e undefined igualmente', () => {
        expect(formatDate(null)).toBe(formatDate(undefined));
      });

      it('formatPhone deve tratar null e undefined igualmente', () => {
        expect(formatPhone(null)).toBe(formatPhone(undefined));
      });
    });
  });

  describe('Integração - Casos Reais', () => {
    it('deve formatar dados de processo corretamente', () => {
      const processo = {
        valor: 50000.00,
        cpfCliente: '12345678901',
        telefone: '11987654321',
        dataDistribuicao: '2024-01-15T00:00:00.000Z',
      };

      expect(formatCurrency(processo.valor)).toBe('R$ 50.000,00');
      expect(formatCPF(processo.cpfCliente)).toBe('123.456.789-01');
      expect(formatPhone(processo.telefone)).toBe('(11) 98765-4321');
      expect(formatDate(processo.dataDistribuicao)).toBe('15/01/2024');
    });

    it('deve formatar dados de empresa corretamente', () => {
      const empresa = {
        cnpj: '12345678000195',
        telefone: '1133334444',
      };

      expect(formatCNPJ(empresa.cnpj)).toBe('12.345.678/0001-95');
      expect(formatPhone(empresa.telefone)).toBe('(11) 3333-4444');
    });

    it('deve lidar com dados parciais/opcionais', () => {
      const usuario = {
        cpf: null,
        telefone: undefined,
        dataNascimento: '',
      };

      expect(formatCPF(usuario.cpf)).toBe('');
      expect(formatPhone(usuario.telefone)).toBe('');
      expect(formatDate(usuario.dataNascimento)).toBe('');
    });
  });
});
