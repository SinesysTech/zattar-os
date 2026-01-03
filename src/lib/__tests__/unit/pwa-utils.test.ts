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

    // Reset window state to avoid pollution between tests
    (global as any).window.isSecureContext = true;
    if (originalWindow?.location) {
      try {
        (global as any).window.location = originalWindow.location;
      } catch (e) {
        // Ignore - JSDOM may not allow this
      }
    }
  });

  afterEach(() => {
    // Restore original location object if it was deleted
    if (originalWindow && originalWindow.location && !(global as any).window?.location) {
      try {
        (global as any).window.location = originalWindow.location;
      } catch (e) {
        // Ignore - JSDOM may not allow this
      }
    }

    // Restore navigator - need to delete error-throwing getters first
    try {
      delete (global as any).navigator;
    } catch (e) {
      // Ignore
    }
    try {
      (global as any).navigator = originalNavigator;
    } catch (e) {
      // Ignore
    }
  });

  describe('isSecureContext', () => {
    it.skip('deve retornar false quando window undefined (SSR)', async () => {
      // JSDOM always has window defined, can't test typeof window === 'undefined'
      delete (global as any).window;
      pwaUtils = await import('@/lib/pwa-utils');
      expect(pwaUtils.isSecureContext()).toBe(false);
    });

    it('deve retornar true quando window.isSecureContext é true', async () => {
      (global as any).window.isSecureContext = true;
      delete (global as any).window.location;
      (global as any).window.location = { hostname: 'example.com' };
      pwaUtils = await import('@/lib/pwa-utils');
      expect(pwaUtils.isSecureContext()).toBe(true);
    });

    it('deve retornar true quando hostname é localhost', async () => {
      (global as any).window.isSecureContext = false;
      delete (global as any).window.location;
      (global as any).window.location = { hostname: 'localhost' };
      pwaUtils = await import('@/lib/pwa-utils');
      expect(pwaUtils.isSecureContext()).toBe(true);
    });

    it.skip('deve retornar false quando não é HTTPS nem localhost', async () => {
      // JSDOM limitation: window.location cannot be fully mocked to a non-localhost hostname
      // JSDOM always defaults to localhost and resists attempts to change it
      // This test scenario (non-HTTPS, non-localhost) can't be properly tested in JSDOM
      const mockLocation = {
        href: 'http://example.com/',
        protocol: 'http:',
        hostname: 'example.com',
        host: 'example.com',
        port: '',
        pathname: '/',
        search: '',
        hash: ''
      };

      delete (global as any).window.isSecureContext;
      delete (global as any).window.location;

      (global as any).window.isSecureContext = false;
      (global as any).window.location = mockLocation;

      pwaUtils = await import('@/lib/pwa-utils');
      expect(pwaUtils.isSecureContext()).toBe(false);
    });
  });

  describe('isPWAInstalled', () => {
    it.skip('deve retornar false quando window undefined (SSR)', async () => {
      // JSDOM always has window defined, can't test typeof window === 'undefined'
      delete (global as any).window;
      pwaUtils = await import('@/lib/pwa-utils');
      expect(pwaUtils.isPWAInstalled()).toBe(false);
    });

    it('deve retornar true quando display-mode é standalone', async () => {
      const mockMatchMedia = jest.fn().mockReturnValue({ matches: true });
      (global as any).window.matchMedia = mockMatchMedia;
      (global as any).window.navigator = {};
      pwaUtils = await import('@/lib/pwa-utils');

      expect(pwaUtils.isPWAInstalled()).toBe(true);
      expect(mockMatchMedia).toHaveBeenCalledWith('(display-mode: standalone)');
    });

    it('deve retornar true quando iOS standalone mode', async () => {
      const mockMatchMedia = jest.fn().mockReturnValue({ matches: false });
      (global as any).window.matchMedia = mockMatchMedia;
      (global as any).navigator = { standalone: true };
      (global as any).window.navigator = (global as any).navigator;
      pwaUtils = await import('@/lib/pwa-utils');

      expect(pwaUtils.isPWAInstalled()).toBe(true);
    });

    it('deve retornar false quando não instalado', async () => {
      const mockMatchMedia = jest.fn().mockReturnValue({ matches: false });
      (global as any).window.matchMedia = mockMatchMedia;
      (global as any).window.navigator = { standalone: false };
      pwaUtils = await import('@/lib/pwa-utils');

      expect(pwaUtils.isPWAInstalled()).toBe(false);
    });

    it('deve retornar false e logar erro quando matchMedia lança exceção', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const mockMatchMedia = jest.fn().mockImplementation(() => {
        throw new Error('matchMedia error');
      });
      (global as any).window.matchMedia = mockMatchMedia;
      pwaUtils = await import('@/lib/pwa-utils');

      expect(pwaUtils.isPWAInstalled()).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error checking if PWA is installed:',
        expect.any(Error)
      );
    });
  });

  describe('isPWASupported', () => {
    it.skip('deve retornar false quando window undefined (SSR)', async () => {
      // JSDOM always has window defined, can't test typeof window === 'undefined'
      delete (global as any).window;
      pwaUtils = await import('@/lib/pwa-utils');
      expect(pwaUtils.isPWASupported()).toBe(false);
    });

    it('deve retornar true quando serviceWorker está disponível', async () => {
      (global as any).navigator.serviceWorker = {};
      pwaUtils = await import('@/lib/pwa-utils');

      expect(pwaUtils.isPWASupported()).toBe(true);
    });

    it('deve retornar false quando serviceWorker não disponível', async () => {
      delete (global as any).navigator.serviceWorker;
      pwaUtils = await import('@/lib/pwa-utils');

      expect(pwaUtils.isPWASupported()).toBe(false);
    });

    it('deve retornar false e logar erro quando verificação lança exceção', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Force error when accessing navigator
      delete (global as any).navigator;
      Object.defineProperty(global, 'navigator', {
        get: () => {
          throw new Error('Navigator error');
        },
        configurable: true,
      });

      pwaUtils = await import('@/lib/pwa-utils');
      expect(pwaUtils.isPWASupported()).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error checking PWA support:',
        expect.any(Error)
      );
    });
  });

  describe('getInstallationSource', () => {
    it.skip('deve retornar "browser" quando window undefined (SSR)', async () => {
      // JSDOM always has window defined, can't test typeof window === 'undefined'
      delete (global as any).window;
      pwaUtils = await import('@/lib/pwa-utils');
      expect(pwaUtils.getInstallationSource()).toBe('browser');
    });

    it('deve retornar "standalone" quando display-mode é standalone', async () => {
      const mockMatchMedia = jest.fn().mockImplementation((query) => {
        if (query === '(display-mode: standalone)') {
          return { matches: true };
        }
        return { matches: false };
      });
      (global as any).window.matchMedia = mockMatchMedia;
      pwaUtils = await import('@/lib/pwa-utils');

      expect(pwaUtils.getInstallationSource()).toBe('standalone');
    });

    it('deve retornar "homescreen" quando display-mode é minimal-ui', async () => {
      const mockMatchMedia = jest.fn().mockImplementation((query) => {
        if (query === '(display-mode: standalone)') {
          return { matches: false };
        }
        if (query === '(display-mode: minimal-ui)') {
          return { matches: true };
        }
        return { matches: false };
      });
      (global as any).window.matchMedia = mockMatchMedia;
      pwaUtils = await import('@/lib/pwa-utils');

      expect(pwaUtils.getInstallationSource()).toBe('homescreen');
    });

    it('deve retornar "browser" quando não instalado', async () => {
      const mockMatchMedia = jest.fn().mockReturnValue({ matches: false });
      (global as any).window.matchMedia = mockMatchMedia;
      pwaUtils = await import('@/lib/pwa-utils');

      expect(pwaUtils.getInstallationSource()).toBe('browser');
    });

    it('deve retornar "browser" e logar erro quando matchMedia lança exceção', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const mockMatchMedia = jest.fn().mockImplementation(() => {
        throw new Error('matchMedia error');
      });
      (global as any).window.matchMedia = mockMatchMedia;
      pwaUtils = await import('@/lib/pwa-utils');

      expect(pwaUtils.getInstallationSource()).toBe('browser');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error detecting installation source:',
        expect.any(Error)
      );
    });
  });

  describe('Integração - Cenários Reais', () => {
    it('deve detectar PWA instalado corretamente', async () => {
      const mockMatchMedia = jest.fn().mockReturnValue({ matches: true });
      (global as any).window.matchMedia = mockMatchMedia;
      (global as any).window.isSecureContext = true;
      (global as any).window.navigator = { standalone: false };
      (global as any).navigator.serviceWorker = {};
      pwaUtils = await import('@/lib/pwa-utils');

      expect(pwaUtils.isPWAInstalled()).toBe(true);
      expect(pwaUtils.isPWASupported()).toBe(true);
      expect(pwaUtils.isSecureContext()).toBe(true);
      expect(pwaUtils.getInstallationSource()).toBe('standalone');
    });

    it('deve detectar navegador normal corretamente', async () => {
      const mockMatchMedia = jest.fn().mockReturnValue({ matches: false });
      (global as any).window.matchMedia = mockMatchMedia;
      (global as any).window.isSecureContext = true;
      (global as any).window.navigator = { standalone: false };
      (global as any).navigator.serviceWorker = {};
      pwaUtils = await import('@/lib/pwa-utils');

      expect(pwaUtils.isPWAInstalled()).toBe(false);
      expect(pwaUtils.isPWASupported()).toBe(true);
      expect(pwaUtils.isSecureContext()).toBe(true);
      expect(pwaUtils.getInstallationSource()).toBe('browser');
    });

    it('deve lidar com ambiente de desenvolvimento (localhost)', async () => {
      (global as any).window.isSecureContext = false;
      delete (global as any).window.location;
      (global as any).window.location = { hostname: 'localhost' };
      pwaUtils = await import('@/lib/pwa-utils');

      expect(pwaUtils.isSecureContext()).toBe(true);
    });

    it('deve detectar suporte em navegadores modernos', async () => {
      (global as any).navigator.serviceWorker = {
        register: jest.fn(),
        ready: Promise.resolve(),
      };
      pwaUtils = await import('@/lib/pwa-utils');

      expect(pwaUtils.isPWASupported()).toBe(true);
    });
  });
});
