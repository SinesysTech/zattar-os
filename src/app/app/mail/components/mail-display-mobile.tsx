"use client";

import React, { useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Archive,
  ArchiveX,
  Forward,
  MoreVertical,
  Reply,
  ReplyAll,
  Trash2
} from "lucide-react";
import { useMailStore } from "../use-mail";
import { useMailActions } from "../hooks/use-mail-api";

import { DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import type { MailMessagePreview } from "@/lib/mail/types";
import { toast } from "sonner";

interface MailDisplayProps {
  mail: MailMessagePreview | null;
}

export function MailDisplayMobile({ mail }: MailDisplayProps) {
  const [open, setOpen] = React.useState(false);
  const [replyText, setReplyText] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);
  const { selectedMail, setSelectedMail } = useMailStore();
  const { deleteMessage, moveMessage, markUnread, starMessage, reply } = useMailActions();

  useEffect(() => {
    if (selectedMail) {
      setOpen(true);
    }
  }, [selectedMail]);

  useEffect(() => {
    if (!open) {
      setSelectedMail(null);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const senderName = mail ? (mail.from.name || mail.from.address) : "";
  const senderInitials = senderName
    .split(" ")
    .map((chunk) => chunk[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const handleAction = async (action: () => Promise<void>, successMsg: string) => {
    try {
      await action();
      setSelectedMail(null);
      setOpen(false);
      toast.success(successMsg);
    } catch {
      toast.error("Erro ao executar ação");
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mail || !replyText.trim()) return;
    setIsSending(true);
    try {
      await reply(mail.uid, mail.folder, replyText);
      setReplyText("");
      toast.success("Resposta enviada");
    } catch {
      toast.error("Erro ao enviar resposta");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent>
        <VisuallyHidden>
          <DialogHeader>
            <DialogTitle>Visualizar e-mail</DialogTitle>
          </DialogHeader>
        </VisuallyHidden>

        <div className="flex h-full flex-col">
          <div className="flex items-center p-2">
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={!mail}
                    onClick={() => mail && handleAction(() => moveMessage(mail.uid, mail.folder, "Archive"), "Arquivado")}>
                    <Archive className="h-4 w-4" />
                    <span className="sr-only">Arquivar</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Arquivar</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={!mail}
                    onClick={() => mail && handleAction(() => moveMessage(mail.uid, mail.folder, "Junk"), "Movido para lixo eletrônico")}>
                    <ArchiveX className="h-4 w-4" />
                    <span className="sr-only">Lixo eletrônico</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Lixo eletrônico</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={!mail}
                    onClick={() => mail && handleAction(() => deleteMessage(mail.uid, mail.folder), "Excluído")}>
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Excluir</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Excluir</TooltipContent>
              </Tooltip>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" disabled={!mail}>
                    <Reply className="h-4 w-4" />
                    <span className="sr-only">Responder</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Responder</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" disabled={!mail}>
                    <ReplyAll className="h-4 w-4" />
                    <span className="sr-only">Responder a todos</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Responder a todos</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" disabled={!mail}>
                    <Forward className="h-4 w-4" />
                    <span className="sr-only">Encaminhar</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Encaminhar</TooltipContent>
              </Tooltip>
            </div>

            <Separator orientation="vertical" className="mx-2 h-6" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" disabled={!mail}>
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Mais</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => mail && markUnread(mail.uid, mail.folder)}>
                  Marcar como não lido
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => mail && starMessage(mail.uid, mail.folder)}>
                  Marcar com estrela
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Separator />

          {mail && (
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="flex items-start p-4">
                <div className="flex items-start gap-4 text-sm">
                  <Avatar>
                    <AvatarFallback>{senderInitials}</AvatarFallback>
                  </Avatar>
                  <div className="grid gap-1">
                    <div className="font-semibold">{senderName}</div>
                    <div className="line-clamp-1 text-xs">{mail.subject}</div>
                    <div className="line-clamp-1 text-xs">
                      <span className="font-medium">De:</span> {mail.from.address}
                    </div>
                  </div>
                </div>
                <div className="text-muted-foreground ml-auto text-xs">
                  {format(new Date(mail.date), "PPpp", { locale: ptBR })}
                </div>
              </div>

              <Separator />

              <div className="flex-1 overflow-auto p-4 text-sm whitespace-pre-wrap">
                {mail.preview}
              </div>

              <Separator className="mt-auto" />

              <div className="p-4">
                <form onSubmit={handleReply}>
                  <div className="grid gap-4">
                    <Textarea
                      className="p-4"
                      placeholder={`Responder ${senderName}...`}
                      value={replyText}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReplyText(e.target.value)}
                    />
                    <div className="flex items-center justify-end">
                      <Button type="submit" size="sm" disabled={isSending || !replyText.trim()}>
                        {isSending ? "Enviando..." : "Enviar"}
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
