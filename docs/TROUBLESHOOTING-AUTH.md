# Troubleshooting: Erro de Autenticação Supabase

## Erro: "Database error querying schema" / "email_change"

### Descrição do Problema

Ao tentar fazer login, você pode encontrar o seguinte erro:

```
AuthApiError: Database error querying schema
Error: error finding user: sql: Scan error on column index 8, name "email_change": converting NULL to string is unsupported
```

### Causa

Este é um **bug conhecido do Supabase Auth** relacionado à coluna `email_change` na tabela `auth.users`. O problema ocorre quando o Supabase Auth tenta fazer scan de uma coluna que é NULL mas está sendo tratada como não-nullable pelo driver Go do Supabase.

### Soluções

#### 1. Verificar Status do Projeto Supabase

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Verifique se há atualizações pendentes do projeto
3. Verifique os logs de autenticação no dashboard

#### 2. Tentar Criar Novo Usuário

O problema pode ser específico de usuários existentes. Tente criar um novo usuário via sign-up para verificar se o problema persiste.

#### 3. Contatar Suporte do Supabase

Se o problema persistir, entre em contato com o suporte do Supabase fornecendo:

- **Erro**: `"error finding user: sql: Scan error on column index 8, name \"email_change\": converting NULL to string is unsupported"`
- **Timestamp**: Data e hora dos erros (verifique os logs)
- **Project ID**: ID do seu projeto Supabase
- **Versão do Supabase**: Verifique no dashboard

#### 4. Verificar Versão do Supabase

Este problema pode estar relacionado a uma versão específica do Supabase Auth. Verifique se há atualizações disponíveis.

### Workaround Temporário

Enquanto o problema não é resolvido pelo Supabase, você pode:

1. Usar autenticação via dashboard do Supabase para gerenciar usuários
2. Tentar fazer login com diferentes navegadores/dispositivos
3. Limpar cookies e cache do navegador

### Links Úteis

- [Supabase Support](https://supabase.com/support)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase Status Page](https://status.supabase.com/)

### Status

- **Data do Problema**: Novembro 2025
- **Status**: Bug conhecido do Supabase Auth
- **Solução**: Aguardando correção do Supabase

