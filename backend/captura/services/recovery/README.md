# Sistema de Recuperação de Capturas

## Visão Geral

O sistema de recuperação permite recuperar e re-persistir dados de capturas que falharam parcialmente. Utiliza os dados brutos (payload_bruto) salvos no MongoDB para identificar elementos faltantes no PostgreSQL e re-persistí-los.

## Problema Resolvido

Durante capturas do PJE, alguns elementos podem falhar na persistência:
- **Endereços**: Validação falhou ou erro no upsert
- **Representantes**: Timeout ou erro de conexão
- **Cadastros PJE**: Erro ao vincular entidade

Os dados brutos permanecem no MongoDB (`captura_logs_brutos`), permitindo recuperação posterior.

## Arquitetura

```
backend/captura/services/recovery/
├── types.ts                      # Tipos TypeScript
├── captura-recovery.service.ts   # Listagem e busca de logs MongoDB
├── recovery-analysis.service.ts  # Análise de gaps (MongoDB vs PostgreSQL)
├── endereco-recovery.service.ts  # Re-persistência de endereços
└── README.md                     # Esta documentação

app/api/captura/recovery/
├── route.ts                      # GET: Listar logs
├── [mongoId]/route.ts            # GET: Detalhe + análise
└── reprocess/route.ts            # POST: Re-persistir elementos
```

## APIs REST

### GET /api/captura/recovery

Lista logs do MongoDB com filtros.

**Query Parameters:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `pagina` | number | Página (default: 1) |
| `limite` | number | Itens por página (max: 100) |
| `captura_log_id` | number | Filtrar por ID PostgreSQL |
| `tipo_captura` | string | acervo_geral, partes, etc. |
| `status` | string | success ou error |
| `trt` | string | TRT1, TRT3, etc. |
| `grau` | string | primeiro_grau ou segundo_grau |
| `advogado_id` | number | ID do advogado |
| `data_inicio` | string | Data inicial (YYYY-MM-DD) |
| `data_fim` | string | Data final (YYYY-MM-DD) |
| `incluir_estatisticas` | boolean | Incluir estatísticas agregadas |

**Exemplo:**
```bash
curl -X GET "http://localhost:3000/api/captura/recovery?tipo_captura=partes&data_inicio=2024-01-01&incluir_estatisticas=true" \
  -H "Authorization: Bearer TOKEN"
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "mongoId": "507f1f77bcf86cd799439011",
        "capturaLogId": 123,
        "tipoCaptura": "partes",
        "status": "success",
        "trt": "TRT3",
        "grau": "primeiro_grau",
        "advogadoId": 1,
        "criadoEm": "2024-01-15T10:30:00.000Z",
        "numeroProcesso": "0001234-56.2024.5.03.0001",
        "erro": null
      }
    ],
    "total": 150,
    "pagina": 1,
    "limite": 50,
    "totalPaginas": 3
  },
  "estatisticas": {
    "contadores": { "success": 145, "error": 5, "total": 150 },
    "porTrt": [
      { "trt": "TRT3", "total": 100, "success": 98, "error": 2 }
    ],
    "gaps": {
      "totalLogs": 150,
      "logsComGaps": 12,
      "resumoGaps": { "enderecos": 25, "partes": 0, "representantes": 3 }
    }
  }
}
```

### GET /api/captura/recovery/{mongoId}

Busca detalhes de um log específico com análise de gaps.

**Path Parameters:**
- `mongoId`: ID do documento no MongoDB (24 caracteres)

**Query Parameters:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `incluir_payload` | boolean | Incluir payload bruto completo |
| `analisar_gaps` | boolean | Realizar análise de gaps (default: true) |

**Exemplo:**
```bash
curl -X GET "http://localhost:3000/api/captura/recovery/507f1f77bcf86cd799439011?analisar_gaps=true" \
  -H "Authorization: Bearer TOKEN"
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "log": {
      "mongoId": "507f1f77bcf86cd799439011",
      "capturaLogId": 123,
      "tipoCaptura": "partes",
      "status": "success",
      "trt": "TRT3",
      "grau": "primeiro_grau",
      "requisicao": { "numero_processo": "0001234-56.2024.5.03.0001" }
    },
    "payloadDisponivel": true,
    "analise": {
      "processo": {
        "id": 456,
        "idPje": 789,
        "numeroProcesso": "0001234-56.2024.5.03.0001",
        "trt": "TRT3",
        "grau": "primeiro_grau"
      },
      "totais": {
        "partes": 3,
        "partesPersistidas": 3,
        "enderecosEsperados": 3,
        "enderecosPersistidos": 1,
        "representantes": 2,
        "representantesPersistidos": 2
      },
      "gaps": {
        "enderecosFaltantes": [
          {
            "tipo": "endereco",
            "identificador": "12345",
            "nome": "Endereço de João Silva",
            "statusPersistencia": "faltando",
            "contexto": {
              "entidadeId": 100,
              "entidadeTipo": "cliente"
            }
          }
        ],
        "partesFaltantes": [],
        "representantesFaltantes": []
      }
    }
  }
}
```

### POST /api/captura/recovery/reprocess

Re-persiste elementos que falharam.

**Modos de operação:**
1. **Por mongoIds**: Re-processa documentos específicos
2. **Por capturaLogId**: Re-processa todos os documentos de uma captura

**Request Body:**
```json
{
  "mongoIds": ["507f1f77bcf86cd799439011"],
  "tiposElementos": ["endereco"],
  "filtros": {
    "apenasGaps": true,
    "forcarAtualizacao": false
  }
}
```

ou

```json
{
  "capturaLogId": 123,
  "tiposElementos": ["endereco"],
  "filtros": {
    "apenasGaps": true
  }
}
```

**Exemplo:**
```bash
curl -X POST "http://localhost:3000/api/captura/recovery/reprocess" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mongoIds": ["507f1f77bcf86cd799439011"], "tiposElementos": ["endereco"]}'
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "sucesso": true,
    "totalDocumentos": 1,
    "totalElementos": 2,
    "totalSucessos": 2,
    "totalErros": 0,
    "documentos": [
      {
        "mongoId": "507f1f77bcf86cd799439011",
        "numeroProcesso": "0001234-56.2024.5.03.0001",
        "sucesso": true,
        "totalProcessados": 2,
        "totalSucessos": 2,
        "totalErros": 0,
        "elementos": [
          {
            "tipo": "endereco",
            "identificador": "12345",
            "nome": "Endereço de João Silva",
            "sucesso": true,
            "acao": "criado",
            "registroId": 789
          }
        ],
        "duracaoMs": 150
      }
    ],
    "duracaoMs": 200
  }
}
```

## Uso Programático

### Listar logs com gaps

```typescript
import { listarLogsRecovery } from '@/backend/captura/services/recovery/captura-recovery.service';

const resultado = await listarLogsRecovery({
  tipoCaptura: 'partes',
  dataInicio: '2024-01-01',
  limite: 100,
});

console.log(`Total de logs: ${resultado.total}`);
```

### Analisar gaps de um documento

```typescript
import { analisarCaptura } from '@/backend/captura/services/recovery/recovery-analysis.service';

const analise = await analisarCaptura('507f1f77bcf86cd799439011');

if (analise) {
  console.log(`Endereços faltantes: ${analise.gaps.enderecosFaltantes.length}`);
  console.log(`Partes faltantes: ${analise.gaps.partesFaltantes.length}`);
}
```

### Re-processar endereços

```typescript
import { reprocessarElementos } from '@/backend/captura/services/recovery/endereco-recovery.service';

const resultado = await reprocessarElementos({
  mongoIds: ['507f1f77bcf86cd799439011'],
  tiposElementos: ['endereco'],
  filtros: {
    apenasGaps: true,
    forcarAtualizacao: false,
  },
});

console.log(`Processados: ${resultado.totalElementos}`);
console.log(`Sucessos: ${resultado.totalSucessos}`);
console.log(`Erros: ${resultado.totalErros}`);
```

### Re-processar por captura_log_id

```typescript
import { reprocessarEnderecosPorCapturaLogId } from '@/backend/captura/services/recovery/endereco-recovery.service';

const resultado = await reprocessarEnderecosPorCapturaLogId(123, {
  apenasGaps: true,
  forcarAtualizacao: false,
});
```

## Fluxo de Recuperação

```
1. IDENTIFICAÇÃO
   ┌──────────────────────────────────────────────────────────┐
   │ GET /api/captura/recovery?incluir_estatisticas=true      │
   │ → Listar logs com estatísticas de gaps                   │
   └──────────────────────────────────────────────────────────┘
                              │
                              ▼
2. ANÁLISE
   ┌──────────────────────────────────────────────────────────┐
   │ GET /api/captura/recovery/{mongoId}?analisar_gaps=true   │
   │ → Ver detalhes e gaps específicos                        │
   └──────────────────────────────────────────────────────────┘
                              │
                              ▼
3. RE-PROCESSAMENTO
   ┌──────────────────────────────────────────────────────────┐
   │ POST /api/captura/recovery/reprocess                     │
   │ → Re-persistir elementos faltantes                       │
   └──────────────────────────────────────────────────────────┘
                              │
                              ▼
4. VERIFICAÇÃO
   ┌──────────────────────────────────────────────────────────┐
   │ GET /api/captura/recovery/{mongoId}?analisar_gaps=true   │
   │ → Verificar se gaps foram resolvidos                     │
   └──────────────────────────────────────────────────────────┘
```

## Tipos de Elementos Suportados

| Tipo | Tabela PostgreSQL | Status |
|------|-------------------|--------|
| `endereco` | enderecos | ✅ Implementado |
| `parte` | clientes/partes_contrarias/terceiros | 🔜 Planejado |
| `representante` | representantes | 🔜 Planejado |
| `cadastro_pje` | cadastros_pje | 🔜 Planejado |

## Limitações

1. **Máximo 50 documentos** por requisição de re-processamento
2. **Análise de gaps** pode ser lenta para payloads grandes
3. **Partes faltantes** requerem que a entidade seja criada primeiro
4. **Endereços de representantes** dependem do representante existir

## Troubleshooting

### Endereço não criado

**Possíveis causas:**
1. Entidade (cliente/parte_contraria/terceiro) não existe
2. `id_pje` duplicado (conflito de constraint)
3. Dados inválidos no payload

**Solução:**
```typescript
const analise = await analisarCaptura(mongoId);
for (const gap of analise.gaps.enderecosFaltantes) {
  console.log('Erro:', gap.erro);
  console.log('Contexto:', gap.contexto);
}
```

### Payload não disponível

**Causa:** Captura falhou antes de obter dados do PJE

**Verificação:**
```typescript
const doc = await buscarLogPorMongoId(mongoId);
if (!doc.payload_bruto) {
  console.log('Payload não disponível - erro original:', doc.erro);
}
```

## Índices MongoDB Utilizados

- `idx_captura_log_id` - Busca por ID do PostgreSQL
- `idx_tipo_captura_criado_em` - Listagem por tipo e data
- `idx_status_criado_em` - Filtro por status
- `idx_trt_grau_status_criado_em` - Filtro composto

