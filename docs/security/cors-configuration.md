# Configuracao CORS

## Visao Geral

O sistema utiliza uma configuracao CORS (Cross-Origin Resource Sharing) baseada em whitelist dinamica para controlar quais origens podem fazer requisicoes aos endpoints da API.

## Arquitetura

### Modulo Central

O modulo de configuracao CORS esta localizado em:

```
src/lib/cors/config.ts
```

Este modulo exporta:

- `getAllowedOrigins()` - Retorna lista de origens permitidas
- `isAllowedOrigin(origin)` - Verifica se uma origem e permitida
- `getCorsHeaders(origin)` - Retorna headers CORS para respostas
- `getPreflightCorsHeaders(origin)` - Retorna headers CORS completos para preflight
- `getCorsConfig()` - Retorna configuracao completa
- `ALLOWED_METHODS` - Metodos HTTP permitidos
- `ALLOWED_HEADERS` - Headers permitidos
- `MAX_AGE` - Tempo de cache para preflight (24h)

### Endpoints Protegidos

| Endpoint | Arquivo |
|----------|---------|
| `/api/mcp` | `src/app/api/mcp/route.ts` |
| `/api/mcp/stream` | `src/app/api/mcp/stream/route.ts` |
| `/api/csp-report` | `src/app/api/csp-report/route.ts` |
| Edge Function: indexar-documentos | `supabase/functions/indexar-documentos/index.ts` |
| Edge Function: alertas-disk-io | `supabase/functions/alertas-disk-io/index.ts` |
| Backblaze B2 Bucket | `scripts/storage/configure-backblaze-bucket.ts` |

## Configuracao

### Variaveis de Ambiente

#### ALLOWED_ORIGINS

Lista de origens permitidas, separadas por virgula.

```bash
# .env.local (desenvolvimento)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# .env (producao)
ALLOWED_ORIGINS=https://zataradvogados.com,https://app.zataradvogados.com
```

### Origens Padrao

Quando `ALLOWED_ORIGINS` nao esta definida, as seguintes origens sao permitidas:

- `http://localhost:3000` - Desenvolvimento local
- `http://localhost:3001` - Porta alternativa de desenvolvimento
- URL do Supabase (se `NEXT_PUBLIC_SUPABASE_URL` estiver definida)

### Wildcards para Subdominios

E possivel usar wildcards para permitir todos os subdominios:

```bash
ALLOWED_ORIGINS=*.zataradvogados.com
```

Isso permite:
- `https://api.zataradvogados.com`
- `https://app.zataradvogados.com`
- `https://staging.zataradvogados.com`

**Importante**: O wildcard `*.example.com` NAO permite `https://example.com` (sem subdominio).

## Uso nos Endpoints

### Next.js API Routes

```typescript
import { getCorsHeaders, getPreflightCorsHeaders } from '@/lib/cors/config';

// OPTIONS (Preflight)
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const corsHeaders = getPreflightCorsHeaders(origin);

  return new NextResponse(null, { headers: corsHeaders });
}

// POST
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  // ... processar requisicao ...

  return NextResponse.json(data, { headers: corsHeaders });
}
```

### Supabase Edge Functions

Edge Functions nao podem importar de `src/lib`, entao a logica e duplicada localmente:

```typescript
function getCorsHeaders(origin: string | null): Record<string, string> {
  const defaultOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    Deno.env.get('NEXT_PUBLIC_SUPABASE_URL') || '',
  ].filter(Boolean);

  const envOrigins = Deno.env.get('ALLOWED_ORIGINS');
  const allowedOrigins = envOrigins
    ? envOrigins.split(',').map((o) => o.trim()).filter(Boolean)
    : defaultOrigins;

  if (origin && allowedOrigins.includes(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
      'Vary': 'Origin',
      // ... outros headers
    };
  }

  return { /* headers basicos sem CORS */ };
}
```

Configure `ALLOWED_ORIGINS` no Supabase Dashboard:
**Functions > Environment Variables**

## Troubleshooting

### Erro: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Causa**: A origem da requisicao nao esta na whitelist.

**Solucao**:
1. Verifique a origem exata no console do navegador
2. Adicione a origem em `ALLOWED_ORIGINS`
3. Reinicie o servidor de desenvolvimento

### Erro: "CORS policy: The 'Access-Control-Allow-Origin' header contains multiple values"

**Causa**: Headers CORS duplicados (ex: middleware + rota).

**Solucao**:
1. Verifique se o middleware nao esta adicionando headers CORS
2. Use `Vary: Origin` para cache correto

### Erro: "CORS preflight channel did not succeed"

**Causa**: Metodo OPTIONS nao implementado ou retornando erro.

**Solucao**:
1. Verifique se a rota exporta `OPTIONS`
2. Verifique se `OPTIONS` retorna status 2xx

### Requisicoes SSE (Server-Sent Events) bloqueadas

**Causa**: Headers CORS nao incluidos na resposta de stream.

**Solucao**:
```typescript
return new Response(stream, {
  headers: {
    'Content-Type': 'text/event-stream',
    ...getCorsHeaders(origin),
  },
});
```

## Seguranca

### Boas Praticas

1. **Nunca use `*` em producao** - Sempre defina origens especificas
2. **Valide protocolo** - `http://` e `https://` sao origens diferentes
3. **Valide porta** - `localhost:3000` e `localhost:3001` sao diferentes
4. **Use Vary: Origin** - Previne problemas de cache com CDNs
5. **Credentials** - So inclua quando necessario para cookies/auth

### O que NAO fazer

```typescript
// ERRADO - Permite qualquer origem
headers: { 'Access-Control-Allow-Origin': '*' }

// ERRADO - Reflete origem sem validacao
headers: { 'Access-Control-Allow-Origin': request.headers.get('origin') }

// ERRADO - Regex muito permissivo
const isAllowed = /example\.com/.test(origin); // Permite evil-example.com
```

### Ataques Prevenidos

- **CSRF** - Origens nao autorizadas nao podem fazer requisicoes
- **Data Exfiltration** - Dados nao sao enviados para origens maliciosas
- **XSS Impact Reduction** - Scripts injetados nao acessam APIs de outras origens

## Testes

### Executar Testes Unitarios

```bash
npm run test -- src/lib/cors
```

### Executar Testes de Integracao

```bash
npm run test:integration -- cors
```

### Teste Manual com cURL

```bash
# Preflight (OPTIONS)
curl -X OPTIONS http://localhost:3000/api/mcp \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -v

# Requisicao com origem permitida
curl -X POST http://localhost:3000/api/mcp \
  -H "Origin: http://localhost:3000" \
  -H "Content-Type: application/json" \
  -d '{"method": "tools/list"}' \
  -v

# Requisicao com origem NAO permitida (deve falhar no browser)
curl -X POST http://localhost:3000/api/mcp \
  -H "Origin: https://malicious.com" \
  -H "Content-Type: application/json" \
  -d '{"method": "tools/list"}' \
  -v
```

## Backblaze B2 CORS

O bucket B2 tambem usa whitelist de origens. Para atualizar:

```bash
# Definir ALLOWED_ORIGINS no .env.local
ALLOWED_ORIGINS=https://zataradvogados.com,http://localhost:3000

# Executar script de configuracao
tsx scripts/storage/configure-backblaze-bucket.ts
```

## Checklist de Deploy

- [ ] `ALLOWED_ORIGINS` definida no ambiente de producao
- [ ] Dominio de producao incluido na whitelist
- [ ] Edge Functions configuradas com `ALLOWED_ORIGINS`
- [ ] Bucket B2 configurado com origens de producao
- [ ] Testes de CORS passando em staging
- [ ] Validacao manual com DevTools do navegador
