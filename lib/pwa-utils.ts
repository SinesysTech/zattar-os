/**
 * Utility functions for Progressive Web App (PWA) functionalities.
 * All functions include error handling and are type-safe.
 */

/**
 * Checks if the app is running as an installed PWA.
 * @returns {boolean} True if the app is installed as a PWA, false otherwise.
 */
export function isPWAInstalled(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    // Check for standalone display mode (modern browsers)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    // Check for iOS standalone mode
    const isIOSStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    return isStandalone || isIOSStandalone;
  } catch (error) {
    console.error('Error checking if PWA is installed:', error);
    return false;
  }
}

/**
 * Checks if the browser supports PWA features.
 * @returns {boolean} True if PWA is supported, false otherwise.
 */
export function isPWASupported(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    return 'serviceWorker' in navigator;
  } catch (error) {
    console.error('Error checking PWA support:', error);
    return false;
  }
}

/**
 * Registers the service worker manually if needed.
 * Useful for special cases where automatic registration is not desired.
 * @returns {Promise<ServiceWorkerRegistration | null>} The service worker registration or null if failed.
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.error('Service worker not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service worker registered successfully:', registration);
    return registration;
  } catch (error) {
    console.error('Service worker registration failed:', error);
    return null;
  }
}

/**
 * Unregisters all service workers.
 * Useful for debugging or resetting PWA state.
 * @returns {Promise<boolean>} True if unregistration was successful, false otherwise.
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.error('Service worker not supported');
    return false;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
    }
    console.log('Service workers unregistered successfully');
    return true;
  } catch (error) {
    console.error('Service worker unregistration failed:', error);
    return false;
  }
}

/**
 * Forces a check for service worker updates.
 * @returns {Promise<boolean>} True if update check was initiated successfully, false otherwise.
 */
export async function checkForUpdates(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.error('Service worker not supported');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
    console.log('Service worker update check initiated');
    return true;
  } catch (error) {
    console.error('Check for updates failed:', error);
    return false;
  }
}

/**
 * Detects the installation source of the app.
 * @returns {'browser' | 'homescreen' | 'standalone'} The installation source.
 */
export function getInstallationSource(): 'browser' | 'homescreen' | 'standalone' {
  if (typeof window === 'undefined') return 'browser';

  try {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return 'standalone';
    } else if (window.matchMedia('(display-mode: minimal-ui)').matches) {
      return 'homescreen';
    } else {
      return 'browser';
    }
  } catch (error) {
    console.error('Error detecting installation source:', error);
    return 'browser';
  }
}
