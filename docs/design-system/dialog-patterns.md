# Padrões de Diálogos de Cadastro

Este documento descreve os padrões e diretrizes para criação de diálogos de cadastro no Sinesys usando o componente `DialogFormShell`.

## Quando Usar DialogFormShell

Use `DialogFormShell` para **todos os diálogos de cadastro e edição** no sistema:

- ✅ Formulários de criação (novo cliente, novo processo, etc.)
- ✅ Formulários de edição (editar cliente, editar processo, etc.)
- ✅ Formulários multi-step (cadastro em etapas)
- ✅ Formulários simples (uma única etapa)

## Estrutura do Componente

O `DialogFormShell` é composto por três seções principais:

### Header (Cabeçalho)
- **Título**: Identifica o propósito do diálogo
- **Descrição**: Contexto adicional opcional
- **Barra de Progresso**: Exibida automaticamente quando `multiStep` está configurado
- **Sem botão X**: O diálogo não possui botão de fechar no header

### Body (Corpo)
- **Background branco explícito**: `bg-white dark:bg-gray-950`
- **Conteúdo do formulário**: Campos, inputs, selects, etc.
- **Layout responsivo**: Use grids adaptáveis

### Footer (Rodapé)
- **Botão Cancelar**: Sempre presente à esquerda (fecha o diálogo)
- **Botões de ação**: Personalizados via prop `footer` (Salvar, Próximo, etc.)

## Exemplo Básico

```tsx
import { DialogFormShell } from '@/components/shared/dialog-form-shell';
import { Button } from '@/components/ui/button';

function MeuFormulario() {
  const [open, setOpen] = React.useState(false);

  return (
    <DialogFormShell
      open={open}
      onOpenChange={setOpen}
      title="Novo Cliente"
      description="Preencha os dados do cliente"
      footer={
        <Button type="submit">
          Criar Cliente
        </Button>
      }
    >
      {/* Conteúdo do formulário */}
      <form>
        {/* Campos aqui */}
      </form>
    </DialogFormShell>
  );
}
```

## Formulários Multi-Step

Para formulários divididos em etapas, use a prop `multiStep`:

```tsx
<DialogFormShell
  open={open}
  onOpenChange={setOpen}
  title="Novo Cliente"
  description="Preencha os dados do cliente"
  multiStep={{
    current: 1,        // Etapa atual (1-indexed)
    total: 5,          // Total de etapas
    stepTitle: "Dados Pessoais" // Título da etapa atual (opcional)
  }}
  footer={<FooterButtons />}
>
  {/* Conteúdo da etapa atual */}
</DialogFormShell>
```

### Comportamento da Barra de Progresso

- A barra de progresso é calculada automaticamente
- Para `total <= 1`, o progresso é definido como 100% (evita divisão por zero)
- Para `total > 1`, o cálculo é: `((current - 1) / (total - 1)) * 100`
- A barra mostra "Etapa X de Y" automaticamente

## Guidelines de Layout

### Grids Responsivos

Sempre use grids responsivos que se adaptam a diferentes tamanhos de tela:

```tsx
// ✅ CORRETO - Grid responsivo
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <Input label="Campo 1" />
  <Input label="Campo 2" />
</div>

// ❌ INCORRETO - Grid fixo
<div className="grid grid-cols-2 gap-4">
  <Input label="Campo 1" />
  <Input label="Campo 2" />
</div>
```

### Inputs

Todos os inputs devem ocupar toda a largura disponível:

```tsx
// ✅ CORRETO
<Input className="w-full" />

// ❌ INCORRETO - Largura fixa ou sem w-full
<Input className="w-64" />
```

### Espaçamentos

Use o sistema de espaçamento padrão (grid de 4px):

```tsx
// ✅ CORRETO - Valores do grid
<div className="space-y-4">  {/* 16px */}
<div className="gap-4">      {/* 16px */}
<div className="p-6">        {/* 24px */}

// ❌ INCORRETO - Valores arbitrários
<div className="gap-[13px]">
<div style={{ padding: '17px' }}>
```

## Regras de UX

### Botão Cancelar

- ✅ **Sempre presente** no footer à esquerda
- ✅ Fecha o diálogo ao clicar
- ✅ Não remove dados não salvos (usar confirmação se necessário)

### Botão de Fechar (X)

- ❌ **Nunca** exibir botão X no header
- ✅ O diálogo fecha apenas via botão Cancelar ou tecla Escape

### Validação e Feedback

- ✅ Validação client-side para melhor UX
- ✅ Validação server-side para segurança
- ✅ Mensagens de erro claras e acionáveis
- ✅ Estados de loading durante submissão

### Acessibilidade

- ✅ Suporte a navegação por teclado
- ✅ Labels descritivos para campos
- ✅ Mensagens de erro associadas aos campos
- ✅ Foco gerenciado corretamente

## Largura Máxima

O componente suporta diferentes larguras máximas (apenas desktop):

```tsx
<DialogFormShell
  maxWidth="lg"  // sm | md | lg | xl | 2xl (padrão: lg)
  // ...
>
```

| Valor | Largura Máxima |
|-------|----------------|
| `sm`  | 384px          |
| `md`  | 448px          |
| `lg`  | 512px          |
| `xl`  | 576px          |
| `2xl` | 672px          |

## Integração com React Hook Form

Exemplo completo com React Hook Form:

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
});

function ClienteFormDialog({ open, onOpenChange }) {
  const formRef = React.useRef<HTMLFormElement>(null);
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: '',
      email: '',
    },
  });

  const onSubmit = async (data) => {
    // Lógica de submissão
    await criarCliente(data);
    onOpenChange(false);
  };

  return (
    <DialogFormShell
      open={open}
      onOpenChange={onOpenChange}
      title="Novo Cliente"
      description="Preencha os dados do cliente"
      footer={
        <Button
          type="submit"
          onClick={() => formRef.current?.requestSubmit()}
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? 'Salvando...' : 'Criar Cliente'}
        </Button>
      }
    >
      <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Nome</Label>
            <Input
              {...form.register('nome')}
              className="w-full"
              aria-invalid={!!form.formState.errors.nome}
            />
            {form.formState.errors.nome && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.nome.message}
              </p>
            )}
          </div>
          <div>
            <Label>Email</Label>
            <Input
              {...form.register('email')}
              type="email"
              className="w-full"
              aria-invalid={!!form.formState.errors.email}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>
        </div>
      </form>
    </DialogFormShell>
  );
}
```

## Referências

- **Componente**: `src/components/shared/dialog-form-shell.tsx`
- **Design System**: `docs/design-system-usage.md`
- **Status de Migração**: `docs/dialogs-migration-status.md`
