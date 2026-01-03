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
  const originalWindow = global.window;
  const originalNavigator = global.navigator;

  afterEach(() => {
    global.window = originalWindow;
    global.navigator = originalNavigator;
    jest.restoreAllMocks();
  });

  describe('isSecureContext', () => {
    it('deve retornar false quando window undefined (SSR)', () => {
      // @ts-expect-error
      delete global.window;
      expect(isSecureContext()).toBe(false);
    });

    it('deve retornar true quando window.isSecureContext é true', () => {
      Object.defineProperty(global.window, 'isSecureContext', {
        value: true,
        writable: true,
      });

      expect(isSecureContext()).toBe(true);
    });

    it('deve retornar true quando hostname é localhost', () => {
      Object.defineProperty(global.window, 'isSecureContext', {
        value: false,
        writable: true,
      });
      Object.defineProperty(global.window, 'location', {
        value: { hostname: 'localhost' },
        writable: true,
      });

      expect(isSecureContext()).toBe(true);
    });

    it('deve retornar false quando não é HTTPS nem localhost', () => {
      Object.defineProperty(global.window, 'isSecureContext', {
        value: false,
        writable: true,
      });
      Object.defineProperty(global.window, 'location', {
        value: { hostname: 'example.com' },
        writable: true,
      });

      expect(isSecureContext()).toBe(false);
    });
  });

  describe('isPWAInstalled', () => {
    it('deve retornar false quando window undefined (SSR)', () => {
      // @ts-expect-error
      delete global.window;
      expect(isPWAInstalled()).toBe(false);
    });

    it('deve retornar true quando display-mode é standalone', () => {
      const mockMatchMedia = jest.fn().mockReturnValue({ matches: true });
      Object.defineProperty(global.window, 'matchMedia', {
        value: mockMatchMedia,
        writable: true,
      });

      expect(isPWAInstalled()).toBe(true);
      expect(mockMatchMedia).toHaveBeenCalledWith('(display-mode: standalone)');
    });

    it('deve retornar true quando iOS standalone mode', () => {
      const mockMatchMedia = jest.fn().mockReturnValue({ matches: false });
      Object.defineProperty(global.window, 'matchMedia', {
        value: mockMatchMedia,
        writable: true,
      });
      Object.defineProperty(global.window.navigator, 'standalone', {
        value: true,
        writable: true,
      });

      expect(isPWAInstalled()).toBe(true);
    });

    it('deve retornar false quando não instalado', () => {
      const mockMatchMedia = jest.fn().mockReturnValue({ matches: false });
      Object.defineProperty(global.window, 'matchMedia', {
        value: mockMatchMedia,
        writable: true,
      });
      Object.defineProperty(global.window.navigator, 'standalone', {
        value: false,
        writable: true,
      });

      expect(isPWAInstalled()).toBe(false);
    });

    it('deve retornar false e logar erro quando matchMedia lança exceção', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const mockMatchMedia = jest.fn().mockImplementation(() => {
        throw new Error('matchMedia error');
      });
      Object.defineProperty(global.window, 'matchMedia', {
        value: mockMatchMedia,
        writable: true,
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
      // @ts-expect-error
      delete global.window;
      expect(isPWASupported()).toBe(false);
    });

    it('deve retornar true quando serviceWorker está disponível', () => {
      Object.defineProperty(global.navigator, 'serviceWorker', {
        value: {},
        writable: true,
        configurable: true,
      });

      expect(isPWASupported()).toBe(true);
    });

    it('deve retornar false quando serviceWorker não disponível', () => {
      const nav = global.navigator as any;
      delete nav.serviceWorker;

      expect(isPWASupported()).toBe(false);
    });

    it('deve retornar false e logar erro quando verificação lança exceção', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Forçar erro ao acessar navigator
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
      // @ts-expect-error
      delete global.window;
      expect(getInstallationSource()).toBe('browser');
    });

    it('deve retornar "standalone" quando display-mode é standalone', () => {
      const mockMatchMedia = jest.fn().mockImplementation((query) => {
        if (query === '(display-mode: standalone)') {
          return { matches: true };
        }
        return { matches: false };
      });
      Object.defineProperty(global.window, 'matchMedia', {
        value: mockMatchMedia,
        writable: true,
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
      Object.defineProperty(global.window, 'matchMedia', {
        value: mockMatchMedia,
        writable: true,
      });

      expect(getInstallationSource()).toBe('homescreen');
    });

    it('deve retornar "browser" quando não instalado', () => {
      const mockMatchMedia = jest.fn().mockReturnValue({ matches: false });
      Object.defineProperty(global.window, 'matchMedia', {
        value: mockMatchMedia,
        writable: true,
      });

      expect(getInstallationSource()).toBe('browser');
    });

    it('deve retornar "browser" e logar erro quando matchMedia lança exceção', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const mockMatchMedia = jest.fn().mockImplementation(() => {
        throw new Error('matchMedia error');
      });
      Object.defineProperty(global.window, 'matchMedia', {
        value: mockMatchMedia,
        writable: true,
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
      Object.defineProperty(global.window, 'matchMedia', {
        value: mockMatchMedia,
        writable: true,
      });
      Object.defineProperty(global.window, 'isSecureContext', {
        value: true,
        writable: true,
      });
      Object.defineProperty(global.navigator, 'serviceWorker', {
        value: {},
        writable: true,
        configurable: true,
      });

      expect(isPWAInstalled()).toBe(true);
      expect(isPWASupported()).toBe(true);
      expect(isSecureContext()).toBe(true);
      expect(getInstallationSource()).toBe('standalone');
    });

    it('deve detectar navegador normal corretamente', () => {
      const mockMatchMedia = jest.fn().mockReturnValue({ matches: false });
      Object.defineProperty(global.window, 'matchMedia', {
        value: mockMatchMedia,
        writable: true,
      });
      Object.defineProperty(global.window, 'isSecureContext', {
        value: true,
        writable: true,
      });
      Object.defineProperty(global.navigator, 'serviceWorker', {
        value: {},
        writable: true,
        configurable: true,
      });

      expect(isPWAInstalled()).toBe(false);
      expect(isPWASupported()).toBe(true);
      expect(isSecureContext()).toBe(true);
      expect(getInstallationSource()).toBe('browser');
    });

    it('deve lidar com ambiente de desenvolvimento (localhost)', () => {
      Object.defineProperty(global.window, 'isSecureContext', {
        value: false,
        writable: true,
      });
      Object.defineProperty(global.window, 'location', {
        value: { hostname: 'localhost' },
        writable: true,
      });

      expect(isSecureContext()).toBe(true);
    });

    it('deve detectar suporte em navegadores modernos', () => {
      Object.defineProperty(global.navigator, 'serviceWorker', {
        value: {
          register: jest.fn(),
          ready: Promise.resolve(),
        },
        writable: true,
        configurable: true,
      });

      expect(isPWASupported()).toBe(true);
    });
  });
});
