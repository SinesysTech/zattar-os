/**
 * Testes Unitários para PWA Utils
 *
 * Valida funções de Progressive Web App
 */

// Don't import at top level - we'll dynamically import in tests
type PWAUtils = typeof import('@/lib/pwa-utils');

// Helper type for global object with window and navigator
interface GlobalWithWindow extends Omit<typeof globalThis, 'window' | 'navigator'> {
  window?: Window & {
    isSecureContext?: boolean;
    location?: Location | { hostname: string };
    matchMedia?: (query: string) => MediaQueryList;
    navigator?: Navigator & { standalone?: boolean };
  };
  navigator?: Navigator & {
    standalone?: boolean;
    serviceWorker?: ServiceWorkerRegistration;
  };
}

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
    const globalWithWindow = global as GlobalWithWindow;
    if (globalWithWindow.window) {
      globalWithWindow.window.isSecureContext = true;
    }
    if (originalWindow?.location && globalWithWindow.window) {
      try {
        globalWithWindow.window.location = originalWindow.location as Location;
      } catch (_e) {
        // Ignore - JSDOM may not allow this
      }
    }
  });

  afterEach(() => {
    const globalWithWindow = global as GlobalWithWindow;
    // Restore original location object if it was deleted
    if (originalWindow && originalWindow.location && globalWithWindow.window && !globalWithWindow.window.location) {
      try {
        globalWithWindow.window.location = originalWindow.location as Location;
      } catch (_e) {
        // Ignore - JSDOM may not allow this
      }
    }

    // Restore navigator - need to delete error-throwing getters first
    try {
      delete globalWithWindow.navigator;
    } catch (_e) {
      // Ignore
    }
    try {
      globalWithWindow.navigator = originalNavigator as Navigator;
    } catch (_e) {
      // Ignore
    }
  });

  describe('isSecureContext', () => {
    it.skip('deve retornar false quando window undefined (SSR)', async () => {
      // JSDOM always has window defined, can't test typeof window === 'undefined'
      const globalWithWindow = global as GlobalWithWindow;
      delete globalWithWindow.window;
      pwaUtils = await import('@/lib/pwa-utils');
      expect(pwaUtils.isSecureContext()).toBe(false);
    });

    it('deve retornar true quando window.isSecureContext é true', async () => {
      const globalWithWindow = global as GlobalWithWindow;
      if (!globalWithWindow.window) {
        globalWithWindow.window = {} as GlobalWithWindow['window'];
      }
      globalWithWindow.window.isSecureContext = true;
      delete globalWithWindow.window.location;
      globalWithWindow.window.location = { hostname: 'example.com' } as Location;
      pwaUtils = await import('@/lib/pwa-utils');
      expect(pwaUtils.isSecureContext()).toBe(true);
    });

    it('deve retornar true quando hostname é localhost', async () => {
      const globalWithWindow = global as GlobalWithWindow;
      if (!globalWithWindow.window) {
        globalWithWindow.window = {} as GlobalWithWindow['window'];
      }
      globalWithWindow.window.isSecureContext = false;
      delete globalWithWindow.window.location;
      globalWithWindow.window.location = { hostname: 'localhost' } as Location;
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

      const globalWithWindow = global as GlobalWithWindow;
      if (!globalWithWindow.window) {
        globalWithWindow.window = {} as GlobalWithWindow['window'];
      }
      delete globalWithWindow.window.isSecureContext;
      delete globalWithWindow.window.location;

      globalWithWindow.window.isSecureContext = false;
      globalWithWindow.window.location = mockLocation as Location;

      pwaUtils = await import('@/lib/pwa-utils');
      expect(pwaUtils.isSecureContext()).toBe(false);
    });
  });

  describe('isPWAInstalled', () => {
    it.skip('deve retornar false quando window undefined (SSR)', async () => {
      // JSDOM always has window defined, can't test typeof window === 'undefined'
      const globalWithWindow = global as GlobalWithWindow;
      delete globalWithWindow.window;
      pwaUtils = await import('@/lib/pwa-utils');
      expect(pwaUtils.isPWAInstalled()).toBe(false);
    });

    it('deve retornar true quando display-mode é standalone', async () => {
      const globalWithWindow = global as GlobalWithWindow;
      const mockMatchMedia = jest.fn().mockReturnValue({ matches: true } as MediaQueryList);
      if (!globalWithWindow.window) {
        globalWithWindow.window = {} as GlobalWithWindow['window'];
      }
      globalWithWindow.window.matchMedia = mockMatchMedia;
      globalWithWindow.window.navigator = {} as Navigator;
      pwaUtils = await import('@/lib/pwa-utils');

      expect(pwaUtils.isPWAInstalled()).toBe(true);
      expect(mockMatchMedia).toHaveBeenCalledWith('(display-mode: standalone)');
    });

    it('deve retornar true quando iOS standalone mode', async () => {
      const globalWithWindow = global as GlobalWithWindow;
      const mockMatchMedia = jest.fn().mockReturnValue({ matches: false } as MediaQueryList);
      if (!globalWithWindow.window) {
        globalWithWindow.window = {} as GlobalWithWindow['window'];
      }
      globalWithWindow.window.matchMedia = mockMatchMedia;
      globalWithWindow.navigator = { standalone: true } as Navigator;
      globalWithWindow.window.navigator = globalWithWindow.navigator;
      pwaUtils = await import('@/lib/pwa-utils');

      expect(pwaUtils.isPWAInstalled()).toBe(true);
    });

    it('deve retornar false quando não instalado', async () => {
      const globalWithWindow = global as GlobalWithWindow;
      const mockMatchMedia = jest.fn().mockReturnValue({ matches: false } as MediaQueryList);
      if (!globalWithWindow.window) {
        globalWithWindow.window = {} as GlobalWithWindow['window'];
      }
      globalWithWindow.window.matchMedia = mockMatchMedia;
      globalWithWindow.window.navigator = { standalone: false } as Navigator;
      pwaUtils = await import('@/lib/pwa-utils');

      expect(pwaUtils.isPWAInstalled()).toBe(false);
    });

    it('deve retornar false e logar erro quando matchMedia lança exceção', async () => {
      const globalWithWindow = global as GlobalWithWindow;
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const mockMatchMedia = jest.fn().mockImplementation(() => {
        throw new Error('matchMedia error');
      });
      if (!globalWithWindow.window) {
        globalWithWindow.window = {} as GlobalWithWindow['window'];
      }
      globalWithWindow.window.matchMedia = mockMatchMedia;
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
      const globalWithWindow = global as GlobalWithWindow;
      delete globalWithWindow.window;
      pwaUtils = await import('@/lib/pwa-utils');
      expect(pwaUtils.isPWASupported()).toBe(false);
    });

    it('deve retornar true quando serviceWorker está disponível', async () => {
      const globalWithWindow = global as GlobalWithWindow;
      if (!globalWithWindow.navigator) {
        globalWithWindow.navigator = {} as Navigator;
      }
      globalWithWindow.navigator.serviceWorker = {} as ServiceWorkerRegistration;
      pwaUtils = await import('@/lib/pwa-utils');

      expect(pwaUtils.isPWASupported()).toBe(true);
    });

    it('deve retornar false quando serviceWorker não disponível', async () => {
      const globalWithWindow = global as GlobalWithWindow;
      if (globalWithWindow.navigator) {
        delete globalWithWindow.navigator.serviceWorker;
      }
      pwaUtils = await import('@/lib/pwa-utils');

      expect(pwaUtils.isPWASupported()).toBe(false);
    });

    it('deve retornar false e logar erro quando verificação lança exceção', async () => {
      const globalWithWindow = global as GlobalWithWindow;
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Force error when accessing navigator
      delete globalWithWindow.navigator;
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
      const globalWithWindow = global as GlobalWithWindow;
      delete globalWithWindow.window;
      pwaUtils = await import('@/lib/pwa-utils');
      expect(pwaUtils.getInstallationSource()).toBe('browser');
    });

    it('deve retornar "standalone" quando display-mode é standalone', async () => {
      const globalWithWindow = global as GlobalWithWindow;
      const mockMatchMedia = jest.fn().mockImplementation((query: string) => {
        if (query === '(display-mode: standalone)') {
          return { matches: true } as MediaQueryList;
        }
        return { matches: false } as MediaQueryList;
      });
      if (!globalWithWindow.window) {
        globalWithWindow.window = {} as GlobalWithWindow['window'];
      }
      globalWithWindow.window.matchMedia = mockMatchMedia;
      pwaUtils = await import('@/lib/pwa-utils');

      expect(pwaUtils.getInstallationSource()).toBe('standalone');
    });

    it('deve retornar "homescreen" quando display-mode é minimal-ui', async () => {
      const globalWithWindow = global as GlobalWithWindow;
      const mockMatchMedia = jest.fn().mockImplementation((query: string) => {
        if (query === '(display-mode: standalone)') {
          return { matches: false } as MediaQueryList;
        }
        if (query === '(display-mode: minimal-ui)') {
          return { matches: true } as MediaQueryList;
        }
        return { matches: false } as MediaQueryList;
      });
      if (!globalWithWindow.window) {
        globalWithWindow.window = {} as GlobalWithWindow['window'];
      }
      globalWithWindow.window.matchMedia = mockMatchMedia;
      pwaUtils = await import('@/lib/pwa-utils');

      expect(pwaUtils.getInstallationSource()).toBe('homescreen');
    });

    it('deve retornar "browser" quando não instalado', async () => {
      const globalWithWindow = global as GlobalWithWindow;
      const mockMatchMedia = jest.fn().mockReturnValue({ matches: false } as MediaQueryList);
      if (!globalWithWindow.window) {
        globalWithWindow.window = {} as GlobalWithWindow['window'];
      }
      globalWithWindow.window.matchMedia = mockMatchMedia;
      pwaUtils = await import('@/lib/pwa-utils');

      expect(pwaUtils.getInstallationSource()).toBe('browser');
    });

    it('deve retornar "browser" e logar erro quando matchMedia lança exceção', async () => {
      const globalWithWindow = global as GlobalWithWindow;
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const mockMatchMedia = jest.fn().mockImplementation(() => {
        throw new Error('matchMedia error');
      });
      if (!globalWithWindow.window) {
        globalWithWindow.window = {} as GlobalWithWindow['window'];
      }
      globalWithWindow.window.matchMedia = mockMatchMedia;
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
      const globalWithWindow = global as GlobalWithWindow;
      const mockMatchMedia = jest.fn().mockReturnValue({ matches: true } as MediaQueryList);
      if (!globalWithWindow.window) {
        globalWithWindow.window = {} as GlobalWithWindow['window'];
      }
      globalWithWindow.window.matchMedia = mockMatchMedia;
      globalWithWindow.window.isSecureContext = true;
      globalWithWindow.window.navigator = { standalone: false } as Navigator;
      if (!globalWithWindow.navigator) {
        globalWithWindow.navigator = {} as Navigator;
      }
      globalWithWindow.navigator.serviceWorker = {} as ServiceWorkerRegistration;
      pwaUtils = await import('@/lib/pwa-utils');

      expect(pwaUtils.isPWAInstalled()).toBe(true);
      expect(pwaUtils.isPWASupported()).toBe(true);
      expect(pwaUtils.isSecureContext()).toBe(true);
      expect(pwaUtils.getInstallationSource()).toBe('standalone');
    });

    it('deve detectar navegador normal corretamente', async () => {
      const globalWithWindow = global as GlobalWithWindow;
      const mockMatchMedia = jest.fn().mockReturnValue({ matches: false } as MediaQueryList);
      if (!globalWithWindow.window) {
        globalWithWindow.window = {} as GlobalWithWindow['window'];
      }
      globalWithWindow.window.matchMedia = mockMatchMedia;
      globalWithWindow.window.isSecureContext = true;
      globalWithWindow.window.navigator = { standalone: false } as Navigator;
      if (!globalWithWindow.navigator) {
        globalWithWindow.navigator = {} as Navigator;
      }
      globalWithWindow.navigator.serviceWorker = {} as ServiceWorkerRegistration;
      pwaUtils = await import('@/lib/pwa-utils');

      expect(pwaUtils.isPWAInstalled()).toBe(false);
      expect(pwaUtils.isPWASupported()).toBe(true);
      expect(pwaUtils.isSecureContext()).toBe(true);
      expect(pwaUtils.getInstallationSource()).toBe('browser');
    });

    it('deve lidar com ambiente de desenvolvimento (localhost)', async () => {
      const globalWithWindow = global as GlobalWithWindow;
      if (!globalWithWindow.window) {
        globalWithWindow.window = {} as GlobalWithWindow['window'];
      }
      globalWithWindow.window.isSecureContext = false;
      delete globalWithWindow.window.location;
      globalWithWindow.window.location = { hostname: 'localhost' } as Location;
      pwaUtils = await import('@/lib/pwa-utils');

      expect(pwaUtils.isSecureContext()).toBe(true);
    });

    it('deve detectar suporte em navegadores modernos', async () => {
      const globalWithWindow = global as GlobalWithWindow;
      if (!globalWithWindow.navigator) {
        globalWithWindow.navigator = {} as Navigator;
      }
      globalWithWindow.navigator.serviceWorker = {
        register: jest.fn(),
        ready: Promise.resolve({} as ServiceWorkerRegistration),
      } as unknown as ServiceWorkerRegistration;
      pwaUtils = await import('@/lib/pwa-utils');

      expect(pwaUtils.isPWASupported()).toBe(true);
    });
  });
});
