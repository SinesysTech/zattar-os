"use client";

import { useEffect } from "react";
import { actionObterChatwootWidgetConfig } from "@/lib/chatwoot/widget-config-action";

declare global {
  interface Window {
    chatwootSDK?: {
      run: (config: { websiteToken: string; baseUrl: string }) => void;
    };
    $chatwoot?: {
      reset: () => void;
    };
  }
}

const SCRIPT_ID = "chatwoot-sdk";

export function ChatwootWidget() {
  useEffect(() => {
    let cancelled = false;

    actionObterChatwootWidgetConfig().then((config) => {
      if (cancelled || !config) return;
      if (document.getElementById(SCRIPT_ID)) return;

      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = `${config.baseUrl}/packs/js/sdk.js`;
      script.async = true;
      script.onload = () => {
        window.chatwootSDK?.run({
          websiteToken: config.websiteToken,
          baseUrl: config.baseUrl,
        });
      };
      document.body.appendChild(script);
    });

    return () => {
      cancelled = true;
      window.$chatwoot?.reset();
      document.getElementById(SCRIPT_ID)?.remove();
    };
  }, []);

  return null;
}
