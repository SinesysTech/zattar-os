# Security Headers

Este documento descreve a implementação de headers HTTP de segurança no projeto.

## Visão Geral

O projeto implementa múltiplas camadas de segurança via headers HTTP para proteger contra:

- **XSS (Cross-Site Scripting)**: Content-Security-Policy com nonces
- **Clickjacking**: X-Frame-Options e frame-ancestors
- **MITM (Man-in-the-Middle)**: Strict-Transport-Security (HSTS)
- **MIME Sniffing**: X-Content-Type-Options
- **Information Disclosure**: Referrer-Policy
- **Feature Abuse**: Permissions-Policy

## Headers Implementados

### Content-Security-Policy (CSP)

O CSP controla quais recursos podem ser carregados pela aplicação.

**Diretivas configuradas:**

| Diretiva | Valor | Descrição |
|----------|-------|-----------|
| `default-src` | `'self'` | Padrão para recursos não especificados |
| `script-src` | `'self' 'nonce-{nonce}' 'strict-dynamic'` | Scripts permitidos |
| `style-src` | `'self' 'nonce-{nonce}' fonts.googleapis.com` | Estilos permitidos |
| `font-src` | `'self' fonts.gstatic.com data:` | Fontes permitidas |
| `img-src` | `'self' data: blob: [domínios]` | Imagens permitidas |
| `connect-src` | `'self' [APIs]` | Conexões XHR/WebSocket |
| `frame-src` | `'self' dyte.io` | Iframes permitidos |
| `media-src` | `'self' blob: [storage]` | Mídia permitida |
| `worker-src` | `'self' blob:` | Web Workers |
| `object-src` | `'none'` | Desabilita plugins |
| `frame-ancestors` | `'none'` | Previne embedding |

### Strict-Transport-Security (HSTS)

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

- **max-age**: 1 ano de cache
- **includeSubDomains**: Aplica a todos os subdomínios
- **preload**: Permite inclusão na lista de preload dos navegadores

### X-Frame-Options

```
X-Frame-Options: DENY
```

Previne que a aplicação seja carregada em iframes (proteção contra clickjacking).

### X-Content-Type-Options

```
X-Content-Type-Options: nosniff
```

Previne que o navegador interprete arquivos com MIME type diferente do declarado.

### Referrer-Policy

```
Referrer-Policy: strict-origin-when-cross-origin
```

Controla quanta informação de referrer é enviada em requisições.

### Permissions-Policy

Desabilita recursos do navegador não utilizados:

- `geolocation=()` - Geolocalização
- `camera=()` - Câmera (Dyte gerencia via getUserMedia)
- `microphone=()` - Microfone (Dyte gerencia via getUserMedia)
- `payment=()` - Payment Request API
- `usb=()` - WebUSB
- `magnetometer=()` - Magnetômetro
- `gyroscope=()` - Giroscópio
- `accelerometer=()` - Acelerômetro

## Domínios Confiáveis

### Supabase (Backend/API)
- `https://*.supabase.co`
- `wss://*.supabase.co`

### Backblaze B2 (Storage)
- `https://*.backblazeb2.com`
- `https://s3.us-east-005.backblazeb2.com`

### Google Fonts
- `https://fonts.googleapis.com`
- `https://fonts.gstatic.com`

### AI Services
- `https://api.openai.com`
- `https://api.cohere.ai`

### Dyte (Video Calls)
- `https://api.dyte.io`
- `https://dyte.io`
- `https://*.dyte.io`

### Imagens
- `https://images.unsplash.com`

## Nonces para Inline Scripts/Styles

O projeto usa nonces CSP para permitir scripts e estilos inline de forma segura.

### Como Funciona

1. O middleware gera um nonce único para cada requisição
2. O nonce é passado via header `x-nonce` e meta tag
3. Componentes usam o hook `useCSPNonce()` para acessar o nonce
4. Elementos `<style jsx>` incluem o atributo `nonce`

### Uso em Componentes

```tsx
import { useCSPNonce } from '@/hooks/use-csp-nonce';

function MyComponent() {
  const nonce = useCSPNonce();

  return (
    <div>
      <style jsx nonce={nonce}>{`
        .my-class {
          color: blue;
        }
      `}</style>
    </div>
  );
}
```

### Server Components

Em Server Components, obtenha o nonce dos headers:

```tsx
import { headers } from 'next/headers';

export default async function Page() {
  const headersList = await headers();
  const nonce = headersList.get('x-nonce') || undefined;

  return <ClientComponent nonce={nonce} />;
}
```

## Modo Report-Only vs Enforcement

### Report-Only (Padrão)

```bash
CSP_REPORT_ONLY=true
```

- Violações são **reportadas** mas **não bloqueadas**
- Ideal para validação inicial em produção
- Permite identificar recursos legítimos que seriam bloqueados

### Enforcement Mode

```bash
CSP_REPORT_ONLY=false
```

- Violações são **bloqueadas**
- Ativar apenas após validar que não há falsos positivos
- Recomendação: manter em report-only por pelo menos 1 semana

## Endpoint de Relatórios CSP

**Endpoint:** `POST /api/csp-report`

Recebe relatórios de violação CSP enviados automaticamente pelo navegador.

### Formato do Relatório

```json
{
  "csp-report": {
    "document-uri": "https://example.com/page",
    "violated-directive": "script-src",
    "blocked-uri": "https://malicious.com/script.js",
    "source-file": "https://example.com/app.js",
    "line-number": 42
  }
}
```

### Logs

Violações são logadas no console:

```
[CSP Violation] {
  "timestamp": "2024-01-15T10:30:00.000Z",
  "type": "CSP_VIOLATION",
  "data": {
    "documentUri": "https://example.com/page",
    "violatedDirective": "script-src",
    "blockedUri": "https://malicious.com/script.js"
  }
}
```

## Troubleshooting

### Recurso Bloqueado pelo CSP

1. Verifique os logs de violação em `/api/csp-report`
2. Identifique o recurso bloqueado na diretiva correspondente
3. Se for um recurso legítimo, adicione o domínio na configuração

### Adicionando Domínio Confiável

Edite `src/middleware/security-headers.ts`:

```typescript
const TRUSTED_DOMAINS = {
  // Adicione seu novo domínio na categoria apropriada
  meuservico: [
    'https://api.meuservico.com',
  ],
};
```

Depois, adicione na diretiva correspondente em `buildCSPDirectives()`.

### Estilo Inline Bloqueado

Se um `<style jsx>` estiver sendo bloqueado:

1. Importe o hook: `import { useCSPNonce } from '@/hooks/use-csp-nonce'`
2. Use o nonce: `const nonce = useCSPNonce()`
3. Adicione ao style: `<style jsx nonce={nonce}>`

### Desabilitando Temporariamente (Emergência)

Em caso de problemas críticos, você pode:

1. Definir `CSP_REPORT_ONLY=true` para modo report-only
2. Ou remover a aplicação de headers no middleware (não recomendado)

## Migração para Enforcement Mode

### Checklist

- [ ] CSP em report-only por pelo menos 1 semana em produção
- [ ] Analisar logs de violação em `/api/csp-report`
- [ ] Confirmar que todas as violações são de extensões de navegador ou falsos positivos
- [ ] Adicionar domínios legítimos que foram bloqueados
- [ ] Testar todas as funcionalidades principais:
  - [ ] Login e autenticação
  - [ ] Upload de arquivos
  - [ ] Chamadas de vídeo (Dyte)
  - [ ] Editor de documentos
  - [ ] Google Fonts carregando
  - [ ] KaTeX renderizando
  - [ ] Syntax highlighting funcionando

### Ativando Enforcement

```bash
# .env.local ou .env.production
CSP_REPORT_ONLY=false
```

### Monitoramento Pós-Ativação

- Monitore os logs de violação por anomalias
- Tenha um plano de rollback (voltar para report-only)
- Considere alertas para picos de violações

## Arquivos Relacionados

| Arquivo | Descrição |
|---------|-----------|
| `src/middleware/security-headers.ts` | Módulo principal de headers |
| `middleware.ts` | Integração com middleware Next.js |
| `src/app/api/csp-report/route.ts` | Endpoint de relatórios |
| `src/hooks/use-csp-nonce.ts` | Hook para nonces em componentes |
| `.env.example` | Variáveis de ambiente |

## Referências

- [MDN - Content-Security-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [MDN - Strict-Transport-Security](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security)
- [OWASP - HTTP Security Response Headers](https://owasp.org/www-project-secure-headers/)
- [Google - CSP Evaluator](https://csp-evaluator.withgoogle.com/)
- [HSTS Preload Submission](https://hstspreload.org/)
