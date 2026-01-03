/**
 * Testes Unitários para PWA Utils
 *
 * Valida funções de Progressive Web App
 */

import {
  isSecureContext,
  isPWAInstalled,
  isPWASupported,
  getInstallationSource,
} from '@/lib/pwa-utils';

describe('PWA Utils - Unit Tests', () => {
  // Store original values
  let originalWindow: typeof globalThis.window;
  let originalNavigator: typeof globalThis.navigator;

  // Helper to set window mock
  const setWindowMock = (value: any) => {
    delete (global as any).window;
    if (value !== undefined) {
      Object.defineProperty(global, 'window', {
        value,
        writable: true,
        configurable: true,
      });
    }
  };

  // Helper to set navigator mock
  const setNavigatorMock = (value: any) => {
    delete (global as any).navigator;
    if (value !== undefined) {
      Object.defineProperty(global, 'navigator', {
        value,
        writable: true,
        configurable: true,
      });
    }
  };

  beforeEach(() => {
    // Save original values
    try {
      originalWindow = global.window;
    } catch (e) {
      originalWindow = undefined;
    }

    try {
      originalNavigator = global.navigator;
    } catch (e) {
      originalNavigator = undefined;
    }

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original values
    try {
      if (originalWindow !== undefined) {
        Object.defineProperty(global, 'window', {
          value: originalWindow,
          writable: true,
          configurable: true,
        });
      }
    } catch (e) {
      // Ignore errors during restoration
    }

    try {
      if (originalNavigator !== undefined) {
        Object.defineProperty(global, 'navigator', {
          value: originalNavigator,
          writable: true,
          configurable: true,
        });
      }
    } catch (e) {
      // Ignore errors during restoration
    }

    jest.restoreAllMocks();
  });

  describe('isSecureContext', () => {
    it('deve retornar false quando window undefined (SSR)', () => {
      setWindowMock(undefined);
      expect(isSecureContext()).toBe(false);
    });

    it('deve retornar true quando window.isSecureContext é true', () => {
      setWindowMock({
        isSecureContext: true,
      });

      expect(isSecureContext()).toBe(true);
    });

    it('deve retornar true quando hostname é localhost', () => {
      setWindowMock({
        isSecureContext: false,
        location: { hostname: 'localhost' },
      });

      expect(isSecureContext()).toBe(true);
    });

    it('deve retornar false quando não é HTTPS nem localhost', () => {
      setWindowMock({
        isSecureContext: false,
        location: { hostname: 'example.com' },
      });

      expect(isSecureContext()).toBe(false);
    });
  });

  describe('isPWAInstalled', () => {
    it('deve retornar false quando window undefined (SSR)', () => {
      setWindowMock(undefined);
      expect(isPWAInstalled()).toBe(false);
    });

    it('deve retornar true quando display-mode é standalone', () => {
      const mockMatchMedia = jest.fn().mockReturnValue({ matches: true });
      setWindowMock({
        matchMedia: mockMatchMedia,
        navigator: {},
      });

      expect(isPWAInstalled()).toBe(true);
      expect(mockMatchMedia).toHaveBeenCalledWith('(display-mode: standalone)');
    });

    it('deve retornar true quando iOS standalone mode', () => {
      const mockMatchMedia = jest.fn().mockReturnValue({ matches: false });
      setWindowMock({
        matchMedia: mockMatchMedia,
        navigator: { standalone: true },
      });

      expect(isPWAInstalled()).toBe(true);
    });

    it('deve retornar false quando não instalado', () => {
      const mockMatchMedia = jest.fn().mockReturnValue({ matches: false });
      setWindowMock({
        matchMedia: mockMatchMedia,
        navigator: { standalone: false },
      });

      expect(isPWAInstalled()).toBe(false);
    });

    it('deve retornar false e logar erro quando matchMedia lança exceção', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const mockMatchMedia = jest.fn().mockImplementation(() => {
        throw new Error('matchMedia error');
      });
      setWindowMock({
        matchMedia: mockMatchMedia,
      });

      expect(isPWAInstalled()).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error checking if PWA is installed:',
        expect.any(Error)
      );
    });
  });

  describe('isPWASupported', () => {
    it('deve retornar false quando window undefined (SSR)', () => {
      setWindowMock(undefined);
      expect(isPWASupported()).toBe(false);
    });

    it('deve retornar true quando serviceWorker está disponível', () => {
      setNavigatorMock({
        serviceWorker: {},
      });

      expect(isPWASupported()).toBe(true);
    });

    it('deve retornar false quando serviceWorker não disponível', () => {
      setNavigatorMock({});

      expect(isPWASupported()).toBe(false);
    });

    it('deve retornar false e logar erro quando verificação lança exceção', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Force error when accessing navigator
      delete (global as any).navigator;
      Object.defineProperty(global, 'navigator', {
        get: () => {
          throw new Error('Navigator error');
        },
        configurable: true,
      });

      expect(isPWASupported()).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error checking PWA support:',
        expect.any(Error)
      );
    });
  });

  describe('getInstallationSource', () => {
    it('deve retornar "browser" quando window undefined (SSR)', () => {
      setWindowMock(undefined);
      expect(getInstallationSource()).toBe('browser');
    });

    it('deve retornar "standalone" quando display-mode é standalone', () => {
      const mockMatchMedia = jest.fn().mockImplementation((query) => {
        if (query === '(display-mode: standalone)') {
          return { matches: true };
        }
        return { matches: false };
      });
      setWindowMock({
        matchMedia: mockMatchMedia,
      });

      expect(getInstallationSource()).toBe('standalone');
    });

    it('deve retornar "homescreen" quando display-mode é minimal-ui', () => {
      const mockMatchMedia = jest.fn().mockImplementation((query) => {
        if (query === '(display-mode: standalone)') {
          return { matches: false };
        }
        if (query === '(display-mode: minimal-ui)') {
          return { matches: true };
        }
        return { matches: false };
      });
      setWindowMock({
        matchMedia: mockMatchMedia,
      });

      expect(getInstallationSource()).toBe('homescreen');
    });

    it('deve retornar "browser" quando não instalado', () => {
      const mockMatchMedia = jest.fn().mockReturnValue({ matches: false });
      setWindowMock({
        matchMedia: mockMatchMedia,
      });

      expect(getInstallationSource()).toBe('browser');
    });

    it('deve retornar "browser" e logar erro quando matchMedia lança exceção', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const mockMatchMedia = jest.fn().mockImplementation(() => {
        throw new Error('matchMedia error');
      });
      setWindowMock({
        matchMedia: mockMatchMedia,
      });

      expect(getInstallationSource()).toBe('browser');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error detecting installation source:',
        expect.any(Error)
      );
    });
  });

  describe('Integração - Cenários Reais', () => {
    it('deve detectar PWA instalado corretamente', () => {
      const mockMatchMedia = jest.fn().mockReturnValue({ matches: true });
      setWindowMock({
        matchMedia: mockMatchMedia,
        isSecureContext: true,
        navigator: { standalone: false },
      });
      setNavigatorMock({
        serviceWorker: {},
      });

      expect(isPWAInstalled()).toBe(true);
      expect(isPWASupported()).toBe(true);
      expect(isSecureContext()).toBe(true);
      expect(getInstallationSource()).toBe('standalone');
    });

    it('deve detectar navegador normal corretamente', () => {
      const mockMatchMedia = jest.fn().mockReturnValue({ matches: false });
      setWindowMock({
        matchMedia: mockMatchMedia,
        isSecureContext: true,
        navigator: { standalone: false },
      });
      setNavigatorMock({
        serviceWorker: {},
      });

      expect(isPWAInstalled()).toBe(false);
      expect(isPWASupported()).toBe(true);
      expect(isSecureContext()).toBe(true);
      expect(getInstallationSource()).toBe('browser');
    });

    it('deve lidar com ambiente de desenvolvimento (localhost)', () => {
      setWindowMock({
        isSecureContext: false,
        location: { hostname: 'localhost' },
      });

      expect(isSecureContext()).toBe(true);
    });

    it('deve detectar suporte em navegadores modernos', () => {
      setNavigatorMock({
        serviceWorker: {
          register: jest.fn(),
          ready: Promise.resolve(),
        },
      });

      expect(isPWASupported()).toBe(true);
    });
  });
});
