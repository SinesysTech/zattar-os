# Change: Sistema de Tipografia shadcn/ui

## Why
Atualmente, o projeto utiliza classes de tipografia Tailwind de forma inconsistente em 104+ arquivos, sem padronização para elementos tipográficos comuns (h1, h2, h3, h4, p, blockquote, listas, etc.). Isso resulta em falta de hierarquia visual consistente, dificuldade de manutenção e experiência do usuário fragmentada. O shadcn/ui fornece uma estrutura tipográfica completa e testada que pode ser aplicada em todo o sistema.

## What Changes
- Criar arquivo CSS com classes de tipografia reutilizáveis baseadas no shadcn/ui
- Implementar variantes tipográficas: h1, h2, h3, h4, p, blockquote, table, list, inline-code, lead, large, small, muted
- Adicionar componentes React opcionais para tipografia semântica (Typography.H1, Typography.P, etc.)
- Documentar padrões de uso e exemplos no código
- Atualizar componentes-chave para usar as novas classes (migração gradual, não breaking)
- Estabelecer guidelines de hierarquia tipográfica para novos componentes

## Impact
- Affected specs:
  - **NEW**: `typography` - nova capacidade sendo adicionada
  - Possível impacto futuro em: `ui-components` (quando componentes existentes forem migrados)

- Affected code:
  - `app/globals.css` - adicionar classes tipográficas
  - `components/ui/typography.tsx` - novo componente (opcional)
  - Documentação de referência para desenvolvedores
  - Migração gradual em componentes existentes (104 arquivos usam classes de tipografia)

- Breaking changes: **NENHUMA**
  - Todas as classes existentes continuam funcionando
  - Migração é opcional e gradual
  - Novas classes são aditivas, não substituem comportamento existente
