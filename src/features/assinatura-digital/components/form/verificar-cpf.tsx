'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { verificarCPFSchema, type VerificarCPFFormData } from '@/lib/assinatura-digital/validations/verificarCPF.schema';
import InputCPF from '@/features/assinatura-digital/components/inputs/input-cpf';
import { useFormularioStore } from '@/features/assinatura-digital/stores';
import { toast } from 'sonner';
import { API_ROUTES } from '@/lib/assinatura-digital/constants/apiRoutes';
import { parseCPF } from '@/features/assinatura-digital/utils/formatters';
import { validateCPF } from '@/features/assinatura-digital/utils';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type { ClienteAssinaturaDigital } from '@/types/assinatura-digital/cliente-adapter.types';
import FormStepLayout from '@/features/assinatura-digital/components/form/form-step-layout';

type VerificarCPFResponse = {
  exists: boolean;
  cliente?: ClienteAssinaturaDigital | null;
};

export default function VerificarCPF() {
  const [isValidating, setIsValidating] = useState(false);
  const { setDadosCPF, proximaEtapa, getTotalSteps, etapaAtual } = useFormularioStore();

  const form = useForm<VerificarCPFFormData>({
    resolver: zodResolver(verificarCPFSchema),
    mode: 'onChange',
    defaultValues: {
      cpf: '',
    },
  });

  const onSubmit = async (data: VerificarCPFFormData) => {
    try {
      // Remover formatação do CPF
      const cpfDigits = parseCPF(data.cpf);

      // Validação local redundante (segurança)
      if (!validateCPF(cpfDigits)) {
        toast.error('CPF inválido', {
          description: 'CPF inválido. Verifique os dígitos informados.',
        });
        return;
      }

      setIsValidating(true);

      // Verificar se cliente existe no sistema via API verificar-cpf
      const response = await fetch(API_ROUTES.verificarCpf, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf: cpfDigits }),
      });

      // Tratar erros HTTP (4xx, 5xx)
      if (!response.ok) {
        console.error(`verificarCpf API erro: ${response.status} ${response.statusText}`);
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const apiResult: VerificarCPFResponse = await response.json();

      // Cenário 1: Cliente existe no sistema
      if (apiResult.exists === true && apiResult.cliente) {
        toast.success('CPF encontrado!', {
          description: 'Seus dados foram localizados no sistema.',
        });

        setDadosCPF({
          cpf: cpfDigits,
          clienteExistente: true,
          clienteId: apiResult.cliente.id,
          dadosCliente: apiResult.cliente,
        });

        proximaEtapa();
        return;
      }

      // Cenário 2: Cliente não existe no sistema (novo cadastro)
      if (apiResult.exists === false) {
        toast.info('CPF válido', {
          description: 'Por favor, preencha seus dados cadastrais.',
        });

        setDadosCPF({
          cpf: cpfDigits,
          clienteExistente: false,
        });

        proximaEtapa();
        return;
      }

      // Cenário 3: Fallback (exists não é boolean - resposta inesperada)
      if (typeof apiResult.exists !== 'boolean') {
        console.warn('verificarCpf API retornou resposta inesperada:', apiResult);
        toast.warning('Atenção', {
          description: 'Não foi possível validar completamente. Continuando...',
        });

        setDadosCPF({
          cpf: cpfDigits,
          clienteExistente: false,
        });

        proximaEtapa();
      }
    } catch (error) {
      console.error('Erro ao verificar CPF:', error);

      toast.error('Erro ao verificar CPF', {
        description: 'Ocorreu um erro ao validar o CPF. Tente novamente.',
      });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <FormStepLayout
      title="Verificação de CPF"
      description="Informe seu CPF para iniciar o cadastro"
      currentStep={etapaAtual}
      totalSteps={getTotalSteps()}
      nextLabel="Continuar"
      isNextDisabled={isValidating || !form.formState.isValid}
      isLoading={isValidating}
      hidePrevious={true}
      cardClassName="w-full max-w-lg mx-auto"
      formId="verificar-cpf-form"
    >
      <Form {...form}>
        <form
          id="verificar-cpf-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <FormField
            control={form.control}
            name="cpf"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CPF</FormLabel>
                <FormControl>
                  <InputCPF
                    placeholder="000.000.000-00"
                    disabled={isValidating}
                    autoFocus={true}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <button type="submit" className="sr-only" aria-hidden="true" tabIndex={-1}>
            Submit
          </button>
        </form>
      </Form>
    </FormStepLayout>
  );
}