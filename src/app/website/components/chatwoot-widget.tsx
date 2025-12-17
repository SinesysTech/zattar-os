"use client";

import Script from "next/script";

export default function ChatwootWidget() {
  return (
    <Script id="chatwoot-script" strategy="afterInteractive">
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
