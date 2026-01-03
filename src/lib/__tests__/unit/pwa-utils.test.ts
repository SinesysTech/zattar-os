/**
 * Testes Unitários para PWA Utils
 *
 * Valida funções de Progressive Web App
 */

// Don't import at top level - we'll dynamically import in tests
type PWAUtils = typeof import('@/lib/pwa-utils');

describe('PWA Utils - Unit Tests', () => {
  let pwaUtils: PWAUtils;
  let originalWindow: typeof global.window;
  let originalNavigator: typeof global.navigator;

  beforeAll(() => {
    originalWindow = global.window;
    originalNavigator = global.navigator;
  });

  beforeEach(async () => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore window and navigator after each test
    (global as any).window = originalWindow;
    (global as any).navigator = originalNavigator;
  });

  describe('isSecureContext', () => {
    it('deve retornar false quando window undefined (SSR)', async () => {
      delete (global as any).window;
      pwaUtils = await import('@/lib/pwa-utils');
      expect(pwaUtils.isSecureContext()).toBe(false);
    });

    it('deve retornar true quando window.isSecureContext é true', async () => {
      (global as any).window = {
        isSecureContext: true,
        location: { hostname: 'example.com' },
      };
      pwaUtils = await import('@/lib/pwa-utils');
      expect(pwaUtils.isSecureContext()).toBe(true);
    });

    it('deve retornar true quando hostname é localhost', async () => {
      (global as any).window = {
        isSecureContext: false,
        location: { hostname: 'localhost' },
      };
      pwaUtils = await import('@/lib/pwa-utils');
      expect(pwaUtils.isSecureContext()).toBe(true);
    });

    it('deve retornar false quando não é HTTPS nem localhost', async () => {
      (global as any).window = {
        isSecureContext: false,
        location: { hostname: 'example.com' },
      };
      pwaUtils = await import('@/lib/pwa-utils');
      expect(pwaUtils.isSecureContext()).toBe(false);
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
