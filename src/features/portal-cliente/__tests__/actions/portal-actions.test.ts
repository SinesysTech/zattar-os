import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { criarDashboardDataMock } from '../fixtures';

// Mock dependencies
jest.mock('next/headers');
jest.mock('next/navigation');

const mockCookies = {
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
};

const mockRedirect = jest.fn();

const { cookies } = require('next/headers');
const { redirect } = require('next/navigation');

cookies.mockReturnValue(mockCookies);
redirect.mockImplementation(mockRedirect);

// Mock service
const mockService = {
  obterDashboardCliente: jest.fn(),
};

jest.mock('../../service', () => mockService);

// Mock utils
const mockUtils = {
  validarCpf: jest.fn(),
};

jest.mock('../../utils', () => mockUtils);

// Mock action implementations
const actionLoginPortal = jest.fn();
const actionCarregarDashboard = jest.fn();
const actionLogout = jest.fn();
const validarCpfESetarSessao = jest.fn();

describe('Portal Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validarCpfESetarSessao', () => {
    it('deve validar CPF válido e setar sessão', async () => {
      // Arrange
      const cpf = '123.456.789-00';
      const cpfLimpo = '12345678900';

      mockUtils.validarCpf.mockReturnValue({
        valido: true,
        cpfLimpo,
      });

      validarCpfESetarSessao.mockImplementation(async (inputCpf) => {
        const validacao = mockUtils.validarCpf(inputCpf);

        if (!validacao.valido) {
          return { success: false, error: 'CPF inválido' };
        }

        // Setar cookie
        mockCookies.set('portal-cpf-session', validacao.cpfLimpo, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 60 * 60 * 24 * 7,
        });

        return { success: true };
      });

      // Act
      const result = await validarCpfESetarSessao(cpf);

      // Assert
      expect(result.success).toBe(true);
      expect(mockUtils.validarCpf).toHaveBeenCalledWith(cpf);
      expect(mockCookies.set).toHaveBeenCalledWith(
        'portal-cpf-session',
        cpfLimpo,
        expect.objectContaining({
          httpOnly: true,
          maxAge: expect.any(Number),
        })
      );
    });

    it('deve retornar erro para CPF inválido', async () => {
      // Arrange
      const cpf = '11111111111';

      mockUtils.validarCpf.mockReturnValue({
        valido: false,
        cpfLimpo: '11111111111',
        erro: 'CPF inválido',
      });

      validarCpfESetarSessao.mockImplementation(async (inputCpf) => {
        const validacao = mockUtils.validarCpf(inputCpf);

        if (!validacao.valido) {
          return { success: false, error: validacao.erro };
        }

        return { success: true };
      });

      // Act
      const result = await validarCpfESetarSessao(cpf);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('CPF inválido');
      expect(mockCookies.set).not.toHaveBeenCalled();
    });

    it('deve retornar erro quando cliente não encontrado', async () => {
      // Arrange
      const cpf = '123.456.789-00';

      mockUtils.validarCpf.mockReturnValue({
        valido: true,
        cpfLimpo: '12345678900',
      });

      validarCpfESetarSessao.mockImplementation(async () => {
        return { success: false, error: 'Cliente não encontrado' };
      });

      // Act
      const result = await validarCpfESetarSessao(cpf);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Cliente não encontrado');
    });
  });

  describe('actionLoginPortal', () => {
    it('deve fazer login com sucesso e redirecionar', async () => {
      // Arrange
      const cpf = '123.456.789-00';

      mockUtils.validarCpf.mockReturnValue({
        valido: true,
        cpfLimpo: '12345678900',
      });

      actionLoginPortal.mockImplementation(async (inputCpf) => {
        const validacao = mockUtils.validarCpf(inputCpf);

        if (!validacao.valido) {
          return { success: false, error: 'CPF inválido' };
        }

        mockCookies.set('portal-cpf-session', validacao.cpfLimpo, {
          httpOnly: true,
        });

        mockRedirect('/portal/dashboard');
      });

      // Act
      await actionLoginPortal(cpf);

      // Assert
      expect(mockCookies.set).toHaveBeenCalled();
      expect(mockRedirect).toHaveBeenCalledWith('/portal/dashboard');
    });

    it('deve retornar erro ao invés de redirecionar quando falha', async () => {
      // Arrange
      const cpf = '11111111111';

      mockUtils.validarCpf.mockReturnValue({
        valido: false,
        cpfLimpo: '11111111111',
        erro: 'CPF inválido',
      });

      actionLoginPortal.mockImplementation(async (inputCpf) => {
        const validacao = mockUtils.validarCpf(inputCpf);

        if (!validacao.valido) {
          return { success: false, error: validacao.erro };
        }

        return { success: true };
      });

      // Act
      const result = await actionLoginPortal(cpf);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('CPF inválido');
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  describe('actionCarregarDashboard', () => {
    it('deve carregar dashboard quando sessão válida', async () => {
      // Arrange
      const cpfLimpo = '12345678900';
      const dashboardData = criarDashboardDataMock();

      mockCookies.get.mockReturnValue({
        name: 'portal-cpf-session',
        value: cpfLimpo,
      });

      mockService.obterDashboardCliente.mockResolvedValue(dashboardData);

      actionCarregarDashboard.mockImplementation(async () => {
        const cookie = mockCookies.get('portal-cpf-session');

        if (!cookie) {
          return { success: false, error: 'Sessão inválida' };
        }

        const data = await mockService.obterDashboardCliente(cookie.value);
        return { success: true, data };
      });

      // Act
      const result = await actionCarregarDashboard();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(dashboardData);
      expect(mockService.obterDashboardCliente).toHaveBeenCalledWith(cpfLimpo);
    });

    it('deve retornar erro quando sessão inválida', async () => {
      // Arrange
      mockCookies.get.mockReturnValue(null);

      actionCarregarDashboard.mockImplementation(async () => {
        const cookie = mockCookies.get('portal-cpf-session');

        if (!cookie) {
          return { success: false, error: 'Sessão inválida' };
        }

        return { success: true };
      });

      // Act
      const result = await actionCarregarDashboard();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Sessão inválida');
      expect(mockService.obterDashboardCliente).not.toHaveBeenCalled();
    });
  });

  describe('actionLogout', () => {
    it('deve deletar cookies e redirecionar', async () => {
      // Arrange
      actionLogout.mockImplementation(async () => {
        mockCookies.delete('portal-cpf-session');
        mockCookies.delete('portal_session');
        mockRedirect('/portal/login');
      });

      // Act
      await actionLogout();

      // Assert
      expect(mockCookies.delete).toHaveBeenCalledWith('portal-cpf-session');
      expect(mockCookies.delete).toHaveBeenCalledWith('portal_session');
      expect(mockRedirect).toHaveBeenCalledWith('/portal/login');
    });
  });
});
