/**
 * Testes Unitários para URLs
 *
 * Valida funções de geração de URLs do ZattarOS
 */

import { getDashboardUrl } from '@/lib/urls';

describe('URLs - Unit Tests', () => {
  describe('getDashboardUrl', () => {
    it('deve retornar URL base sem path', () => {
      expect(getDashboardUrl()).toBe('http://localhost:3000');
    });

    it('deve adicionar path com barra inicial', () => {
      expect(getDashboardUrl('/processos')).toBe('http://localhost:3000/processos');
    });

    it('deve adicionar path sem barra inicial', () => {
      expect(getDashboardUrl('processos')).toBe('http://localhost:3000/processos');
    });

    it('deve lidar com paths compostos', () => {
      expect(getDashboardUrl('/processos/123')).toBe('http://localhost:3000/processos/123');
    });

    it('deve lidar com query strings', () => {
      expect(getDashboardUrl('/processos?filter=active')).toBe('http://localhost:3000/processos?filter=active');
    });

    it('deve lidar com string vazia', () => {
      expect(getDashboardUrl('')).toBe('http://localhost:3000/');
    });

    it('deve lidar com undefined como path', () => {
      expect(getDashboardUrl(undefined)).toBe('http://localhost:3000');
    });

    it('deve lidar com paths com caracteres especiais', () => {
      expect(getDashboardUrl('/processos/número-123')).toBe('http://localhost:3000/processos/número-123');
    });
  });
});
