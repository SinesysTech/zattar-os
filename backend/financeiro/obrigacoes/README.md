# Módulo de Obrigações Financeiras

## Visão Geral

O Módulo de Obrigações Financeiras é um sistema de integração que atua como **ponte/adapter** entre os acordos judiciais (acordos e condenações) e o Sistema de Gestão Financeira (SGF). Ele fornece uma visão consolidada de todas as obrigações financeiras do escritório, sejam elas originadas de acordos judiciais ou de lançamentos avulsos.

### Funcionalidades Principais

- **Visualização Consolidada**: Dashboard unificado de todas as obrigações financeiras
- **Sincronização Automática**: Triggers que criam lançamentos financeiros automaticamente
- **Sincronização Manual**: APIs para forçar sincronização quando necessário
- **Verificação de Consistência**: Detecção de inconsistências entre parcelas e lançamentos
- **Sincronização Bidirecional**: Alterações em lançamentos refletem nas parcelas e vice-versa
- **Alertas e Resumos**: Widget de dashboard e APIs de resumo

## Arquitetura

```
backend/financeiro/obrigacoes/
├── services/
│   ├── integracao/
│   │   └── obrigacoes-integracao.service.ts   # Sincronização parcela ↔ lançamento
│   ├── obrigacoes/
│   │   └── listar-obrigacoes.service.ts       # Consulta consolidada
│   ├── persistence/
│   │   └── obrigacoes-persistence.service.ts  # Acesso ao banco de dados
│   └── validacao/
│       └── validar-sincronizacao.service.ts   # Validações de negócio
└── README.md

backend/types/financeiro/
└── obrigacoes.types.ts                        # Tipos e interfaces

app/api/financeiro/obrigacoes/
├── route.ts                                    # GET - Listagem consolidada
├── resumo/route.ts                            # GET - Resumo/métricas
├── sincronizar/route.ts                       # POST - Sincronização manual
├── cliente/[clienteId]/route.ts               # GET - Obrigações por cliente
└── processo/[processoId]/route.ts             # GET - Obrigações por processo

app/(dashboard)/financeiro/obrigacoes/
├── page.tsx                                    # Dashboard de obrigações
└── components/
    ├── resumo-cards.tsx                       # Cards de métricas
    ├── alertas-obrigacoes.tsx                 # Alertas de vencimento
    └── obrigacao-detalhes-dialog.tsx          # Dialog de detalhes

supabase/schemas/
└── 35_financeiro_integracao.sql               # Triggers de integração
```

## Tipos de Obrigações

O módulo consolida quatro tipos de obrigações:

| Tipo | Descrição | Origem |
|------|-----------|--------|
| `acordo_recebimento` | Parcela de acordo a receber | Parcela de acordo/condenação |
| `acordo_pagamento` | Parcela de acordo a pagar | Parcela de acordo/condenação |
| `conta_receber` | Conta a receber avulsa | Lançamento financeiro |
| `conta_pagar` | Conta a pagar avulsa | Lançamento financeiro |

## Status de Obrigações

| Status | Descrição |
|--------|-----------|
| `pendente` | Aguardando vencimento/efetivação |
| `vencida` | Passou da data de vencimento sem efetivação |
| `efetivada` | Recebida/paga com sucesso |
| `cancelada` | Cancelada antes da efetivação |
| `estornada` | Estornada após efetivação |

## Fluxo de Sincronização

### Sincronização Automática (Parcela → Lançamento)

Quando uma parcela é marcada como "recebida" ou "paga", um trigger no banco de dados cria automaticamente um lançamento financeiro correspondente:

```
Parcela.status = 'recebida' ou 'paga'
       ↓
trigger_criar_lancamento_de_parcela()
       ↓
INSERT INTO lancamentos_financeiros
```

### Sincronização Reversa (Lançamento → Parcela)

Quando um lançamento é alterado (cancelado, estornado), a parcela é atualizada:

```
Lançamento.status = 'cancelado' ou 'estornado'
       ↓
trigger_sincronizar_parcela_de_lancamento()
       ↓
UPDATE parcelas_acordos_condenacoes SET status = 'pendente'
```

### Sincronização Manual

Para casos onde a sincronização automática falhou ou precisa ser forçada:

```bash
POST /api/financeiro/obrigacoes/sincronizar
{
  "acordoId": 100,     # Sincronizar acordo inteiro
  "forcar": true       # Recriar lançamentos mesmo se existirem
}

# ou

POST /api/financeiro/obrigacoes/sincronizar
{
  "parcelaId": 1,      # Sincronizar parcela específica
  "forcar": false
}
```

## API Routes

### GET /api/financeiro/obrigacoes

Lista todas as obrigações com filtros e paginação.

**Query Parameters:**
- `pagina` (number): Página atual (default: 1)
- `limite` (number): Itens por página (default: 20, max: 100)
- `tipos[]` (TipoObrigacao[]): Filtrar por tipo
- `status[]` (StatusObrigacao[]): Filtrar por status
- `busca` (string): Busca textual
- `dataVencimentoInicio` (string): Data inicial
- `dataVencimentoFim` (string): Data final
- `clienteId` (number): Filtrar por cliente
- `processoId` (number): Filtrar por processo
- `apenasVencidas` (boolean): Apenas vencidas
- `apenasInconsistentes` (boolean): Apenas com inconsistências

**Response:**
```json
{
  "items": [...],
  "paginacao": {
    "pagina": 1,
    "limite": 20,
    "total": 150,
    "totalPaginas": 8
  },
  "resumo": {
    "totalObrigacoes": 150,
    "valorTotal": 500000,
    "pendentes": { "quantidade": 50, "valor": 200000 },
    "vencidas": { "quantidade": 10, "valor": 50000 },
    ...
  }
}
```

### GET /api/financeiro/obrigacoes/resumo

Retorna resumo/métricas das obrigações.

**Query Parameters:**
- `incluirAlertas` (boolean): Incluir alertas de vencimento

**Response:**
```json
{
  "resumo": {
    "totalObrigacoes": 150,
    "valorTotal": 500000,
    "pendentes": { "quantidade": 50, "valor": 200000 },
    "vencidas": { "quantidade": 10, "valor": 50000 },
    "efetivadas": { "quantidade": 90, "valor": 250000 },
    "vencendoHoje": { "quantidade": 5, "valor": 25000 },
    "vencendoEm7Dias": { "quantidade": 15, "valor": 75000 },
    "porTipo": [...],
    "sincronizacao": {
      "sincronizados": 100,
      "pendentes": 40,
      "inconsistentes": 10
    }
  },
  "alertas": {
    "vencidas": { "quantidade": 10, "valor": 50000 },
    "vencendoHoje": { "quantidade": 5, "valor": 25000 },
    "inconsistentes": { "quantidade": 10, "valor": 30000 }
  }
}
```

### POST /api/financeiro/obrigacoes/sincronizar

Sincroniza manualmente parcelas com o sistema financeiro.

**Request Body:**
```json
{
  "acordoId": 100,      // Sincronizar acordo inteiro (opcional)
  "parcelaId": 1,       // Sincronizar parcela específica (opcional)
  "forcar": false       // Forçar recriação de lançamentos
}
```

**Response:**
```json
{
  "sucesso": true,
  "totalProcessados": 5,
  "totalSucessos": 4,
  "totalErros": 1,
  "itens": [
    {
      "parcelaId": 1,
      "lancamentoId": 500,
      "sucesso": true,
      "acao": "criado",
      "mensagem": "Lançamento criado com sucesso"
    }
  ],
  "erros": [],
  "warnings": []
}
```

## Componentes Frontend

### ResumoCards

Exibe cards com métricas resumidas:

```tsx
import { ResumoCards } from './components/resumo-cards';

<ResumoCards resumo={resumo} />
```

### AlertasObrigacoes

Exibe alertas de obrigações vencidas ou vencendo:

```tsx
import { AlertasObrigacoes } from './components/alertas-obrigacoes';

<AlertasObrigacoes
  alertas={alertas}
  onVerVencidas={() => setFiltros({ apenasVencidas: true })}
  onVerVencendoHoje={() => setFiltros({ dataVencimento: hoje })}
  onVerInconsistentes={() => setFiltros({ apenasInconsistentes: true })}
/>
```

### ObrigacaoDetalhesDialog

Dialog com detalhes completos de uma obrigação:

```tsx
import { ObrigacaoDetalhesDialog } from './components/obrigacao-detalhes-dialog';

<ObrigacaoDetalhesDialog
  obrigacao={obrigacaoSelecionada}
  open={dialogOpen}
  onOpenChange={setDialogOpen}
  onSincronizar={handleSincronizar}
/>
```

## Hooks React

### useObrigacoes

Hook para listagem de obrigações:

```tsx
import { useObrigacoes } from '@/app/_lib/hooks/use-obrigacoes';

const { obrigacoes, resumo, paginacao, isLoading, error, mutate } = useObrigacoes({
  pagina: 1,
  limite: 20,
  tipos: ['acordo_recebimento'],
  apenasVencidas: true,
});
```

### useResumoObrigacoes

Hook para resumo/métricas:

```tsx
import { useResumoObrigacoes } from '@/app/_lib/hooks/use-obrigacoes';

const { resumo, alertas, isLoading, error } = useResumoObrigacoes({
  incluirAlertas: true,
});
```

### useSincronizarObrigacao

Hook para sincronização manual:

```tsx
import { useSincronizarObrigacao } from '@/app/_lib/hooks/use-obrigacoes';

const { sincronizar, isSyncing, error } = useSincronizarObrigacao();

await sincronizar({ acordoId: 100, forcar: true });
```

## Permissões

O módulo utiliza o sistema de permissões granulares:

### Recurso: obrigacoes

| Operação | Descrição |
|----------|-----------|
| `listar` | Visualizar listagem de obrigações |
| `visualizar` | Ver detalhes de uma obrigação |
| `sincronizar` | Executar sincronização manual |
| `forcar_sincronizacao` | Forçar recriação de lançamentos |
| `verificar_consistencia` | Verificar inconsistências |
| `editar` | Editar obrigação |
| `deletar` | Excluir obrigação |

### Recurso: lancamentos_financeiros

| Operação | Descrição |
|----------|-----------|
| `listar` | Visualizar lançamentos |
| `visualizar` | Ver detalhes |
| `criar` | Criar lançamento |
| `editar` | Editar lançamento |
| `deletar` | Excluir lançamento |
| `confirmar` | Confirmar lançamento |
| `estornar` | Estornar lançamento |
| `cancelar` | Cancelar lançamento |
| `conciliar` | Conciliar com extrato bancário |
| `atribuir_responsavel` | Atribuir responsável |
| `desatribuir_responsavel` | Remover responsável |
| `transferir_responsavel` | Transferir responsável |

## Validações

Antes de sincronizar, o sistema valida:

1. **Existência de Entidades**: Parcela e acordo devem existir
2. **Status Válido**: Acordo não pode estar cancelado
3. **Valores Válidos**: Valor principal deve ser positivo
4. **Datas Válidas**: Data de vencimento deve ser válida
5. **Conta Contábil**: Deve existir conta contábil padrão configurada
6. **Lançamento Existente**: Verifica se já existe para evitar duplicidade

## Testes

Os testes estão localizados em:

```
tests/unit/financeiro/
├── obrigacoes-integracao.test.ts    # Testes do serviço de integração
└── obrigacoes-validacao.test.ts     # Testes do serviço de validação
```

Para executar:

```bash
npm run test:unit -- --testPathPattern="obrigacoes"
```

## Migrations

O módulo utiliza as seguintes tabelas:

- `acordos_condenacoes`: Acordos e condenações judiciais
- `parcelas_acordos_condenacoes`: Parcelas dos acordos
- `lancamentos_financeiros`: Lançamentos do sistema financeiro
- `plano_contas`: Plano de contas contábil

Triggers de integração em `35_financeiro_integracao.sql`:

- `trigger_criar_lancamento_de_parcela`: Cria lançamento quando parcela é efetivada
- `trigger_sincronizar_parcela_de_lancamento`: Sincroniza parcela quando lançamento muda
- `trigger_sincronizar_parcela_ao_deletar_lancamento`: Volta parcela para pendente ao deletar

## Troubleshooting

### Lançamento não foi criado automaticamente

1. Verifique se a parcela foi marcada como 'recebida' ou 'paga'
2. Verifique se existe conta contábil padrão configurada
3. Verifique os logs do banco (NOTICE/WARNING)
4. Use a sincronização manual: `POST /api/financeiro/obrigacoes/sincronizar`

### Inconsistência detectada

1. Acesse o dashboard de obrigações
2. Filtre por "Apenas inconsistentes"
3. Clique na obrigação para ver detalhes
4. Use "Forçar Sincronização" para corrigir

### Parcela não voltou para pendente

Verifique se o trigger `trigger_sincronizar_parcela_de_lancamento` está ativo:

```sql
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgname = 'trigger_sincronizar_parcela_de_lancamento';
```

## Changelog

### v1.0.0 (2025-12)

- Implementação inicial do módulo
- Visão consolidada de obrigações
- Sincronização automática via triggers
- Sincronização manual via API
- Dashboard e widgets
- Sistema de permissões
- Testes unitários
