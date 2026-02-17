"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { useCSPNonce } from "@/hooks/use-csp-nonce";
import { actionObterChatwootWidgetConfig, type WidgetConfig } from "@/lib/chatwoot/widget-config-action";

export default function ChatwootWidget() {
  const nonce = useCSPNonce();
  const [config, setConfig] = useState<WidgetConfig | null>(null);

  useEffect(() => {
    actionObterChatwootWidgetConfig().then(setConfig);
  }, []);

  if (!config) return null;

  return (
    <Script id="chatwoot-script" strategy="afterInteractive" nonce={nonce}>
      {`
        (function(d,t) {
          var BASE_URL="${config.baseUrl}";
          var g=d.createElement(t),s=d.getElementsByTagName(t)[0];
          g.src=BASE_URL+"/packs/js/sdk.js";
          g.defer = true;
          g.async = true;
          s.parentNode.insertBefore(g,s);
          g.onload=function(){
            window.chatwootSDK.run({
              websiteToken: '${config.websiteToken}',
              baseUrl: BASE_URL
            })
          }
        })(document,"script");
      `}
    </Script>
  );
}
