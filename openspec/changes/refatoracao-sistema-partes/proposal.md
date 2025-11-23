# Refatoração do Sistema de Partes

## Summary
Reestruturação completa do sistema de gestão de partes (clientes, partes contrárias e terceiros) para seguir fielmente a estrutura de dados do PJE, incluindo normalização de endereços, unificação de interface frontend e preparação para captura automatizada de partes processuais.

## Motivation
O sistema atual de clientes e partes contrárias não reflete adequadamente a estrutura de dados do PJE, dificultando a implementação da captura automatizada de partes processuais. As principais limitações são:

1. **Estrutura incompatível com PJE**: Campos não mapeiam diretamente aos retornados pela API do PJE
2. **Endereços não normalizados**: Dados de endereço em JSONB dificultam consultas e relacionamentos
3. **Ausência de terceiros**: Não há suporte para peritos, ministério público e outros terceiros
4. **Relação processo-parte indefinida**: Não há tabela para vincular partes aos processos onde aparecem
5. **UI fragmentada**: Clientes e partes contrárias em páginas separadas, dificultando navegação

## Goals
1. ✅ Alinhar estrutura de dados com o PJE (campos idênticos)
2. ✅ Normalizar endereços em tabela separada (suporta múltiplos endereços por pessoa)
3. ✅ Criar suporte para terceiros interessados (peritos, MP, etc)
4. ✅ Implementar tabela de relacionamento processo-partes
5. ✅ Unificar interface em página única com tabs (Clientes | Partes Contrárias | Terceiros)
6. 🔄 Preparar infraestrutura para captura automatizada de partes do PJE

## Non-Goals
- Implementação completa da captura de partes (será feita em change posterior)
- Migração de dados existentes (tabelas estão vazias)
- Alteração em outras funcionalidades do sistema
- Modificação de permissões ou auditoria

## Scope

### Database Changes
- ✅ Criar tabela `enderecos` (normalizada, polimórfica)
- ✅ Reestruturar tabela `clientes` (42 campos novos, 4 removidos)
- ✅ Reestruturar tabela `partes_contrarias` (42 campos novos, 4 removidos)
- 🔄 Criar tabela `terceiros` (estrutura completa PJE)
- 🔄 Criar tabela `processo_partes` (relacionamento N:N)

### Backend Changes
- 🔄 Atualizar tipos TypeScript para todas as entidades
- 🔄 Atualizar/criar serviços de persistência
- 🔄 Atualizar/criar API routes
- 🔄 Adicionar validações e documentação Swagger

### Frontend Changes
- 🔄 Renomear `/clientes` → `/partes`
- 🔄 Criar interface com tabs (ClientOnlyTabs para React 19)
- 🔄 Refatorar formulários para novos campos
- 🔄 Atualizar componentes de visualização
- 🔄 Ajustar navegação e menu

## Affected Specs
- **Modified**: `clientes`, `clientes-frontend`
- **New**: `partes-contrarias`, `enderecos`, `terceiros`, `processo-partes`, `frontend-partes`
- **Prepared for**: `captura-partes` (estrutura pronta, implementação futura)

## Success Criteria
1. ✅ Migrations aplicadas com sucesso (enderecos, clientes, partes_contrarias)
2. 🔄 Todas as tabelas criadas (terceiros, processo_partes pendentes)
3. 🔄 Backend completo com CRUD funcional para todas as entidades
4. 🔄 Frontend unificado em `/partes` com 3 tabs funcionais
5. 🔄 Tipos TypeScript sincronizados entre backend e frontend
6. 🔄 Testes manuais de fluxo completo passando
7. 🔄 Documentação Swagger atualizada

## Risks & Mitigation
| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| Tipos TypeScript complexos | Médio | Alta | Usar utility types, validação incremental |
| Relacionamento polimórfico | Médio | Média | Criar helper functions, documentar padrão |
| UI com múltiplos estados | Médio | Média | Usar ClientOnlyTabs, state management claro |
| Performance com JOINs | Baixo | Baixa | Índices apropriados já criados |

## Timeline
- **FASE 1** (Database): ~1-2 horas - ✅ 60% concluído
- **FASE 2-4** (Backend): ~4-6 horas - ⏳ Pendente
- **FASE 5-6** (Frontend): ~3-4 horas - ⏳ Pendente
- **FASE 7** (Testes): ~1-2 horas - ⏳ Pendente

**Total estimado**: 9-14 horas

## Related Changes
- Depends on: Nenhum
- Blocks: `captura-partes-pje` (futura implementação de captura)
- Related: `unify-multi-instance-processes` (mesma filosofia de normalização)

## Status
🔄 **In Progress** - Database reestruturado (60%), Backend e Frontend pendentes
