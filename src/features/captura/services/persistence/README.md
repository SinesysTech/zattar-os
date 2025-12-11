# Sistema de Logs de Captura

## Visão Geral

O sistema de logs de captura implementa uma arquitetura dual PostgreSQL + MongoDB para fornecer auditoria completa, observabilidade e rastreabilidade das operações de captura.

### Por que dois bancos?

- **PostgreSQL**: Metadados estruturados, queries rápidas, agregações e relatórios
- **MongoDB**: Payloads brutos flexíveis, auditoria granular por processo, logs estruturados

### Fluxo de Captura

```mermaid
graph TD
    A[Início da Captura] --> B[Criar log PostgreSQL<br/>status: 'in_progress']
    B --> C[Processar processos]
    C --> D[Para cada processo]
    D --> E[Capturar dados do PJE]
    E --> F[Salvar log bruto MongoDB<br/>1 documento por processo]
    F --> G[Agregar resultados]
    G --> H[Atualizar log PostgreSQL<br/>status: 'completed'<br/>resultado.mongodb_ids: [...]]
    H --> I[Fim da Captura]

    E --> J[Erro durante captura]
    J --> K[Salvar log de erro MongoDB<br/>payload_bruto: null]
    K --> G

    C --> L[Erro de autenticação]
    L --> M[Salvar logs MongoDB<br/>para todos os processos do grupo]
    M --> G
```

## Schema PostgreSQL (`capturas_log`)

Tabela principal para metadados e controle de capturas.

| Campo            | Tipo        | Descrição                                       |
| ---------------- | ----------- | ----------------------------------------------- |
| `id`             | bigint      | Chave primária (auto-increment)                 |
| `tipo_captura`   | text        | Tipo: 'partes', 'acervo_geral', etc.            |
| `advogado_id`    | bigint      | FK para advogados (nullable)                    |
| `credencial_ids` | bigint[]    | Array de IDs de credenciais                     |
| `status`         | text        | 'pending', 'in_progress', 'completed', 'failed' |
| `resultado`      | jsonb       | Resultado da captura (ResultadoCapturaPartes)   |
| `erro`           | text        | Mensagem de erro (nullable)                     |
| `iniciado_em`    | timestamptz | Timestamp de início                             |
| `concluido_em`   | timestamptz | Timestamp de conclusão (nullable)               |
| `created_at`     | timestamptz | Timestamp de criação                            |

### Campo `resultado` (JSONB)

Contém interface `ResultadoCapturaPartes`:

```typescript
interface ResultadoCapturaPartes {
  total_processos: number; // Quantidade processada
  total_partes: number; // Total de partes encontradas
  clientes: number; // Clientes identificados
  partes_contrarias: number; // Partes contrárias
  terceiros: number; // Terceiros (peritos, MP, etc.)
  representantes: number; // Representantes salvos
  vinculos: number; // Vínculos processo-parte
  erros_count: number; // Quantidade de erros
  duracao_ms: number; // Tempo de execução
  mongodb_ids: string[]; // IDs MongoDB (um por processo)
  mongodb_falhas?: number; // Falhas de persistência MongoDB
}
```

### Exemplos de Queries PostgreSQL

```sql
-- Capturas com erro nos últimos 7 dias
SELECT id, tipo_captura, erro, iniciado_em
FROM capturas_log
WHERE status = 'failed'
  AND iniciado_em >= NOW() - INTERVAL '7 days'
ORDER BY iniciado_em DESC;

-- Total de partes capturadas por advogado
SELECT
  advogado_id,
  SUM((resultado->>'total_partes')::int) as total_partes,
  COUNT(*) as total_capturas
FROM capturas_log
WHERE status = 'completed'
  AND resultado IS NOT NULL
GROUP BY advogado_id;
```

## Schema MongoDB (`captura_logs_brutos`)

Collection para payloads brutos e auditoria granular.

### Documento `CapturaRawLogDocument`

| Campo                  | Tipo               | Obrigatório | Descrição                       |
| ---------------------- | ------------------ | ----------- | ------------------------------- |
| `_id`                  | ObjectId           | Auto        | ID único do documento           |
| `captura_log_id`       | number             | Sim         | FK para capturas_log PostgreSQL |
| `tipo_captura`         | string             | Sim         | Tipo de captura                 |
| `advogado_id`          | number             | Sim         | ID do advogado                  |
| `credencial_id`        | number             | Sim         | ID da credencial usada          |
| `credencial_ids`       | number[]           | Não         | Array completo de credenciais   |
| `trt`                  | CodigoTRT          | Sim         | Tribunal (TRT1, TRT2, etc.)     |
| `grau`                 | GrauTRT            | Sim         | Grau do tribunal                |
| `status`               | 'success'\|'error' | Sim         | Status da operação              |
| `requisicao`           | object             | Não         | Dados da requisição             |
| `payload_bruto`        | any                | Não         | JSON bruto do PJE               |
| `resultado_processado` | any                | Não         | Resultado processado            |
| `logs`                 | LogEntry[]         | Não         | Logs estruturados               |
| `erro`                 | string             | Não         | Mensagem de erro                |
| `criado_em`            | Date               | Auto        | Timestamp de criação            |
| `atualizado_em`        | Date               | Auto        | Timestamp de atualização        |

### Quando usar `captura_log_id: -1`

Usado para erros que ocorrem **antes** de criar o log PostgreSQL (ex: falha na validação inicial).

### Estrutura de `logs` array

Array de objetos `LogEntry` (de `capture-log.service.ts`):

```typescript
type LogEntry =
  | { tipo: 'erro', entidade: TipoEntidade, erro: string, contexto?: object }
  | { tipo: 'inserido', entidade: TipoEntidade, id_pje: number, ... }
  | { tipo: 'atualizado', entidade: TipoEntidade, campos_alterados: string[], ... }
  | { tipo: 'nao_atualizado', entidade: TipoEntidade, motivo: 'registro_identico', ... };
```

## Fluxo de Captura de Partes

Implementado em [`app/api/captura/trt/partes/route.ts`](../app/api/captura/trt/partes/route.ts).

### Passo a Passo

1. **Validação e Setup** (linhas 200-300):

   - Validar parâmetros obrigatórios (`advogado_id`, `credencial_ids`)
   - Buscar advogado e credenciais
   - Filtrar processos por IDs, TRTs, graus, números

2. **Criar Log PostgreSQL** (linha 320):

   ```typescript
   const capturaLog = await criarCapturaLog({
     tipo_captura: "partes",
     advogado_id: advogado.id,
     credencial_ids: credencial_ids,
     status: "in_progress",
   });
   ```

3. **Agrupar Processos por TRT+Grau** (linhas 340-360):

   - Reutilizar sessão autenticada por grupo
   - Evitar logins desnecessários

4. **Processar Cada Grupo** (linhas 370-500):

   - Autenticar uma vez por grupo
   - Para cada processo:
     - Capturar partes via PJE
     - Salvar log MongoDB (sucesso ou erro)
     - Agregar resultados

5. **Tratamento de Erros**:

   - **Erro por processo** (linha 430): Salva log MongoDB com `status: 'error'`
   - **Erro de autenticação** (linha 520): Salva logs para todos os processos do grupo

6. **Validação de Consistência** (linha 580):

   ```typescript
   if (resultadoTotal.mongodb_ids.length !== resultadoTotal.total_processos) {
     const warning = `Inconsistência: ${resultadoTotal.total_processos} processos processados mas ${resultadoTotal.mongodb_ids.length} logs MongoDB criados`;
     console.warn(warning);
     erroAppend = warning;
   }
   ```

7. **Finalizar Log PostgreSQL** (linha 590):
   ```typescript
   await atualizarCapturaLog(capturaLog.id, {
     status: "completed",
     resultado: resultadoTotal,
     erro: erros.length > 0 ? `${erros.length} erro(s)` : undefined,
   });
   ```

## Queries Comuns

### PostgreSQL

```sql
-- Capturas recentes por advogado
SELECT * FROM capturas_log
WHERE advogado_id = 123
ORDER BY iniciado_em DESC
LIMIT 10;

-- Status das capturas
SELECT status, COUNT(*)
FROM capturas_log
GROUP BY status;
```

### MongoDB

```javascript
// Buscar payload bruto de um processo específico
db.captura_logs_brutos.findOne({
  "requisicao.numero_processo": "0001234-56.2023.5.01.0001",
  status: "success",
});

// Logs de erro de uma captura
db.captura_logs_brutos
  .find({
    captura_log_id: 456,
    status: "error",
  })
  .sort({ criado_em: -1 });
```

### Joins Cross-Database

```javascript
// Buscar logs MongoDB de uma captura PostgreSQL
const captura = await buscarCapturaLog(123); // PostgreSQL
const mongoIds = captura.resultado.mongodb_ids;
const logsMongo = await buscarLogsBrutoPorCapturaId(123); // MongoDB
```

## Índices e Performance

### PostgreSQL (de `20250120000000_create_capturas_log.sql`)

- `idx_capturas_log_tipo_captura` - Por tipo de captura
- `idx_capturas_log_advogado_id` - Por advogado
- `idx_capturas_log_status` - Por status
- `idx_capturas_log_iniciado_em` - Por data (desc)
- `idx_capturas_log_credencial_ids` - GIN para array de credenciais

### MongoDB (de `collections.ts`)

- `idx_captura_log_id` - Por captura_log_id
- `idx_tipo_captura_criado_em` - Tipo + data
- `idx_criado_em_desc` - Por data (desc)
- `idx_status_criado_em` - Status + data
- `idx_advogado_id_criado_em` - Advogado + data
- `idx_credencial_id_criado_em` - Credencial + data
- `idx_trt_grau_status_criado_em` - TRT + grau + status + data
- `idx_erro_text` - Busca textual em erros

### Recomendações de Otimização

- **Particionamento**: Considerar particionar por mês/ano em `iniciado_em`
- **Agregações**: Usar views materializadas para estatísticas frequentes
- **TTL**: Configurar TTL em MongoDB para logs antigos (90 dias)

## Troubleshooting

### Inconsistência entre PostgreSQL e MongoDB

**Sintomas**: `resultadoTotal.mongodb_ids.length !== resultadoTotal.total_processos`

**Causas**:

- Falhas de persistência MongoDB (verificar `mongodb_falhas`)
- Erros não logados corretamente

**Solução**:

```javascript
// Verificar contadores
const contadores = await contarLogsBrutoPorStatus(capturaLogId);
console.log(contadores); // { success: 5, error: 2, total: 7 }
```

### Logs MongoDB não encontrados

**Sintomas**: `buscarLogsBrutoPorCapturaId()` retorna array vazio

**Causas**:

- Índices não criados
- `createMongoIndexes()` não executado

**Solução**:

```javascript
await createMongoIndexes(); // Executar na inicialização
```

### Queries lentas

**Sintomas**: Queries demorando >5s

**Verificações**:

- Índices criados: `db.captura_logs_brutos.getIndexes()`
- Queries usando índices: `db.captura_logs_brutos.find({...}).explain()`
- Considerar agregações para estatísticas

## Exemplos de Código

### Criar log de captura

```typescript
import { criarCapturaLog } from "@/features/captura/services/persistence/captura-log-persistence.service";

const capturaLog = await criarCapturaLog({
  tipo_captura: "partes",
  advogado_id: 123,
  credencial_ids: [456, 789],
  status: "in_progress",
});
```

### Salvar log bruto MongoDB

```typescript
import { registrarCapturaRawLog } from "@/features/captura/services/persistence/captura-raw-log.service";

const result = await registrarCapturaRawLog({
  captura_log_id: capturaLog.id,
  tipo_captura: "partes",
  advogado_id: 123,
  credencial_id: 456,
  trt: "TRT3",
  grau: "primeiro_grau",
  status: "success",
  requisicao: { numero_processo: "0001234-56.2023.5.03.0001" },
  payload_bruto: jsonDoPJE,
  resultado_processado: partesProcessadas,
});

if (!result.success) {
  console.error("Falha MongoDB:", result.erro);
}
```

### Buscar logs de uma captura

```typescript
import { buscarLogsBrutoPorCapturaId } from "@/features/captura/services/persistence/captura-raw-log.service";

const logs = await buscarLogsBrutoPorCapturaId(capturaLogId);
logs.forEach((log) => {
  console.log(`${log.status}: ${log.requisicao.numero_processo}`);
});
```

### Validar consistência

```typescript
import { buscarCapturaLog } from "@/features/captura/services/persistence/captura-log-persistence.service";
import { contarLogsBrutoPorStatus } from "@/features/captura/services/persistence/captura-raw-log.service";

const captura = await buscarCapturaLog(id);
const contadores = await contarLogsBrutoPorStatus(id);

const esperado = captura.resultado.total_processos;
const atual = contadores.total;

if (atual !== esperado) {
  console.warn(`Inconsistência: esperado ${esperado}, encontrado ${atual}`);
}
```
