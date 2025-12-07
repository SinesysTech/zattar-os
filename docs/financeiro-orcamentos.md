# Módulo de Orçamentos Empresariais

## Visão Geral
- Gerenciamento de orçamentos anuais, semestrais, trimestrais ou mensais.
- Controle do ciclo de vida: rascunho → aprovado → em execução → encerrado.
- Análise orçamentária: comparativo orçado vs realizado.
- Alertas de desvio e projeções de fechamento.
- Relatórios exportáveis (Excel, PDF).

## Conceitos
- **Orçamento**: planejamento financeiro para um período específico com itens de despesa.
- **Item do orçamento**: linha orçamentária vinculada a conta contábil e centro de custo.
- **Status**:
  - `rascunho`: em elaboração, pode ser editado.
  - `aprovado`: aguardando início da execução.
  - `em_execucao`: período ativo, lançamentos são comparados.
  - `encerrado`: período finalizado, apenas consulta.
- **Análise orçamentária**: comparação entre valores orçados e realizados (lançamentos financeiros).
- **Variação**: percentual de diferença entre realizado e orçado.
- **Projeção**: estimativa de fechamento baseada na tendência atual de gastos.

## Fluxo de Uso
1) **Criar orçamento**: definir nome, ano, período, datas de início/fim.
2) **Adicionar itens**: vincular contas contábeis com valores orçados.
3) **Aprovar**: orçamento fica pronto para execução (requer pelo menos 1 item).
4) **Iniciar execução**: orçamento entra em vigor, lançamentos são comparados.
5) **Monitorar**: acompanhar análise, alertas e projeções durante o período.
6) **Encerrar**: finalizar período, orçamento fica apenas para consulta.

## Tabelas do Banco de Dados

### orcamentos
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | bigint | ID único |
| nome | varchar(200) | Nome do orçamento |
| descricao | text | Descrição detalhada |
| ano | integer | Ano de referência |
| periodo | periodo_orcamento | mensal, trimestral, semestral, anual |
| status | status_orcamento | rascunho, aprovado, em_execucao, encerrado |
| data_inicio | date | Data de início da vigência |
| data_fim | date | Data de fim da vigência |
| observacoes | text | Observações adicionais |
| criado_por | bigint | FK usuários |
| aprovado_por | bigint | FK usuários |
| data_aprovacao | timestamp | Data/hora da aprovação |

### orcamento_itens
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | bigint | ID único |
| orcamento_id | bigint | FK orçamento |
| plano_contas_id | bigint | FK conta contábil |
| centro_custo_id | bigint | FK centro de custo (opcional) |
| valor_orcado | numeric(15,2) | Valor planejado |
| descricao | text | Descrição do item |

### v_orcamento_vs_realizado (View Materializada)
View que consolida orçado vs realizado por item, calculando variações automaticamente a partir de `lancamentos_financeiros`.

## Endpoints da API

### Orçamentos
- `GET /api/financeiro/orcamentos`: Lista orçamentos com filtros (ano, período, status, busca).
- `POST /api/financeiro/orcamentos`: Cria novo orçamento.
- `GET /api/financeiro/orcamentos/{id}`: Detalhes do orçamento com itens.
- `PUT /api/financeiro/orcamentos/{id}`: Atualiza orçamento (apenas rascunho).
- `DELETE /api/financeiro/orcamentos/{id}`: Exclui orçamento (apenas rascunho).

### Ações do Orçamento
- `POST /api/financeiro/orcamentos/{id}/aprovar`: Aprova orçamento.
- `POST /api/financeiro/orcamentos/{id}/iniciar-execucao`: Inicia execução.
- `POST /api/financeiro/orcamentos/{id}/encerrar`: Encerra orçamento.

### Itens
- `GET /api/financeiro/orcamentos/{id}/itens`: Lista itens do orçamento.
- `POST /api/financeiro/orcamentos/{id}/itens`: Cria item(s) - suporta individual ou lote.
- `PUT /api/financeiro/orcamentos/{id}/itens/{itemId}`: Atualiza item.
- `DELETE /api/financeiro/orcamentos/{id}/itens/{itemId}`: Remove item.

### Análise
- `GET /api/financeiro/orcamentos/{id}/analise`: Análise orçamentária com resumo e alertas.
- `GET /api/financeiro/orcamentos/{id}/projecao`: Projeção de fechamento.
- `GET /api/financeiro/orcamentos/{id}/relatorio`: Relatório completo para exportação.

## Parâmetros de Filtro

### Listagem de Orçamentos
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| pagina | number | Página atual (default: 1) |
| limite | number | Itens por página (default: 50, max: 100) |
| busca | string | Busca no nome e descrição |
| ano | number | Filtrar por ano |
| periodo | string | mensal, trimestral, semestral, anual |
| status | string | rascunho, aprovado, em_execucao, encerrado (múltiplos) |
| ordenarPor | string | nome, ano, periodo, status, data_inicio, created_at |
| ordem | string | asc, desc |

### Análise Orçamentária
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| incluirResumo | boolean | Incluir resumo geral (default: true) |
| incluirAlertas | boolean | Incluir alertas de desvio (default: true) |
| incluirEvolucao | boolean | Incluir evolução mensal (default: false) |

## Hooks Disponíveis

```typescript
// Listagem com filtros
const { orcamentos, paginacao, isLoading, refetch } = useOrcamentos(params);

// Orçamento individual com detalhes
const { orcamento, isLoading, refetch } = useOrcamento(id);

// Análise orçamentária
const { itens, resumo, alertas, evolucao, isLoading } = useAnaliseOrcamentaria(id, params);

// Projeção
const { projecao, comparativoAnual, isLoading } = useProjecaoOrcamentaria(id);

// Itens do orçamento
const { itens, isLoading, refetch } = useOrcamentoItens(id);

// Relatório completo
const { relatorio, isLoading } = useRelatorioOrcamento(id);
```

## Funções de Mutação

```typescript
// Orçamentos
await criarOrcamento(dados);
await atualizarOrcamento(id, dados);
await aprovarOrcamento(id, observacoes?);
await iniciarExecucaoOrcamento(id);
await encerrarOrcamento(id, observacoes?);
await excluirOrcamento(id);

// Itens
await criarItemOrcamento(orcamentoId, dados);
await criarItensOrcamentoEmLote(orcamentoId, itens);
await atualizarItemOrcamento(orcamentoId, itemId, dados);
await excluirItemOrcamento(orcamentoId, itemId);
```

## Permissões Sugeridas

| Permissão | Descrição |
|-----------|-----------|
| orcamentos.listar | Visualizar lista de orçamentos |
| orcamentos.visualizar | Ver detalhes de um orçamento |
| orcamentos.criar | Criar novos orçamentos |
| orcamentos.editar | Editar orçamentos em rascunho |
| orcamentos.aprovar | Aprovar orçamentos |
| orcamentos.executar | Iniciar/encerrar execução |
| orcamentos.excluir | Excluir orçamentos em rascunho |
| orcamentos.analise | Visualizar análise orçamentária |
| orcamentos.exportar | Exportar relatórios |

## Cache

- **TTL listagem**: 10 minutos (600s)
- **TTL análise**: 5 minutos (300s) - dados mais voláteis
- **Prefixo**: `orcamentos:`
- **Invalidação**: automática em operações de escrita

## Integração com Lançamentos Financeiros

A análise orçamentária compara valores orçados com lançamentos da tabela `lancamentos_financeiros`:
- Filtra por `plano_contas_id` do item
- Considera período de competência dentro da vigência do orçamento
- Soma valores por conta/centro de custo
- Calcula variação percentual: `((realizado - orcado) / orcado) * 100`

## Troubleshooting

- **Orçamento não pode ser aprovado**: verifique se possui pelo menos 1 item e se está em rascunho.
- **Orçamento não pode ser editado**: apenas orçamentos em rascunho podem ser editados.
- **Análise sem dados**: view materializada pode estar desatualizada; verificar lançamentos.
- **Projeção imprecisa**: requer histórico mínimo de 3 meses para tendências confiáveis.
- **Duplicidade de item**: mesmo `plano_contas_id` + `centro_custo_id` já existe no orçamento.

## Arquivos do Módulo

### Backend
- `backend/types/financeiro/orcamento.types.ts`: Tipos TypeScript
- `backend/financeiro/orcamento/services/persistence/orcamento-persistence.service.ts`: CRUD
- `backend/financeiro/orcamento/services/persistence/analise-orcamentaria-persistence.service.ts`: Análise

### API
- `app/api/financeiro/orcamentos/route.ts`: GET/POST
- `app/api/financeiro/orcamentos/[id]/route.ts`: GET/PUT/DELETE
- `app/api/financeiro/orcamentos/[id]/aprovar/route.ts`: POST
- `app/api/financeiro/orcamentos/[id]/iniciar-execucao/route.ts`: POST
- `app/api/financeiro/orcamentos/[id]/encerrar/route.ts`: POST
- `app/api/financeiro/orcamentos/[id]/analise/route.ts`: GET
- `app/api/financeiro/orcamentos/[id]/projecao/route.ts`: GET
- `app/api/financeiro/orcamentos/[id]/relatorio/route.ts`: GET
- `app/api/financeiro/orcamentos/[id]/itens/route.ts`: GET/POST
- `app/api/financeiro/orcamentos/[id]/itens/[itemId]/route.ts`: GET/PUT/DELETE

### Frontend
- `app/_lib/hooks/use-orcamentos.ts`: Hooks React
- `app/(dashboard)/financeiro/orcamentos/page.tsx`: Listagem
- `app/(dashboard)/financeiro/orcamentos/[id]/page.tsx`: Detalhes
- `app/(dashboard)/financeiro/orcamentos/[id]/analise/page.tsx`: Análise
- `app/(dashboard)/financeiro/orcamentos/components/`: Componentes UI
