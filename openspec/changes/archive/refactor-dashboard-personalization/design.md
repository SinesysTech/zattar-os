## Context

O dashboard é a página inicial da aplicação para usuários autenticados. Atualmente:
- Dados financeiros são carregados por 3 hooks separados, gerando múltiplas requisições
- Não há verificação de permissões granulares para exibição de widgets
- Admin vê widgets sem organização lógica por domínio
- Títulos são estáticos ("Dashboard", "Dashboard Administrador")

Stakeholders: usuários finais (advogados, assistentes), admins do escritório.

## Goals / Non-Goals

### Goals
- Reduzir latência consolidando queries financeiras em uma única chamada
- Filtrar widgets por permissões do usuário para segurança e UX
- Organizar visão admin por domínios funcionais para melhor navegação
- Personalizar saudação com nome do usuário

### Non-Goals
- Não alterar lógica de cálculo de métricas existentes
- Não modificar estrutura de banco de dados
- Não implementar novos widgets
- Não alterar permissões existentes no sistema

## Decisions

### 1. Consolidação de Queries Financeiras

**Decision**: Criar função `buscarDadosFinanceirosConsolidados()` no repository que retorna todos os dados financeiros em uma única estrutura.

**Rationale**:
- Reduz de 3 para 1 requisição ao backend
- Permite `Promise.all()` para paralelizar subqueries internamente
- Mantém interface limpa para o componente

**Alternatives considered**:
- React Query com batch: Adiciona complexidade de configuração
- GraphQL: Overhead de migração para um único caso de uso
- **Consolidar no repository (escolhido)**: Simples, mantém arquitetura FSD

### 2. Hook de Permissões de Widgets

**Decision**: Criar `useWidgetPermissions()` que mapeia permissões do sistema para flags de visualização de widgets.

**Rationale**:
- Centraliza lógica de permissões em um lugar
- Reutilizável se outros componentes precisarem
- Usa `useMinhasPermissoes()` existente como base

**Implementation**:
```typescript
// hooks/use-widget-permissions.ts
export function useWidgetPermissions() {
  const { permissoes, isSuperAdmin } = useMinhasPermissoes();

  return {
    podeVerProcessos: isSuperAdmin || permissoes.includes('processos:read'),
    podeVerAudiencias: isSuperAdmin || permissoes.includes('audiencias:read'),
    podeVerExpedientes: isSuperAdmin || permissoes.includes('expedientes:read'),
    podeVerFinanceiro: isSuperAdmin || permissoes.includes('financeiro:read'),
    podeVerRH: isSuperAdmin || permissoes.includes('rh:read'),
    podeVerCaptura: isSuperAdmin || permissoes.includes('captura:read'),
  };
}
```

### 3. Componente DomainSection

**Decision**: Criar componente wrapper para agrupar widgets por domínio no admin.

**Rationale**:
- Organização visual clara por área funcional
- Reusável para diferentes seções
- Segue padrão de componentes do shadcn/ui

**Props**:
- `title: string` - Título da seção
- `description?: string` - Descrição opcional
- `icon?: LucideIcon` - Ícone identificador
- `children: ReactNode` - Widgets filhos

### 4. Saudação Personalizada

**Decision**: Buscar nome do usuário no service e exibir "Olá, {nome}!" em ambos os dashboards.

**Rationale**:
- UX mais amigável e personalizada
- Diferencia visualmente o dashboard do usuário
- Consistente com padrões de aplicações modernas

**Implementation**:
- User dashboard já recebe `data.usuario.nome`
- Admin dashboard precisará passar `usuarioId` para service buscar nome

## Risks / Trade-offs

### Risk: Cache invalidation
- **Risco**: Dados consolidados podem ficar desatualizados mais tempo
- **Mitigação**: Manter mesmo TTL de cache (5 min) da implementação atual

### Risk: Aumento de complexidade do service
- **Risco**: Service ficará mais complexo com nova lógica
- **Mitigação**: Manter funções bem separadas e documentadas

### Trade-off: Performance vs Granularidade
- Consolidar queries pode retornar dados desnecessários em alguns casos
- Benefício de reduzir round-trips compensa overhead mínimo de dados extras

## Migration Plan

1. Implementar mudanças sem quebrar funcionalidade existente
2. Criar novos hooks/componentes antes de refatorar existentes
3. Atualizar componentes um por vez
4. Não há necessidade de migração de dados

**Rollback**: Reverter commits se necessário, sem impacto em dados.

## Open Questions

- Nenhuma questão em aberto - plano detalhado já definido
