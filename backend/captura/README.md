# Backend Captura - Camada de Infraestrutura

## Propósito

Este diretório contém **serviços de infraestrutura** para integração com sistemas judiciais externos (PJE/TRT). Não contém lógica de domínio — apenas adaptadores técnicos.

## Estrutura

- `credentials/` — Gestão de credenciais de acesso aos tribunais
- `services/trt/` — Integração com PJE/TRT (auth, capture, audiências, acervo)
- `services/pje/` — Serviços específicos do PJE (expedientes, documentos)
- `services/partes/` — Captura e identificação de partes processuais
- `services/persistence/` — Persistência de logs e dados brutos (Supabase + MongoDB)
- `services/recovery/` — Recuperação de dados do MongoDB
- `services/browser/` — Automação com Playwright
- `services/backblaze/` — Upload de documentos para Backblaze
- `services/google-drive/` — Integração com Google Drive
- `services/timeline/` — Captura de timeline de processos
- `services/scheduler/` — Agendamento de capturas
- `utils/` — Utilitários (Redis, MongoDB, locks)

## Relação com Features

- **`features/captura/`** — Camada de domínio (domain, service, repository, drivers, UI)
- **`backend/captura/`** — Camada de infraestrutura (integrações externas, persistência)

As API routes em `app/api/captura/` e Server Actions devem utilizar `features/captura/services/capture-orchestrator.ts` (exposto via `features/captura/service.ts`) como a camada de orquestração oficial. Ela coordena os drivers e regras de negócio, mantendo o backend isolado.

## Princípios

1. **Sem lógica de negócio** — Apenas adaptadores técnicos
2. **Integrações externas** — PJE, TRT, Backblaze, Google Drive, MongoDB
3. **Persistência bruta** — Salvar payloads completos para recovery
4. **Isolamento** — Não importar de `features/` (apenas `backend/` e `lib/`)
