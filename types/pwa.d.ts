declare global {
  interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  }

  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
    appinstalled: Event;
  }

  interface Navigator {
    standalone?: boolean;
  }
}

type DisplayMode = 'browser' | 'standalone' | 'minimal-ui' | 'fullscreen';

interface ManifestIcon {
  src: string;
  sizes: string;
  type?: string;
  purpose?: string;
}

interface ManifestShortcut {
  name: string;
  short_name?: string;
  description?: string;
  url: string;
  icons?: ManifestIcon[];
}

interface Manifest {
  name?: string;
  short_name?: string;
  description?: string;
  start_url?: string;
  display?: DisplayMode;
  background_color?: string;
  theme_color?: string;
  orientation?: string;
  scope?: string;
  lang?: string;
  dir?: string;
  icons?: ManifestIcon[];
  categories?: string[];
  shortcuts?: ManifestShortcut[];
}

export { DisplayMode, Manifest };