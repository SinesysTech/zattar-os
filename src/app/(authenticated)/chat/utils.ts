import { StatusChamada, TipoChamada } from "./domain";
import { Phone, Video, CalendarCheck, CalendarX, Clock, Ban } from "lucide-react";
import type { BadgeVisualVariant } from "@/lib/design-system";

type BadgeVariant = BadgeVisualVariant;

/**
 * Formata a duração em segundos para formato humanizado (HH:MM:SS ou MM:SS)
 */
export function formatarDuracao(segundos: number): string {
  if (!segundos) return "0s";

  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = segundos % 60;

  if (h > 0) {
    return `${h}h ${m}m ${s}s`;
  } else if (m > 0) {
    return `${m}m ${s}s`;
  } else {
    return `${s}s`;
  }
}

/**
 * Retorna a variante do badge baseada no status da chamada
 */
export function getStatusBadgeVariant(status: StatusChamada): BadgeVariant {
  switch (status) {
    case StatusChamada.Iniciada:
      return "default"; // Azul/Padrão
    case StatusChamada.EmAndamento:
      return "default"; // Verde seria ideal, mas default é azul. Usar style custom se precisar.
    case StatusChamada.Finalizada:
      return "secondary"; // Cinza
    case StatusChamada.Cancelada:
    case StatusChamada.Recusada:
      return "destructive"; // Vermelho
    default:
      return "outline";
  }
}

/**
 * Retorna o label amigável do status
 */
export function getStatusLabel(status: StatusChamada): string {
  switch (status) {
    case StatusChamada.Iniciada:
      return "Iniciada";
    case StatusChamada.EmAndamento:
      return "Em Andamento";
    case StatusChamada.Finalizada:
      return "Finalizada";
    case StatusChamada.Cancelada:
      return "Cancelada";
    case StatusChamada.Recusada:
      return "Recusada";
    default:
      return status;
  }
}

/**
 * Retorna o ícone do tipo de chamada
 */
export function getTipoChamadaIcon(tipo: TipoChamada) {
  return tipo === TipoChamada.Video ? Video : Phone;
}

/**
 * Retorna ícone para status
 */
export function getStatusIcon(status: StatusChamada) {
  switch (status) {
    case StatusChamada.Iniciada:
      return Clock;
    case StatusChamada.EmAndamento:
      return Video;
    case StatusChamada.Finalizada:
      return CalendarCheck;
    case StatusChamada.Cancelada:
      return Ban;
    case StatusChamada.Recusada:
      return CalendarX;
    default:
      return Clock;
  }
}

// =============================================================================
// CALL ERROR HANDLER (migrated from utils/call-error-handler.ts)
// =============================================================================

import { toast } from 'sonner';

interface ErrorAction {
  label: string;
  onClick: () => void;
}

interface ErrorConfig {
  message: string;
  description?: string;
  action?: ErrorAction;
}

export function handleCallError(error: unknown): void {
  console.error("Call Error:", error);

  const config = getErrorConfig(error);

  toast.error(config.message, {
    description: config.description,
    action: config.action,
    duration: 5000,
  });
}

function getErrorConfig(error: unknown): ErrorConfig {
  const errorObj = error as { message?: string } | null | undefined;
  const message = errorObj?.message || String(error || "Ocorreu um erro desconhecido");

  if (message.includes("NotAllowedError") || message.includes("Permission denied")) {
    return {
      message: "Permissão negada",
      description: "Por favor, permita o acesso à câmera e microfone nas configurações do navegador.",
      action: {
        label: "Ajuda",
        onClick: () => window.open("https://support.google.com/chrome/answer/2693767", "_blank")
      }
    };
  }

  if (message.includes("NotFoundError") || message.includes("Device not found")) {
    return {
      message: "Dispositivo não encontrado",
      description: "Verifique se sua câmera e microfone estão conectados corretamente."
    };
  }

  if (message.includes("NetworkError") || message.includes("Failed to fetch")) {
    return {
      message: "Erro de conexão",
      description: "Verifique sua conexão com a internet e tente novamente.",
      action: {
        label: "Recarregar",
        onClick: () => window.location.reload()
      }
    };
  }

  if (message.includes("Timeout")) {
    return {
      message: "Tempo limite excedido",
      description: "A conexão demorou muito para responder."
    };
  }

  return {
    message: "Erro na chamada",
    description: message
  };
}
