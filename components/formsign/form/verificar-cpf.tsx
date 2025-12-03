'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { verificarCPFSchema, type VerificarCPFFormData } from '@/lib/formsign/validations/verificarCPF.schema';
import InputCPF from '@/components/formsign/inputs/input-cpf';
import { useFormularioStore } from '@/app/_lib/stores/formsign/formulario-store';
import { toast } from 'sonner';
import { API_ROUTES } from '@/lib/formsign/constants/apiRoutes';
import { parseCPF } from '@/lib/formsign/formatters/cpf';
import { validateCPF } from '@/lib/formsign/validators/cpf.validator';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type { ClienteFormsign } from '@/types/formsign/cliente-adapter.types';
import FormStepLayout from '@/components/formsign/form/form-step-layout';

type VerificarCPFResponse = {
  exists: boolean;
  cliente?: ClienteFormsign | null;
};

export default function VerificarCPF() {
  const [isValidating, setIsValidating] = useState(false);
  const { setDadosCPF, proximaEtapa, getTotalSteps } = useFormularioStore();

  const form = useForm<VerificarCPFFormData>({
    resolver: zodResolver(verificarCPFSchema),
    mode: 'onChange',
    defaultValues: {
      cpf: '',
    },
  });

  const onSubmit = async (data: VerificarCPFFormData) => {
    const sessionId = Math.random().toString(36).substring(7);
    console.log(`\n[CLIENT-${sessionId}] 🚀 Iniciando validação de CPF no frontend`);
    console.log(`[CLIENT-${sessionId}] 📝 CPF original: ${data.cpf}`);

    try {
      // Remover formatação do CPF
      const cpfDigits = parseCPF(data.cpf);
      console.log(`[CLIENT-${sessionId}] 🔢 CPF parseado: ${cpfDigits}`);

      // Validação local redundante (segurança)
      console.log(`[CLIENT-${sessionId}] 🔍 Validando CPF localmente...`);
      if (!validateCPF(cpfDigits)) {
        console.error(`[CLIENT-${sessionId}] ❌ CPF INVÁLIDO na validação local`);
        toast.error('CPF inválido', {
          description: 'CPF inválido. Verifique os dígitos informados.',
        });
        return;
      }
      console.log(`[CLIENT-${sessionId}] ✅ CPF válido na validação local`);

      setIsValidating(true);
      console.log(`[CLIENT-${sessionId}] 🔍 Verificando se CPF existe no sistema...`);

      // Verificar se cliente existe no sistema
      const n8nResult = await fetch(API_ROUTES.verificarCpf, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf: cpfDigits }),
      }).then(async (res) => {
        console.log(`[CLIENT-${sessionId}] 📥 n8n API respondeu: ${res.status}`);
        if (!res.ok) {
          console.error(`[CLIENT-${sessionId}] ❌ n8n API erro: ${res.status} ${res.statusText}`);
          throw new Error(`Erro ${res.status}: ${res.statusText}`);
        }
        const text = await res.text();
        console.log(`[CLIENT-${sessionId}] 📄 n8n API body:`, text);
        if (!text) {
          console.warn(`[CLIENT-${sessionId}] ⚠️  n8n API retornou body vazio`);
          return { exists: false, cliente: null };
        }
        const parsed = JSON.parse(text) as VerificarCPFResponse;
        console.log(`[CLIENT-${sessionId}] 📦 n8n result:`, parsed);
        return parsed;
      });

      console.log(`[CLIENT-${sessionId}] 🎯 Resultado:`, n8nResult);

      // Lógica de decisão simplificada (apenas validação local + n8n)
      console.log(`[CLIENT-${sessionId}] 🧠 Analisando lógica de decisão...`);

      // Verificar se n8n teve erro (não resposta válida)
      if ('error' in n8nResult || typeof n8nResult.exists !== 'boolean') {
        console.warn(`[CLIENT-${sessionId}] ⚠️  n8n com erro ou resposta inválida`);
        console.warn(`[CLIENT-${sessionId}]    exists type: ${typeof n8nResult.exists}`);
        console.warn(`[CLIENT-${sessionId}]    has error: ${'error' in n8nResult}`);
        // Fallback: erro do serviço n8n, permitir continuar
        toast.warning('Atenção', {
          description: 'Não foi possível validar completamente. Continuando...',
        });

        setDadosCPF({
          cpf: cpfDigits,
          clienteExistente: false,
        });

        console.log(`[CLIENT-${sessionId}] ➡️  Avançando para próxima etapa (fallback n8n)`);
        proximaEtapa();
        return;
      }

      // Cenário 1: Cliente existe no sistema
      if (n8nResult.exists && n8nResult.cliente) {
        console.log(`[CLIENT-${sessionId}] ✅ CENÁRIO 1: CLIENTE EXISTE NO SISTEMA`);
        console.log(`[CLIENT-${sessionId}]    Cliente ID: ${n8nResult.cliente.id}`);
        console.log(`[CLIENT-${sessionId}]    Cliente:`, n8nResult.cliente);
        toast.success('CPF encontrado!', {
          description: 'Seus dados foram localizados no sistema.',
        });

        setDadosCPF({
          cpf: cpfDigits,
          clienteExistente: true,
          clienteId: n8nResult.cliente.id,
          dadosCliente: n8nResult.cliente,
        });

        console.log(`[CLIENT-${sessionId}] ➡️  Avançando para próxima etapa (cliente existente)`);
        proximaEtapa();
        return;
      }

      // Cenário 2: Cliente não existe no sistema (novo cadastro)
      if (n8nResult.exists === false) {
        console.log(`[CLIENT-${sessionId}] ✅ CENÁRIO 2: NOVO CLIENTE`);
        toast.info('CPF válido', {
          description: 'Por favor, preencha seus dados cadastrais.',
        });

        setDadosCPF({
          cpf: cpfDigits,
          clienteExistente: false,
        });

        console.log(`[CLIENT-${sessionId}] ➡️  Avançando para próxima etapa (novo cliente)`);
        proximaEtapa();
        return;
      }

      // Cenário 3: Fallback
      console.warn(`[CLIENT-${sessionId}] ⚠️  CENÁRIO 3: FALLBACK`);
      console.warn(`[CLIENT-${sessionId}]    n8nResult.exists: ${n8nResult.exists}`);
      toast.warning('Atenção', {
        description: 'Não foi possível validar completamente. Continuando...',
      });

      setDadosCPF({
        cpf: cpfDigits,
        clienteExistente: false,
      });

      console.log(`[CLIENT-${sessionId}] ➡️  Avançando para próxima etapa (fallback)`);
      proximaEtapa();
    } catch (error) {
      const sessionId = Math.random().toString(36).substring(7);
      console.error(`[CLIENT-${sessionId}] ❌ ERRO CRÍTICO ao verificar CPF:`, error);
      console.error(`[CLIENT-${sessionId}] 📋 Stack trace:`, error instanceof Error ? error.stack : 'N/A');

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
      currentStep={0}
      totalSteps={getTotalSteps()}
      nextLabel="Continuar"
      isNextDisabled={isValidating || !form.formState.isValid}
      isLoading={isValidating}
      showPrevious={false}
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