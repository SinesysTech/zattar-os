"use client";

import { useEffect } from "react";
import Script from "next/script";

export function Pedrinho() {
  useEffect(() => {
    // Define a configuração no objeto window apenas quando o componente montar no cliente
    // @ts-ignore (Ignora erro de tipagem se não tiver declarado a interface global)
    window.difyChatbotConfig = {
      token: "7LF2csja50lSYUzQ",
      inputs: {
        // Se precisar passar dados do usuário logado, você pode receber via props neste componente
      },
      // systemVariables e userVariables podem ser adicionados aqui se tiver os dados
    };
  }, []);

  return (
    <>
      {/* Estilos específicos do Dify */}
      <style jsx global>{`
        #dify-chatbot-bubble-button {
          background-color: #1c64f2 !important;
        }
        #dify-chatbot-bubble-window {
          width: 24rem !important;
          height: 40rem !important;
        }
      `}</style>

      {/* Carrega o script externo */}
      <Script
        src="https://udify.app/embed.min.js"
        id="dify-chatbot-script"
        defer
        strategy="lazyOnload" // Carrega depois que a página principal estiver pronta (melhor performance)
      />
    </>
  );
}