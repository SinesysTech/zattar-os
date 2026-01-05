"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { PublicStepLayout } from "../layout/PublicStepLayout";
import InputCPF from "../../inputs/input-cpf";
import { InputTelefone } from "@/components/ui/input-telefone";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { formatCPF, formatTelefone } from "../../../utils/formatters";
import { updatePublicSignerIdentificationSchema } from "../../../domain";

/**
 * Schema de validação do formulário derivado do schema de domínio.
 * - Todos os campos são obrigatórios (não opcionais como no domínio)
 * - Valores são transformados para remover máscaras antes da validação
 * - Mensagens de erro customizadas em português
 */
const confirmDetailsSchema = z.object({
  nome_completo: updatePublicSignerIdentificationSchema.shape.nome_completo
    .unwrap()
    .min(3, "Nome deve ter no mínimo 3 caracteres"),
  cpf: z
    .string()
    .min(1, "CPF é obrigatório")
    .transform((val) => val.replace(/\D/g, ""))
    .pipe(
      updatePublicSignerIdentificationSchema.shape.cpf
        .unwrap()
        .refine((val) => val.length === 11, "CPF deve conter 11 dígitos")
    ),
  email: updatePublicSignerIdentificationSchema.shape.email
    .unwrap()
    .refine((val) => val.length > 0, "E-mail é obrigatório"),
  telefone: z
    .string()
    .min(1, "Telefone é obrigatório")
    .transform((val) => val.replace(/\D/g, ""))
    .pipe(
      updatePublicSignerIdentificationSchema.shape.telefone
        .unwrap()
        .refine((val) => val.length >= 10, "Telefone deve ter no mínimo 10 dígitos")
    ),
});

// Input type (before transform) for the form fields
type ConfirmDetailsFormInput = {
  nome_completo: string;
  cpf: string;
  email: string;
  telefone: string;
};

// Output type (after transform) for API submission
type ConfirmDetailsFormData = z.infer<typeof confirmDetailsSchema>;

export interface ConfirmDetailsStepProps {
  token: string;
  dadosSnapshot: {
    nome_completo?: string;
    cpf?: string;
    email?: string;
    telefone?: string;
  };
  onPrevious: () => void;
  onNext: () => void;
}

export function ConfirmDetailsStep({
  token,
  dadosSnapshot,
  onPrevious,
  onNext,
}: ConfirmDetailsStepProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ConfirmDetailsFormInput>({
    resolver: zodResolver(confirmDetailsSchema),
    mode: "onChange",
    defaultValues: {
      nome_completo: "",
      cpf: "",
      email: "",
      telefone: "",
    },
  });

  // Prefill de dados do snapshot
  useEffect(() => {
    if (dadosSnapshot) {
      form.reset({
        nome_completo: dadosSnapshot.nome_completo || "",
        cpf: dadosSnapshot.cpf ? formatCPF(dadosSnapshot.cpf) : "",
        email: dadosSnapshot.email || "",
        telefone: dadosSnapshot.telefone
          ? formatTelefone(dadosSnapshot.telefone)
          : "",
      });
      // Trigger validation to update form state
      form.trigger();
    }
  }, [dadosSnapshot, form]);

  const onSubmit = async (data: ConfirmDetailsFormData) => {
    setIsSubmitting(true);
    try {
      // Remove masks before sending to API
      const cpfDigits = data.cpf.replace(/\D/g, "");
      const telefoneDigits = data.telefone.replace(/\D/g, "");

      const response = await fetch(
        `/api/assinatura-digital/public/${token}/identificacao`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome_completo: data.nome_completo,
            cpf: cpfDigits,
            email: data.email,
            telefone: telefoneDigits,
          }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Erro ao salvar dados");
      }

      toast.success("Dados confirmados com sucesso!");
      onNext();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao salvar dados"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PublicStepLayout
      currentStep={1}
      totalSteps={3}
      title="Confirm Your Details"
      description="Please review your information below. You can edit any field if necessary before proceeding to the signature."
      onPrevious={onPrevious}
      onNext={form.handleSubmit(onSubmit)}
      isNextDisabled={!form.formState.isValid || isSubmitting}
      isLoading={isSubmitting}
      nextLabel="Continue"
      previousLabel="Back"
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid grid-cols-1 gap-6"
        >
          {/* Campo Nome Completo */}
          <FormField
            control={form.control}
            name="nome_completo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <div className="relative">
                  <span
                    className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]"
                    aria-hidden="true"
                  >
                    person
                  </span>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Type your full name"
                      className="pl-10"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Campo CPF */}
          <FormField
            control={form.control}
            name="cpf"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CPF</FormLabel>
                <div className="relative">
                  <span
                    className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px] z-10"
                    aria-hidden="true"
                  >
                    badge
                  </span>
                  <FormControl>
                    <InputCPF
                      {...field}
                      placeholder="000.000.000-00"
                      className="pl-10"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Campo Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <div className="relative">
                  <span
                    className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]"
                    aria-hidden="true"
                  >
                    mail
                  </span>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="name@example.com"
                      className="pl-10"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Campo Telefone */}
          <FormField
            control={form.control}
            name="telefone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <div className="relative">
                  <span
                    className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px] z-10"
                    aria-hidden="true"
                  >
                    call
                  </span>
                  <FormControl>
                    <InputTelefone
                      {...field}
                      mode="cell"
                      placeholder="(00) 00000-0000"
                      className="pl-10"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Hidden submit button for form submission */}
          <button
            type="submit"
            className="sr-only"
            aria-hidden="true"
            tabIndex={-1}
          >
            Submit
          </button>
        </form>
      </Form>
    </PublicStepLayout>
  );
}
