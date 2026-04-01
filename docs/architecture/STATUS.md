# Relatório de Status do Projeto Sinesys

**Data:** 2026-02-26  
**Versão:** Next.js 16 / React 19

## 1. Resumo Executivo

O projeto segue a arquitetura Feature-Sliced Design (FSD) + princípios DDD, com **42 módulos em `src/features`**. A base está funcional e evolutiva, com diferentes níveis de maturidade estrutural entre os módulos.

Este status foi atualizado com base na árvore atual do repositório (não em projeções históricas).

## 2. Status Estrutural dos Módulos

Critério de completude: presença simultânea de `domain.ts`, `service.ts`, `repository.ts`, `index.ts`, `actions/` e `components/`.

| Status           | Total | Módulos                                                                                                                                                                                                                                                       |
| ---------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ✅ **Completos** | 23    | `acervo`, `advogados`, `ai`, `assistentes-tipos`, `audiencias`, `captura`, `chatwoot`, `config-atribuicao`, `contratos`, `dify`, `enderecos`, `entrevistas-trabalhistas`, `expedientes`, `integracoes`, `notificacoes`, `obrigacoes`, `pecas-juridicas`, `pericias`, `processos`, `rh`, `system-prompts`, `tipos-expedientes`, `usuarios` |
| ⚠️ **Parciais**  | 8     | `calendar`, `cargos`, `chat`, `documentos`, `financeiro`, `partes`, `perfil`, `tags`                                                                                                                                                                        |
| 🧩 **Iniciais**  | 11    | `admin`, `agenda-eventos`, `audit`, `busca`, `calculadoras`, `portal`, `profiles`, `repasses`, `tasks`, `twofauth`, `website`                                                                                                                               |

## 3. Cobertura de Artefatos (42 módulos)

- `index.ts`: 41 (98%)
- `components/`: 36 (86%)
- `domain.ts`: 34 (81%)
- `actions/`: 33 (79%)
- `service.ts`: 32 (76%)
- `repository.ts`: 29 (69%)
- `RULES.md`: 9 (21%)
- `README.md` no módulo: 6 (14%)

## 4. Estado da Documentação por Módulo

- Não há módulos em `src/features` sem pasta correspondente em `docs/modules`.
- Pasta em `docs/modules` sem módulo correspondente em `src/features`: `assinatura-digital` (mantida como documentação histórica/funcional).

## 5. Próximos Passos Recomendados

1. Padronizar os 13 módulos parciais no contrato FSD completo.
2. Expandir `RULES.md` e `README.md` por módulo para melhorar suporte a IA e onboarding.
3. Tratar módulos iniciais (`admin`, `audit`, `busca`, `repasses`, `tasks`, `twofauth`) com roadmap explícito.
