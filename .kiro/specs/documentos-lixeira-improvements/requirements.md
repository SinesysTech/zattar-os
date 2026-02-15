# Requirements: Melhorias na Página de Lixeira de Documentos

## 1. Visão Geral

A página de lixeira de documentos (`src/app/app/documentos/lixeira/page-client.tsx`) precisa ser atualizada para seguir os padrões de design e UX estabelecidos no sistema, especialmente em relação aos filtros e estrutura de página.

## 2. Problemas Identificados

### 2.1 Filtros Não Seguem o Padrão
**Problema**: A página de lixeira não possui filtros com o estilo de checkbox e contorno pontilhado (`border-dashed`) usado em outras páginas como "Contas a Pagar".

**Referência**: `src/app/app/financeiro/contas-pagar/page.tsx` usa o componente `FilterPopover` de `@/features/partes` que implementa:
- Botão com `border-dashed bg-card`
- Ícone `PlusCircle`
- Popover com checkboxes
- Badge mostrando filtro ativo

### 2.2 Estrutura de Página Inconsistente
**Problema**: A página de lixeira usa um header customizado em vez do componente `PageShell` padrão do sistema.

**Impacto**: Inconsistência visual e de UX com outras páginas do sistema.

## 3. User Stories

### US-1: Filtros Padronizados na Lixeira
**Como** usuário do sistema  
**Quero** filtrar documentos na lixeira usando filtros com checkbox e contorno pontilhado  
**Para** ter uma experiência consistente com outras páginas do sistema

**Critérios de Aceitação**:
1. A página de lixeira deve usar o componente `FilterPopover` de `@/features/partes`
2. Os filtros devem ter o estilo `border-dashed bg-card`
3. Deve haver pelo menos os seguintes filtros:
   - **Período de exclusão**: Hoje, Últimos 7 dias, Últimos 30 dias, Todos
   - **Tipo de documento**: (se aplicável, baseado nos tipos existentes)
4. Os filtros devem mostrar um badge quando ativos
5. Deve haver opção de limpar todos os filtros

### US-2: Estrutura de Página Consistente
**Como** usuário do sistema  
**Quero** que a página de lixeira use o mesmo layout das outras páginas  
**Para** ter uma navegação e experiência visual consistente

**Critérios de Aceitação**:
1. A página deve usar o componente `PageShell` de `@/components/shared/page-shell`
2. O título "Lixeira" deve ser exibido no `PageShell`
3. A descrição deve explicar o propósito da página
4. O botão "Voltar" deve ser mantido, mas integrado ao layout padrão
5. O aviso sobre exclusão automática após 30 dias deve ser mantido

### US-3: Integração com DataShell (Opcional)
**Como** desenvolvedor  
**Quero** avaliar se a página de lixeira deve usar `DataShell` e `DataTable`  
**Para** manter consistência com outras páginas de listagem

**Critérios de Aceitação**:
1. Avaliar se a estrutura atual de cards é adequada ou se deve ser substituída por tabela
2. Se usar tabela, implementar com `DataShell`, `DataTable` e `DataTableToolbar`
3. Manter a funcionalidade de restaurar e excluir permanentemente
4. Garantir que a UX não seja prejudicada pela mudança

## 4. Requisitos Técnicos

### 4.1 Componentes a Utilizar
- `PageShell` de `@/components/shared/page-shell`
- `FilterPopover` de `@/features/partes`
- `DataShell`, `DataTable`, `DataTableToolbar` de `@/components/shared/data-shell` (se aplicável)
- Manter componentes existentes: `Card`, `Button`, `AlertDialog`

### 4.2 Filtros a Implementar
```typescript
// Período de exclusão
const periodoOptions = [
  { value: 'hoje', label: 'Hoje' },
  { value: '7dias', label: 'Últimos 7 dias' },
  { value: '30dias', label: 'Últimos 30 dias' },
  { value: 'todos', label: 'Todos' },
];
```

### 4.3 Lógica de Filtro
- Filtrar documentos por `deleted_at` baseado no período selecionado
- Manter a lista de documentos no estado local
- Aplicar filtros de forma reativa

### 4.4 Estilo dos Filtros
```typescript
<FilterPopover
  label="Período"
  options={periodoOptions}
  value={periodo}
  onValueChange={setPeriodo}
  defaultValue="todos"
/>
```

## 5. Regras de Negócio

### RN-1: Filtro de Período
- **Hoje**: Documentos excluídos nas últimas 24 horas
- **Últimos 7 dias**: Documentos excluídos nos últimos 7 dias
- **Últimos 30 dias**: Documentos excluídos nos últimos 30 dias
- **Todos**: Sem filtro de período

### RN-2: Aviso de Exclusão Automática
- O aviso sobre exclusão automática após 30 dias deve ser mantido
- Deve ser exibido de forma destacada (Card com `border-orange-200`)

### RN-3: Ações nos Documentos
- Restaurar: Move o documento de volta para a lista principal
- Excluir permanentemente: Remove o documento definitivamente (com confirmação)

## 6. Restrições

### 6.1 Compatibilidade
- Manter compatibilidade com as actions existentes:
  - `actionListarLixeira`
  - `actionRestaurarDaLixeira`
  - `actionDeletarPermanentemente`

### 6.2 Performance
- Filtros devem ser aplicados no lado do cliente (dados já carregados)
- Não fazer novas requisições ao servidor ao mudar filtros

### 6.3 Acessibilidade
- Manter labels e aria-labels adequados
- Garantir navegação por teclado
- Manter feedback visual para ações (loading states)

## 7. Casos de Uso

### UC-1: Filtrar Documentos por Período
1. Usuário acessa a página de lixeira
2. Usuário clica no filtro "Período"
3. Sistema exibe popover com opções de período
4. Usuário seleciona "Últimos 7 dias"
5. Sistema filtra e exibe apenas documentos excluídos nos últimos 7 dias
6. Sistema mostra badge no botão de filtro indicando filtro ativo

### UC-2: Limpar Filtros
1. Usuário tem filtros ativos
2. Usuário clica no filtro ativo
3. Sistema exibe popover com opção "Limpar filtro"
4. Usuário clica em "Limpar filtro"
5. Sistema remove o filtro e exibe todos os documentos

### UC-3: Restaurar Documento Filtrado
1. Usuário aplica filtro "Últimos 7 dias"
2. Sistema exibe documentos filtrados
3. Usuário clica em "Restaurar" em um documento
4. Sistema restaura o documento
5. Sistema remove o documento da lista
6. Sistema mantém o filtro ativo

## 8. Critérios de Aceitação Globais

1. ✅ A página deve usar `PageShell` com título e descrição
2. ✅ Os filtros devem usar `FilterPopover` com estilo `border-dashed`
3. ✅ Os filtros devem ter checkboxes e mostrar badge quando ativos
4. ✅ A funcionalidade de restaurar e excluir deve continuar funcionando
5. ✅ O aviso de exclusão automática deve ser mantido
6. ✅ A página deve ser responsiva
7. ✅ Não deve haver regressões nas funcionalidades existentes

## 9. Fora do Escopo

- Implementação de novos tipos de filtros além do período
- Mudança na lógica de exclusão automática (30 dias)
- Implementação de busca por texto
- Paginação (se não existir atualmente)
- Ordenação de documentos

## 10. Referências

- **Página de referência**: `src/app/app/financeiro/contas-pagar/page.tsx`
- **Componente de filtro**: `src/features/partes/components/shared/filter-popover.tsx`
- **PageShell**: `src/components/shared/page-shell.tsx`
- **Design System**: `src/lib/design-system/`
