"use client";

import Script from "next/script";
import { useCSPNonce } from "@/hooks/use-csp-nonce";

export default function ChatwootWidget() {
  const nonce = useCSPNonce();

  return (
    <Script id="chatwoot-script" strategy="afterInteractive" nonce={nonce}>
      {`
        (function(d,t) {
          var BASE_URL="https://chatwoot-web.platform.sinesys.app";
          var g=d.createElement(t),s=d.getElementsByTagName(t)[0];
          g.src=BASE_URL+"/packs/js/sdk.js";
          g.defer = true;
          g.async = true;
          s.parentNode.insertBefore(g,s);
          g.onload=function(){
            window.chatwootSDK.run({
              websiteToken: 'zyY6kcqbBsudawsAPVRw7ooM',
              baseUrl: BASE_URL
            })
          }
        })(document,"script");
      `}
    </Script>
  );
}
