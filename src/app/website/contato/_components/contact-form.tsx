"use client";

/**
 * ContactForm — formulário público de /contato com submissão real via Server
 * Action publicFormAction (grava em public_leads). React 19 useActionState
 * para pending/error states. Honeypot, validação Zod e rate-limit acontecem
 * no servidor (ver src/shared/public-leads/service.ts).
 */

import { useActionState, useEffect, useId, useRef } from "react";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import { submitLeadAction } from "@/shared/public-leads/actions/submit-lead";

export function ContactForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const nomeId = useId();
  const emailId = useId();
  const telefoneId = useId();
  const assuntoId = useId();
  const mensagemId = useId();
  const websiteHoneypotId = useId();

  const [state, formAction, isPending] = useActionState(submitLeadAction, null);

  // Exibir toast em resposta ao estado retornado pelo servidor
  useEffect(() => {
    if (!state) return;
    if (state.success) {
      toast.success("Mensagem enviada", {
        description: "Entraremos em contato em breve. Obrigado!",
      });
      formRef.current?.reset();
    } else {
      toast.error("Não foi possível enviar", {
        description: state.message,
      });
    }
  }, [state]);

  const fieldErrors = !state?.success ? state?.errors : undefined;

  return (
    <form ref={formRef} action={formAction} className="space-y-6" noValidate>
      {/* Honeypot — invisível a humanos, bots costumam preencher */}
      <div
        className="absolute -left-2499.75 w-px h-px overflow-hidden"
        aria-hidden="true"
      >
        <label htmlFor={websiteHoneypotId}>
          Não preencha este campo
        </label>
        <input
          id={websiteHoneypotId}
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>

      <input type="hidden" name="source" defaultValue="website-contato" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label
            htmlFor={nomeId}
            className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1"
          >
            Nome
          </Label>
          <Input
            id={nomeId}
            name="nome"
            type="text"
            variant="glass"
            placeholder="Seu nome completo"
            required
            minLength={2}
            maxLength={200}
            aria-invalid={fieldErrors?.nome ? true : undefined}
            aria-describedby={fieldErrors?.nome ? `${nomeId}-err` : undefined}
          />
          {fieldErrors?.nome && (
            <p id={`${nomeId}-err`} className="text-xs text-destructive ml-1">
              {fieldErrors.nome[0]}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label
            htmlFor={emailId}
            className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1"
          >
            E-mail
          </Label>
          <Input
            id={emailId}
            name="email"
            type="email"
            variant="glass"
            placeholder="seu@email.com"
            required
            autoComplete="email"
            aria-invalid={fieldErrors?.email ? true : undefined}
            aria-describedby={fieldErrors?.email ? `${emailId}-err` : undefined}
          />
          {fieldErrors?.email && (
            <p id={`${emailId}-err`} className="text-xs text-destructive ml-1">
              {fieldErrors.email[0]}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label
            htmlFor={telefoneId}
            className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1"
          >
            Telefone <span className="font-normal text-on-surface-variant/60">(opcional)</span>
          </Label>
          <Input
            id={telefoneId}
            name="telefone"
            type="tel"
            variant="glass"
            placeholder="(31) 99999-9999"
            autoComplete="tel"
            maxLength={32}
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor={assuntoId}
            className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1"
          >
            Assunto <span className="font-normal text-on-surface-variant/60">(opcional)</span>
          </Label>
          <Input
            id={assuntoId}
            name="assunto"
            type="text"
            variant="glass"
            placeholder="Como podemos ajudar?"
            maxLength={200}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label
          htmlFor={mensagemId}
          className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1"
        >
          Mensagem
        </Label>
        <Textarea
          id={mensagemId}
          name="mensagem"
          variant="glass"
          placeholder="Descreva seu desafio jurídico..."
          rows={5}
          required
          minLength={10}
          maxLength={5000}
          aria-invalid={fieldErrors?.mensagem ? true : undefined}
          aria-describedby={fieldErrors?.mensagem ? `${mensagemId}-err` : undefined}
        />
        {fieldErrors?.mensagem && (
          <p id={`${mensagemId}-err`} className="text-xs text-destructive ml-1">
            {fieldErrors.mensagem[0]}
          </p>
        )}
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={isPending}
        className="w-full rounded-xl gap-2"
      >
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Enviando...
          </>
        ) : (
          <>
            <Send className="size-4" aria-hidden="true" />
            Enviar Mensagem
          </>
        )}
      </Button>
    </form>
  );
}
