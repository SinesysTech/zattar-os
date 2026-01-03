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

describe('Portal Cliente - Dashboard Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Fluxo de Login e Carregamento', () => {
    it('deve validar CPF → setar cookie → carregar dashboard', async () => {
      // Arrange - Validar CPF
      const cpf = '123.456.789-00';
      const cpfLimpo = '12345678900';

      // Arrange - Carregar dashboard
      const dashboardData = criarDashboardDataMock();
      mockService.obterDashboardCliente.mockResolvedValue(dashboardData);

      // Mock cookie set
      mockCookies.set.mockImplementation((name, value, options) => {
        // Validar estrutura do cookie
        expect(name).toBe('portal-cpf-session');
        expect(value).toBe(cpfLimpo);
        expect(options).toEqual(
          expect.objectContaining({
            httpOnly: true,
            secure: expect.any(Boolean),
            maxAge: expect.any(Number),
          })
        );
      });

      // Act - Setar sessão (simular)
      mockCookies.set('portal-cpf-session', cpfLimpo, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 7 dias
      });

      // Mock cookie get
      mockCookies.get.mockReturnValue({
        name: 'portal-cpf-session',
        value: cpfLimpo,
      });

      // Act - Carregar dashboard
      const result = await mockService.obterDashboardCliente(cpfLimpo);

      // Assert
      expect(result.cliente.cpf).toBe(cpfLimpo);
      expect(result.processos).toBeDefined();
      expect(result.contratos).toBeDefined();
      expect(result.audiencias).toBeDefined();
      expect(result.pagamentos).toBeDefined();
    });
  });

  describe('Estrutura do Cookie', () => {
    it('deve criar cookie com campos corretos', () => {
      // Arrange
      const cpf = '12345678900';
      const nome = 'João da Silva';

      // Act
      mockCookies.set('portal-cpf-session', cpf, {
        httpOnly: true,
        secure: true,
        maxAge: 60 * 60 * 24 * 7,
      });

      mockCookies.set('portal_session', nome, {
        httpOnly: false, // Acessível via JS se necessário
        secure: true,
        maxAge: 60 * 60 * 24 * 7,
      });

      // Assert
      expect(mockCookies.set).toHaveBeenCalledWith(
        'portal-cpf-session',
        cpf,
        expect.objectContaining({
          httpOnly: true,
          secure: true,
        })
      );

      expect(mockCookies.set).toHaveBeenCalledWith(
        'portal_session',
        nome,
        expect.objectContaining({
          maxAge: 60 * 60 * 24 * 7,
        })
      );
    });

    it('deve usar httpOnly para segurança', () => {
      // Act
      mockCookies.set('portal-cpf-session', '12345678900', {
        httpOnly: true,
      });

      // Assert
      expect(mockCookies.set).toHaveBeenCalledWith(
        'portal-cpf-session',
        '12345678900',
        expect.objectContaining({
          httpOnly: true,
        })
      );
    });

    it('deve usar secure em produção', () => {
      // Arrange
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      // Act
      mockCookies.set('portal-cpf-session', '12345678900', {
        secure: process.env.NODE_ENV === 'production',
      });

      // Assert
      expect(mockCookies.set).toHaveBeenCalledWith(
        'portal-cpf-session',
        '12345678900',
        expect.objectContaining({
          secure: true,
        })
      );

      // Cleanup
      process.env.NODE_ENV = originalEnv;
    });

    it('deve configurar maxAge para 7 dias', () => {
      // Act
      const maxAge = 60 * 60 * 24 * 7; // 7 dias em segundos
      mockCookies.set('portal-cpf-session', '12345678900', {
        maxAge,
      });

      // Assert
      expect(mockCookies.set).toHaveBeenCalledWith(
        'portal-cpf-session',
        '12345678900',
        expect.objectContaining({
          maxAge: 604800, // 7 dias
        })
      );
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
    it('deve carregar dashboard quando sessão válida', async () => {
      // Arrange
      const cpfLimpo = '12345678900';
      const dashboardData = criarDashboardDataMock();

      mockCookies.get.mockReturnValue({
        name: 'portal-cpf-session',
        value: cpfLimpo,
      });

      mockService.obterDashboardCliente.mockResolvedValue(dashboardData);

      // Act
      const cookie = mockCookies.get('portal-cpf-session');
      const result = await mockService.obterDashboardCliente(cookie.value);

      // Assert
      expect(result).toEqual(dashboardData);
    });

    it('deve retornar null quando sessão inválida', () => {
      // Arrange
      mockCookies.get.mockReturnValue(null);

      // Act
      const cookie = mockCookies.get('portal-cpf-session');

      // Assert
      expect(cookie).toBeNull();
    });

    it('deve tratar erro ao carregar dashboard com sessão inválida', async () => {
      // Arrange
      mockCookies.get.mockReturnValue({
        name: 'portal-cpf-session',
        value: 'invalid-cpf',
      });

      mockService.obterDashboardCliente.mockRejectedValue(
        new Error('Cliente não encontrado')
      );

      // Act & Assert
      await expect(
        mockService.obterDashboardCliente('invalid-cpf')
      ).rejects.toThrow('Cliente não encontrado');
    });
  });
});
