# Cronicle no CapRover (Scheduler)

Este projeto expõe endpoints HTTP em `src/app/api/cron/*` para execução de rotinas periódicas.
A forma mais simples de integrar com o Cronicle (rodando no mesmo CapRover) é criar jobs no Cronicle que executam `curl` nesses endpoints.

## Pré-requisitos

- App (Next.js) rodando no CapRover.
- Cronicle rodando no CapRover.
- Uma variável de ambiente `CRON_SECRET` configurada **no app** (e conhecida pelo Cronicle).

## Autenticação

Os endpoints aceitam uma destas opções:

- `Authorization: Bearer <CRON_SECRET>`
- `X-Cron-Secret: <CRON_SECRET>`

## Endpoints disponíveis

- `POST /api/cron/executar-agendamentos` — scheduler de capturas (pode ser demorado)
- `POST /api/cron/verificar-prazos` — verifica prazos e cria notificações
- `POST /api/cron/indexar-documentos` — indexação RAG de pendências (respeita `ENABLE_AI_INDEXING=false`)
- `POST /api/cron/refresh-chat-view` — refresh de materialized view do chat
- `POST /api/cron/vacuum-maintenance` — diagnóstico de bloat (não executa VACUUM)
- `POST /api/cron/alertas-disk-io` — verifica budget de disk I/O e notifica super_admins

## Exemplo de execução (curl)

Troque `APP_URL` pelo endereço interno (no cluster CapRover) **ou** pelo domínio público.

```bash
APP_URL="https://seu-dominio.com"  # ou http://srv-captain--NOME_DO_APP:3000
CRON_SECRET="..."

curl -fsS -X POST "$APP_URL/api/cron/executar-agendamentos" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json"
```

## Sugestão de agendamentos

Ajuste conforme volume/carga:

- `executar-agendamentos`: a cada 5 min
- `verificar-prazos`: a cada 15–60 min
- `indexar-documentos`: a cada 1–5 min (ou desabilitar em incidente com `ENABLE_AI_INDEXING=false`)
- `refresh-chat-view`: a cada 5 min
- `vacuum-maintenance`: diário/semanal (ex.: madrugada)
- `alertas-disk-io`: a cada 5–15 min

## Observações

- Alguns handlers definem `maxDuration` (Next.js route handlers). No Cronicle, configure o timeout do job acima desse valor.
- Para segurança, evite expor `CRON_SECRET` em logs do Cronicle (use secrets/variáveis seguras).
