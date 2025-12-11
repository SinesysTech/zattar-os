# 🏗️ Arquitetura Sinesys 2.0: AI-First Standard

**Versão:** 2.0 (Integrated MCP Edition)
**Status:** Canonical

Esta é a documentação definitiva da **Arquitetura Sinesys 2.0**. Ela foi projetada para ser seguida rigorosamente por desenvolvedores humanos e agentes de IA, garantindo que o sistema seja, ao mesmo tempo, um produto robusto e uma plataforma de agentes.

---

## 1. Princípios Fundamentais (The AI-First Manifesto)

1. **Contexto é Soberano:** O código é organizado para minimizar a "janela de contexto" necessária para entender uma funcionalidade. Features são ilhas autossuficientes.
2. **Schema como Contrato:** Zod Schemas (`zod`) não são apenas validação; são a definição da verdade para o Banco de Dados, Formulários React e Ferramentas de IA (MCP).
3. **Dual-Use Actions:** Toda Server Action deve ser projetada para ser consumida por uma Interface Humana (UI) E por um Agente de IA (MCP) sem modificação de código.
4. **Introspecção Nativa (RAG):** O sistema se auto-indexa. Todo dado criado gera um vetor de conhecimento acessível via busca semântica.
5. **MCP Integrado:** O servidor MCP não é um processo separado. Ele roda dentro do runtime do Next.js, expondo as funcionalidades do sistema como ferramentas via API Routes.

---

## 2. Estrutura de Diretórios Global

A raiz do projeto é limpa, eliminando pastas legadas.

```text
src/
├── app/                  # Roteamento (Next.js App Router)
│   ├── (dashboard)/      # Rotas de UI protegidas
│   ├── api/              # Endpoints REST
│   │   └── mcp/          # 🆕 Endpoint do Servidor MCP (SSE)
│   └── layout.tsx        # Shell da Aplicação
│
├── features/             # 🏝️ Módulos de Negócio (Feature-Sliced)
│   ├── processos/
│   ├── financeiro/
│   └── [feature]/
│
├── lib/                  # Infraestrutura Compartilhada
│   ├── ai/               # 🧠 Núcleo de IA (Embedding, RAG)
│   ├── db/               # Cliente Supabase & Schema
│   ├── mcp/              # 🔌 Configuração do Servidor MCP Integrado
│   └── safe-action.ts    # Wrapper para Server Actions
│
├── components/           # UI Compartilhada (Design System)
│   └── ui/               # shadcn/ui primitives
│
└── types/                # Tipos Globais (apenas o essencial)
```

---

## 3. O Padrão de Feature (The Feature Pod)

Cada pasta dentro de `features/` deve seguir estritamente esta anatomia. A IA deve ser instruída a **nunca** desviar deste padrão.

Exemplo: `src/features/processos/`

```text
src/features/processos/
├── components/           # UI Components (Client-side)
│   ├── processo-form.tsx # Usa os Schemas de types.ts
│   └── timeline.tsx
│
├── server/               # 🔒 Lógica de Servidor (Server-side Only)
│   ├── actions.ts        # Server Actions (Entrypoints)
│   ├── service.ts        # Regras de Negócio Puras
│   └── repository.ts     # Acesso ao DB (Supabase)
│
├── types.ts              # 📜 Fonte da Verdade (Zod Schemas + TS Types)
├── utils.ts              # Helpers locais
└── RULES.md              # 🧠 Contexto em Linguagem Natural para IA
```

### 3.1. `RULES.md` (Contexto Local)

Arquivo obrigatório em cada feature. Contém regras que não são óbvias no código.

> **Exemplo:** "Ao arquivar um processo, verificar se existem custas pendentes. Se houver, bloquear a ação e sugerir a criação de um boleto."

### 3.2. `types.ts` (Schema-First)

Define os dados antes de qualquer lógica.

```typescript
import { z } from "zod";

export const ProcessoSchema = z.object({
  numero: z.string().min(20),
  parte_autora: z.string(),
  // ...
});

// Input para criação (usado no Form E na Tool da IA)
export const CriarProcessoInput = ProcessoSchema.pick({
  numero: true,
  parte_autora: true
});

export type CriarProcessoInput = z.infer<typeof CriarProcessoInput>;
```

### 3.3. `server/actions.ts` (Dual-Use Pattern)

As Actions usam um wrapper (`actionClient` ou `createSafeAction`) que garante tipagem e tratamento de erro padronizado.

```typescript
'use server'
import { authenticatedAction } from "@/lib/safe-action";
import { CriarProcessoInput } from "../types";
import { criarProcessoService } from "./service";

// Esta action é importada pelo React E pelo registro do MCP
export const criarProcessoAction = authenticatedAction(
  CriarProcessoInput, // Zod valida entrada automaticamente
  async (data, { user }) => {
    const processo = await criarProcessoService(data, user.id);
    return {
      message: `Processo ${processo.numero} criado.`,
      processo_id: processo.id
    };
  }
);
```

---

## 4. Integração MCP Nativa (The Internal Bridge)

Em vez de um processo Node.js separado, o MCP roda como uma **Route Handler** do Next.js. Isso permite que agentes externos (como Claude Desktop ou IDEs) se conectem ao Sinesys.

### 4.1. Registry de Ferramentas (`src/lib/mcp/registry.ts`)

Arquivo central que importa as actions das features e as converte em Tools MCP.

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
// Importando Actions das Features
import { criarProcessoAction } from "@/features/processos/server/actions";
import { CriarProcessoInput } from "@/features/processos/types";

export const mcpServer = new McpServer({
  name: "Sinesys API",
  version: "2.0.0"
});

// Função para registrar todas as tools
export function registerTools() {
  // Tool: Criar Processo
  mcpServer.tool(
    "criar_processo",
    "Cria um novo processo jurídico no acervo",
    CriarProcessoInput.shape, // Usa o Zod Schema da feature!
    async (args) => {
      // Chama a mesma Server Action que a UI usa
      const result = await criarProcessoAction(args);
      if (!result?.data) throw new Error(result?.serverError || "Erro desconhecido");

      return {
        content: [{ type: "text", text: JSON.stringify(result.data) }]
      };
    }
  );

  // ... registrar outras tools
}
```

### 4.2. O Endpoint SSE (`src/app/api/mcp/route.ts`)

Expõe o servidor via Server-Sent Events (SSE) para conexão.

```typescript
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { mcpServer, registerTools } from "@/lib/mcp/registry";

// Inicializa tools na primeira chamada
registerTools();

export async function GET(req: Request) {
  const transport = new SSEServerTransport("/api/mcp/messages", res);
  await mcpServer.connect(transport);
  // ... lógica de stream SSE padrão do SDK MCP
}

export async function POST(req: Request) {
  // Lógica para receber mensagens do cliente MCP e rotear para o transport
}
```

---

## 5. Camada de Inteligência e RAG (`src/lib/ai`)

O sistema não apenas armazena dados, ele gera conhecimento vetorial automaticamente.

### 5.1. Estrutura

```text
src/lib/ai/
├── embedding.ts      # Gera vetores (OpenAI/Cohere)
├── indexing.ts       # Pipeline de ingestão (Chunking -> Vector DB)
└── retrieval.ts      # Busca semântica (usada pelos Agentes)
```

### 5.2. Pipeline de "Conhecimento Vivo"

Sempre que uma Action de mutação (Criar/Editar) é chamada em uma feature, ela deve disparar a reindexação de forma assíncrona.

**Exemplo em `src/features/pecas/server/service.ts`:**

```typescript
import { after } from "next/server"; // Next.js 15+ async execution
import { indexarDocumento } from "@/lib/ai/indexing";

export async function salvarPeca(dados: any) {
  const peca = await db.insert(pecas).values(dados);

  // ⚡ Fire-and-forget: Não trava a resposta para o usuário
  after(async () => {
    await indexarDocumento({
      texto: await extrairTextoPDF(peca.url),
      metadata: { tipo: 'peca', id: peca.id, processoId: peca.processo_id }
    });
  });

  return peca;
}
```

---

## 6. Fluxo de Desenvolvimento AI-First (Instruções para o Agente de Código)

Quando você (humano) pedir para a IA (Cursor/Windsurf/Gemini) criar uma nova funcionalidade, ela deve seguir estritamente esta ordem de operações:

**Passo 1: Entendimento (Contexto)**

- Ler `src/features/{modulo}/RULES.md`.
- Se o arquivo não existir, criá-lo com as regras de negócio inferidas.

**Passo 2: Definição de Dados (Schema)**

- Criar/Atualizar `src/features/{modulo}/types.ts`.
- Definir Zod Schemas para as Entidades e para os Inputs das Actions.

**Passo 3: Lógica e Ferramental (Server)**

- Implementar `repository.ts` (Queries SQL).
- Implementar `service.ts` (Regras de negócio).
- Implementar `actions.ts` (Exposição segura).
- **Crucial:** Ir em `src/lib/mcp/registry.ts` e registrar a nova action como uma Tool.

**Passo 4: Interface (UI)**

- Criar componentes em `components/` usando os tipos exportados no Passo 2.
- Conectar componentes às actions do Passo 3.

---

## 7. Comandos de Manutenção

- **`npm run mcp:check`**: Script que verifica se todas as Server Actions exportadas possuem uma entrada correspondente no `registry.ts` (garante que a IA sempre tenha acesso ao que o humano tem).
- **`npm run ai:reindex`**: Script para varrer o banco e regenerar embeddings (caso mude o modelo de IA).

---

## 8. Features Atuais

### Módulos Migrados para Feature-Sliced Design

| Feature | Path | Status |
|---------|------|--------|
| Acervo | `features/acervo/` | ✅ Completo |
| Advogados | `features/advogados/` | ✅ Completo |
| Assinatura Digital | `features/assinatura-digital/` | ✅ Completo |
| Assistentes | `features/assistentes/` | ✅ Completo |
| Audiências | `features/audiencias/` | ✅ Completo |
| Captura | `features/captura/` | ✅ Completo |
| Cargos | `features/cargos/` | ✅ Completo |
| Chat | `features/chat/` | ✅ Completo |
| Contratos | `features/contratos/` | ✅ Completo |
| Dashboard | `features/dashboard/` | ✅ Completo |
| Documentos | `features/documentos/` | ✅ Completo |
| Endereços | `features/enderecos/` | ✅ Completo |
| Expedientes | `features/expedientes/` | ✅ Completo |
| Financeiro | `features/financeiro/` | ✅ Completo |
| Obrigações | `features/obrigacoes/` | ✅ Completo |
| Partes | `features/partes/` | ✅ Completo |
| Perfil | `features/perfil/` | ✅ Completo |
| Processos | `features/processos/` | ✅ Completo |
| Repasses | `features/repasses/` | ✅ Completo |
| RH | `features/rh/` | ✅ Completo |
| Tipos Expedientes | `features/tipos-expedientes/` | ✅ Completo |
| Usuários | `features/usuarios/` | ✅ Completo |

---

## 9. Infraestrutura (`src/lib/`)

### Componentes Atuais

| Módulo | Path | Descrição |
|--------|------|-----------|
| Supabase | `lib/supabase/` | Cliente e helpers para Supabase |
| Redis | `lib/redis/` | Cache e sessões |
| Auth | `lib/auth/` | Autenticação e autorização |
| Storage | `lib/storage/` | Upload e gerenciamento de arquivos |
| Logger | `lib/logger/` | Sistema de logs estruturados |
| Utils | `lib/utils/` | Utilitários compartilhados |
| CopilotKit | `lib/copilotkit/` | Integração com AI assistants |
| MongoDB | `lib/mongodb/` | Conexão com MongoDB |
| YJS | `lib/yjs/` | Colaboração em tempo real |

### Planejados (Arquitetura 2.0)

| Módulo | Path | Descrição |
|--------|------|-----------|
| AI | `lib/ai/` | 🔮 Embeddings, RAG, busca semântica |
| MCP | `lib/mcp/` | 🔮 Servidor MCP integrado |

---

## 10. Referência Rápida

### Imports Padronizados

```typescript
// ✅ Features
import { ClientesTable, actionListarClientes } from "@/features/partes";
import { listarProcessos, type Processo } from "@/features/processos";

// ✅ Componentes UI
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/shared/page-shell";

// ✅ Infraestrutura
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

// ❌ NUNCA usar (removidos)
// import { ... } from "@/backend/...";
// import { ... } from "@/app/_lib/...";
```

### Checklist Nova Feature

- [ ] Criar estrutura em `src/features/{modulo}/`
- [ ] Definir `types.ts` com Zod Schemas
- [ ] Implementar `repository.ts` (acesso a dados)
- [ ] Implementar `service.ts` (lógica de negócio)
- [ ] Criar Server Actions em `actions/`
- [ ] Criar componentes em `components/`
- [ ] Exportar via `index.ts` (barrel)
- [ ] Criar `RULES.md` com regras de negócio
- [ ] Registrar no MCP Registry (quando implementado)
- [ ] Criar página em `app/(dashboard)/{modulo}/`
- [ ] Testar responsividade

---

Esta instrução serve como o "Manual de Operações" da arquitetura Sinesys. Referencie este arquivo nas regras do seu editor de código (ex: `.cursorrules`, `.windsurfrules`).
