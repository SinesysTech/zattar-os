# Design: Integração Comunica CNJ

## Decisões Arquiteturais

### 1. Modelagem de Dados

#### Tabela Unificada de Expedientes

**Decisão:** Unificar `pendentes_manifestacao` e `expedientes_manuais` em uma única tabela `expedientes` com coluna `origem`.

**Alternativa rejeitada:** Manter tabelas separadas (aumenta complexidade de queries e manutenção).

**Justificativa:**
- Simplifica queries na página de expedientes
- Permite filtrar por origem quando necessário
- Facilita criação de expedientes de qualquer fonte
- Nomenclatura `expedientes` é mais correta que `pendentes_manifestacao`

#### Relacionamento 1:1 entre `comunica_cnj` e `expedientes`

**Decisão:** FK em `comunica_cnj.expediente_id` apontando para `expedientes.id`.

**Justificativa:**
- Comunicação é a entidade "descoberta" que referencia o expediente
- Expediente não precisa conhecer a comunicação (baixo acoplamento)
- Permite expedientes sem comunicação vinculada (manuais, captura PJE)

### 2. Fluxo de Captura

#### Criação Automática de Expediente

**Decisão:** Quando não há match, criar expediente automaticamente com `origem = 'comunica_cnj'`.

**Alternativa rejeitada:** Armazenar comunicações órfãs para exibição separada na UI.

**Justificativa:**
- UI unificada na página de expedientes
- Workflow consistente para todas as fontes
- Expediente criado já pode receber ações (baixa, responsável, etc.)

#### Janela de Match: 3 dias

**Decisão:** Buscar expediente criado até 3 dias antes da data de disponibilização.

**Justificativa:**
- Expediente é criado no PJE antes de aparecer no CNJ
- 3 dias cobre a maioria dos casos de publicação
- Evita falsos positivos de processos antigos

### 3. Inferência de Grau

**Decisão:** Inferir grau a partir do nome do órgão julgador.

| Padrão no Órgão | Grau |
|-----------------|------|
| `vara`, `comarca`, `fórum` | `primeiro_grau` |
| `turma`, `gabinete`, `segundo grau` | `segundo_grau` |
| `ministro`, `TST` | `tribunal_superior` |

**Limitação:** Pode haver casos edge não cobertos. Monitorar logs para ajustes.

### 4. Rate Limiting da API CNJ

**Decisão:** Implementar controle local de rate limit com headers da resposta.

```typescript
// Headers retornados pela API:
// x-ratelimit-limit: 100
// x-ratelimit-remaining: 50

// Ao receber 429:
// - Aguardar 60 segundos
// - Retry com backoff exponencial
```

**Justificativa:** Evita bloqueios e garante capturas completas.

### 5. Armazenamento de Dados

#### Campos da Tabela `comunica_cnj`

**Decisão:** Armazenar todos os campos retornados pela API, sem campos de negócio.

**Justificativa:**
- Tabela é "espelho" dos dados da API
- Campos de negócio (baixa, responsável, etc.) ficam no expediente
- Permite reprocessamento futuro se necessário

#### JSONB para Destinatários

**Decisão:** Usar JSONB para `destinatarios` e `destinatarios_advogados`.

**Alternativa rejeitada:** Criar tabelas relacionais separadas.

**Justificativa:**
- Estrutura variável (0 a N destinatários)
- Dados são apenas para exibição, não para queries complexas
- Simplifica inserção e leitura

### 6. API Routes

#### Busca Manual (GET /api/comunica-cnj/consulta)

**Decisão:** Proxy direto para API CNJ, sem persistência.

**Justificativa:**
- Usuário quer resultados em tempo real
- Não poluir banco com buscas exploratórias
- Persistência apenas via captura agendada

#### Captura (POST /api/comunica-cnj/captura)

**Decisão:** Endpoint separado que persiste e vincula.

**Justificativa:**
- Separa busca (read-only) de captura (write)
- Permite controle de permissões diferenciado
- Pode ser chamado pelo scheduler ou manualmente

### 7. MCP Tools

**Decisão:** Criar tools que utilizam os endpoints HTTP do backend.

**Justificativa:**
- Reutiliza lógica existente
- Tools são wrappers simples
- Facilita manutenção (mudanças no backend refletem automaticamente)

## Diagrama de Fluxo

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FLUXO DE CAPTURA CNJ                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐                                                        │
│  │  Scheduler   │ (diário, por OAB)                                      │
│  └──────┬───────┘                                                        │
│         │                                                                │
│         ▼                                                                │
│  ┌──────────────┐     ┌──────────────┐                                  │
│  │  API CNJ     │────►│  Comunicação │                                  │
│  └──────────────┘     └──────┬───────┘                                  │
│                              │                                          │
│                              ▼                                          │
│                    ┌─────────────────┐                                  │
│                    │  Já existe?     │                                  │
│                    │  (by hash)      │                                  │
│                    └────────┬────────┘                                  │
│                             │                                           │
│               ┌─────────────┴─────────────┐                             │
│               │                           │                             │
│               ▼ SIM                       ▼ NÃO                         │
│         ┌──────────┐              ┌──────────────┐                      │
│         │  SKIP    │              │ Buscar match │                      │
│         └──────────┘              │ (3 dias)     │                      │
│                                   └──────┬───────┘                      │
│                                          │                              │
│                          ┌───────────────┴───────────────┐              │
│                          │                               │              │
│                          ▼ ENCONTROU                     ▼ NÃO          │
│                   ┌──────────────┐              ┌──────────────┐        │
│                   │  Vincular    │              │ Criar        │        │
│                   │  expediente  │              │ expediente   │        │
│                   └──────┬───────┘              │ (origem=cnj) │        │
│                          │                      └──────┬───────┘        │
│                          │                             │                │
│                          └──────────────┬──────────────┘                │
│                                         │                               │
│                                         ▼                               │
│                                ┌──────────────────┐                     │
│                                │ INSERT           │                     │
│                                │ comunica_cnj     │                     │
│                                │ (com expediente) │                     │
│                                └──────────────────┘                     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Estrutura de Diretórios

```
backend/
  comunica-cnj/
    client/
      comunica-cnj-client.ts         # Cliente HTTP para API CNJ
    services/
      comunica-cnj/
        buscar-comunicacoes.service.ts
        obter-certidao.service.ts
        capturar-comunicacoes.service.ts
      persistence/
        comunica-cnj-persistence.service.ts
    types/
      types.ts
    index.ts                          # Barrel export

app/
  api/
    comunica-cnj/
      consulta/
        route.ts                      # GET - busca manual
      certidao/
        [hash]/
          route.ts                    # GET - download PDF
      tribunais/
        route.ts                      # GET - lista tribunais
      captura/
        route.ts                      # POST - executar captura

lib/
  types/
    comunica-cnj.ts                   # Tipos compartilhados frontend/backend

supabase/
  migrations/
    YYYYMMDDHHMMSS_rename_pendentes_to_expedientes.sql
    YYYYMMDDHHMMSS_add_origem_expediente.sql
    YYYYMMDDHHMMSS_migrate_expedientes_manuais.sql
    YYYYMMDDHHMMSS_create_comunica_cnj.sql
    YYYYMMDDHHMMSS_add_tipo_captura_comunica_cnj.sql
```

## Considerações de Segurança

1. **Autenticação:** Todas as routes requerem usuário autenticado
2. **Permissões:**
   - Busca: qualquer usuário autenticado
   - Captura: permissão `captura:executar`
3. **Rate Limiting:** Respeitar limites da API CNJ para evitar bloqueios
4. **Dados sensíveis:** Comunicações podem conter dados de processos em segredo de justiça (tratar conforme RLS existente)

## Variáveis de Ambiente

```env
# API Comunica CNJ (opcional, usa default se não definido)
COMUNICA_CNJ_API_URL=https://comunicaapi.pje.jus.br/
COMUNICA_CNJ_REQUEST_TIMEOUT=30000
COMUNICA_CNJ_MAX_RETRIES=3
```
