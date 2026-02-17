# Erro 401: Management API Unauthorized

## Problema

Você está vendo este erro no console:

```
[Management API] Erro 401: Unauthorized
at obterComputeAtual (src/lib/supabase/management-api.ts:384:15)
```

## Causa

O token de acesso da Supabase Management API (`SUPABASE_ACCESS_TOKEN`) está **expirado ou inválido**.

## Impacto

Este erro **NÃO quebra a aplicação**. O sistema continua funcionando normalmente, mas:

- O compute tier será mostrado como "unknown" nas métricas
- Os limites de IOPS e throughput não serão exibidos
- Recomendações de upgrade não serão precisas

## Solução Rápida

### 1. Gerar um novo token

1. Acesse: https://supabase.com/dashboard/account/tokens
2. Clique em "Generate new token"
3. Dê um nome: "Sinesys Management API"
4. Copie o token gerado

### 2. Atualizar o .env.local

Substitua o valor de `SUPABASE_ACCESS_TOKEN` no arquivo `.env.local`:

```bash
SUPABASE_ACCESS_TOKEN=seu_novo_token_aqui
```

### 3. Reiniciar a aplicação

```bash
# Parar o servidor (Ctrl+C)
npm run dev
```

### 4. Verificar se funcionou

1. Acesse: http://localhost:3000/app/admin/metricas-db
2. Verifique o card "Disk IO Budget"
3. O compute tier deve aparecer (ex: "Small", "Medium")

## Verificação Manual

Você pode testar o token manualmente antes de atualizar:

```bash
curl -H "Authorization: Bearer SEU_NOVO_TOKEN" \
  https://api.supabase.com/v1/projects/cxxdivtgeslrujpfpivs
```

**Resposta esperada:**
- Status 200: Token válido ✅
- Status 401: Token inválido ❌

## Alternativa: Desabilitar a Management API

Se você não precisa das métricas de compute tier, pode simplesmente comentar as variáveis:

```bash
# SUPABASE_PROJECT_REF=cxxdivtgeslrujpfpivs
# SUPABASE_ACCESS_TOKEN=sbp_...
```

O sistema funcionará normalmente, mas mostrará "unknown" como tier.

## Melhorias Implementadas

Para evitar confusão no futuro, implementamos:

1. **Mensagem de erro mais clara**: Agora o erro 401 explica que o token expirou e onde gerar um novo
2. **Warning quando não configurado**: Se as variáveis não existirem, mostra um aviso em vez de erro
3. **Documentação completa**: Criado `docs/configuracao/management-api.md` com guia completo
4. **Comentários no .env.local**: Adicionado link para documentação

## Referências

- [Documentação completa](../configuracao/management-api.md)
- [Supabase Access Tokens](https://supabase.com/docs/guides/platform/access-tokens)
- [Management API Reference](https://supabase.com/docs/reference/api/introduction)
