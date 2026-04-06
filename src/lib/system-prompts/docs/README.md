# Módulo: System-Prompts

**Status:** Fully Migrated

## Visão Geral

Módulo de gerenciamento dos prompts de sistema utilizados por recursos de IA da aplicação (editor, assistente de chat e copilot inline), com fallback de prompts padrão.

## Arquitetura (Feature-Sliced Design)

- [x] Domain (Entidades e Tipos)
- [x] Service (Regras de Negócio)
- [x] Repository (Acesso a Dados)
- [x] Server Actions
- [x] UI Components
- [ ] Regras de Negócio (AI Context)

## Principais arquivos

- `src/features/system-prompts/domain.ts`
- `src/features/system-prompts/service.ts`
- `src/features/system-prompts/repository.ts`
- `src/features/system-prompts/actions/`
- `src/features/system-prompts/components/`
- `src/features/system-prompts/defaults.ts`

## Observações

- `defaults.ts` define fallback para prompts críticos do sistema quando não houver registro ativo no banco.
