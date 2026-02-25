# Índice de Features (FSD)

Este documento acompanha o estado real de `src/features/` e da documentação em `docs/modules/`.

> Convenção: evitar imports profundos. Preferir sempre `@/features/<modulo>` (barrel export via `index.ts`).

## Resumo (2026-02-25)

- Módulos em `src/features`: **37**
- Pastas em `docs/modules`: **33**
- Módulos sem pasta em `docs/modules`: `assistentes-tipos`, `dify`, `integracoes`, `system-prompts`, `twofauth`
- Pasta sem módulo correspondente em `src/features`: `assinatura-digital`

## Classificação estrutural dos módulos

Critério de módulo **completo**: `domain.ts` + `service.ts` + `repository.ts` + `index.ts` + `actions/` + `components/`.

- ✅ **Completos (17)**: `acervo`, `advogados`, `ai`, `captura`, `config-atribuicao`, `contratos`, `dify`, `enderecos`, `integracoes`, `notificacoes`, `obrigacoes`, `pecas-juridicas`, `pericias`, `processos`, `rh`, `tipos-expedientes`, `usuarios`
- ⚠️ **Parciais (14)**: `assistentes-tipos`, `audiencias`, `calendar`, `cargos`, `chat`, `chatwoot`, `documentos`, `expedientes`, `financeiro`, `partes`, `perfil`, `profiles`, `system-prompts`, `tags`
- 🧩 **Iniciais (6)**: `admin`, `audit`, `busca`, `repasses`, `tasks`, `twofauth`

## Cobertura de artefatos por módulo

| Artefato              | Cobertura |
| --------------------- | --------- |
| `index.ts`            | 37/37     |
| `components/`         | 32/37     |
| `domain.ts`           | 30/37     |
| `actions/`            | 30/37     |
| `service.ts`          | 29/37     |
| `repository.ts`       | 26/37     |
| `RULES.md`            | 8/37      |
| `README.md` no módulo | 6/37      |

## Documentação funcional disponível

Veja os módulos documentados nesta pasta: `acervo`, `admin`, `advogados`, `ai`, `audiencias`, `audit`, `busca`, `calendar`, `captura`, `cargos`, `chat`, `chatwoot`, `config-atribuicao`, `contratos`, `documentos`, `enderecos`, `expedientes`, `financeiro`, `notificacoes`, `obrigacoes`, `partes`, `pecas-juridicas`, `perfil`, `pericias`, `processos`, `profiles`, `repasses`, `rh`, `tags`, `tasks`, `tipos-expedientes`, `usuarios`.

## Testes por feature

Scripts úteis (quando aplicável) no `package.json`:

- `npm run test:actions:processos`
- `npm run test:actions:partes`
- `npm run test:actions:financeiro`
- `npm run test:enderecos`
- `npm run test:pericias`

E2E (Playwright): `npm run test:e2e` (docs: `../../src/testing/e2e/README.md`).
