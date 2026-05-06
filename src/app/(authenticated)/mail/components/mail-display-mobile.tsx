"use client";

import { cn } from '@/lib/utils';
import React, { useEffect, useRef } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Archive, ArchiveX, Forward, MoreVertical, Reply, ReplyAll, Trash2} from "lucide-react";
import { useMailStore } from "../hooks/use-mail";
import { useMailActions } from "../hooks/use-mail-api";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import type { MailMessagePreview } from "@/lib/mail/types";
import { useMailDisplay } from "../hooks/use-mail-display";
import { MailEditor } from "./mail-editor";

import { LoadingSpinner } from "@/components/ui/loading-state"
import { Text } from '@/components/ui/typography';
interface MailDisplayProps {
  mail: MailMessagePreview | null;
}

function MailBodyMobile({ mail }: { mail: MailMessagePreview }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { fullMessage } = useMailStore();
  const { fetchMessage } = useMailActions();
  const [isLoadingBody, setIsLoadingBody] = React.useState(true);

  useEffect(() => {
    setIsLoadingBody(true);
    fetchMessage(mail.uid, mail.folder).finally(() => setIsLoadingBody(false));
  }, [mail.uid, mail.folder, fetchMessage]);

  const isLoaded = fullMessage?.uid === mail.uid;
  const htmlContent = isLoaded ? fullMessage.html : null;
  const textContent = isLoaded ? (fullMessage.text || mail.preview) : mail.preview;

  useEffect(() => {
    if (!htmlContent || !iframeRef.current) return;
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 14px;
            line-height: 1.6;
            color: #1a1a1a;
            margin: 0;
            padding: 0;
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          img { max-width: 100%; height: auto; }
          a { color: #2563eb; }
          pre { overflow-x: auto; }
          table { max-width: 100%; }
        </style>
      </head>
      <body>${htmlContent}</body>
      </html>
    `);
    doc.close();

    // Make links open in a new browser tab
    doc.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const href = link.getAttribute("href");
        if (href) {
          window.open(href, "_blank", "noopener,noreferrer");
        }
      });
    });

    const resizeObserver = new ResizeObserver(() => {
      if (iframeRef.current && doc.body) {
        iframeRef.current.style.height = doc.body.scrollHeight + "px";
      }
    });
    if (doc.body) resizeObserver.observe(doc.body);
    return () => resizeObserver.disconnect();
  }, [htmlContent]);

  if (isLoadingBody && !isLoaded) {
    return (
      <div className={cn("flex flex-col inline-medium")}>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
        <Skeleton className="h-4 w-full" />
      </div>
    );
  }

  if (htmlContent) {
    return (
      <iframe
        ref={iframeRef}
        className="w-full border-0"
        sandbox="allow-same-origin"
        title="Conteúdo do e-mail"
      />
    );
  }

  return <div className={cn("text-body-sm whitespace-pre-wrap")}>{textContent}</div>;
}

export function MailDisplayMobile({ mail }: MailDisplayProps) {
  const [open, setOpen] = React.useState(false);
  const { selectedMail, setSelectedMail } = useMailStore();
  const {
    editorRef,
    isSending,
    actionLoading,
    participantName,
    participantInitials,
    participantLabel,
    participantLine,
    replyMode,
    startReply,
    cancelReply,
    handleReply,
    actions,
  } = useMailDisplay(mail);

  const replyAreaRef = useRef<HTMLDivElement>(null);

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

  // Auto-scroll to reply editor when entering reply mode
  useEffect(() => {
    if (replyMode) {
      const timer = setTimeout(() => {
        replyAreaRef.current?.scrollIntoView({ behavior: "smooth" });
        editorRef.current?.focus();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [replyMode, editorRef]);

  const handleMobileAction = async (action: (() => Promise<void>) | undefined) => {
    if (!action) return;
    await action();
    setOpen(false);
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
          <div className={cn(/* design-system-escape: p-2 → usar <Inset> */ "flex items-center p-2")}>
            <div className={cn("flex items-center inline-tight")}>
              <Button
                variant="ghost"
                size="icon"
                disabled={!mail || actionLoading === "archive"}
                aria-label="Arquivar"
                onClick={() => handleMobileAction(actions?.archive)}>
                {actionLoading === "archive" ? (
                  <LoadingSpinner />
                ) : (
                  <Archive className="h-4 w-4" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                disabled={!mail || actionLoading === "junk"}
                aria-label="Lixo eletrônico"
                onClick={() => handleMobileAction(actions?.junk)}>
                {actionLoading === "junk" ? (
                  <LoadingSpinner />
                ) : (
                  <ArchiveX className="h-4 w-4" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                disabled={!mail || actionLoading === "delete"}
                aria-label="Excluir"
                onClick={() => handleMobileAction(actions?.delete)}>
                {actionLoading === "delete" ? (
                  <LoadingSpinner />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className={cn("ml-auto flex items-center inline-tight")}>
              <Button
                variant="ghost"
                size="icon"
                disabled={!mail}
                aria-label="Responder"
                onClick={() => startReply("reply")}>
                <Reply className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                disabled={!mail}
                aria-label="Responder a todos"
                onClick={() => startReply("reply-all")}>
                <ReplyAll className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                disabled={!mail}
                aria-label="Encaminhar">
                <Forward className="h-4 w-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className={cn(/* design-system-escape: mx-2 margin sem primitiva DS */ "mx-2 h-6")} />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" disabled={!mail} aria-label="Mais opções">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => actions?.markUnread()}>
                  Marcar como não lido
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => actions?.star()}>
                  Marcar com estrela
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Separator />

          {mail && (
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className={cn("flex flex-wrap items-start inline-medium inset-card-compact")}>
                <div className={cn("flex min-w-0 flex-1 items-start inline-default text-body-sm")}>
                  <Avatar>
                    <AvatarFallback>{participantInitials}</AvatarFallback>
                  </Avatar>
                  <div className={cn("min-w-0 grid flex-1 inline-micro")}>
                    <div className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading> */ "whitespace-normal wrap-break-word font-semibold")}>{participantName}</div>
                    <Text variant="caption" className="whitespace-normal wrap-break-word">{mail.subject}</Text>
                    <Text variant="caption" className="whitespace-normal wrap-break-word">
                      <span className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium")}>{participantLabel}:</span> {participantLine}
                    </Text>
                  </div>
                </div>
                <Text variant="caption" className="whitespace-normal wrap-break-word sm:ml-auto sm:pl-4 sm:text-right">
                  {format(new Date(mail.date), "PPpp", { locale: ptBR })}
                </Text>
              </div>

              <Separator />

              <div className={cn("flex-1 overflow-auto inset-card-compact")}>
                <MailBodyMobile mail={mail} />
              </div>

              <Separator className="mt-auto" />

              {replyMode ? (
                <div ref={replyAreaRef} className={cn("inset-card-compact")}>
                  <form onSubmit={handleReply}>
                    <div className={cn("grid inline-medium")}>
                      <div className={cn("text-body-sm text-muted-foreground")}>
                        {replyMode === "reply-all"
                          ? "Responder a todos"
                          : "Responder para"}{" "}
                        <span className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium text-foreground")}>
                          {participantName}
                        </span>
                      </div>
                      <MailEditor
                        variant="inline"
                        editorRef={editorRef}
                        placeholder="Escreva sua resposta..."
                      />
                      <div className={cn("flex items-center inline-tight justify-end")}>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={cancelReply}
                          disabled={isSending}>
                          Cancelar
                        </Button>
                        <Button type="submit" size="sm" disabled={isSending}>
                          {isSending ? (
                            <>
                              <LoadingSpinner className="mr-2" />
                              Enviando...
                            </>
                          ) : (
                            "Enviar"
                          )}
                        </Button>
                      </div>
                    </div>
                  </form>
                </div>
              ) : (
                <div className={cn("inset-card-compact")}>
                  <div className={cn("flex items-center inline-tight")}>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!mail}
                      onClick={() => startReply("reply")}>
                      <Reply className="mr-2 h-4 w-4" />
                      Responder
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!mail}
                      onClick={() => startReply("reply-all")}>
                      <ReplyAll className="mr-2 h-4 w-4" />
                      Responder a todos
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
