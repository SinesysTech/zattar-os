# Módulo: Integrações

**Status:** Fully Migrated

## Visão Geral

Módulo central de configurações de integrações externas (ex.: 2FAuth, Dify, Chatwoot, Dyte, webhook e provedores de IA para editor), com validações por tipo e gestão de credenciais/configurações.

## Arquitetura (Feature-Sliced Design)

- [x] Domain (Entidades e Tipos)
- [x] Service (Regras de Negócio)
- [x] Repository (Acesso a Dados)
- [x] Server Actions
- [x] UI Components
- [ ] Regras de Negócio (AI Context)

## Principais arquivos

- `src/features/integracoes/domain.ts`
- `src/features/integracoes/service.ts`
- `src/features/integracoes/repository.ts`
- `src/features/integracoes/actions/`
- `src/features/integracoes/components/`

## Observações

- Contém schemas específicos por tipo de integração (`twofauth`, `dify`, `chatwoot`, `dyte`, `editor_ia`, etc.).
