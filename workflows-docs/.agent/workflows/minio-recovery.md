---
description: Recuperação de dados de clientes do MinIO
---

# Workflow: Recuperação de Dados de Clientes do MinIO

## Visão Geral
Este workflow processa pastas no bucket MinIO `zapsign`, extrai dados de clientes de PDFs (contratos, procurações), renomeia as pastas com o nome do cliente e gera uma planilha Excel completa.

## Pré-requisitos

### Dependências (Node.js)

Este workflow hoje roda via Node.js (scripts em `workflows-docs/scripts/`).

```bash
npm install
```

### Credenciais MinIO

As credenciais **devem** vir do `.env.local` (ou variáveis de ambiente). **Nunca** commite chaves.

- **MINIO_ENDPOINT**: ex. `storage-api.sinesys.app`
- **MINIO_ACCESS_KEY**
- **MINIO_SECRET_KEY**
- **MINIO_SECURE**: `true` (default) ou `false`
- **MINIO_BUCKET_NAME**: bucket padrão (ex: `docs-12132024`)
- **MINIO_ROOT_PREFIX** (opcional): prefixo/pasta dentro do bucket (ex: `docs 1213 2024 12`)

## Estrutura do Bucket

```
zapsign/
├── 8511/           # ID do cliente
│   ├── 11081/
│   │   ├── contrato-11-07-2024-161615.pdf
│   │   ├── ctps-21-06-2024-150939.pdf
│   │   └── ...
│   └── ...
├── 851/
│   └── ...
```

## Passos do Workflow (Atual)

### 1. Teste com Amostra (sem renomear / sem persistir)

```bash
node workflows-docs/scripts/process_with_ai.js --dry-run --limit 10 --bucket "docs-12132024" --prefix "docs 1213 2024 12"
```

### 2. Processamento com persistência (Supabase)

> Requer `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` no `.env.local`.

```bash
node workflows-docs/scripts/process_with_ai.js --limit 50 --bucket "docs-12132024" --prefix "docs 1213 2024 12"
```

> [!CAUTION]
> Esta operação é **irreversível**. Certifique-se de revisar os resultados do dry-run antes de confirmar.

## Dados Extraídos

O script extrai os seguintes campos de cada PDF:

| Campo | Descrição | Fonte |
|-------|-----------|-------|
| `folder_id` | ID original da pasta | MinIO |
| `client_name` | Nome do contratante | Regex no PDF |
| `cpf` | CPF do contratante | Regex no PDF |
| `opposing_party` | Parte contrária/empresa | Regex no PDF |
| `signature_date` | Data de assinatura | Regex no PDF |
| `document_type` | Tipo (CONTRACT/POWER_OF_ATTORNEY/OTHER) | Nome do arquivo |
| `document_path` | Caminho completo do PDF processado | MinIO |
| `renamed` | Se a pasta foi renomeada | Sistema |
| `status` | Status do processamento | Sistema |

## Priorização de Documentos

Para cada pasta, o script busca PDFs nesta ordem de prioridade:

1. **Contrato** (nome contém "contrato")
2. **Procuração** (nome contém "procuração")
3. **Declaração** (nome contém "declaração")
4. **Outros PDFs**

> [!NOTE]
> Contratos têm maior prioridade pois contêm mais informações (inclusive parte contrária).

## Padrões de Extração

### Nome do Cliente
Busca por:
- `CONTRATANTE: [NOME]`
- `QUALIFICAÇÃO: [NOME]`
- `Nome: [NOME]`

### CPF
Busca por:
- `CPF: 123.456.789-00` ou `CPF 12345678900`

### Parte Contrária
Busca por:
- `CONTRATADO: [EMPRESA]`
- `CONTRATADA: [EMPRESA]`
- `contra [EMPRESA]`

### Data de Assinatura
Busca por:
- `assinado em: DD/MM/AAAA`
- `data: DD/MM/AAAA`
- `DD de MMMM de AAAA`

## Troubleshooting

### Script trava ao processar PDFs
- Alguns PDFs podem ser grandes ou corruptos
- O script possui timeout e tratamento de erros
- Pastas com erro terão `status: ERROR` no Excel

### Erro de permissão no MinIO
- Verificar credenciais em `process_clients.py`
- Testar com `verify_connection.py`

### Nome do cliente não extraído
- Revisar o PDF manualmente
- Padrão pode não corresponder ao documento
- Adicionar novo regex pattern em `PDFDataExtractor.extract_client_name()`

## Arquivos do Projeto

```
workflows-docs/
├── scripts/
│   ├── process_with_ai.js         # ⭐ Script principal (MinIO -> PDF -> IA -> rename -> Supabase)
│   ├── openrouter_client.js       # Cliente IA (OpenRouter)
│   ├── import_to_supabase.js      # Importa um JSON gerado (fallback)
│   └── filter_results_remove_teste.js # Limpa “teste” dos outputs
└── .agent/
    └── workflows/
        └── minio-recovery.md      # Este documento
```

## Exemplo de Uso Completo

```bash
# 1. Instalar dependências
pip install minio pypdf pandas openpyxl

# 2. Testar conectividade
python scripts/verify_connection.py

# 3. Executar processamento
python scripts/process_clients.py

# 4. Revisar test_results_*.xlsx

# 5. Confirmar processamento completo (quando solicitado)

# 6. Revisar full_results_dryrun_*.xlsx

# 7. Confirmar renomeação (quando solicitado)

# 8. Revisar final_results_*.xlsx
```

## Melhorias Futuras

- [ ] Adicionar extração de endereço
- [ ] Suporte para OCR em PDFs escaneados
- [ ] API REST para processar on-demand
- [ ] Dashboard web para visualização dos dados
- [ ] Backup automático antes de renomear
