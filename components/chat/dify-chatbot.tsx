"use client";

import * as React from "react";
import { createClient } from "@/app/_lib/supabase/client";

interface DifyConfig {
  token: string;
  inputs: {
    nome?: string;
  };
  systemVariables: {
    user_id?: string;
    conversation_id?: string;
  };
  userVariables: {
    avatar_url?: string;
    name?: string;
  };
}

declare global {
  interface Window {
    difyChatbotConfig?: DifyConfig;
  }
}

interface UserData {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export function DifyChatbot() {
  const [userData, setUserData] = React.useState<UserData | null>(null);
  const [scriptLoaded, setScriptLoaded] = React.useState(false);
  const hasLoadedRef = React.useRef(false);

  // Carrega dados do usuário
  React.useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    async function loadUser() {
      try {
        const response = await fetch("/api/perfil");

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            const usuario = data.data;
            setUserData({
              id: String(usuario.id),
              name:
                usuario.nomeExibicao ||
                usuario.nomeCompleto ||
                "Usuário",
              email: usuario.emailCorporativo || usuario.emailPessoal || "",
              avatar: "",
            });
            return;
          }
        }

        // Fallback: usar dados do Supabase Auth
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setUserData({
            id: user.id,
            name:
              user.user_metadata?.full_name ||
              user.email?.split("@")[0] ||
              "Usuário",
            email: user.email || "",
            avatar: user.user_metadata?.avatar_url || "",
          });
        } else {
          // Mesmo sem usuário, permite carregar o chatbot
          setUserData({
            id: "",
            name: "Visitante",
            email: "",
            avatar: "",
          });
        }
      } catch (error) {
        console.error("Erro ao carregar usuário para Dify:", error);
        // Permite carregar mesmo com erro
        setUserData({
          id: "",
          name: "Visitante",
          email: "",
          avatar: "",
        });
      }
    }

    loadUser();
  }, []);

  // Configura e carrega o script do Dify após ter os dados do usuário
  React.useEffect(() => {
    if (!userData || scriptLoaded) return;

    // 1. Configura o objeto global ANTES de carregar o script
    window.difyChatbotConfig = {
      token: "7LF2csja50lSYUzQ",
      inputs: {
        nome: userData.name,
      },
      systemVariables: {
        user_id: userData.id || undefined,
      },
      userVariables: {
        avatar_url: userData.avatar || undefined,
        name: userData.name,
      },
    };

    // 2. Injeta o script manualmente para garantir a ordem
    const script = document.createElement("script");
    script.src = "https://udify.app/embed.min.js";
    script.id = "7LF2csja50lSYUzQ";
    script.defer = true;
    document.body.appendChild(script);

    setScriptLoaded(true);

    // Cleanup
    return () => {
      // Remove o script e elementos do Dify ao desmontar
      const existingScript = document.getElementById("7LF2csja50lSYUzQ");
      if (existingScript) {
        existingScript.remove();
      }
      const bubble = document.getElementById("dify-chatbot-bubble-button");
      if (bubble) {
        bubble.remove();
      }
      const chatWindow = document.getElementById("dify-chatbot-bubble-window");
      if (chatWindow) {
        chatWindow.remove();
      }
    };
  }, [userData, scriptLoaded]);

  return (
    <style jsx global>{`
      #dify-chatbot-bubble-button {
        background-color: #1c64f2 !important;
        z-index: 9999 !important;
      }
      #dify-chatbot-bubble-window {
        width: 24rem !important;
        height: 40rem !important;
        z-index: 9999 !important;
      }
    `}</style>
  );
}
