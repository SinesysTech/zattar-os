# Módulo: Dify

**Status:** Fully Migrated

## Visão Geral

Módulo de integração com a plataforma Dify para gerenciamento e execução de apps de IA (chat, chatflow, workflow, completion e agent), incluindo suporte a ferramentas MCP.

## Arquitetura (Feature-Sliced Design)

- [x] Domain (Entidades e Tipos)
- [x] Service (Regras de Negócio)
- [x] Repository (Acesso a Dados)
- [x] Server Actions
- [x] UI Components
- [ ] Regras de Negócio (AI Context)

## Principais arquivos

- `src/features/dify/domain.ts`
- `src/features/dify/service.ts`
- `src/features/dify/repository.ts`
- `src/features/dify/actions/`
- `src/features/dify/components/`
- `src/features/dify/factory.ts`

## Observações

- Possui documentação detalhada em `src/features/dify/README.md`, `src/features/dify/API_REFERENCE.md` e `src/features/dify/DIFY-API-REFERENCE.md`.
