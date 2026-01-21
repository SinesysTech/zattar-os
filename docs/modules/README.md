# Índice de Features (FSD)

Este documento é um índice rápido dos módulos em `src/features/` e onde encontrar documentação específica (README/RULES) quando existir.

> Convenção: evite imports profundos. Sempre prefira `@/features/<modulo>` (barrel exports).

## Módulos

| Feature | Pasta | Docs (FSD) | Docs (Wiki) | RULES |
|---|---|---|---|---|
| acervo | [src/features/acervo](../../src/features/acervo) | [README](../../src/features/acervo/README.md) | — | — |
| admin | [src/features/admin](../../src/features/admin) | — | — | — |
| advogados | [src/features/advogados](../../src/features/advogados) | — | — | — |
| ai | [src/features/ai](../../src/features/ai) | — | [Wiki](./ai) | — |
| assistentes | [src/features/assistentes](../../src/features/assistentes) | — | — | — |
| assinatura-digital | — | — | [Wiki](./assinatura-digital) | — |
| audiencias | [src/features/audiencias](../../src/features/audiencias) | — | [Wiki](./audiencias) | [RULES](../../src/features/audiencias/RULES.md) |
| busca | [src/features/busca](../../src/features/busca) | — | — | [RULES](../../src/features/busca/RULES.md) |
| calendar | [src/features/calendar](../../src/features/calendar) | — | — | — |
| captura | [src/features/captura](../../src/features/captura) | — | — | — |
| cargos | [src/features/cargos](../../src/features/cargos) | — | — | — |
| chat | [src/features/chat](../../src/features/chat) | — | — | — |
| chatwoot | [src/features/chatwoot](../../src/features/chatwoot) | — | [Wiki](./chatwoot) | — |
| config-atribuicao | [src/features/config-atribuicao](../../src/features/config-atribuicao) | — | — | — |
| contratos | [src/features/contratos](../../src/features/contratos) | — | — | [RULES](../../src/features/contratos/RULES.md) |
| documentos | [src/features/documentos](../../src/features/documentos) | — | — | [RULES](../../src/features/documentos/RULES.md) |
| enderecos | [src/features/enderecos](../../src/features/enderecos) | — | — | — |
| expedientes | [src/features/expedientes](../../src/features/expedientes) | — | — | — |
| financeiro | [src/features/financeiro](../../src/features/financeiro) | — | [Wiki](./financeiro) | [RULES](../../src/features/financeiro/RULES.md) |
| notificacoes | [src/features/notificacoes](../../src/features/notificacoes) | — | — | [RULES](../../src/features/notificacoes/RULES.md) |
| obrigacoes | [src/features/obrigacoes](../../src/features/obrigacoes) | [README](../../src/features/obrigacoes/README.md) | — | [RULES](../../src/features/obrigacoes/RULES.md) |
| pangea | [src/features/pangea](../../src/features/pangea) | — | — | — |
| partes | [src/features/partes](../../src/features/partes) | — | — | [RULES](../../src/features/partes/RULES.md) |
| perfil | [src/features/perfil](../../src/features/perfil) | — | — | — |
| pericias | [src/features/pericias](../../src/features/pericias) | — | — | — |
| portal-cliente | [src/features/portal-cliente](../../src/features/portal-cliente) | — | — | — |
| processos | [src/features/processos](../../src/features/processos) | — | — | [RULES](../../src/features/processos/RULES.md) |
| profiles | [src/features/profiles](../../src/features/profiles) | [README](../../src/features/profiles/README.md) | — | — |
| repasses | [src/features/repasses](../../src/features/repasses) | — | — | — |
| rh | [src/features/rh](../../src/features/rh) | [README](../../src/features/rh/README.md) | — | — |
| tasks | [src/features/tasks](../../src/features/tasks) | — | — | — |
| tipos-expedientes | [src/features/tipos-expedientes](../../src/features/tipos-expedientes) | — | — | — |
| usuarios | [src/features/usuarios](../../src/features/usuarios) | — | — | — |

## Testes por feature

Scripts úteis (quando aplicável) ficam no `package.json`. Alguns atalhos existentes:

- `npm run test:actions:processos`
- `npm run test:actions:partes`
- `npm run test:actions:financeiro`
- `npm run test:enderecos`
- `npm run test:pericias`
- `npm run test:portal-cliente`

E2E (Playwright): `npm run test:e2e` (docs: `../../src/testing/e2e/README.md`).
