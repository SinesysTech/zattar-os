# Guia para Atualizar Tipos TypeScript do Supabase

## Status Atual

Os tipos TypeScript foram gerados via MCP Supabase e estão disponíveis. O arquivo `src/lib/supabase/database.types.ts` precisa ser atualizado com o conteúdo completo.

## Métodos para Atualizar Tipos

### Método 1: Via Supabase CLI (Local)

Se você tiver o Supabase local rodando:

```bash
npx supabase gen types typescript --local > src/lib/supabase/database.types.ts
```

### Método 2: Via Supabase CLI (Projeto Remoto)

Se você tiver o projeto configurado:

```bash
npx supabase gen types typescript --project-id <project-id> > src/lib/supabase/database.types.ts
```

### Método 3: Via Supabase Dashboard

1. Acesse o Supabase Dashboard
2. Vá em Settings > API
3. Role até "TypeScript Types"
4. Copie o conteúdo gerado
5. Cole em `src/lib/supabase/database.types.ts`

### Método 4: Via Script Helper

Execute o script helper criado:

```bash
./update-types.sh
```

## Nota Importante

O conteúdo completo dos tipos foi gerado via MCP e está disponível. O arquivo atual pode estar desatualizado. Recomenda-se atualizar sempre que houver mudanças no schema do banco de dados.

