# Design: Tipos de Expedientes

## Context
Precisamos adicionar categorização de expedientes pendentes de manifestação e permitir descrições/arquivos relacionados. A tabela `pendentes_manifestacao` já possui dados existentes, então as migrations precisam ser cuidadosas para não quebrar dados existentes.

## Goals / Non-Goals

### Goals
- Criar sistema completo de CRUD para tipos de expedientes
- Adicionar campos `tipo_expediente_id` e `descricao_arquivos` em `pendentes_manifestacao`
- Exibir tipo e descrição em coluna composta no frontend
- Manter compatibilidade com dados existentes (campos nullable)
- Documentar completamente no Swagger

### Non-Goals
- Não criar sistema de upload de arquivos (apenas texto descritivo por enquanto)
- Não implementar hierarquia de tipos (flat structure)
- Não criar sistema de tags múltiplas (um tipo por expediente)

## Decisions

### Decision: Campos nullable em `pendentes_manifestacao`
**Rationale**: Como há dados existentes na tabela, os novos campos devem ser nullable para não quebrar registros existentes. Isso permite migração gradual.

### Decision: Foreign Key com `on delete set null`
**Rationale**: Se um tipo de expediente for deletado, os expedientes relacionados não devem ser deletados, apenas ter o campo `tipo_expediente_id` setado para null.

### Decision: Validação de uso antes de deletar
**Rationale**: Antes de permitir deleção de um tipo de expediente, verificar se há expedientes usando esse tipo. Se houver, bloquear deleção ou implementar soft delete.

### Decision: Buscar tipos uma única vez no frontend
**Rationale**: Seguindo o padrão já implementado para usuários, buscar a lista de tipos uma única vez no componente pai e passar via props para evitar múltiplas requisições.

### Decision: Usar MCP Supabase para migrations
**Rationale**: O usuário solicitou explicitamente usar MCP Supabase ao invés de criar arquivos SQL diretamente. Isso garante que as migrations sejam aplicadas corretamente no ambiente.

## Risks / Trade-offs

### Risk: Dados existentes podem ficar sem tipo
**Mitigation**: Campos são nullable, então dados existentes continuam funcionando. Usuários podem atribuir tipos gradualmente.

### Risk: Performance ao fazer JOIN com tipos_expedientes
**Mitigation**: Criar índice em `tipo_expediente_id` e usar JOIN apenas quando necessário (quando filtro por tipo está ativo).

### Risk: Deleção acidental de tipo em uso
**Mitigation**: Implementar verificação antes de deletar, bloqueando deleção se tipo está sendo usado.

## Migration Plan

### Step 1: Criar tabela `tipos_expedientes`
- Criar tabela com estrutura completa
- Habilitar RLS
- Criar índices

### Step 2: Inserir tipos pré-definidos
- Inserir 33 tipos fornecidos
- Usar `created_by` do sistema ou primeiro usuário admin

### Step 3: Adicionar colunas em `pendentes_manifestacao`
- Adicionar `tipo_expediente_id` (nullable, FK)
- Adicionar `descricao_arquivos` (nullable, text)
- Criar índice em `tipo_expediente_id`

### Step 4: Implementar backend
- Criar serviços de persistência
- Criar serviços de negócio
- Criar endpoints API

### Step 5: Atualizar frontend
- Criar hook para tipos
- Atualizar página de expedientes
- Adicionar coluna composta

### Rollback Plan
- Se necessário, remover colunas de `pendentes_manifestacao` (dados serão perdidos se houver)
- Deletar tabela `tipos_expedientes` (dados serão perdidos)

## Open Questions
- Quem deve ter permissão para criar/editar/deletar tipos de expedientes? (Todos autenticados ou apenas admins?)
- Devemos permitir soft delete de tipos em uso ou apenas bloquear hard delete?

