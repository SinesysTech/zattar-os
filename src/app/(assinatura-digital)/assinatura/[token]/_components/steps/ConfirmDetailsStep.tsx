'use client'

import * as React from 'react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { User, CreditCard, Mail, Phone } from 'lucide-react'
import InputCPF from '@/shared/assinatura-digital/components/inputs/input-cpf'
import { InputTelefone } from '@/components/ui/input-telefone'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { formatCPF, formatTelefone } from '@/shared/assinatura-digital/utils/formatters'
import { PublicStepCard, PublicStepFooter } from '@/shared/assinatura-digital'

const confirmDetailsSchema = z.object({
  nome_completo: z
    .string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(200, 'Nome deve ter no máximo 200 caracteres'),
  cpf: z
    .string()
    .min(1, 'CPF é obrigatório')
    .transform((val) => val.replace(/\D/g, ''))
    .pipe(z.string().refine((val) => val.length === 11, 'CPF deve conter 11 dígitos')),
  email: z.string().min(1, 'E-mail é obrigatório').email('E-mail inválido'),
  telefone: z
    .string()
    .min(1, 'Telefone é obrigatório')
    .transform((val) => val.replace(/\D/g, ''))
    .pipe(z.string().refine((val) => val.length >= 10, 'Telefone deve ter no mínimo 10 dígitos')),
})

type ConfirmDetailsFormInput = {
  nome_completo: string
  cpf: string
  email: string
  telefone: string
}

type ConfirmDetailsFormData = z.infer<typeof confirmDetailsSchema>

export interface ConfirmDetailsStepProps {
  token: string
  dadosSnapshot: {
    nome_completo?: string
    cpf?: string
    email?: string
    telefone?: string
  }
  currentStep?: number
  totalSteps?: number
  onPrevious: () => void
  onNext: () => void
}

export function ConfirmDetailsStep({
  token,
  dadosSnapshot,
  onPrevious,
  onNext,
}: ConfirmDetailsStepProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ConfirmDetailsFormInput>({
    resolver: zodResolver(confirmDetailsSchema),
    mode: 'onBlur',
    defaultValues: {
      nome_completo: dadosSnapshot.nome_completo || '',
      cpf: dadosSnapshot.cpf ? formatCPF(dadosSnapshot.cpf) : '',
      email: dadosSnapshot.email || '',
      telefone: dadosSnapshot.telefone ? formatTelefone(dadosSnapshot.telefone) : '',
    },
  })

  const onSubmit = async (data: ConfirmDetailsFormData) => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/assinatura-digital/public/${token}/identificacao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome_completo: data.nome_completo,
          cpf: data.cpf,
          email: data.email,
          telefone: data.telefone,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Erro ao salvar dados')
      }

      toast.success('Dados confirmados com sucesso!')
      onNext()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar dados')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
        <div className="mx-auto w-full max-w-2xl">
          <PublicStepCard
            title="Confirme seus dados"
            description="Revise as informações abaixo. Edite qualquer campo se necessário antes de prosseguir."
          >
            <Form {...form}>
              <form
                id="confirm-details-form"
                onSubmit={form.handleSubmit(onSubmit)}
                className="grid grid-cols-1 gap-4"
              >
                <FormField
                  control={form.control}
                  name="nome_completo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome completo</FormLabel>
                      <div className="relative">
                        <User
                          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                          aria-hidden="true"
                        />
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Digite seu nome completo"
                            className="h-12 pl-10"
                            autoComplete="name"
                            disabled={isSubmitting}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF</FormLabel>
                      <div className="relative">
                        <CreditCard
                          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10"
                          aria-hidden="true"
                        />
                        <FormControl>
                          <InputCPF
                            {...field}
                            placeholder="000.000.000-00"
                            className="h-12 pl-10"
                            disabled={isSubmitting}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <div className="relative">
                          <Mail
                            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                            aria-hidden="true"
                          />
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="nome@exemplo.com"
                              className="h-12 pl-10"
                              autoComplete="email"
                              disabled={isSubmitting}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="telefone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <div className="relative">
                          <Phone
                            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10"
                            aria-hidden="true"
                          />
                          <FormControl>
                            <InputTelefone
                              {...field}
                              mode="cell"
                              placeholder="(00) 00000-0000"
                              className="h-12 pl-10"
                              autoComplete="tel"
                              disabled={isSubmitting}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </form>
            </Form>
          </PublicStepCard>
        </div>
      </div>
      <PublicStepFooter
        onPrevious={onPrevious}
        formId="confirm-details-form"
        isNextDisabled={isSubmitting}
        isLoading={isSubmitting}
        isPreviousDisabled={isSubmitting}
      />
    </div>
  )
}
