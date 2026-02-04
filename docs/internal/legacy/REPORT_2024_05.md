# Relatório de Revisão Arquitetural e Otimização

**Data:** 2024-05-22
**Projeto:** Zattar Advogados - Sinesys App
**Versão:** Next.js 16 / React 19

## 1. Resumo Executivo

A revisão identificou uma base sólida utilizando tecnologias modernas (Next.js 16, Supabase, Redis, IA). No entanto, foi detectada uma **vulnerabilidade crítica de segurança** no módulo principal (`processos`), onde as Server Actions estão expostas publicamente sem verificação de autenticação e utilizam um cliente de banco de dados que ignora as regras de segurança (RLS). Além disso, há inconsistências arquiteturais onde alguns módulos seguem o padrão seguro (`authenticatedAction`) e outros não.

## 2. Auditoria de Segurança (Crítico)

### 2.1. Server Actions Expostas em `processos`
- **Problema**: O arquivo `src/features/processos/actions/index.ts` exporta Server Actions (`actionCriarProcesso`, `actionAtualizarProcesso`, etc.) que não implementam nenhuma verificação de autenticação.
- **Evidência**: Diferente de outros módulos (ex: `enderecos`, `partes`), este arquivo não utiliza o wrapper `authenticatedAction` definido em `src/lib/safe-action.ts`.
- **Risco**: Qualquer usuário (mesmo anônimo) pode enviar requisições POST para estas ações e criar/modificar/listar processos, contanto que saiba o ID da ação (que é público no bundle do cliente).

### 2.2. Bypass de RLS (Row Level Security)
- **Problema**: O repositório de processos (`src/features/processos/repository.ts`) utiliza `createDbClient` para todas as operações.
- **Análise**: O arquivo `src/lib/supabase/db-client.ts` configura este cliente explicitamente com a `SUPABASE_SECRET_KEY` (Service Role), o que **ignora todas as políticas de RLS** do Supabase.
- **Impacto**: Como a camada de Serviço não implementa verificações manuais de permissão (ex: "usuário X é dono do processo Y"), e o banco não pode aplicar RLS (pois o cliente é admin), não há barreira de segurança eficaz para operações de dados neste módulo.

**Recomendação Imediata**:
1. Refatorar `src/features/processos/actions/index.ts` para usar `authenticatedAction`.
2. Alterar o repositório para aceitar um cliente Supabase opcional (contextual), permitindo passar o cliente autenticado (SSR) que respeita RLS.

## 3. Revisão Arquitetural

### 3.1. Inconsistência de Padrões
- O projeto define um padrão claro em `ARCHITECTURE.md` ("Safe Action Wrapper"), mas a implementação no módulo `processos` desvia deste padrão. Isso sugere que o módulo principal pode ser legado ou foi refatorado parcialmente.

### 3.2. Gerenciamento de Cliente Supabase
- **Ponto de Atenção**: Em `repository.ts`, a função `createDbClient()` é chamada dentro de cada método (ex: `findProcessoById`). Isso cria uma nova instância do cliente Supabase a cada chamada.
- **Otimização**: Utilizar o singleton `getDbClient()` (já existente em `db-client.ts`) ou injetar o cliente como dependência para permitir melhor testabilidade e controle transacional.

## 4. Otimização e Performance

### 4.1. Caching (Redis)
- **Positivo**: O uso de Redis para cache manual (`src/lib/redis/cache-utils.ts`) é robusto e bem implementado, com invalidação correta via `revalidatePath` e `deletePattern`.
- **Oportunidade**: Integrar as tags de cache do Next.js (`unstable_cache`) com o Redis para permitir que o Next.js gerencie a revalidação de forma mais nativa, embora a solução atual seja funcional.

### 4.2. Middleware (`middleware.ts`)
- **Ponto de Atenção**: O middleware realiza verificações de bloqueio de IP e chamadas `auth.getUser()` em (quase) todas as requisições.
- **Impacto**: Isso adiciona latência ao TTFB (Time To First Byte).
- **Sugestão**: Considerar mover a lógica pesada de bloqueio de IP para a camada de Edge (se estiver usando Vercel/Cloudflare) ou simplificar a verificação de sessão (ex: validar apenas JWT sem chamar `getUser` para rotas não-críticas, ou usar cache de sessão).

### 4.3. Next.js 16 & Server Components
- O projeto faz bom uso de Server Components e `await cookies()`, alinhado com Next.js 15/16.
- A configuração `serverActions: { bodySizeLimit: "50mb" }` em `next.config.ts` é adequada para uploads.

## 5. Conclusão

A arquitetura geral é moderna e bem estruturada (Feature-Sliced Design), mas a falha de segurança no módulo `processos` compromete a integridade do sistema. A correção deste ponto é prioritária sobre qualquer otimização de performance.
