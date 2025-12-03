"use client";

import { useEffect } from "react";
import { createClient } from "@/app/_lib/supabase/client";

// Declaração global para evitar erros de TypeScript
declare global {
  interface Window {
    difyChatbotConfig?: {
      token: string;
      isDev?: boolean;
      baseUrl?: string;
      dynamicScript?: boolean; // Necessário para SPAs - executa imediatamente ao carregar
      containerProps?: Record<string, unknown>;
      draggable?: boolean;
      dragAxis?: 'x' | 'y' | 'both';
      systemVariables?: Record<string, string | undefined>;
      inputs?: Record<string, string>;
      userVariables?: {
        avatar_url?: string;
        name?: string;
      };
    };
  }
}

export function DifyChatbot() {
  const supabase = createClient();

  useEffect(() => {
    // Evita carregar múltiplas vezes
    if (document.getElementById('dify-chatbot-script')) {
      return;
    }

    async function initAndLoadChatbot() {
      // 1. Obtém o usuário do Supabase
      const { data: { user } } = await supabase.auth.getUser();

      // Dados do usuário para o chatbot
      const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || "Visitante";
      const userId = user?.id || 'anonymous';

      // 2. Define a configuração ANTES de carregar o script
      window.difyChatbotConfig = {
        token: '7LF2csja50lSYUzQ',
        isDev: false,
        baseUrl: 'https://udify.app',

        // IMPORTANTE: dynamicScript=true faz o script executar imediatamente
        // Sem isso, ele espera document.body.onload que já passou em SPAs
        dynamicScript: true,

        draggable: true,
        dragAxis: 'both',

        // Variáveis de sistema - aparecem no histórico do Dify para rastreamento
        systemVariables: {
          user_id: userId,
        },

        // Inputs - variáveis de entrada do fluxo do chatbot
        // O chatbot pode usar {{name}} nas mensagens
        inputs: {
          nome: userName,
        },

        // Perfil do usuário - exibido na interface do chat
        userVariables: {
          name: userName,
        }
      };

      console.log('[DifyChatbot] Config definida:', window.difyChatbotConfig);

      // 3. Injeta o CSS
      const style = document.createElement('style');
      style.textContent = `
        #dify-chatbot-bubble-button {
          --dify-chatbot-bubble-button-bg-color: #1C64F2;
          --dify-chatbot-bubble-button-width: 44px;
          --dify-chatbot-bubble-button-height: 44px;
          --dify-chatbot-bubble-button-border-radius: 22px;
          --dify-chatbot-bubble-button-box-shadow: rgba(0, 0, 0, 0.15) 0px 2px 6px 0px;
          --dify-chatbot-bubble-button-hover-transform: scale(1.1);
          --dify-chatbot-bubble-button-bottom: 1.5rem;
          --dify-chatbot-bubble-button-right: 1.5rem;
          z-index: 9999 !important;
          position: fixed !important;
        }
        #dify-chatbot-bubble-window {
          width: 32rem !important;
          height: 44rem !important;
          z-index: 9999 !important;
        }
      `;
      document.head.appendChild(style);

      // 4. Carrega o script DEPOIS da config estar definida
      const script = document.createElement('script');
      script.id = 'dify-chatbot-script';
      script.src = 'https://udify.app/embed.min.js';
      script.async = true;
      script.onload = () => {
        console.log('[DifyChatbot] Script carregado com sucesso');
      };
      script.onerror = (e) => {
        console.error('[DifyChatbot] Erro ao carregar script:', e);
      };
      document.body.appendChild(script);
    }

    initAndLoadChatbot();

    // Cleanup
    return () => {
      const script = document.getElementById('dify-chatbot-script');
      if (script) script.remove();

      const button = document.getElementById('dify-chatbot-bubble-button');
      if (button) button.remove();

      const window_ = document.getElementById('dify-chatbot-bubble-window');
      if (window_) window_.remove();
    };
  }, [supabase]);

  // Componente não renderiza nada - tudo é injetado via DOM
  return null;
}