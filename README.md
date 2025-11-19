This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Sistema de Cache Redis

### Visão Geral

Este projeto utiliza Redis como sistema de cache para otimizar consultas ao banco de dados Supabase (PostgreSQL). O cache reduz a latência de endpoints com alta frequência de acesso, como listagens de pendentes, audiências e acervo, melhorando a performance geral da aplicação. O sistema é implementado seguindo boas práticas de cache distribuído, com fallback automático para operação sem cache em caso de falhas.

### Configuração

As seguintes variáveis de ambiente são necessárias para configurar o Redis:

- `REDIS_URL`: URL de conexão do Redis (formato: `redis://[:password@]host:port`)
- `REDIS_PASSWORD`: Senha do Redis (se necessário)
- `ENABLE_REDIS_CACHE`: Habilita/desabilita o cache Redis (`true`/`false`)
- `REDIS_CACHE_TTL`: TTL padrão do cache em segundos (ex: `600` para 10 minutos)
- `REDIS_CACHE_MAX_MEMORY`: Memória máxima do Redis (ex: `256mb`, `1gb`)

Configure essas variáveis no arquivo `.env` ou no ambiente de produção.

### Arquitetura

O sistema segue o padrão **Cache-Aside** (Lazy Loading), onde:

- Dados são buscados primeiro no cache Redis.
- Em caso de cache miss, a consulta é executada no banco de dados e o resultado é armazenado no cache.
- A invalidação é inteligente e baseada em eventos de modificação (ex: após atualizar um registro, o cache relacionado é limpo).
- Utilitários genéricos em `lib/redis/` facilitam a reutilização em diferentes módulos.

### TTLs

Os TTLs (Time To Live) variam por tipo de dado para otimizar eficiência:

- **Listagens dinâmicas** (pendentes, audiências, acervo): 10 minutos (600s)
- **Dados auxiliares** (usuários, clientes, contratos, tipos de expedientes, cargos): 15-30 minutos
- **Dados estáveis** (classes judiciais, tipos de audiência, salas de audiência, órgãos julgadores): 1 hora (3600s)

### Monitoramento

- **Endpoint `/api/cache/stats`**: Retorna estatísticas do Redis, como memória usada, número de chaves, uptime, hits e misses. Requer autenticação.
- **Endpoint `/api/cache/clear`**: Permite limpeza manual do cache (total ou por padrão). Requer permissões de administrador.

### Desenvolvimento

Para desabilitar o cache localmente durante desenvolvimento, defina `ENABLE_REDIS_CACHE=false` no `.env`. Isso permite testar funcionalidades sem dependência do Redis. Certifique-se de que o Redis esteja rodando localmente ou em um container Docker para testes.

### Troubleshooting

- **Problema**: Cache não está sendo usado. **Solução**: Verifique se `ENABLE_REDIS_CACHE=true` e se o Redis está acessível via `REDIS_URL`.
- **Problema**: Dados desatualizados no cache. **Solução**: Use o endpoint `/api/cache/clear` para limpar manualmente ou aguarde o TTL expirar.
- **Problema**: Erro de conexão com Redis. **Solução**: Confirme credenciais e disponibilidade do servidor Redis. O sistema tem fallback automático.
- **Problema**: Memória do Redis esgotada. **Solução**: Ajuste `REDIS_CACHE_MAX_MEMORY` ou configure políticas de eviction no Redis.

Para mais detalhes, consulte a [documentação do Redis](https://redis.io/documentation) e a [documentação do ioredis](https://github.com/redis/ioredis).
