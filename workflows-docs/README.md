# Workflows Docs (MinIO -> PDF -> IA -> Rename -> Supabase)

Esta pasta contém scripts utilitários para recuperar e normalizar documentos antigos (MinIO) e persistir os dados no Supabase.

## Objetivo do workflow

- Ler PDFs armazenados no MinIO (bucket + opcionalmente um `prefix`/pasta).
- Extrair texto do PDF.
- Enviar o texto para IA (OpenRouter) para:
  - classificar o tipo do documento (contrato/procuração/declaração/outros)
  - extrair nome, CPF e, no caso de contrato, a parte contrária e data de assinatura
- Renomear os PDFs no próprio bucket (com base em nome/CPF/tipo).
- Se for **CONTRATO**, persistir no Supabase:
  - upsert do cliente por CPF
  - resolve/cria parte contrária por `ilike(nome, %...%)`
  - cria contrato com `cadastrado_em = data_assinatura`, `status = contratado`, `segmento_id = 1 (Trabalhista)`
  - cria vínculo em `contrato_partes` e histórico em `contrato_status_historico`

## Variáveis de ambiente necessárias

Configure em `.env.local` (recomendado) ou no ambiente do shell:

- `MINIO_ENDPOINT`
- `MINIO_ACCESS_KEY`
- `MINIO_SECRET_KEY`
- `MINIO_SECURE` (`true`/`false`)
- `MINIO_BUCKET_NAME` (bucket padrão)
- `MINIO_ROOT_PREFIX` (opcional, “pasta” dentro do bucket)

- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL` (opcional)

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (obrigatória para persistir; RLS bloqueia anon)

## Script principal

### Dry-run (não renomeia pastas/arquivos e não persiste)

```bash
node workflows-docs/scripts/process_with_ai.js --dry-run --limit 10 --bucket "docs-12132024" --prefix "WELINGTON SANTOS GONCALVES - 806.560.564-87/documentos" --run-id "sample"
```

### Produção (renomeia arquivos; persiste contratos)

```bash
node workflows-docs/scripts/process_with_ai.js --limit 50 --bucket "docs-12132024" --prefix "WELINGTON SANTOS GONCALVES - 806.560.564-87/documentos" --rename-folders --run-id "batch-1"
```

Observação: o script **não renomeia arquivos** (o `*signed*.pdf` já vem com nome adequado). Ele renomeia a **pasta mãe** após extrair + salvar JSON + persistir no banco.

### Retomar um run (idempotência por output)

Use o mesmo `--run-id` (ou `--outdir`) e o script vai reaproveitar os JSONs gerados para pular pastas já processadas.

## Saída (outputs)

Por padrão, os outputs ficam em:

`workflows-docs/output/<bucket>/run-<prefix>-<run-id ou timestamp>/`

- `contracts.json`
- `non_contracts.json`


