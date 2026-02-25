# Relatório de Status do Projeto Sinesys

**Data:** 2026-02-25  
**Versão:** Next.js 16 / React 19

## 1. Resumo Executivo

O projeto segue a arquitetura Feature-Sliced Design (FSD) + princípios DDD, com **37 módulos em `src/features`**. A base está funcional e evolutiva, com diferentes níveis de maturidade estrutural entre os módulos.

Este status foi atualizado com base na árvore atual do repositório (não em projeções históricas).

## 2. Status Estrutural dos Módulos

Critério de completude: presença simultânea de `domain.ts`, `service.ts`, `repository.ts`, `index.ts`, `actions/` e `components/`.

| Status           | Total | Módulos                                                                                                                                                                                                                       |
| ---------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ✅ **Completos** | 17    | `acervo`, `advogados`, `ai`, `captura`, `config-atribuicao`, `contratos`, `dify`, `enderecos`, `integracoes`, `notificacoes`, `obrigacoes`, `pecas-juridicas`, `pericias`, `processos`, `rh`, `tipos-expedientes`, `usuarios` |
| ⚠️ **Parciais**  | 14    | `assistentes-tipos`, `audiencias`, `calendar`, `cargos`, `chat`, `chatwoot`, `documentos`, `expedientes`, `financeiro`, `partes`, `perfil`, `profiles`, `system-prompts`, `tags`                                              |
| 🧩 **Iniciais**  | 6     | `admin`, `audit`, `busca`, `repasses`, `tasks`, `twofauth`                                                                                                                                                                    |

## 3. Cobertura de Artefatos (37 módulos)

- `index.ts`: 37 (100%)
- `components/`: 32 (86%)
- `domain.ts`: 30 (81%)
- `actions/`: 30 (81%)
- `service.ts`: 29 (78%)
- `repository.ts`: 26 (70%)
- `RULES.md`: 8 (22%)
- `README.md` no módulo: 6 (16%)

## 4. Estado da Documentação por Módulo

- Módulos com pasta em `src/features` sem correspondência em `docs/modules`: `assistentes-tipos`, `dify`, `integracoes`, `system-prompts`, `twofauth`.
- Pasta em `docs/modules` sem módulo correspondente em `src/features`: `assinatura-digital` (mantida como documentação histórica/funcional).

## 5. Próximos Passos Recomendados

1. Padronizar os 14 módulos parciais no contrato FSD completo.
2. Criar documentação em `docs/modules` para os 5 módulos sem página.
3. Expandir `RULES.md` e `README.md` por módulo para melhorar suporte a IA e onboarding.
4. Tratar módulos iniciais (`admin`, `audit`, `busca`, `repasses`, `tasks`, `twofauth`) com roadmap explícito.
