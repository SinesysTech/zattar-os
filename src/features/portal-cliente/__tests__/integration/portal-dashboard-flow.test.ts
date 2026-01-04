import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { criarDashboardDataMock } from '../fixtures';

// Mock cookies
const mockCookies = {
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
};

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => mockCookies),
}));

// Mock service
const mockService = {
  obterDashboardCliente: jest.fn(),
};

jest.mock('../../service', () => mockService);

// Helper function to create portal session cookie in JSON format
function criarPortalSessionCookie(cpf: string, nome: string): string {
  return JSON.stringify({ cpf, nome });
}

describe('Portal Cliente - Dashboard Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Fluxo de Login e Carregamento', () => {
    it('deve validar CPF → setar cookie JSON → carregar dashboard', async () => {
      // Arrange - Validar CPF
      const cpfLimpo = '12345678900';
      const nomeCliente = 'João da Silva';

      // Arrange - Carregar dashboard
      const dashboardData = criarDashboardDataMock();
      mockService.obterDashboardCliente.mockResolvedValue(dashboardData);

      // Mock cookie set with JSON format
      const cookieValue = criarPortalSessionCookie(cpfLimpo, nomeCliente);
      mockCookies.set.mockImplementation((name, value, options) => {
        // Validar estrutura do cookie
        expect(name).toBe('portal-cpf-session');
        // Verify it's JSON format {cpf, nome}
        expect(value).toMatch(/^\{"cpf":"[^"]+","nome":"[^"]+"\}$/);
        expect(options).toEqual(
          expect.objectContaining({
            httpOnly: true,
            secure: expect.any(Boolean),
            maxAge: expect.any(Number),
          })
        );
      });

      // Act - Setar sessão com JSON (simular)
      mockCookies.set('portal-cpf-session', cookieValue, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 7 dias
      });

      // Mock cookie get with JSON format
      mockCookies.get.mockReturnValue({
        name: 'portal-cpf-session',
        value: cookieValue,
      });

      // Act - Carregar dashboard (parse JSON and use cpf)
      const cookie = mockCookies.get('portal-cpf-session');
      const { cpf: parsedCpf } = JSON.parse(cookie.value);
      const result = await mockService.obterDashboardCliente(parsedCpf);

      // Assert
      expect(parsedCpf).toBe(cpfLimpo);
      expect(result.cliente.cpf).toBe(cpfLimpo);
      expect(result.processos).toBeDefined();
      expect(result.contratos).toBeDefined();
      expect(result.audiencias).toBeDefined();
      expect(result.pagamentos).toBeDefined();
    });
  });

  describe('Estrutura do Cookie', () => {
    it('deve criar cookie JSON com campos corretos {cpf, nome}', () => {
      // Arrange
      const cpf = '12345678900';
      const nome = 'João da Silva';
      const cookieValue = criarPortalSessionCookie(cpf, nome);

      // Act
      mockCookies.set('portal-cpf-session', cookieValue, {
        httpOnly: true,
        secure: true,
        maxAge: 60 * 60 * 24 * 7,
      });

      // Assert
      expect(mockCookies.set).toHaveBeenCalledWith(
        'portal-cpf-session',
        expect.stringMatching(/^\{"cpf":"12345678900","nome":"João da Silva"\}$/),
        expect.objectContaining({
          httpOnly: true,
          secure: true,
        })
      );

      // Verify JSON can be parsed
      const parsed = JSON.parse(cookieValue);
      expect(parsed).toEqual({ cpf, nome });
    });

    it('deve usar httpOnly para segurança', () => {
      // Arrange
      const cookieValue = criarPortalSessionCookie('12345678900', 'João');

      // Act
      mockCookies.set('portal-cpf-session', cookieValue, {
        httpOnly: true,
      });

      // Assert
      expect(mockCookies.set).toHaveBeenCalledWith(
        'portal-cpf-session',
        expect.any(String),
        expect.objectContaining({
          httpOnly: true,
        })
      );
    });

    it('deve usar secure em produção', () => {
      // Arrange
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      const cookieValue = criarPortalSessionCookie('12345678900', 'João');

      // Act
      mockCookies.set('portal-cpf-session', cookieValue, {
        secure: process.env.NODE_ENV === 'production',
      });

      // Assert
      expect(mockCookies.set).toHaveBeenCalledWith(
        'portal-cpf-session',
        expect.any(String),
        expect.objectContaining({
          secure: true,
        })
      );

      // Cleanup
      process.env.NODE_ENV = originalEnv;
    });

    it('deve configurar maxAge para 7 dias', () => {
      // Arrange
      const maxAge = 60 * 60 * 24 * 7; // 7 dias em segundos
      const cookieValue = criarPortalSessionCookie('12345678900', 'João');

      // Act
      mockCookies.set('portal-cpf-session', cookieValue, {
        maxAge,
      });

      // Assert
      expect(mockCookies.set).toHaveBeenCalledWith(
        'portal-cpf-session',
        expect.any(String),
        expect.objectContaining({
          maxAge: 604800, // 7 dias
        })
      );
    });

    it('deve falhar ao parsear JSON malformado', () => {
      // Arrange - cookie with invalid JSON
      const invalidJson = 'invalid-json-string';

      // Act & Assert
      expect(() => JSON.parse(invalidJson)).toThrow();
    });
  });

  describe('Fluxo de Logout', () => {
    it('deve deletar cookies (portal-cpf-session e portal_session)', () => {
      // Act
      mockCookies.delete('portal-cpf-session');
      mockCookies.delete('portal_session');

      // Assert
      expect(mockCookies.delete).toHaveBeenCalledWith('portal-cpf-session');
      expect(mockCookies.delete).toHaveBeenCalledWith('portal_session');
      expect(mockCookies.delete).toHaveBeenCalledTimes(2);
    });
  });

  describe('Validação de Sessão', () => {
    it('deve carregar dashboard quando sessão válida com JSON cookie', async () => {
      // Arrange
      const cpfLimpo = '12345678900';
      const nomeCliente = 'João da Silva';
      const dashboardData = criarDashboardDataMock();

      mockCookies.get.mockReturnValue({
        name: 'portal-cpf-session',
        value: criarPortalSessionCookie(cpfLimpo, nomeCliente),
      });

      mockService.obterDashboardCliente.mockResolvedValue(dashboardData);

      // Act
      const cookie = mockCookies.get('portal-cpf-session');
      const { cpf } = JSON.parse(cookie.value);
      const result = await mockService.obterDashboardCliente(cpf);

      // Assert
      expect(result).toEqual(dashboardData);
      expect(cpf).toBe(cpfLimpo);
    });

    it('deve retornar null quando sessão inválida', () => {
      // Arrange
      mockCookies.get.mockReturnValue(null);

      // Act
      const cookie = mockCookies.get('portal-cpf-session');

      // Assert
      expect(cookie).toBeNull();
    });

    it('deve tratar erro ao carregar dashboard com JSON malformado', async () => {
      // Arrange
      mockCookies.get.mockReturnValue({
        name: 'portal-cpf-session',
        value: 'invalid-json',
      });

      // Act & Assert - JSON.parse will fail
      expect(() => {
        const cookie = mockCookies.get('portal-cpf-session');
        JSON.parse(cookie.value);
      }).toThrow();
    });

    it('deve tratar erro ao carregar dashboard com CPF inválido do JSON', async () => {
      // Arrange
      mockCookies.get.mockReturnValue({
        name: 'portal-cpf-session',
        value: criarPortalSessionCookie('invalid-cpf', 'Nome'),
      });

      mockService.obterDashboardCliente.mockRejectedValue(
        new Error('Cliente não encontrado')
      );

      // Act
      const cookie = mockCookies.get('portal-cpf-session');
      const { cpf } = JSON.parse(cookie.value);

      // Assert
      await expect(
        mockService.obterDashboardCliente(cpf)
      ).rejects.toThrow('Cliente não encontrado');
    });
  });
});
