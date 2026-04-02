# Documentacao dos Modulos

Este diretorio contem documentacao dedicada para modulos que possuem materiais alem do codigo-fonte.
A documentacao de regras de negocio fica em `src/features/{modulo}/RULES.md` diretamente no codigo.

## Modulos com documentacao dedicada

| Modulo | Documentacao |
|--------|-------------|
| assinatura-digital | [Arquitetura conceitual](assinatura-digital/arquitetura-conceitual.md), [Conformidade legal](assinatura-digital/conformidade-legal.md) |
| assistentes-tipos | [README](assistentes-tipos/README.md) — pipeline de geracao automatica de pecas via IA |
| captura | [Proposta de mudanca](captura/CHANGE-PROPOSAL-CAPTURA-MODULE.md) — arquitetura de drivers PJE/TRT |
| chatwoot | 17 guias de API: accounts, agents, contacts, conversations, inboxes, messages, reports, webhooks e outros |
| dify | [README](dify/README.md) — integracao com apps de IA (chat, workflow, completion, agent) |
| financeiro | [Conciliacao bancaria](financeiro/conciliacao-bancaria.md), [Dashboard](financeiro/dashboard.md), [Exportacoes](financeiro/exportacoes.md) |
| integracoes | [README](integracoes/README.md) — configuracoes de integracoes externas (2FAuth, Dify, Chatwoot, Dyte) |
| system-prompts | [README](system-prompts/README.md) — prompts de sistema para editor, chat e copilot inline |
| twofauth | [README](twofauth/README.md) — integracao 2FAuth para autenticacao de dois fatores |

## Regras de negocio por modulo

Cada feature module pode ter um `RULES.md` em `src/features/{modulo}/RULES.md` com regras de negocio especificas para contexto de IA. Consulte diretamente no codigo-fonte.

Modulos com `RULES.md` existente (9/38): `audiencias`, `busca`, `contratos`, `documentos`, `financeiro`, `notificacoes`, `obrigacoes`, `partes`, `processos`.

## Status estrutural dos modulos

Classificacao por completude FSD (`domain.ts` + `service.ts` + `repository.ts` + `index.ts` + `actions/` + `components/`):

- **Completos (18)**: `acervo`, `advogados`, `ai`, `captura`, `config-atribuicao`, `contratos`, `dify`, `enderecos`, `integracoes`, `notificacoes`, `obrigacoes`, `pecas-juridicas`, `pericias`, `processos`, `rh`, `system-prompts`, `tipos-expedientes`, `usuarios`
- **Parciais (14)**: `agenda-eventos`, `assistentes-tipos`, `audiencias`, `calendar`, `cargos`, `chat`, `chatwoot`, `documentos`, `expedientes`, `financeiro`, `partes`, `perfil`, `profiles`, `tags`
- **Iniciais (6)**: `admin`, `audit`, `busca`, `repasses`, `tasks`, `twofauth`

Para a classificacao estrutural atualizada consulte [docs/architecture/STATUS.md](../architecture/STATUS.md).

## Arquivo historico

Relatorios de execucao e documentos de trabalho concluidos estao em `docs/archive/2026-Q1/`.
