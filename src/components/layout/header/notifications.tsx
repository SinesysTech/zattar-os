"use client";

import { BellIcon, ClockIcon, CheckCheckIcon } from "lucide-react";
import Link from "next/link";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNotificacoes, useNotificacoesRealtime, TIPO_NOTIFICACAO_LABELS } from "@/features/notificacoes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const Notifications = () => {
  const isMobile = useIsMobile();
  const { notificacoes, contador, loading, refetch, marcarComoLida, marcarTodasComoLidas } = useNotificacoes({
    pagina: 1,
    limite: 20,
    lida: false,
  });

  // Escutar novas notificações em tempo real
  useNotificacoesRealtime({
    onNovaNotificacao: (_notificacao) => {
      refetch();
    },
  });

  // Gerar link para a entidade relacionada
  const getEntityLink = (tipo: string, id: number) => {
    switch (tipo) {
      case "processo":
        return `/processos/${id}`;
      case "audiencia":
        return `/audiencias/${id}`;
      case "expediente":
        return `/expedientes/${id}`;
      case "pericia":
        return `/pericias/${id}`;
      default:
        return "#";
    }
  };

  // Formatar data relativa
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ptBR,
      });
    } catch {
      return dateString;
    }
  };

  // Contador de não lidas
  const unreadCount = contador.total;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" className="relative">
          <>
            <BellIcon className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="bg-destructive absolute end-0 top-0 block size-2 shrink-0 rounded-full"></span>
            )}
          </>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align={isMobile ? "center" : "end"} className="ms-4 w-80 p-0">
        <DropdownMenuLabel className="bg-background dark:bg-muted sticky top-0 z-10 p-0">
          <div className="flex justify-between items-center border-b px-6 py-4">
            <div className="font-medium">
              Notificações
              {unreadCount > 0 && (
                <span className="ml-2 text-xs text-muted-foreground">
                  ({unreadCount})
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs"
                  onClick={(e) => {
                    e.preventDefault();
                    marcarTodasComoLidas();
                  }}
                >
                  <CheckCheckIcon className="h-3 w-3 mr-1" />
                  Marcar todas
                </Button>
              )}
              <Button variant="link" className="h-auto p-0 text-xs" size="sm" asChild>
                <Link href="/notificacoes">Ver todas</Link>
              </Button>
            </div>
          </div>
        </DropdownMenuLabel>

        <ScrollArea className="h-[350px]">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-sm text-muted-foreground">Carregando...</div>
            </div>
          ) : notificacoes.length === 0 ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-sm text-muted-foreground">
                Nenhuma notificação
              </div>
            </div>
          ) : (
            notificacoes.map((item) => (
              <DropdownMenuItem
                key={item.id}
                className="group flex cursor-pointer items-start gap-3 rounded-none border-b px-4 py-3"
                asChild
              >
                <Link
                  href={getEntityLink(item.entidade_tipo, item.entidade_id)}
                  onClick={() => {
                    if (!item.lida) {
                      marcarComoLida(item.id);
                    }
                  }}
                >
                  <div className="flex flex-1 items-start gap-2">
                    <div className="flex-none">
                      <Avatar className="size-8">
                        <AvatarFallback>
                          {TIPO_NOTIFICACAO_LABELS[item.tipo].charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex flex-1 flex-col gap-1">
                      <div className="dark:group-hover:text-default-800 truncate text-sm font-medium">
                        {item.titulo}
                      </div>
                      <div className="dark:group-hover:text-default-700 text-muted-foreground line-clamp-2 text-xs">
                        {item.descricao}
                      </div>
                      <div className="dark:group-hover:text-default-500 text-muted-foreground flex items-center gap-1 text-xs">
                        <ClockIcon className="size-3" />
                        {formatDate(item.created_at)}
                      </div>
                    </div>
                  </div>
                  {!item.lida && (
                    <div className="flex-0">
                      <span className="bg-destructive/80 block size-2 rounded-full border" />
                    </div>
                  )}
                </Link>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Notifications;
