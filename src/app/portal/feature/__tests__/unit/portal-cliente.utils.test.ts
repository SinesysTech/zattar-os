import { describe, it, expect } from '@jest/globals';
import { validarCpf, cpfSchema } from '../../utils';

describe('Portal Cliente Utils', () => {
  describe('validarCpf', () => {
    it('deve validar CPF correto sem formatação', () => {
      const result = validarCpf('12345678900');

      expect(result.valido).toBe(true);
      expect(result.cpfLimpo).toBe('12345678900');
      expect(result.erro).toBeUndefined();
    });

    it('deve validar CPF correto com formatação', () => {
      const result = validarCpf('123.456.789-00');

      expect(result.valido).toBe(true);
      expect(result.cpfLimpo).toBe('12345678900');
    });

    it('deve rejeitar CPF com menos de 11 dígitos', () => {
      const result = validarCpf('123456789');

      expect(result.valido).toBe(false);
      expect(result.erro).toBe('CPF inválido');
    });

    it('deve rejeitar CPF com mais de 11 dígitos', () => {
      const result = validarCpf('123456789000');

      expect(result.valido).toBe(false);
      expect(result.erro).toBe('CPF inválido');
    });

    it('deve rejeitar CPF com todos os dígitos iguais', () => {
      const result1 = validarCpf('11111111111');
      const result2 = validarCpf('00000000000');
      const result3 = validarCpf('99999999999');

      expect(result1.valido).toBe(false);
      expect(result2.valido).toBe(false);
      expect(result3.valido).toBe(false);
    });

    it('deve limpar caracteres não numéricos', () => {
      const result = validarCpf('123.456.789-00');

      expect(result.cpfLimpo).toBe('12345678900');
    });

    it('deve limpar múltiplos tipos de caracteres', () => {
      const result = validarCpf('123-456.789/00');

      expect(result.cpfLimpo).toBe('12345678900');
    });

    it('deve rejeitar CPF vazio', () => {
      const result = validarCpf('');

      expect(result.valido).toBe(false);
      expect(result.erro).toBe('CPF inválido');
    });

    it('deve rejeitar CPF apenas com caracteres especiais', () => {
      const result = validarCpf('...-');

      expect(result.valido).toBe(false);
      expect(result.erro).toBe('CPF inválido');
    });

    it('deve rejeitar CPF com letras', () => {
      const result = validarCpf('123abc789de');

      expect(result.valido).toBe(false);
      expect(result.cpfLimpo).toBe('123789'); // Apenas números
      expect(result.erro).toBe('CPF inválido');
    });
  });

  describe('cpfSchema', () => {
    it('deve validar CPF com 11 dígitos', () => {
      const result = cpfSchema.safeParse('12345678900');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('12345678900');
      }
    });

    it('deve rejeitar CPF com menos de 11 dígitos', () => {
      const result = cpfSchema.safeParse('123456789');

      expect(result.success).toBe(false);
    });

    it('deve rejeitar CPF com mais de 11 dígitos', () => {
      const result = cpfSchema.safeParse('123456789012');

      expect(result.success).toBe(false);
    });

    it('deve rejeitar CPF com formatação', () => {
      const result = cpfSchema.safeParse('123.456.789-00');

      expect(result.success).toBe(false);
    });

    it('deve rejeitar CPF com letras', () => {
      const result = cpfSchema.safeParse('12345678abc');

      expect(result.success).toBe(false);
    });

    it('deve rejeitar CPF vazio', () => {
      const result = cpfSchema.safeParse('');

      expect(result.success).toBe(false);
    });

    it('deve aceitar apenas números', () => {
      const result = cpfSchema.safeParse('00000000000');

      expect(result.success).toBe(true);
    });
  });
});
