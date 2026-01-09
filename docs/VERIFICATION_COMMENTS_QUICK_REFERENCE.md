# Quick Reference: Verification Comments Implementation

## ✅ Comment 1: Disk IO Monitoring Edge Function

### Files Modified
1. **CREATED** `supabase/functions/alertas-disk-io/index.ts`
   - Deno-based Edge Function
   - Calls Supabase Management API for real Disk IO metrics
   - Falls back to RPC if Management API unavailable
   - Sends SMTP email when Disk IO > 80%
   - Protected with CRON_SECRET
   - Logs detailed metrics and alerts

2. **MODIFIED** `vercel.json`
   - Removed: `"/api/cron/alertas-disk-io"` from crons
   - Added: Edge Function to functions section with memory/timeout config

3. **DEPRECATED** `src/app/api/cron/alertas-disk-io/route.ts`
   - Now returns 410 Gone status
   - Includes deprecation notice with migration docs

### Environment Variables
```bash
CRON_SECRET                      # Required: Bearer token
SUPABASE_URL                     # Required: Supabase project URL
SUPABASE_SERVICE_ROLE_KEY        # Required: Service role key
SUPABASE_MANAGEMENT_API_TOKEN    # Optional: For real Disk IO metrics
SMTP_HOST                        # Optional: SMTP server
SMTP_PORT                        # Optional: SMTP port
SMTP_USER                        # Optional: SMTP username
SMTP_PASSWORD                    # Optional: SMTP password
SMTP_FROM_EMAIL                  # Optional: From email address
```

### Deploy & Test
```bash
# Deploy
supabase functions deploy alertas-disk-io

# Test manually
curl -X POST https://<project>.supabase.co/functions/v1/alertas-disk-io \
  -H "Authorization: Bearer $CRON_SECRET"
```

---

## ✅ Comment 2: Query Logging (>1s) with DEBUG_SUPABASE

### Files Modified
1. **ENHANCED** `src/lib/supabase/db-client.ts`
   - Added `logQuery<T>()` export
   - Added `logSlowQuery()` helper
   - Integrated DEBUG_SUPABASE flag
   - Logs when query > 1000ms AND DEBUG_SUPABASE=true

2. **ENHANCED** `src/lib/supabase/query-logger.ts`
   - `logQuery<T>()` - Basic wrapper
   - `logQueryPromise<T>()` - Promise decorator
   - `logBatchQueries()` - Monitor multiple queries
   - High-resolution timing via `process.hrtime.bigint()`
   - Customizable per-query thresholds

3. **CREATED** `src/lib/supabase/QUERY_LOGGING_GUIDE.md`
   - Complete integration guide
   - Usage examples and patterns
   - Troubleshooting tips

### Enable & Use
```bash
# Enable debug mode
export DEBUG_SUPABASE=true
npm run dev
```

```typescript
// In any repository
import { logQuery } from '@/lib/supabase/db-client';

export async function findUsuarios() {
  return logQuery('usuarios.findAll', async () => {
    const { data, error } = await supabase.from('usuarios').select('*');
    if (error) throw new Error(error.message);
    return data || [];
  });
}
```

### Console Output (when query > 1000ms)
```
[Supabase] Slow query (1234.56ms > 1000ms): usuarios.findAll
{
  queryName: 'usuarios.findAll',
  duration_ms: '1234.56',
  threshold_ms: 1000,
  timestamp: '2026-01-09T10:30:45.123Z'
}
```

---

## Implementation Checklist

### For Developers Integrating Query Logging

- [ ] Import `logQuery` in repository files
- [ ] Wrap database queries with `logQuery(name, () => query)`
- [ ] Use naming: `{table}.{operation}` (e.g., `usuarios.findById`)
- [ ] Set `DEBUG_SUPABASE=true` for local testing
- [ ] Monitor console for slow query warnings
- [ ] Create database indexes for identified slow queries

### For DevOps/Infrastructure

- [ ] Deploy Edge Function: `supabase functions deploy alertas-disk-io`
- [ ] Set environment variables (CRON_SECRET, SMTP, Management API token)
- [ ] Configure Supabase Cron Functions schedule (1h interval)
- [ ] Test Edge Function manually
- [ ] Monitor Edge Function logs in Supabase dashboard
- [ ] Set up email notifications for alerts

---

## Key Differences from Previous Implementation

| Aspect | Before | After |
|--------|--------|-------|
| **Disk IO Source** | RPC estimates | Management API (real) + RPC fallback |
| **Runtime** | Node.js (Next.js) | Deno (Edge Functions) |
| **Email Support** | N/A | SMTP configurable |
| **Cold Start** | Slower | Faster (edge runtime) |
| **Query Logging** | Manual/inconsistent | Automatic with logQuery helper |
| **Debug Control** | N/A | DEBUG_SUPABASE environment var |

---

## Related Documentation

- Full implementation details: `docs/IMPLEMENTATION_VERIFICATION_COMMENTS_2026-01-09.md`
- Query logging guide: `src/lib/supabase/QUERY_LOGGING_GUIDE.md`
- Architecture guidelines: `AGENTS.md`
- SQL style guide: `.cursor/rules/postgres-sql-style-guide.mdc`

---

## Troubleshooting

### Disk IO Edge Function not triggering?
1. Verify CRON_SECRET is set in Supabase
2. Check Edge Function logs in Supabase dashboard
3. Manually test with curl command above

### Queries not showing as slow?
1. Ensure DEBUG_SUPABASE=true is set
2. Verify query duration > 1000ms
3. Check NODE_ENV for context

### Management API metrics unavailable?
1. Edge Function falls back to RPC automatically
2. Check SUPABASE_MANAGEMENT_API_TOKEN is valid
3. Review Management API docs: https://supabase.com/docs/reference/management-api

---

**Last Updated**: 2026-01-09
**Status**: ✅ Ready for deployment and integration
