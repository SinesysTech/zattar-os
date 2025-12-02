"use client";

import * as React from "react";
import Script from "next/script";
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
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    async function loadUser() {
      try {
        // Primeiro tenta buscar via API de perfil para dados mais completos
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
            setIsReady(true);
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
        }
        setIsReady(true);
      } catch (error) {
        console.error("Erro ao carregar usuário para Dify:", error);
        setIsReady(true); // Permite carregar mesmo sem dados do usuário
      }
    }

    loadUser();
  }, []);

  // Configura o objeto global do Dify antes de carregar o script
  React.useEffect(() => {
    if (!isReady) return;

    window.difyChatbotConfig = {
      token: "7LF2csja50lSYUzQ",
      inputs: {
        nome: userData?.name,
      },
      systemVariables: {
        user_id: userData?.id,
      },
      userVariables: {
        avatar_url: userData?.avatar,
        name: userData?.name,
      },
    };
  }, [isReady, userData]);

  if (!isReady) return null;

  return (
    <>
      <Script
        src="https://udify.app/embed.min.js"
        id="7LF2csja50lSYUzQ"
        strategy="lazyOnload"
      />
      <style jsx global>{`
        #dify-chatbot-bubble-button {
          background-color: #1c64f2 !important;
        }
        #dify-chatbot-bubble-window {
          width: 24rem !important;
          height: 40rem !important;
        }
      `}</style>
    </>
  );
}
