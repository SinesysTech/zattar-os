# 📚 Documentação Completa - Integração Chatwoot

**Status:** 🟢 Documentação Completa | 🟡 Implementação em Planejamento  
**Autor:** Jordan Medeiros  
**Data:** 17/02/2026  
**Fonte Única de Verdade:** Chatwoot Docs via Context7 `/chatwoot/docs`

---

## 📖 Como Usar Esta Documentação

### Para Product Manager / QA

👉 Comece com **[INTEGRATION_PLAN.md](./INTEGRATION_PLAN.md)**

- Visão geral das 4 fases
- Timeline estimada
- Checklist de complet ação
- Responsabilidades por fase

### Para Arquiteto / Tech Lead

👉 Comece com **[ARCHITECTURE.md](./ARCHITECTURE.md)**

- Princípios de design
- Diagramas de fluxo
- Estrutura de dados
- Padrões de implementação

### Para Developer (Implementação)

👉 Comece com **[CHATWOOT_API_OFFICIAL.md](./CHATWOOT_API_OFFICIAL.md)**

- Documentação completa de API
- Exemplos de código prontos
- Endpoints todos documentados
- Webhooks e realtime

---

## 🚀 Visão Geral Rápida

### O Que é Esta Integração?

```
OBJETIVO: Sincronizar contatos, conversas e mensagens
entre Zattar e Chatwoot em tempo real.

RESULTADO: Gerenciamento omnichannel completo dentro do Zattar
├─ Ver histórico de conversas do cliente
├─ Responder direto no perfil
├─ Notificações de novam ensagens
├─ Atribuição automática de agentes
└─ Dashboard unificado
```

### Arquitetura em 60 segundos

```
┌─────────────────┐
│  ZATTAR APP     │  ← Cliente, Partes, Terceiros
└────────┬────────┘
         │ Service Layer
         ▼
┌─────────────────┐
│ BD Synced Data  │  ← partes_chatwoot, conversas_chatwoot
└────────┬────────┘
         │ webhooks/realtime
         ▼
┌─────────────────┐
│ CHATWOOT API    │  ← Contatos, Conversas, Mensagens
└─────────────────┘
```

### Estado Atual

| Componente        | Status      | Detalhes                  |
| ----------------- | ----------- | ------------------------- |
| **API Client**    | ✅ 90%      | Client HTTP implementado  |
| **MCP Tools**     | ✅ 17 tools | Chatwoot basic operations |
| **BD Schema**     | ✅ Migração | partes_chatwoot pronta    |
| **Service Layer** | ✅ Partial  | Sincronização básica      |
| **Webhooks**      | ⏳ Planned  | Listener não implementado |
| **UI Components** | ⏳ Planned  | Histórico + chat          |
| **Realtime**      | ⏳ Planned  | SSE/WebSocket             |

---

## 📊 Documentos Disponíveis

### 1. CHATWOOT_API_OFFICIAL.md ⭐⭐⭐

**Para quem:** Developers que precisam chamar API  
**Tamanho:** ~20KB | ~1000 linhas  
**Conteúdo:**

```
✅ Autenticação (Public + Agent API)
✅ Contatos API (CRUD completo)
✅ Conversas API (criar, listar, atualizar)
✅ Mensagens API (enviar, historico)
✅ Agent Bots API
✅ Webhooks & Real-time
✅ Custom Attributes
✅ Inboxes API
✅ Agents/Users API
✅ Exemplo de fluxo completo
✅ Variáveis de ambiente necessárias
```

**Exemplos de código:**

- JavaScript/TypeScript
- cURL (Bash)
- Estrutura de payloads
- Tratamento de erros

### 2. INTEGRATION_PLAN.md ⭐⭐

**Para quem:** Product managers, tech leads, arquitetos  
**Tamanho:** ~30KB | ~1500 linhas  
**Conteúdo:**

```
FASE 1: Sincronização de Contatos (2 semanas)
├─ Estrutura de mapeamento
├─ Ações de sync (criar, atualizar, desvincular)
├─ Hooks automáticos
└─ Sincronização em lote

FASE 2: Gerenciamento de Conversas (2 semanas)
├─ Nova tabela conversas_chatwoot
├─ Criar conversa integrada
├─ Webhook: sincronizar eventos
├─ Mensagens bidirecional

FASE 3: Dashboard & Perfil (1.5 semanas)
├─ Histórico de conversas
├─ Chat inline no perfil
├─ Novo dashboard
└─ Notificações

FASE 4: Automações (1 semana)
├─ Auto-assignment agentes
├─ Respostas automáticas
├─ Sincronização de usuários
└─ Refinamento
```

**Timeline total:** ~6.5 semanas

### 3. ARCHITECTURE.md ⭐⭐⭐

**Para quem:** Arquitetos, tech leads, seniors developers  
**Tamanho:** ~15KB | ~800 linhas  
**Conteúdo:**

```
✅ Princípios arquiteturais
✅ Ciclos de sincronização (3 exemplos detalhados)
✅ Estrutura de dados (schemas SQL)
✅ Interfaces TypeScript
✅ Padrões de API (Service/Repository)
✅ Segurança & Validação
✅ Error handling
✅ Monitoramento & Logging
✅ Exemplos de testes
✅ Deployment considerations
```

**Diagramas:**

- Data flow diagram
- Sync cycles
- WebSocket/SSE architecture

---

## 🔗 Como Están Interconectados

```
ARQUITETURA.md (Conceitos)
    ↓
    └─→ Como sync funciona? (Ciclos de sync)
        └─→ Quais endpoints? → CHATWOOT_API_OFFICIAL.md
            └─→ Em que ordem? → INTEGRATION_PLAN.md (Fases)
                └─→ Como implementar? → Code examples em ARCHITECTURE.md

INTEGRATION_PLAN.md (Sequência)
    ↓
    └─→ Fase 1: Contatos
        └─→ Quais APIs usar? → CHATWOOT_API_OFFICIAL.md
            └─→ Como estruturar código? → ARCHITECTURE.md
                └─→ Qual a estrutura de dados? → ARCHITECTURE.md (Tables)
```

---

## 🎯 Plano de Implementação

### Sprint 1: Fundação (Semana 1-2)

**Tarefas:**

- [ ] **Database:** Criar migrations (partes_chatwoot, conversas_chatwoot)
- [ ] **Types:** Definir todas as interfaces TypeScript
- [ ] **Repository:** Implementar CRUD layer
- [ ] **Service:** Sincronizar contatos Zattar → Chatwoot
- [ ] **Tests:** Cobertura 80%+

**Referência:** INTEGRATION_PLAN.md → Fase 1 + ARCHITECTURE.md → Estrutura de dados

**Subagentes disponíveis para:**

- Database design & migrations
- TypeScript types & interfaces
- Repository pattern implementation
- Unit tests

---

### Sprint 2: Conversas (Semana 3-4)

**Tarefas:**

- [ ] Criar tabela conversas_chatwoot
- [ ] Implementar criarConversaIntegrada()
- [ ] Configurar webhook listener
- [ ] Processar eventos Chatwoot
- [ ] Sincronização bidirecional de mensagens

**Referência:** INTEGRATION_PLAN.md → Fase 2 + ARCHITECTURE.md → Ciclo 2 & 3

---

### Sprint 3: UI & Dashboard (Semana 5-6)

**Tarefas:**

- [ ] Componente: Histórico conversas no perfil
- [ ] Endpoint: Listar conversas cliente
- [ ] Dashboard: Conversas atribuídas
- [ ] Notificações em realtime (SSE)
- [ ] Chat inline (opcional v1)

**Referência:** INTEGRATION_PLAN.md → Fase 3

---

### Sprint 4: Automações (Semana 7)

**Tarefas:**

- [ ] Auto-assignment de agentes
- [ ] Respostas automáticas
- [ ] Sincronização de usuários Zattar ↔ Chatwoot
- [ ] Testes E2E completos
- [ ] Deploy + monitoring

**Referência:** INTEGRATION_PLAN.md → Fase 4

---

## 🧑‍💻 Para Subagentes: Começar Uma Tarefa

### Step 1: Entender o Contexto

1. Ler o documento relevante:
   - API? → CHATWOOT_API_OFFICIAL.md
   - Arquitetura? → ARCHITECTURE.md
   - Planejamento? → INTEGRATION_PLAN.md

2. Buscar a seção específica da tarefa
3. Notar todas as dependências

### Step 2: Configurar Ambiente

```bash
# Verificar Chatwoot API acesso
curl -H "api_access_token: xxx" https://seu-chatwoot.com/api/v1/accounts/1

# Ler .env.example
cat .env.example | grep CHATWOOT

# Setup BD local
npm run db:migrate
```

### Step 3: Implementar

1. Seguir padrão em ARCHITECTURE.md → Padrões de API
2. Usar tipos de CHATWOOT_API_OFFICIAL.md
3. Rastrear progresso em INTEGRATION_PLAN.md
4. Escrever testes junto

### Step 4: PR & Review

1. Refernciar documentação nos comentários do código
2. Incluir link para ARCHITECTURE.md patterns usado
3. Adicionar testes com cobertura

---

## 🔐 Configuração via Tabela Integracoes

A partir da versão 2026.02, o Chatwoot é configurado **via banco de dados** ao invés de variáveis de ambiente.

### Setup

1. Acesse **Configurações → Integrações**
2. Clique em **"+ Nova Integração"**
3. Selecione tipo **"Chatwoot"**
4. Preencha os campos:

```json
{
  "nome": "Chatwoot Principal",
  "descricao": "Sistema de atendimento integrado",
  "ativo": true,
  "tipo": "chatwoot",
  "configuracao": {
    "api_url": "https://seu-chatwoot.com",
    "api_key": "seu_api_access_token",
    "account_id": 1,
    "default_inbox_id": "abc123"
  }
}
```

### Onde conseguir as credenciais

1. **api_url**: URL da sua instância Chatwoot
2. **api_key**: Chatwoot → Settings → Account Settings → API
3. **account_id**: Número da conta (visível na URL da conta)
4. **default_inbox_id**: ID da inbox padrão (opcional)

### Migração de Env Vars

Se usando variáveis de ambiente, o sistema faz **fallback automático**:

```env
# Opcionais (durante transição):
CHATWOOT_API_URL=https://seu-chatwoot.com
CHATWOOT_API_KEY=seu_api_access_token
CHATWOOT_ACCOUNT_ID=1
CHATWOOT_DEFAULT_INBOX_ID=abc123
```

**Recomendação:** Migre para tabela de integrações para melhor UX e não precisar redeploy.

---

## 📞 FAQ para Subagentes

### P: Por onde começo?

**R:**

1. Se nunca viu a API → CHATWOOT_API_OFFICIAL.md
2. Se precisa entender fluxo → ARCHITECTURE.md
3. Se precisa planejar tarefas → INTEGRATION_PLAN.md

### P: Qual é a source of truth?

**R:** CHATWOOT_API_OFFICIAL.md (1075 code snippets do Context7)

### P: E se Chatwoot mudar?

**R:**

1. Atualizar CHATWOOT_API_OFFICIAL.md via Context7
2. Atualizar ARCHITECTURE.md se padrões mudam
3. Atualizar INTEGRATION_PLAN.md se timeline muda

### P: Como testo minha implementação?

**R:**

1. Usar ambiente de staging Chatwoot
2. Fazer testes unitários (exemplo em ARCHITECTURE.md)
3. Fazer testes E2E antes de PRMerge
4. Monitorar logs (padrão em ARCHITECTURE.md)

### P: E se houver erro durante sync?

**R:**

1. Verificar `erro_sincronizacao` em DB
2. Ver `audit_logs` com `origem_externa='chatwoot'`
3. Validar webhook signature
4. Retry automático (3 tentativas padrão)

### P: Posso fazer sync parcial?

**R:** Sim! Usar `tipo_entidade` para filtrar:

- 'cliente'
- 'parte_contraria'
- 'terceiro'
- 'todos'

---

## 🎓 Recursos Externos

### Documentação Oficial Chatwoot

- 📖 Docs: https://www.chatwoot.com/docs
- 🔗 API: https://developers.chatwoot.com
- 💬 Community: https://github.com/chatwoot/chatwoot

### Relacionado ao Projeto

- 🗂️ Código: `src/lib/chatwoot/`
- 📝 Specs: `openspec/changes/` (histórico de mudanças)
- 🧪 Testes: `tests/chatwoot/`

---

## ✅ Checklist: Antes de Começar Implementar

- [ ] Li CHATWOOT_API_OFFICIAL.md? (pelo menos overview)
- [ ] Li ARCHITECTURE.md (padrões relevantes)?
- [ ] Vi seção no INTEGRATION_PLAN.md (minha tarefa)?
- [ ] Testei conexão com Chatwoot API?
- [ ] Setei variáveis de ambiente?
- [ ] Criei branch de feature?
- [ ] Entendi as dependências (o que precisa ser feito antes)?

---

## 📈 Métricas de Sucesso

| Métrica             | Target        | Critério                    |
| ------------------- | ------------- | --------------------------- |
| Cobertura de Testes | 80%+          | Pull request precisa passar |
| Documents.coverage  | 100%          | Todas as funções têm JSDoc  |
| API Response Time   | <1500ms       | Medido em staging           |
| Webhook Latency     | <2000ms       | Medido em produção          |
| Error Rate          | <1%           | Monitorar por 1 semana      |
| User Adoption       | >50% usuários | 4 semanas após deploy       |

---

## 🆘 Suporte

### Preciso de Help?

1. **Entender uma API?**
   → Procure em CHATWOOT_API_OFFICIAL.md → Ctrl+F

2. **Entender arquitetura?**
   → Veja ARCHITECTURE.md → Seção "Ciclos de Sincronização"

3. **Não sei o que fazer?**
   → Veja INTEGRATION_PLAN.md → Checklist de fase

4. **Erro no Chatwoot?**
   → Veja CHATWOOT_API_OFFICIAL.md → Seção "Respostas Comuns"

5. **Outro problema?**
   → Abra issue no GitHub com link para documentação relevante

---

## 📝 Histórico de Documentação

| Data         | Autor     | Mudanças                          |
| ------------ | --------- | --------------------------------- |
| 17/02/2026   | Jordan M. | v1.0 - Documentação completa      |
| via Context7 | -         | 1075 code snippets da API oficial |

---

## 🎉 Pronto Para Começar?

```
1️⃣ Escolha seu role acima (PM/Arch/Dev)
2️⃣ Leia o documento indicado
3️⃣ Encontre sua tarefa em INTEGRATION_PLAN.md
4️⃣ Use ARCHITECTURE.md como referência
5️⃣ Implemente com exemplos de CHATWOOT_API_OFFICIAL.md
6️⃣ Submeta PR com cobertura de testes
7️⃣ Deploy com confiança! 🚀
```

---

**Perguntas? Dúvidas?**
→ Consulte os 3 documentos acima
→ Se não achar, abra issue referenciando o documento + linha

**Happy coding! 🎉**

---

_Documentação mantida por: Jordan Medeiros_  
_Baseada em: Chatwoot Official Docs via Context7_  
_Última atualização: 17/02/2026_  
_Status: 🟢 Completa e pronta para implementação_
