# Regras de Negócio — Comunica CNJ

## Contexto
Módulo autocontido (`/comunica-cnj`, "Diário Oficial") responsável pela integração com a **API pública do Comunica CNJ** (Conselho Nacional de Justiça) — consulta, persistência, vinculação a expedientes, views salvas e métricas.

## Entidades Principais
- **ComunicacaoCNJ** (tabela `comunica_cnj`) — comunicação processual capturada, com hash único. Pode ter `expediente_id` vinculado.
- **SyncLogEntry** (tabela `comunica_cnj_sync_log`) — histórico de sincronizações manuais/automáticas.
- **GazetteView** (tabela `comunica_cnj_views`) — views salvas com filtros, colunas, densidade e modo de visualização.
- **ComunicacaoResumo** (tabela `comunica_cnj_resumos`) — resumo gerado por IA com tags semânticas.

## Regras Principais

### Consulta (sem persistência)
- Usuário precisa da permissão `comunica_cnj:consultar`.
- Pelo menos um filtro deve estar preenchido, OU `itensPorPagina <= 5`.
- `itensPorPagina` só aceita 5 ou 100 (limite da API CNJ).
- Rate limit rastreado via headers `x-ratelimit-*`.

### Sincronização
- Permissão `comunica_cnj:capturar`.
- Parâmetros exigem OAB (`numeroOab + ufOab`) OU tribunal com data (`siglaTribunal + dataInicio`).
- Para cada comunicação nova:
  1. Verifica se já existe pelo `hash` — se sim, marca como duplicada.
  2. Busca expediente correspondente por `(numero_processo, trt, grau, data_criacao ∈ [data-3d, data])` sem comunicação já vinculada.
  3. Se não achar expediente, cria um novo com `origem = COMUNICA_CNJ`.
  4. Persiste a comunicação com `expediente_id` vinculado.

### Inferência de Grau
- Sigla `TST` ou órgão contendo "ministro" → `tribunal_superior`.
- Órgão contendo "turma", "gabinete", "segundo grau", "sdc", "sdi", "seção" → `segundo_grau`.
- Caso contrário → `primeiro_grau`.

### Vinculação Manual
- Permissão `comunica_cnj:editar` + `expedientes:editar`.
- Valida existência da comunicação e do expediente.
- Atualiza `expediente_id` na comunicação.

### Views Salvas (Gazette Fusion)
- Visibilidade `pessoal` (só criador vê) ou `equipe` (todos veem).
- Densidade: `compacto | padrao | confortavel`.
- Modo: `tabela | cards`.
- Modo de ordenação e filtros salvos em JSON.

## Agendamentos
**Fora do escopo deste módulo.** Agendamentos de sincronização recorrente são gerenciados pelo módulo `captura/agendamentos/` por serem genéricos (atendem todos os tipos de captura).

## Erros Tratados
- `VALIDATION_ERROR` — parâmetros inválidos (Zod).
- `EXTERNAL_SERVICE_ERROR` — falha na API CNJ (timeout, 5xx).
- `DATABASE_ERROR` — falha no Supabase.
- `NOT_FOUND` — comunicação/expediente/certidão ausente.
- Rate limit (429) — retry automático após janela.

## Fontes Canônicas
- **Domain + Service + Repository**: `./domain.ts`, `./service.ts`, `./repository.ts`
- **API Client**: `./cnj-client.ts` (axios + rate limit state global)
- **Server Actions**: `./actions/`
- **Componentes UI**: `./components/`
