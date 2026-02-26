# Módulo: Assistentes-Tipos

**Status:** Partially Migrated

## Visão Geral

Módulo responsável por vincular assistentes de IA a tipos de expediente e automatizar a geração de peças jurídicas no fluxo de criação de expedientes.

## Arquitetura (Feature-Sliced Design)

- [x] Domain (Entidades e Tipos)
- [x] Service (Regras de Negócio)
- [x] Repository (Acesso a Dados)
- [ ] Server Actions (usa `actions.ts` sem pasta `actions/`)
- [x] UI Components
- [ ] Regras de Negócio (AI Context)

## Principais arquivos

- `src/features/assistentes-tipos/domain.ts`
- `src/features/assistentes-tipos/service.ts`
- `src/features/assistentes-tipos/repository.ts`
- `src/features/assistentes-tipos/actions.ts`
- `src/features/assistentes-tipos/geracao-automatica-service.ts`
- `src/features/assistentes-tipos/components/`

## Observações

- Possui README técnico próprio em `src/features/assistentes-tipos/README.md` com detalhes de pipeline e integração.
- O próximo passo de padronização é migrar `actions.ts` para pasta `actions/`.
