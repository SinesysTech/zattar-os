# Tasks: Visualização de Processo com Timeline

## Ordem de Implementação

As tarefas estão ordenadas para permitir desenvolvimento incremental com entregas visíveis ao usuário.

---

## 1. Preparação e Tipos

**Objetivo**: Garantir tipos TypeScript completos para timeline

### 1.1. Criar tipos de timeline frontend
- [x] Criar tipos em `app/_lib/types/timeline.ts` (utilizados tipos existentes do backend)
- [x] Tipos já existentes em `@/backend/types/pje-trt/timeline` e `@/backend/types/mongodb/timeline`

**Validação**: TypeScript compila sem erros, tipos estão disponíveis para importação

**Dependências**: Nenhuma

**Paralelizável**: Não

---

## 2. Hook de Consulta/Captura

**Objetivo**: Encapsular lógica de verificação + captura de timeline

### 2.1. Criar hook `useProcessoTimeline`
- [ ] Criar `lib/hooks/use-processo-timeline.ts`
- [ ] Implementar estados:
  - `processo`: Acervo | null
  - `timeline`: TimelineDocument | null
  - `isLoading`: boolean (carregamento inicial)
  - `isCapturing`: boolean (capturando no PJE)
  - `error`: Error | null
- [ ] Implementar funções:
  - `fetchProcesso()`: GET /api/acervo/[id]
  - `fetchTimeline()`: GET /api/acervo/[id]/timeline
  - `captureTimeline()`: POST /api/captura/trt/timeline
  - `pollTimeline()`: Polling a cada 5s até sucesso/erro
  - `refetch()`: Re-buscar timeline

### 2.2. Implementar lógica de verificação automática
```typescript
useEffect(() => {
  if (!processo) return;
  if (timeline === null && !isCapturing) {
    captureTimeline();
  }
}, [processo, timeline]);
```

### 2.3. Adicionar tratamento de erros
- [ ] Capturar erros de rede
- [ ] Capturar erros de autenticação PJE
- [ ] Capturar erros de timeout
- [ ] Mensagens de erro amigáveis

**Validação**:
- Hook retorna dados corretos quando timeline existe
- Hook aciona captura automaticamente quando timeline não existe
- Polling funciona e para após sucesso/erro
- Erros são capturados e expostos via `error` state

**Dependências**: 1.1

**Paralelizável**: Não

---

## 3. Componentes de UI da Timeline

**Objetivo**: Criar componentes visuais reutilizáveis

### 3.1. Criar `ProcessoHeader`
- [ ] Criar `components/processos/processo-header.tsx`
- [ ] Exibir:
  - TRT (badge)
  - Grau (badge)
  - Número do processo (destaque)
  - Órgão julgador
  - Status
  - Data de autuação
  - Parte autora vs Parte ré (badges coloridas)
  - Responsável (se houver)
- [ ] Estilização com shadcn/ui (Card, Badge, Separator)
- [ ] Responsivo (mobile-friendly)

**Validação**: Header exibe todos os dados do processo corretamente

### 3.2. Criar `TimelineItem`
- [ ] Criar `components/processos/timeline-item.tsx`
- [ ] Props: `item: TimelineItemEnriquecido`, `index: number`
- [ ] Distinguir visualmente documento vs movimento:
  - Documento: ícone FileText, cor azul
  - Movimento: ícone Activity, cor cinza
- [ ] Exibir:
  - Data e hora formatada
  - Título do item
  - Responsável/signatário
  - Tipo (se documento)
  - Status assinatura (se documento)
- [ ] Para documentos com googleDrive:
  - Botão "Ver Documento" (abre em nova aba)
  - Botão "Download" (download direto)
- [ ] Animação de entrada (Framer Motion)

**Validação**: Item renderiza corretamente documentos e movimentos

### 3.3. Criar `TimelineContainer`
- [ ] Criar `components/processos/timeline-container.tsx`
- [ ] Props: `items: TimelineItemEnriquecido[]`, `isLoading: boolean`
- [ ] Ordenação descendente por data (mais recente primeiro)
- [ ] Linha vertical conectando itens
- [ ] Scroll suave
- [ ] Loading skeleton para cada item (quando isLoading)
- [ ] Empty state quando array vazio

**Validação**: Timeline renderiza lista completa ordenada, com scroll

### 3.4. Criar estados de loading/erro
- [ ] Criar `components/processos/timeline-loading.tsx`:
  - Skeleton com 5 itens
  - Mensagem contextual (verificando/capturando/processando)
- [ ] Criar `components/processos/timeline-error.tsx`:
  - Alert de erro com ícone
  - Mensagem de erro
  - Botão "Tentar Novamente"
- [ ] Criar `components/processos/timeline-empty.tsx`:
  - Ilustração (ícone grande)
  - Mensagem "Nenhum movimento ou documento encontrado"

**Validação**: Estados são exibidos apropriadamente

**Dependências**: 1.1, 2.1

**Paralelizável**: 3.1, 3.2, 3.3, 3.4 podem ser feitos em paralelo

---

## 4. Página de Visualização

**Objetivo**: Criar rota dinâmica de visualização

### 4.1. Criar página `app/(dashboard)/processos/[id]/page.tsx`
- [ ] Server Component com params: `{ id: string }`
- [ ] Validar id (number)
- [ ] Client wrapper component para uso do hook
- [ ] Usar `useProcessoTimeline(id)`
- [ ] Renderização condicional:
  ```tsx
  if (isLoading) return <TimelineLoading />;
  if (error) return <TimelineError error={error} onRetry={refetch} />;
  if (!timeline || timeline.timeline.length === 0) return <TimelineEmpty />;
  return (
    <>
      <ProcessoHeader processo={processo} />
      <TimelineContainer items={timeline.timeline} />
    </>
  );
  ```

### 4.2. Adicionar breadcrumb
- [ ] Breadcrumb: Processos > [Número do Processo]
- [ ] Botão "Voltar para Processos"

### 4.3. Adicionar metadata dinâmico
- [ ] `generateMetadata()` com título do processo
- [ ] Descrição com partes e tribunal

**Validação**:
- Página carrega e exibe timeline existente
- Página inicia captura automaticamente se timeline não existe
- Navegação funciona (breadcrumb e botão voltar)
- Metadata é gerado corretamente

**Dependências**: 2.2, 3.1, 3.2, 3.3, 3.4

**Paralelizável**: Não

---

## 5. Atualizar Listagem de Processos

**Objetivo**: Conectar botão "Visualizar" à nova página

### 5.1. Atualizar botão em `app/(dashboard)/processos/page.tsx`
- [ ] Substituir `console.log` por navegação:
  ```tsx
  import { useRouter } from 'next/navigation';
  const router = useRouter();

  onClick={() => {
    router.push(`/processos/${row.original.id}`);
  }}
  ```
- [ ] Adicionar tooltip "Visualizar processo completo"

**Validação**:
- Clicar em "Visualizar" redireciona para `/processos/[id]`
- Navegação é rápida e sem erros

**Dependências**: 4.1

**Paralelizável**: Não

---

## 6. Testes e Validação

**Objetivo**: Garantir funcionalidade completa

### 6.1. Testar fluxo completo
- [ ] Processo com timeline existente: carrega imediatamente
- [ ] Processo sem timeline: inicia captura automática
- [ ] Captura bem-sucedida: exibe timeline após conclusão
- [ ] Erro de captura: exibe mensagem de erro + retry funciona
- [ ] Links Google Drive: abrem documentos corretamente
- [ ] Estados de loading: são exibidos nos momentos certos

### 6.2. Testar casos extremos
- [ ] Timeline com centenas de itens: scroll funciona
- [ ] Timeline vazia: empty state é exibido
- [ ] Processo inválido (ID não existe): erro 404
- [ ] Autenticação PJE falha: mensagem clara
- [ ] MongoDB indisponível: erro tratado

### 6.3. Validar performance
- [ ] Página carrega em < 2s (timeline existente)
- [ ] Captura completa em < 3min (processo médio ~50 docs)
- [ ] UI não trava durante captura
- [ ] Animações são suaves (60fps)

### 6.4. Validar responsividade
- [ ] Mobile (< 640px): timeline legível
- [ ] Tablet (640px - 1024px): layout adequado
- [ ] Desktop (> 1024px): uso eficiente do espaço

**Validação**: Todos os testes passam

**Dependências**: 5.1

**Paralelizável**: 6.1, 6.2, 6.3, 6.4 podem ser feitos em paralelo

---

## 7. Documentação e Finalização

**Objetivo**: Documentar mudanças e completar spec

### 7.1. Atualizar README (se necessário)
- [ ] Adicionar seção sobre visualização de processos
- [ ] Documentar estrutura de timeline

### 7.2. Documentar componentes
- [ ] JSDoc para hook `useProcessoTimeline`
- [ ] JSDoc para componentes principais
- [ ] Adicionar comentários explicativos em lógica complexa

### 7.3. Atualizar OpenSpec
- [ ] Marcar change como "Applied"
- [ ] Atualizar specs com requirements implementados

**Validação**: Documentação está completa e clara

**Dependências**: 6.4

**Paralelizável**: Sim

---

## Resumo de Dependências

```
1.1 → 2.1 → 2.2 → 4.1 → 5.1 → 6.1-6.4 → 7.1-7.3
       ↓
      3.1-3.4 → 4.1
```

## Estimativa de Esforço

| Task | Esforço | Complexidade |
|------|---------|--------------|
| 1. Tipos | 0.5h | Baixa |
| 2. Hook | 2h | Média |
| 3. Componentes UI | 3h | Média |
| 4. Página | 1.5h | Média |
| 5. Atualizar Listagem | 0.5h | Baixa |
| 6. Testes | 2h | Média |
| 7. Documentação | 1h | Baixa |
| **Total** | **~10.5h** | - |

## Ordem de Entrega (Milestones)

**Milestone 1**: Tipos + Hook (Tasks 1-2)
- Funcionalidade core pronta para uso

**Milestone 2**: Componentes UI (Task 3)
- UI completa e reutilizável

**Milestone 3**: Página + Navegação (Tasks 4-5)
- Feature completa e visível ao usuário

**Milestone 4**: Testes + Docs (Tasks 6-7)
- Qualidade garantida e documentação completa
