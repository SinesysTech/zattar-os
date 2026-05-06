"use client";

import { cn } from '@/lib/utils';
import { useRef, useState } from "react";
import { X} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Heading } from "@/components/ui/typography";
import { useMailActions } from "../hooks/use-mail-api";
import { useMailStore } from "../hooks/use-mail";
import { MailEditor, type MailEditorRef } from "./mail-editor";

import { LoadingSpinner } from "@/components/ui/loading-state"
export function ComposeMailPanel() {
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState("");
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const editorRef = useRef<MailEditorRef | null>(null);
  const { sendNewEmail } = useMailActions();
  const { setIsComposing } = useMailStore();

  const parseEmails = (value: string) =>
    value
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);

  const resetForm = () => {
    setTo("");
    setCc("");
    setBcc("");
    setSubject("");
    setShowCcBcc(false);
    editorRef.current?.reset();
  };

  const handleDiscard = () => {
    resetForm();
    setIsComposing(false);
  };

  const handleSend = async () => {
    const toEmails = parseEmails(to);
    if (toEmails.length === 0) {
      toast.error("Informe pelo menos um destinatário");
      return;
    }
    if (!subject.trim()) {
      toast.error("Informe o assunto do e-mail");
      return;
    }

    if (!editorRef.current) {
      toast.error("Editor não está pronto. Tente novamente.");
      return;
    }

    const text = editorRef.current.getText();
    if (!text.trim()) {
      toast.error("Escreva o conteúdo do e-mail");
      return;
    }

    const html = editorRef.current.getHtml();

    setIsSending(true);
    try {
      const ccEmails = parseEmails(cc);
      const bccEmails = parseEmails(bcc);
      await sendNewEmail(
        toEmails,
        subject.trim(),
        text,
        html || undefined,
        ccEmails.length > 0 ? ccEmails : undefined,
        bccEmails.length > 0 ? bccEmails : undefined
      );
      toast.success("E-mail enviado com sucesso");
      resetForm();
      setIsComposing(false);
    } catch {
      toast.error("Erro ao enviar e-mail");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className={cn(/* design-system-escape: px-4 padding direcional sem Inset equiv. */ "flex h-13 shrink-0 items-center justify-between px-4")}>
        <Heading level="card" className={cn("text-body-sm")}>Novo E-mail</Heading>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon" aria-label="Descartar"
              className="h-7 w-7"
              onClick={handleDiscard}>
              <X className="h-4 w-4" />
              <span className="sr-only">Descartar</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Descartar</TooltipContent>
        </Tooltip>
      </div>

      <Separator />

      {/* Fields */}
      <div className={cn(/* design-system-escape: px-4 padding direcional sem Inset equiv.; py-3 padding direcional sem Inset equiv. */ "shrink-0 grid inline-medium px-4 py-3")}>
        <div className={cn("grid inline-tight")}>
          <div className="flex items-center justify-between">
            <Label htmlFor="compose-panel-to">Para</Label>
            {!showCcBcc && (
              <button
                type="button"
                className={cn("text-caption text-muted-foreground hover:text-foreground transition-colors cursor-pointer")}
                onClick={() => setShowCcBcc(true)}>
                Cc / Cco
              </button>
            )}
          </div>
          <Input
            id="compose-panel-to"
            type="text"
            placeholder="email@exemplo.com (separar com vírgula)"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            autoFocus
          />
        </div>

        {showCcBcc && (
          <>
            <div className={cn("grid inline-tight")}>
              <Label htmlFor="compose-panel-cc">Cc</Label>
              <Input
                id="compose-panel-cc"
                type="text"
                placeholder="email@exemplo.com"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
              />
            </div>
            <div className={cn("grid inline-tight")}>
              <Label htmlFor="compose-panel-bcc">Cco</Label>
              <Input
                id="compose-panel-bcc"
                type="text"
                placeholder="email@exemplo.com"
                value={bcc}
                onChange={(e) => setBcc(e.target.value)}
              />
            </div>
          </>
        )}

        <div className={cn("grid inline-tight")}>
          <Label htmlFor="compose-panel-subject">Assunto</Label>
          <Input
            id="compose-panel-subject"
            type="text"
            placeholder="Assunto do e-mail"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>
      </div>

      <Separator />

      {/* Editor — fills all remaining space */}
      <div className="flex min-h-0 flex-1 flex-col">
        <MailEditor variant="compose" editorRef={editorRef} placeholder="Escreva sua mensagem..." />
      </div>

      <Separator />

      {/* Footer */}
      <div className={cn("flex shrink-0 items-center justify-end inline-tight inset-card-compact")}>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDiscard}
          disabled={isSending}>
          Descartar
        </Button>
        <Button size="sm" onClick={handleSend} disabled={isSending}>
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
  );
}
