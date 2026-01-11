# Armazenamento Seguro (Secure Storage)

## Visão Geral
Sistema de criptografia para dados sensíveis no `localStorage` usando Web Crypto API (AES-GCM).

## Uso

### Hook `useSecureStorage`

```ts
import { useSecureStorage } from "@/hooks/use-secure-storage";

const [value, setValue, state] = useSecureStorage(
  "chat-notifications",
  [],
  { migrateFromPlaintext: true, ttl: 7 * 24 * 60 * 60 * 1000 }
);
```

- `value`: valor atual
- `setValue`: setter (aceita valor direto ou função `(prev) => next`)
- `state.isLoading`: carregando/migrando
- `state.error`: erro de criptografia/descriptografia (sem expor dados)

### Dados criptografados
- Notificações de chat (`chat-notifications`)
- Contadores de mensagens não lidas (`chat-unread-counts`)
- Preferências de layout de chamadas (`call-layout`)

## Segurança

### Algoritmo
- AES-GCM (256 bits)
- PBKDF2 (100.000 iterações, SHA-256)
- Salt aleatório por usuário
- IV único por operação

### Chave de criptografia
Derivada de: `user.id` + `salt`.

### Formato do payload

```
enc:{version}:{salt_base64}:{iv_base64}:{ciphertext_base64}:{timestamp}
```

### TTL (Time-to-Live)
Dados expiram após 7 dias e são removidos automaticamente na leitura e na inicialização da aplicação.

## Migração
Dados plaintext existentes são migrados automaticamente na primeira leitura quando `migrateFromPlaintext=true`.

## Limpeza
- Logout remove automaticamente os dados (`useAuth.logout`).
- Inicialização remove expirados via `clearExpiredSecureStorage()`.

## Troubleshooting
- **`Web Crypto API indisponível`**: ambiente sem `crypto.subtle` (ex: browser antigo ou execução fora do contexto do navegador).
- **Dados resetados para o valor inicial**: geralmente indica payload expirado/corrompido; a chave é removida do storage.
