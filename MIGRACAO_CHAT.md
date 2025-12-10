# Plano de Migração do Sistema de Chat Legado

## Status: Em Andamento

Este documento registra o plano de migração do sistema de chat legado para a nova arquitetura baseada em `src/core/chat`.

## Arquitetura Alvo

### Nova Arquitetura (Recomendada)
- **Domain Layer**: `src/core/chat/domain.ts` - Tipos e schemas
- **Repository**: `src/core/chat/repository.ts` - Acesso a dados com Result pattern
- **Service**: `src/core/chat/service.ts` - Lógica de negócio
- **Actions**: `src/app/actions/chat.ts` - Server Actions para Next.js
- **Components**: 
  - `src/components/modules/chat/chat-layout.tsx` - Layout geral
  - `src/components/modules/chat/chat-window.tsx` - Janela de mensagens
  - `src/components/modules/chat/chat-sidebar.tsx` - Lista de salas
  - `src/components/modules/chat/room-list.tsx` - Lista de salas (UI)

### Arquitetura Legada (Depreciada)
- **Hooks**: `src/hooks/use-realtime-chat.tsx` ⚠️ DEPRECADO
- **Components**: 
  - `src/components/realtime-chat.tsx` ⚠️ DEPRECADO
  - `src/components/chat/chat-interface.tsx` ⚠️ USO INTERMEDIÁRIO
  - `src/components/documentos/document-chat.tsx` ⚠️ USO INTERMEDIÁRIO
  - `src/components/chat/chat-message-with-files.tsx` - Pode ser migrado
  - `src/components/chat-message.tsx` - Pode ser migrado
- **Backend**: `backend/documentos/services/persistence/chat-persistence.service.ts` ⚠️ DEPRECADO
- **API Routes**: 
  - `src/app/api/chat/salas/route.ts` ⚠️ DEPRECADO
  - `src/app/api/chat/salas/[id]/route.ts` - Parcialmente necessário
  - `src/app/api/chat/salas/[id]/mensagens/route.ts` ⚠️ DEPRECADO

## Consumidores Identificados

### 1. Importações de `use-realtime-chat.tsx` (APENAS TIPO)
- ✅ `src/components/chat/chat-interface.tsx` - Usa apenas tipo `ChatMessage`
- ✅ `src/components/chat/chat-message-with-files.tsx` - Usa apenas tipo `ChatMessage`
- ✅ `src/components/chat-message.tsx` - Usa apenas tipo `ChatMessage`
- ✅ `src/components/documentos/document-chat.tsx` - Usa apenas tipo `ChatMessage`

**Ação**: Mover tipo `ChatMessage` para `src/core/chat/domain.ts` e atualizar imports.

### 2. Importações de `realtime-chat.tsx` (COMPONENTE)
- ⚠️ `src/components/chat/chat-interface.tsx` - Usa componente `RealtimeChat`
- ⚠️ `src/components/documentos/document-chat.tsx` - Usa componente `RealtimeChat`

**Ação**: Refatorar para usar `ChatWindow` da nova arquitetura.

### 3. Importações de `chat-persistence.service.ts` (BACKEND LEGADO)
- ⚠️ `src/app/api/chat/salas/route.ts` - Usa `listarSalasChat`, `criarSalaChat`, `buscarSalaGeral`
- ⚠️ `src/app/api/chat/salas/[id]/route.ts` - Usa `buscarSalaChatPorId`, `deletarSalaChat`, `atualizarSalaChatNome`
- ⚠️ `src/app/api/chat/salas/[id]/mensagens/route.ts` - Usa `listarMensagensChat`, `criarMensagemChat`, etc.

**Ação**: Migrar rotas para Server Actions ou manter apenas para compatibilidade retroativa.

### 4. Consumidor Ativo Principal
- ✅ `src/components/documentos/document-editor.tsx` - Importa `DocumentChat`

**Ação**: Criar novo componente de chat de documento baseado na nova arquitetura.

## Fases da Migração

### Fase 1: Preparação e Tipagem ✅ CONCLUÍDA
- [x] Criar nova arquitetura em `src/core/chat`
- [x] Implementar Repository, Service, Actions
- [x] Criar componentes base (`ChatWindow`, `ChatLayout`, `ChatSidebar`)
- [x] Adicionar constraints de unicidade no banco de dados

### Fase 2: Migração de Tipos (PRÓXIMA)
- [ ] Mover tipo `ChatMessage` para `src/core/chat/domain.ts`
- [ ] Criar tipo `MensagemComUsuario` equivalente
- [ ] Atualizar imports em:
  - [ ] `src/components/chat/chat-interface.tsx`
  - [ ] `src/components/chat/chat-message-with-files.tsx`
  - [ ] `src/components/chat-message.tsx`
  - [ ] `src/components/documentos/document-chat.tsx`

### Fase 3: Migração de Componentes
- [ ] Criar `DocumentChatWindow` baseado na nova arquitetura
- [ ] Atualizar `document-editor.tsx` para usar novo componente
- [ ] Depreciar `DocumentChat` antigo
- [ ] Avaliar migração de `chat-interface.tsx` ou deprecação completa

### Fase 4: Migração de API Routes (Opcional)
- [ ] Analisar se API routes ainda são necessárias (podem ser substituídas por Server Actions)
- [ ] Se necessárias, refatorar para usar `ChatRepository` e `ChatService`
- [ ] Se desnecessárias, remover e atualizar consumidores para Server Actions

### Fase 5: Limpeza Final
- [ ] Remover `src/hooks/use-realtime-chat.tsx`
- [ ] Remover `src/components/realtime-chat.tsx`
- [ ] Remover `backend/documentos/services/persistence/chat-persistence.service.ts`
- [ ] Remover API routes depreciadas
- [ ] Atualizar documentação do projeto

## Notas Importantes

### Compatibilidade de Realtime
A nova arquitetura usa **Supabase Realtime** da mesma forma que o sistema legado. A migração é principalmente arquitetural, não funcional.

### Convenções de Nomenclatura
- **Legado**: `sala_id`, `usuario_id`, `created_at` (snake_case)
- **Novo**: `salaId`, `usuarioId`, `createdAt` (camelCase no TypeScript)
- Conversão automática via `fromSnakeToCamel` e `fromCamelToSnake`

### Tipo ChatMessage
```typescript
// Legado (use-realtime-chat.tsx)
interface ChatMessage {
  id: string;
  content: string;
  user: { id?: number; name: string };
  createdAt: string;
}

// Novo (domain.ts) - Equivalente: MensagemComUsuario
interface MensagemComUsuario {
  id: number;
  salaId: number;
  usuarioId: number;
  conteudo: string;
  tipo: TipoMensagemChat;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  usuario: {
    id: number;
    nomeCompleto: string;
    nomeExibicao: string | null;
    emailCorporativo: string | null;
  };
}
```

### API Routes vs Server Actions
- **API Routes** continuam funcionando para compatibilidade
- **Server Actions** são preferidos para novas implementações
- Ambos podem coexistir durante a transição

## Timeline Estimado

- **Fase 2**: 1-2 dias (migração de tipos)
- **Fase 3**: 3-4 dias (migração de componentes)
- **Fase 4**: 2-3 dias (opcional - API routes)
- **Fase 5**: 1 dia (limpeza)

**Total**: 7-10 dias úteis

## Responsáveis

- **Arquitetura**: Definida ✅
- **Implementação**: Em andamento
- **Testes**: Pendente
- **Documentação**: Este arquivo

## Referências

- [Chat Page](src/app/(dashboard)/chat/page.tsx) - Exemplo de uso da nova arquitetura
- [Chat Actions](src/app/actions/chat.ts) - Server Actions
- [Chat Repository](src/core/chat/repository.ts) - Camada de dados
- [Chat Service](src/core/chat/service.ts) - Lógica de negócio
- [Migration SQL](supabase/migrations/20251210010000_add_chat_uniqueness_constraints.sql) - Constraints
