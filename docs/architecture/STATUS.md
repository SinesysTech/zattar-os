# Relatório de Status do Projeto Sinesys

**Data:** 2026-02-25  
**Versão:** Next.js 16 / React 19

## 1. Resumo Executivo

O projeto segue a arquitetura Feature-Sliced Design (FSD) + princípios DDD, com **37 módulos em `src/features`**. A base está funcional e evolutiva, com diferentes níveis de maturidade estrutural entre os módulos.

Este status foi atualizado com base na árvore atual do repositório (não em projeções históricas).

## 2. Status Estrutural dos Módulos

Critério de completude: presença simultânea de `domain.ts`, `service.ts`, `repository.ts`, `index.ts`, `actions/` e `components/`.

| Status           | Total | Módulos                                                                                                                                                                                                                                         |
| ---------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ✅ **Completos** | 18    | `acervo`, `advogados`, `ai`, `captura`, `config-atribuicao`, `contratos`, `dify`, `enderecos`, `integracoes`, `notificacoes`, `obrigacoes`, `pecas-juridicas`, `pericias`, `processos`, `rh`, `system-prompts`, `tipos-expedientes`, `usuarios` |
| ⚠️ **Parciais**  | 13    | `assistentes-tipos`, `audiencias`, `calendar`, `cargos`, `chat`, `chatwoot`, `documentos`, `expedientes`, `financeiro`, `partes`, `perfil`, `profiles`, `tags`                                                                                  |
| 🧩 **Iniciais**  | 6     | `admin`, `audit`, `busca`, `repasses`, `tasks`, `twofauth`                                                                                                                                                                                      |

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

- Não há módulos em `src/features` sem pasta correspondente em `docs/modules`.
- Pasta em `docs/modules` sem módulo correspondente em `src/features`: `assinatura-digital` (mantida como documentação histórica/funcional).

## 5. Próximos Passos Recomendados

1. Padronizar os 13 módulos parciais no contrato FSD completo.
2. Expandir `RULES.md` e `README.md` por módulo para melhorar suporte a IA e onboarding.
3. Tratar módulos iniciais (`admin`, `audit`, `busca`, `repasses`, `tasks`, `twofauth`) com roadmap explícito.
