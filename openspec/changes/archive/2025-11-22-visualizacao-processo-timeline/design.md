# Design: Visualização de Processo com Timeline

> **⚠️ NOTA HISTÓRICA (Janeiro 2025):**  
> Esta especificação foi arquivada. O sistema migrou de MongoDB para PostgreSQL JSONB para armazenamento de timelines.  
> Referências a MongoDB neste documento são mantidas apenas para contexto histórico.

## Visão Geral

Esta mudança implementa a visualização completa de processos com captura automática de timeline quando necessário. O design segue o padrão de "lazy loading" onde os dados da timeline são capturados apenas quando o usuário expressa interesse em visualizá-los.

## Decisões Arquiteturais

### 1. Rota de Visualização

**Decisão**: Usar rota dinâmica `app/(dashboard)/processos/[id]/page.tsx`

**Alternativas Consideradas**:
- Modal/Dialog na mesma página
- Sheet lateral (como em clientes/usuários)

**Justificativa**:
- Timeline pode ter centenas de itens, requer espaço vertical
- URL dedicada permite compartilhamento e navegação direta
- Melhor para SEO e bookmarking
- Consistente com padrão de visualização detalhada de entidades complexas

### 2. Estratégia de Captura

**Decisão**: Captura sob demanda (lazy loading) com verificação automática

**Fluxo**:
```
1. Usuário clica "Visualizar"
2. Navega para /processos/[id]
3. useProcessoTimeline verifica se existe timeline
4. Se não existe:
   4.1. Inicia captura via POST /api/captura/trt/timeline
   4.2. Mostra loading state com progresso
   4.3. Polling ou long-polling para obter resultado
5. Exibe timeline carregada
```

**Alternativas Consideradas**:
- Captura em background para todos os processos (batch)
- Re-captura sempre que visualizar

**Justificativa**:
- Captura sob demanda economiza recursos e tempo
- Usuário só espera quando realmente precisa da timeline
- Backend já suporta captura individual otimizada
- Evita sobrecarga desnecessária no PJE

### 3. Estrutura de Dados

**Decisão**: Manter estrutura existente MongoDB + PostgreSQL

**Modelo Híbrido**:
```
PostgreSQL (acervo):
- Dados relacionais do processo
- Referência timeline_mongodb_id
- Metadados básicos (TRT, grau, partes, datas)

MongoDB (timeline):
- Timeline completa (array de items)
- Documentos enriquecidos com links Google Drive
- Metadados de captura (data, totais, versão schema)
```

**Justificativa**:
- Timeline é document-based, melhor fit para MongoDB
- PostgreSQL mantém dados relacionais e referências
- Separação permite escalabilidade independente
- Já implementado e testado

### 4. Upload de Documentos

**Decisão**: Usar webhook n8n existente para Google Drive

**Fluxo de Upload**:
```
1. Captura timeline do PJE
2. Para cada documento:
   2.1. Baixar PDF do PJE
   2.2. Enviar para n8n webhook
   2.3. Receber links (visualização + download)
   2.4. Enriquecer item timeline com googleDrive field
3. Salvar timeline enriquecida no MongoDB
```

**Justificativa**:
- n8n já gerencia autenticação Google Drive
- Desacoplamento facilita mudanças futuras (ex: outro storage)
- Retry e error handling já implementados no n8n
- Links do Google Drive permitem visualização direta no browser

### 5. UI/UX da Timeline

**Decisão**: Timeline vertical com itens expansíveis

**Layout Proposto**:
```
┌─────────────────────────────────────────┐
│ Header do Processo                      │
│ [TRT] [Grau] [Número] [Status]         │
│ Autora vs Ré                            │
├─────────────────────────────────────────┤
│ Timeline (ordenada desc)                │
│                                          │
│ ○ 15/01/2025 - Certidão de Julgamento   │
│   │ Assinado por: Juiz XYZ              │
│   │ [Ver Documento] [Download]          │
│   └─────────────────────────────────────│
│                                          │
│ ○ 10/01/2025 - Movimento Processual     │
│   │ Despacho determinando...            │
│   └─────────────────────────────────────│
│                                          │
│ ○ 05/01/2025 - Petição Inicial          │
│   │ Assinado por: Adv ABC               │
│   │ [Ver Documento] [Download]          │
│   └─────────────────────────────────────│
└─────────────────────────────────────────┘
```

**Componentes**:
- `ProcessoHeader`: Dados do processo (partes, tribunal, status)
- `TimelineContainer`: Container principal scrollable
- `TimelineItem`: Item individual (movimento ou documento)
- `DocumentoActions`: Botões de visualização e download

**Justificativa**:
- Timeline vertical é padrão em sistemas jurídicos
- Ordenação descendente mostra eventos recentes primeiro
- Distinção visual entre documentos e movimentos
- Links diretos economizam cliques

### 6. Estados de UI

**Estados Mapeados**:

| Estado | Trigger | UI |
|--------|---------|-----|
| `loading` | Inicial / Capturando | Skeleton + spinner + mensagem |
| `error` | Erro na captura | Alert + mensagem + botão retry |
| `empty` | Timeline vazia | Empty state + ilustração |
| `success` | Timeline carregada | Timeline completa renderizada |

**Loading States Granulares**:
- `verificando`: "Verificando timeline existente..."
- `capturando`: "Capturando timeline do PJE... Isso pode levar alguns minutos."
- `processando`: "Processando documentos..."

### 7. Hook Customizado

**Decisão**: Criar `useProcessoTimeline` hook

**Interface**:
```typescript
function useProcessoTimeline(acervoId: number) {
  return {
    processo: Acervo | null,
    timeline: TimelineDocument | null,
    isLoading: boolean,
    isCapturing: boolean,
    error: Error | null,
    refetch: () => void
  };
}
```

**Lógica Interna**:
```typescript
1. Buscar processo: GET /api/acervo/[id]
2. Buscar timeline: GET /api/acervo/[id]/timeline
3. Se timeline === null:
   3.1. Acionar captura: POST /api/captura/trt/timeline
   3.2. Setar isCapturing = true
   3.3. Polling: repetir GET a cada 5s até sucesso/erro
4. Retornar dados combinados
```

**Justificativa**:
- Encapsula lógica complexa de verificação + captura
- Reutilizável em outros componentes
- Simplifica componente de página
- Facilita testes unitários

### 8. Performance e Cache

**Decisão**: Não implementar cache client-side adicional nesta iteração

**Justificativa**:
- Timeline muda raramente após captura inicial
- MongoDB já fornece performance adequada
- SWR/React Query podem ser adicionados futuramente se necessário
- Simplicidade favorece entrega rápida

**Consideração Futura**:
- Se performance for problema, adicionar SWR com revalidação
- Cache Redis no servidor para timelines frequentemente acessadas

## Fluxo de Dados Completo

```
┌──────────┐      1. Click       ┌───────────────┐
│  User    │─────"Visualizar"────▶│  Processos    │
│          │                      │  List Page    │
└──────────┘                      └───────┬───────┘
                                          │
                                  2. Navigate to
                                     /processos/[id]
                                          │
                                          ▼
┌─────────────────────────────────────────────────────┐
│  Processo Detail Page                               │
│                                                     │
│  useProcessoTimeline(id)                           │
│  ├─ GET /api/acervo/[id]                           │
│  │  └─ return Acervo                               │
│  │                                                  │
│  ├─ GET /api/acervo/[id]/timeline                  │
│  │  ├─ if timeline_mongodb_id:                     │
│  │  │  └─ return MongoDB.timeline                  │
│  │  └─ else: return null                           │
│  │                                                  │
│  └─ if timeline === null:                          │
│     ├─ POST /api/captura/trt/timeline              │
│     │  ├─ Autenticar no PJE                        │
│     │  ├─ Capturar timeline                        │
│     │  ├─ Baixar documentos                        │
│     │  ├─ Upload para Google Drive                 │
│     │  ├─ Salvar no MongoDB                        │
│     │  └─ Atualizar timeline_mongodb_id no PG      │
│     │                                               │
│     └─ Poll GET /api/acervo/[id]/timeline          │
│        until timeline !== null                     │
└─────────────────────────────────────────────────────┘
                    │
                    ▼
            Render Timeline UI
```

## Estrutura de Arquivos

```
app/(dashboard)/processos/
  page.tsx                              # Listagem (atualizar botão)
  [id]/
    page.tsx                            # NEW: Página de visualização

components/processos/
  processo-header.tsx                   # NEW: Header do processo
  timeline-container.tsx                # NEW: Container da timeline
  timeline-item.tsx                     # NEW: Item individual
  documento-actions.tsx                 # NEW: Ações de documento

lib/hooks/
  use-processo-timeline.ts              # NEW: Hook de captura/consulta

backend/captura/services/timeline/
  (sem mudanças - já implementado)

app/api/captura/trt/timeline/
  (sem mudanças - já implementado)

app/api/acervo/[id]/timeline/
  (sem mudanças - já implementado)
```

## Questões em Aberto

1. **Polling vs WebSocket**: Polling é mais simples, mas WebSocket seria mais eficiente. Implementar polling primeiro?
   - **Resposta Sugerida**: Sim, polling primeiro. WebSocket como melhoria futura.

2. **Re-captura Manual**: Permitir re-capturar timeline mesmo se já existe?
   - **Resposta Sugerida**: Não nesta iteração. Adicionar botão "Atualizar Timeline" futuramente.

3. **Paginação da Timeline**: Timeline pode ter centenas de itens. Paginar?
   - **Resposta Sugerida**: Não inicialmente. Scroll infinito ou paginação se performance for problema.

4. **Filtros de Timeline**: Permitir filtrar por tipo (documento/movimento), data, responsável?
   - **Resposta Sugerida**: Não nesta iteração. Feature request separada.

## Métricas de Sucesso

- **Performance**: Página carrega em < 2s (sem captura), captura completa < 3min
- **Usabilidade**: < 3 cliques para ver documento
- **Confiabilidade**: > 95% taxa de sucesso na captura
- **Adoção**: > 80% dos processos visualizados têm timeline capturada em 30 dias
