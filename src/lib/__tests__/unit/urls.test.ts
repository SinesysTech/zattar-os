/**
 * Testes Unitários para URLs
 *
 * Valida funções de geração de URLs dos apps Sinesys
 */

import { getDashboardUrl, getMeuProcessoUrl, getWebsiteUrl } from '@/lib/urls';

describe('URLs - Unit Tests', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

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

    it('deve usar variável de ambiente quando configurada', async () => {
      process.env.NEXT_PUBLIC_DASHBOARD_URL = 'https://app.sinesys.com.br';
      jest.resetModules();
      const { getDashboardUrl: getDashboardUrlNew } = await import('@/lib/urls');

      expect(getDashboardUrlNew()).toBe('https://app.sinesys.com.br');
    });
  });

  describe('getMeuProcessoUrl', () => {
    it('deve retornar URL base sem path', () => {
      expect(getMeuProcessoUrl()).toBe('http://localhost:3000/meu-processo');
    });

    it('deve adicionar path com barra inicial', () => {
      expect(getMeuProcessoUrl('/processos')).toBe('http://localhost:3000/meu-processo/processos');
    });

    it('deve adicionar path sem barra inicial', () => {
      expect(getMeuProcessoUrl('processos')).toBe('http://localhost:3000/meu-processo/processos');
    });

    it('deve lidar com paths compostos', () => {
      expect(getMeuProcessoUrl('/login')).toBe('http://localhost:3000/meu-processo/login');
    });

    it('deve lidar com hash fragments', () => {
      expect(getMeuProcessoUrl('/#dashboard')).toBe('http://localhost:3000/meu-processo/#dashboard');
    });

    it('deve usar variável de ambiente quando configurada', async () => {
      process.env.NEXT_PUBLIC_MEU_PROCESSO_URL = 'https://cliente.sinesys.com.br';
      jest.resetModules();
      const { getMeuProcessoUrl: getMeuProcessoUrlNew } = await import('@/lib/urls');

      expect(getMeuProcessoUrlNew()).toBe('https://cliente.sinesys.com.br');
    });
  });

  describe('getWebsiteUrl', () => {
    it('deve retornar URL base sem path', () => {
      expect(getWebsiteUrl()).toBe('http://localhost:3000/website');
    });

    it('deve adicionar path com barra inicial', () => {
      expect(getWebsiteUrl('/sobre')).toBe('http://localhost:3000/website/sobre');
    });

    it('deve adicionar path sem barra inicial', () => {
      expect(getWebsiteUrl('sobre')).toBe('http://localhost:3000/website/sobre');
    });

    it('deve lidar com paths aninhados', () => {
      expect(getWebsiteUrl('/blog/post-123')).toBe('http://localhost:3000/website/blog/post-123');
    });

    it('deve usar variável de ambiente quando configurada', async () => {
      process.env.NEXT_PUBLIC_WEBSITE_URL = 'https://www.sinesys.com.br';
      jest.resetModules();
      const { getWebsiteUrl: getWebsiteUrlNew } = await import('@/lib/urls');

      expect(getWebsiteUrlNew()).toBe('https://www.sinesys.com.br');
    });
  });

  describe('Comportamento Consistente', () => {
    it('todas as funções devem adicionar barra quando path não tem barra', () => {
      expect(getDashboardUrl('test')).toContain('/test');
      expect(getMeuProcessoUrl('test')).toContain('/test');
      expect(getWebsiteUrl('test')).toContain('/test');
    });

    it('todas as funções devem usar path como está quando tem barra', () => {
      expect(getDashboardUrl('/test')).toContain('/test');
      expect(getMeuProcessoUrl('/test')).toContain('/test');
      expect(getWebsiteUrl('/test')).toContain('/test');
    });

    it('todas as funções devem retornar URL base sem trailing slash', () => {
      expect(getDashboardUrl()).not.toEndWith('/');
      // Exceções: meu-processo e website têm path base
      expect(getMeuProcessoUrl()).not.toEndWith('/meu-processo/');
      expect(getWebsiteUrl()).not.toEndWith('/website/');
    });
  });

  describe('Casos Especiais', () => {
    it('deve lidar com URLs de produção', async () => {
      process.env.NEXT_PUBLIC_DASHBOARD_URL = 'https://app.zattar.com.br';
      process.env.NEXT_PUBLIC_MEU_PROCESSO_URL = 'https://cliente.zattar.com.br';
      process.env.NEXT_PUBLIC_WEBSITE_URL = 'https://www.zattar.com.br';
      jest.resetModules();

      const { getDashboardUrl: getDash, getMeuProcessoUrl: getMeu, getWebsiteUrl: getWeb } = await import('@/lib/urls');

      expect(getDash('/processos')).toBe('https://app.zattar.com.br/processos');
      expect(getMeu('/login')).toBe('https://cliente.zattar.com.br/login');
      expect(getWeb('/contato')).toBe('https://www.zattar.com.br/contato');
    });

    it('deve lidar com paths com caracteres especiais', () => {
      expect(getDashboardUrl('/processos/número-123')).toBe('http://localhost:3000/processos/número-123');
      expect(getMeuProcessoUrl('/busca?q=teste%20123')).toBe('http://localhost:3000/meu-processo/busca?q=teste%20123');
    });

    it('deve lidar com undefined como path', () => {
      expect(getDashboardUrl(undefined)).toBe('http://localhost:3000');
      expect(getMeuProcessoUrl(undefined)).toBe('http://localhost:3000/meu-processo');
      expect(getWebsiteUrl(undefined)).toBe('http://localhost:3000/website');
    });
  });
});
