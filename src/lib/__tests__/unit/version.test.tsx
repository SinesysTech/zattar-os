/**
 * Testes Unitários para utilitários de versão de build
 */

import {
  BUILD_ID,
  checkVersionMismatch,
  updateStoredVersion,
  clearStoredVersion,
  clearServiceWorkerCache,
  isServerActionVersionError,
  handleVersionMismatchError,
} from "../../version";

const BUILD_ID_STORAGE_KEY = "__SYNTHROPIC_BUILD_ID__";

describe("version utils", () => {
  beforeAll(() => {
    // Cannot mock window directly in JSDOM easily.
    // Since we need to test 'typeof window === "undefined"',
    // we will run those tests specifically by deleting global.window temporarily via Object.defineProperty fallback.
    // However, jest-environment-jsdom makes 'window' non-configurable.
    // Instead of fighting JSDOM, let's just test the branches assuming window is defined.
    // For the window missing branch, it's a simple return false/void anyway.
  });

  afterEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
  });

  describe("checkVersionMismatch", () => {
    it("returns false and sets storage on first visit", () => {
      expect(sessionStorage.getItem(BUILD_ID_STORAGE_KEY)).toBeNull();

      const result = checkVersionMismatch();

      expect(result).toBe(false);
      expect(sessionStorage.getItem(BUILD_ID_STORAGE_KEY)).toBe(BUILD_ID);
    });

    it("returns false when version is unchanged", () => {
      sessionStorage.setItem(BUILD_ID_STORAGE_KEY, BUILD_ID);

      const result = checkVersionMismatch();

      expect(result).toBe(false);
      expect(sessionStorage.getItem(BUILD_ID_STORAGE_KEY)).toBe(BUILD_ID);
    });

    it("returns true when version changes", () => {
      sessionStorage.setItem(BUILD_ID_STORAGE_KEY, "old-build-id");

      const result = checkVersionMismatch();

      expect(result).toBe(true);
      expect(sessionStorage.getItem(BUILD_ID_STORAGE_KEY)).toBe("old-build-id");
    });

    it("returns false when sessionStorage throws an error", () => {
      const spy = jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("Storage unavailable");
      });

      const result = checkVersionMismatch();

      expect(result).toBe(false);
      spy.mockRestore();
    });
  });

  describe("updateStoredVersion", () => {
    it("updates storage with current BUILD_ID", () => {
      sessionStorage.setItem(BUILD_ID_STORAGE_KEY, "old-build");

      updateStoredVersion();

      expect(sessionStorage.getItem(BUILD_ID_STORAGE_KEY)).toBe(BUILD_ID);
    });

    it("ignores errors when sessionStorage throws", () => {
      const spy = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("Storage unavailable");
      });

      expect(() => updateStoredVersion()).not.toThrow();
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe("clearStoredVersion", () => {
    it("removes the item from storage", () => {
      sessionStorage.setItem(BUILD_ID_STORAGE_KEY, "some-build");

      clearStoredVersion();

      expect(sessionStorage.getItem(BUILD_ID_STORAGE_KEY)).toBeNull();
    });

    it("ignores errors when sessionStorage throws", () => {
      const spy = jest.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
        throw new Error("Storage unavailable");
      });

      expect(() => clearStoredVersion()).not.toThrow();
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe("isServerActionVersionError", () => {
    it("returns false for non-Error objects", () => {
      expect(isServerActionVersionError("string error")).toBe(false);
      expect(isServerActionVersionError(123)).toBe(false);
      expect(isServerActionVersionError(null)).toBe(false);
      expect(isServerActionVersionError({})).toBe(false);
    });

    it("returns false for unrelated errors", () => {
      expect(isServerActionVersionError(new Error("Network error"))).toBe(false);
      expect(isServerActionVersionError(new Error("Database connection failed"))).toBe(false);
    });

    it("returns true for 'Failed to find Server Action' error", () => {
      expect(isServerActionVersionError(new Error("Failed to find Server Action - please reload"))).toBe(true);
    });

    it("returns true for 'This request might be from an older...' error", () => {
      expect(isServerActionVersionError(new Error("This request might be from an older or newer deployment. Please try again."))).toBe(true);
    });
  });

  describe("clearServiceWorkerCache", () => {
    let mockKeys: jest.Mock;
    let mockDelete: jest.Mock;

    beforeEach(() => {
      mockKeys = jest.fn().mockResolvedValue(["cache1", "cache2"]);
      mockDelete = jest.fn().mockResolvedValue(true);

      Object.defineProperty(window, "caches", {
        value: {
          keys: mockKeys,
          delete: mockDelete,
        },
        writable: true,
        configurable: true
      });
    });

    afterEach(() => {
      // @ts-expect-error -- caches não é deletável no tipo Window mas é necessário para limpar entre testes
      delete window.caches;
    });

    it("does nothing if caches is undefined in window", async () => {
      // @ts-expect-error -- caches não é deletável no tipo Window mas é necessário para simular ausência
      delete window.caches;

      await clearServiceWorkerCache();
      // shouldn't throw
    });

    it("deletes all caches and updates registrations", async () => {
      const mockPostMessage = jest.fn();
      const mockUpdate = jest.fn().mockResolvedValue(undefined);

      const navSpy = jest.spyOn(window, 'navigator', 'get').mockImplementation(() => ({
        serviceWorker: {
          controller: { postMessage: mockPostMessage },
          getRegistrations: jest.fn().mockResolvedValue([{ update: mockUpdate }])
        }
      } as any));

      await clearServiceWorkerCache();

      expect(mockKeys).toHaveBeenCalled();
      expect(mockDelete).toHaveBeenCalledWith("cache1");
      expect(mockDelete).toHaveBeenCalledWith("cache2");
      expect(mockPostMessage).toHaveBeenCalledWith({ type: "CLEAR_CACHE" });
      expect(mockUpdate).toHaveBeenCalled();

      navSpy.mockRestore();
    });

    it("logs error if an exception is thrown", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      mockKeys.mockRejectedValue(new Error("Cache access denied"));

      await clearServiceWorkerCache();

      expect(consoleSpy).toHaveBeenCalledWith(
        "[Version] Erro ao limpar cache do SW:",
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe("handleVersionMismatchError", () => {
    it("updates version, clears cache and reloads page", async () => {
      const setItemSpy = jest.spyOn(Storage.prototype, "setItem");
      const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

      // It is famously difficult to mock window.location.reload in standard JSDOM.
      // We will intercept the call at the function level by just expecting it throws the specific JSDOM error.
      // But we must suppress the VirtualConsole error that JSDOM emits. We do this by temporarily overriding console.error or catching the error if it bubbles up.

      const originalConsoleError = console.error;
      let errorThrownByReload = false;

      console.error = (msg, ...args) => {
        if (msg && msg.type === "not implemented") {
           errorThrownByReload = true;
           return;
        }
        originalConsoleError(msg, ...args);
      };

      // Mock caches
      Object.defineProperty(window, "caches", {
        value: {
          keys: jest.fn().mockResolvedValue([]),
        },
        writable: true,
        configurable: true
      });

      // Mock navigator for clearServiceWorkerCache
      const originalNavigator = window.navigator;
      Object.defineProperty(window, "navigator", {
        configurable: true,
        value: {
          serviceWorker: {
            controller: { postMessage: jest.fn() },
            getRegistrations: jest.fn().mockResolvedValue([]),
          }
        }
      });

      try {
        await handleVersionMismatchError();
      } catch (e: any) {
        if (e.message && e.message.includes("Not implemented")) {
          errorThrownByReload = true;
        }
      }

      console.error = originalConsoleError;

      expect(consoleSpy).toHaveBeenCalledWith(
        "[Version] Detectada incompatibilidade de versão - recarregando..."
      );
      expect(setItemSpy).toHaveBeenCalledWith(BUILD_ID_STORAGE_KEY, BUILD_ID);
      expect(window.caches.keys).toHaveBeenCalled();

      // It should have either thrown an error caught by try-catch, or intercepted by console.error in VirtualConsole
      expect(errorThrownByReload).toBe(true);

      consoleSpy.mockRestore();

      // Restore
      Object.defineProperty(window, "navigator", {
        configurable: true,
        value: originalNavigator,
      });
    });
  });
});
