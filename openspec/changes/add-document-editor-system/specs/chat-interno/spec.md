# Spec: Sistema de Chat Interno

## ADDED Requirements

### Requirement: Chat Global com Página Dedicada (REQ-CHAT-001)

O sistema deve fornecer um chat interno global acessível por todos os usuários do escritório.

#### Scenario: Acessar página de chat
GIVEN o usuário está autenticado
WHEN o usuário clica em "Chat Interno" na navegação
THEN o sistema deve:
- Redirecionar para `/chat`
- Mostrar lista de salas disponíveis (esquerda)
- Mostrar chat ativo (centro)
- Mostrar lista de usuários online (direita, opcional)

#### Scenario: Visualizar sala geral
GIVEN o usuário acessa página de chat
WHEN página carrega
THEN o sistema deve:
- Selecionar "Sala Geral" automaticamente
- Carregar últimas 50 mensagens
- Conectar ao canal Realtime `chat:sala:geral`
- Mostrar usuários online na sala

#### Scenario: Criar nova sala de chat
GIVEN o usuário está na página de chat
WHEN o usuário clica em "Nova Sala"
AND informa nome e tipo (geral/privado)
THEN o sistema deve:
- Criar registro em `salas_chat`
- Associar criador
- Adicionar à lista de salas
- Redirecionar para nova sala

#### Scenario: Visualizar salas disponíveis
GIVEN existem múltiplas salas
WHEN usuário acessa página de chat
THEN o sistema deve:
- Listar salas na sidebar esquerda
- Mostrar: nome, última mensagem, contador de não lidas
- Ordenar por: última atividade (desc)
- Destacar sala ativa

---

### Requirement: Tipos de Salas (REQ-CHAT-002)

O sistema deve suportar diferentes tipos de salas de chat.

#### Scenario: Sala Geral (pública)
GIVEN existe sala tipo "geral"
WHEN qualquer usuário autenticado acessa
THEN o sistema deve:
- Permitir acesso sem restrições
- Mostrar histórico completo
- Todos podem enviar mensagens
- Não pode ser deletada

#### Scenario: Sala de Documento (contextual)
GIVEN documento possui sala associada
WHEN usuário abre documento no editor
THEN o sistema deve:
- Criar sala automaticamente (se não existir)
- Tipo: "documento"
- `documento_id` associado
- Apenas usuários com acesso ao documento podem participar

#### Scenario: Sala Privada (futuro)
GIVEN usuário quer chat 1-on-1
WHEN usuário seleciona "Chat Privado" com outro usuário
THEN o sistema deve:
- Criar sala tipo "privado"
- Adicionar apenas os dois usuários
- Nome: Nomes dos participantes
- Histórico visível apenas para participantes

---

### Requirement: Enviar e Receber Mensagens (REQ-CHAT-003)

O sistema deve permitir envio e recebimento de mensagens em tempo real.

#### Scenario: Enviar mensagem de texto
GIVEN usuário está em uma sala
WHEN usuário digita mensagem e pressiona Enter
THEN o sistema deve:
- Validar que mensagem não está vazia
- Salvar em `mensagens_chat` (PostgreSQL)
- Broadcast via Supabase Realtime
- Mostrar mensagem instantaneamente
- Limpar campo de input

#### Scenario: Receber mensagem de outro usuário
GIVEN usuário A está conectado à sala
WHEN usuário B envia mensagem
THEN o sistema deve:
- Receber via Realtime (WebSocket)
- Inserir mensagem no histórico
- Scroll automático para última mensagem
- Reproduzir som de notificação (opcional)
- Incrementar contador de não lidas (se em outra sala)

#### Scenario: Enviar arquivo (futuro)
GIVEN usuário quer compartilhar arquivo
WHEN usuário anexa arquivo e envia
THEN o sistema deve:
- Fazer upload para Backblaze B2
- Salvar mensagem tipo "arquivo"
- `conteudo` contém URL do arquivo
- Renderizar preview do arquivo

#### Scenario: Mensagem do sistema
GIVEN usuário entra ou sai da sala
WHEN presença é detectada via Realtime
THEN o sistema deve:
- Criar mensagem tipo "sistema"
- Conteúdo: "Fulano entrou na sala" ou "Fulano saiu"
- Estilo diferenciado (texto cinza, itálico)

---

### Requirement: Integração com RealtimeChat do Supabase (REQ-CHAT-004)

O sistema deve usar o componente `RealtimeChat` existente.

#### Scenario: Renderizar chat com RealtimeChat
GIVEN página de chat está carregada
WHEN sala é selecionada
THEN o sistema deve:
- Usar componente `<RealtimeChat />`
- Props:
  - `roomName={sala:${salaId}}`
  - `username={currentUser.nome}`
  - `messages={mensagensIniciais}`
  - `onMessage={handlePersistirMensagem}`

#### Scenario: Persistir mensagens no banco
GIVEN componente RealtimeChat emite evento `onMessage`
WHEN nova mensagem é criada
THEN o sistema deve:
- Chamar API `POST /api/chat/salas/{id}/mensagens`
- Salvar em `mensagens_chat`
- Associar `sala_id` e `usuario_id`
- Retornar confirmação

#### Scenario: Carregar mensagens iniciais
GIVEN sala é selecionada
WHEN componente monta
THEN o sistema deve:
- Buscar últimas 50 mensagens de `mensagens_chat`
- Ordenar por `created_at` asc
- Passar para prop `messages`
- RealtimeChat renderiza histórico

---

### Requirement: Integração com Editor de Documentos (REQ-CHAT-005)

O sistema deve permitir acesso ao chat lateral enquanto edita documento.

#### Scenario: Abrir chat lateral no editor
GIVEN usuário está editando documento
WHEN usuário clica em botão "Chat" (toolbar)
THEN o sistema deve:
- Abrir sidebar lateral com chat
- Conectar à sala do documento (`documento:{id}`)
- Mostrar histórico de mensagens
- Usuário pode digitar sem sair do editor

#### Scenario: Fechar chat lateral
GIVEN chat lateral está aberto
WHEN usuário clica em "Fechar" ou pressiona Esc
THEN o sistema deve:
- Fechar sidebar
- Desconectar do canal Realtime
- Manter editor visível (ocupar espaço completo)

#### Scenario: Notificação de nova mensagem enquanto edita
GIVEN chat lateral está fechado
WHEN nova mensagem chega na sala do documento
THEN o sistema deve:
- Mostrar badge com contador no botão "Chat"
- Badge desaparece ao abrir chat lateral
- Não interromper edição

#### Scenario: Chat lateral responsivo
GIVEN editor está em tela pequena (mobile/tablet)
WHEN chat lateral abre
THEN o sistema deve:
- Sobrepor editor (fullscreen)
- Botão "Voltar" retorna ao editor
- Manter estado do documento

---

### Requirement: Notificações e Contador de Não Lidas (REQ-CHAT-006)

O sistema deve notificar usuários sobre novas mensagens.

#### Scenario: Contador de mensagens não lidas
GIVEN usuário está em sala A
WHEN mensagem chega na sala B
THEN o sistema deve:
- Incrementar contador de não lidas na sala B
- Mostrar badge numérico na lista de salas
- Resetar contador ao abrir sala B

#### Scenario: Notificação visual
GIVEN usuário não está focado na aba do browser
WHEN nova mensagem chega
THEN o sistema deve:
- Atualizar título da página: "(3) Chat - Sinesys"
- Resetar ao voltar foco

#### Scenario: Notificação sonora (opcional)
GIVEN usuário habilitou notificações sonoras
WHEN nova mensagem chega
THEN o sistema deve:
- Reproduzir som curto (bip)
- Apenas se não é mensagem própria
- Pode ser desabilitado em settings

---

### Requirement: Histórico e Paginação (REQ-CHAT-007)

O sistema deve permitir acesso ao histórico completo de mensagens.

#### Scenario: Scroll infinito para mensagens antigas
GIVEN sala tem mais de 50 mensagens
WHEN usuário scrolla para cima (topo)
THEN o sistema deve:
- Detectar proximidade do topo (intersection observer)
- Carregar mais 50 mensagens anteriores
- Manter posição do scroll (não pular)
- Continuar até não haver mais mensagens

#### Scenario: Buscar mensagens por texto
GIVEN sala tem centenas de mensagens
WHEN usuário usa busca de mensagens
THEN o sistema deve:
- Filtrar mensagens por texto (ILIKE)
- Destacar texto encontrado
- Permitir navegação entre resultados

#### Scenario: Exibir timestamp de mensagens
GIVEN mensagens no chat
WHEN renderizar histórico
THEN o sistema deve:
- Agrupar mensagens por dia
- Mostrar data separadora: "15 de Janeiro de 2025"
- Hora ao lado de cada mensagem: "14:32"
- Formato relativo para mensagens recentes: "há 2 minutos"

---

### Requirement: Editar e Deletar Mensagens (REQ-CHAT-008)

O sistema deve permitir edição e deleção de mensagens próprias.

#### Scenario: Editar mensagem própria
GIVEN usuário enviou mensagem
WHEN usuário clica em "Editar"
AND altera texto
AND salva
THEN o sistema deve:
- Atualizar `conteudo` em `mensagens_chat`
- Setar `updated_at`
- Broadcast via Realtime
- Mostrar indicador "(editado)" na mensagem

#### Scenario: Deletar mensagem própria (soft delete)
GIVEN usuário enviou mensagem
WHEN usuário clica em "Deletar"
AND confirma ação
THEN o sistema deve:
- Setar `deleted_at` em `mensagens_chat`
- Substituir conteúdo por "[Mensagem deletada]"
- Broadcast via Realtime
- Mensagem não desaparece (histórico)

#### Scenario: Tempo limite para edição
GIVEN mensagem foi enviada há mais de 15 minutos
WHEN usuário tenta editar
THEN o sistema deve:
- Desabilitar opção de edição
- Mostrar tooltip "Mensagens podem ser editadas até 15 minutos após envio"

---

### Requirement: Presença de Usuários Online (REQ-CHAT-009)

O sistema deve mostrar quem está online na sala.

#### Scenario: Ver usuários online
GIVEN múltiplos usuários em sala
WHEN página carrega
THEN o sistema deve:
- Usar Supabase Realtime Presence
- Mostrar lista de usuários online (sidebar direita)
- Atualizar em tempo real ao entrar/sair

#### Scenario: Indicador de digitando
GIVEN usuário A está digitando
WHEN usuário A digita no campo de mensagem
THEN o sistema deve:
- Broadcast evento "typing"
- Mostrar para usuário B: "Fulano está digitando..."
- Timeout de 3 segundos sem digitação remove indicador

#### Scenario: Status de presença
GIVEN usuário está online
WHEN usuário fica inativo por 5 minutos
THEN o sistema deve:
- Alterar status para "ausente"
- Mostrar indicador visual (bolinha amarela)
- Retorna a "online" ao voltar atividade

---

### Requirement: Reações e Emojis (REQ-CHAT-010)

O sistema deve permitir reações rápidas a mensagens.

#### Scenario: Reagir a mensagem com emoji
GIVEN mensagem no chat
WHEN usuário clica em "Reagir"
AND seleciona emoji
THEN o sistema deve:
- Criar registro em `mensagens_reacoes` (futuro)
- Associar mensagem, usuário e emoji
- Mostrar contagem de reações sob mensagem
- Broadcast via Realtime

#### Scenario: Remover reação
GIVEN usuário já reagiu
WHEN usuário clica na própria reação
THEN o sistema deve:
- Remover registro de reação
- Atualizar contagem
- Broadcast via Realtime

---

### Requirement: Suprimir Configurações de IA no Chat (REQ-CHAT-011)

O sistema de chat NÃO deve ter configurações de IA visíveis (similar ao editor).

#### Scenario: Configurar IA via environment
GIVEN chat pode ter assistente IA (futuro)
WHEN funcionalidade for implementada
THEN o sistema deve:
- Configurar via `OPENROUTER_API_KEY` em `.env`
- NÃO mostrar settings de IA na UI
- Integração transparente sem configuração do usuário

---

## Design Constraints

### C-CHAT-001: Estrutura de Salas
- Sala Geral: Criada automaticamente, tipo "geral", não pode ser deletada
- Sala de Documento: Criada ao abrir documento, tipo "documento", `documento_id` associado
- Sala Privada (futuro): Chat 1-on-1, tipo "privado"

### C-CHAT-002: Persistência
- Todas as mensagens persistidas em PostgreSQL (`mensagens_chat`)
- Histórico completo mantido indefinidamente
- Soft delete para mensagens deletadas

### C-CHAT-003: Realtime
- Usar componente `RealtimeChat` do Supabase
- Canal Realtime: `chat:sala:{salaId}`
- Broadcast de mensagens via Realtime
- Persistência via callback `onMessage`

### C-CHAT-004: Integração com Editor
- Chat lateral (sidebar) no editor
- Botão na toolbar para abrir/fechar
- Sala automática do documento (`chat:documento:{documentoId}`)
- Notificações visuais (badge) quando chat fechado

### C-CHAT-005: Página Dedicada
- Rota: `/chat`
- Layout: Lista de salas (esquerda) + Chat ativo (centro) + Usuários online (direita)
- Responsivo: Mobile mostra apenas componente ativo

### C-CHAT-006: Performance
- Paginação: Carregar 50 mensagens por vez
- Scroll infinito para histórico
- Debounce em "digitando" (300ms)

### C-CHAT-007: Segurança
- RLS: Usuários só veem salas que têm acesso
- Sala de documento: Apenas usuários com acesso ao documento
- Validação de permissões no backend

### C-CHAT-008: Nomenclatura
- Arquivos backend: `kebab-case.service.ts`
- Componentes React: `PascalCase.tsx`
- Hooks: `use-kebab-case.ts`
- Pasta: `backend/chat/`, `components/chat/`
