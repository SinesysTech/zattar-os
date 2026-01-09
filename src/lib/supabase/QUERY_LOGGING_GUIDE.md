# Query Logging Integration Guide

## Overview

The query logging system monitors slow database queries (>1000ms) and emits warnings when `DEBUG_SUPABASE=true`. This guide shows how to integrate the `logQuery` helper into your repositories.

## Quick Start

### Option 1: Direct Import from db-client (Recommended)

The `logQuery` function is exported from `@/lib/supabase/db-client.ts`:

```typescript
import { logQuery } from '@/lib/supabase/db-client';

export const usuarioRepository = {
  async findAll(): Promise<Usuario[]> {
    return logQuery('usuarios.findAll', () =>
      supabase
        .from('usuarios')
        .select('*')
    );
  },
};
```

### Option 2: Import from query-logger

For more advanced features:

```typescript
import { 
  logQuery, 
  logQueryPromise, 
  logBatchQueries 
} from '@/lib/supabase/query-logger';
```

## Usage Patterns

### Basic Query Logging

```typescript
export async function findUsuarios(): Promise<Usuario[]> {
  return logQuery('find_usuarios', async () => {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('nome_completo');

    if (error) throw new Error(error.message);
    return data || [];
  });
}
```

### With Custom Threshold

```typescript
return logQuery('find_usuarios', queryFn, 2000); // Alert if > 2000ms
```

### Logging Existing Promises

```typescript
const usersPromise = supabase
  .from('usuarios')
  .select('*')
  .then(result => result.data || []);

const users = await logQueryPromise('fetch_users', usersPromise);
```

### Batch Operations

```typescript
const results = await logBatchQueries('user_setup', {
  usuarios: () => supabase.from('usuarios').select('*'),
  cargos: () => supabase.from('cargos').select('*'),
  endericos: () => supabase.from('enderecos').select('*'),
});
```

## Environment Configuration

### Enable Debug Logging

```bash
# .env.local or .env.development
DEBUG_SUPABASE=true
```

### Console Output

When `DEBUG_SUPABASE=true` and query duration > 1000ms:

```
[Supabase] Slow query detected (1234.56ms > 1000ms): usuarios.findAll
{
  queryName: 'usuarios.findAll',
  duration_ms: '1234.56',
  threshold_ms: 1000,
  timestamp: '2026-01-09T10:30:45.123Z',
  environment: 'development'
}
```

## Error Logging

Failed queries are always logged (regardless of DEBUG_SUPABASE):

```
[Supabase] Query execution failed (245ms): usuarios.findAll
{
  queryName: 'usuarios.findAll',
  error: 'relation "usuarios" does not exist',
  duration_ms: 245,
  timestamp: '2026-01-09T10:30:45.123Z',
  environment: 'development'
}
```

## Implementation Checklist

For each repository, follow this pattern:

### 1. Import logQuery

```typescript
import { logQuery } from '@/lib/supabase/db-client';
// or
import { logQuery, logBatchQueries } from '@/lib/supabase/query-logger';
```

### 2. Wrap Query Functions

**Before:**
```typescript
export async function findAll(): Promise<User[]> {
  const { data, error } = await supabase.from('users').select('*');
  if (error) throw new Error(error.message);
  return data || [];
}
```

**After:**
```typescript
export async function findAll(): Promise<User[]> {
  return logQuery('users.findAll', async () => {
    const { data, error } = await supabase.from('users').select('*');
    if (error) throw new Error(error.message);
    return data || [];
  });
}
```

### 3. Name Queries Consistently

Use format: `{table}.{operation}` or `{feature}.{operation}`

**Examples:**
- `usuarios.findAll`
- `usuarios.findById`
- `processos.findByCliente`
- `documentos.search`
- `audiencias.findByData`

### 4. Apply Across Repositories

Key repositories to update:
- `src/features/usuarios/repository.ts`
- `src/features/processos/repository.ts`
- `src/features/documentos/repository.ts`
- `src/features/audiencias/repository.ts`
- `src/features/financeiro/repository.ts`
- ... (all 20 repositories)

## Advanced Usage

### Conditional Thresholds

```typescript
// Different thresholds for different operations
export const usuarioRepository = {
  // Fast queries: 500ms threshold
  async findById(id: number) {
    return logQuery('usuarios.findById', () => 
      supabase.from('usuarios').select('*').eq('id', id),
      500
    );
  },

  // Complex queries: 2000ms threshold
  async findByFilters(filters: Filter[]) {
    return logQuery('usuarios.findByFilters', () =>
      buildComplexQuery(filters),
      2000
    );
  },
};
```

### Batch Processing

```typescript
async function setupNewUser(userData: UserInput) {
  return logBatchQueries('setup_new_user', {
    createUser: () => 
      supabase.from('usuarios').insert(userData).select().single(),
    
    createAddress: () =>
      supabase.from('enderecos').insert(addressData).select().single(),
    
    createProfile: () =>
      supabase.from('profiles').insert(profileData).select().single(),
  }, 5000); // 5s threshold for batch
}
```

## Monitoring & Debugging

### Extract Slow Queries from Logs

```bash
# From Next.js output
npm run dev 2>&1 | grep "Slow query"

# From production logs (CloudWatch, Vercel, etc.)
# Search for: "[Supabase] Slow query detected"
```

### Create Database Indexes

If you see repeated slow queries:

```sql
-- Add indexes to frequently queried columns
CREATE INDEX idx_usuarios_email ON usuarios(email_corporativo);
CREATE INDEX idx_processos_cliente ON processos(cliente_id);
CREATE INDEX idx_audiencias_data ON audiencias(data_hora);
```

### Performance Analysis

Enable `DEBUG_SUPABASE` in staging to profile queries:

```bash
# Deploy with debug enabled
vercel env add DEBUG_SUPABASE true --environment staging
```

## Related Files

- `src/lib/supabase/db-client.ts` - Core implementation
- `src/lib/supabase/query-logger.ts` - Advanced helpers
- `AGENTS.md` - Architecture guidelines
- `.cursor/rules/postgres-sql-style-guide.mdc` - SQL best practices

## Troubleshooting

### Queries not being logged?

1. Check `DEBUG_SUPABASE=true` is set
2. Verify query duration > 1000ms (default threshold)
3. Check console for any errors during query execution

### Too many warnings?

1. Increase threshold: `logQuery(name, fn, 5000)` for 5s
2. Optimize slow queries with database indexes
3. Consider pagination for large result sets

### Integration issues?

1. Ensure imports are correct
2. Verify repository is in `src/features/{module}/`
3. Check TypeScript strict mode is enabled
