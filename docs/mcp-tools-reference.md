# Referência Completa - Tools MCP Sinesys

## Visão Geral

O Sinesys expõe **0 ferramentas MCP** organizadas em 0 módulos funcionais. Estas ferramentas permitem que agentes de IA interajam com o sistema de forma estruturada e segura.\n\n## Índice Rápido

| Módulo | Tools | Descrição |
|--------|-------|-----------|\n
---

## Módulos

## Padrões de Uso

### Autenticação

Todas as tools com autenticação obrigatória requerem:\n\n- Header `x-service-api-key` com API key válida, OU\n- Cookie de sessão autenticada\n\n### Paginação

Tools de listagem suportam `limite` e `offset`:\n\n```json
{
  "limite": 20,
  "offset": 40
}
```

### Tratamento de Erros

Padrão de resposta:\n\n**Sucesso:**
```json
{ "success": true, "data": {...} }
```

**Erro:**
```json
{ "success": false, "error": "Mensagem descritiva" }
```

### Rate Limiting

- **Anonymous:** 10 req/min\n- **Authenticated:** 100 req/min\n- **Service:** 1000 req/min\n\nHeaders de resposta:\n- `X-RateLimit-Limit`\n- `X-RateLimit-Remaining`\n- `X-RateLimit-Reset`\n\n## Tabela Comparativa de Tools

| Tool | Módulo | Auth | Uso Comum |
|------|--------|------|-----------|\n
## Workflows Comuns

### 1. Buscar Processos de um Cliente

```typescript
// 1. Buscar cliente por CPF
const cliente = await executeMcpTool('buscar_cliente_por_cpf', {
  cpf: '12345678901'
});

// 2. Buscar processos do cliente
const processos = await executeMcpTool('buscar_processos_por_cpf', {
  cpf: '12345678901',
  limite: 50
});
```

### 2. Criar Lançamento Financeiro

```typescript
// 1. Listar plano de contas
const contas = await executeMcpTool('listar_plano_contas', {});

// 2. Criar lançamento
const lancamento = await executeMcpTool('criar_lancamento', {
  tipo: 'receita',
  valor: 1500.00,
  conta_id: 10,
  descricao: 'Honorários - Processo 123'
});

// 3. Confirmar lançamento
await executeMcpTool('confirmar_lancamento', {
  lancamento_id: lancamento.data.id
});
```

## Referências

- **Registry:** `src/lib/mcp/registry.ts`\n- **Server:** `src/lib/mcp/server.ts`\n- **API Endpoint:** `src/app/api/mcp/route.ts`\n- **Testes:** `scripts/mcp/test-tools.ts`\n- **Auditoria:** `docs/mcp-audit/`\n