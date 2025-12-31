# MCP Audit - Quick Reference Card

> **Use esta referência rápida quando precisar consultar números e decisões da auditoria rapidamente.**

---

## 📊 Números-Chave

```
Total de Actions:        332
Features Mapeadas:        27
Actions Registradas:      85 (25.6%)

Classificação:
  ✅ Úteis:               78 (23.5%)
     - Já Registradas:    51 (65% de úteis)
     - Não Registradas:   27 (35% de úteis)

  ❌ Inúteis:           ~216 (65.1%)

  🔄 Requerem Adaptação:  ~38 (11.4%)
```

---

## 🎯 Top 5 Prioridades de Implementação

### 1. Busca Semântica (AI) 🔥 **CRÍTICO**
- `actionBuscaSemantica`
- `actionBuscaHibrida`
- `actionObterContextoRAG`
- `actionBuscarSimilares`
- `actionBuscarConhecimento`
- `actionBuscarNoProcesso`
- `actionBuscarPorTipoEntidade`

**Total: 7 actions | Prioridade: CRÍTICA**

---

### 2. Documentos - Geração
- `actionGerarPDF`
- `actionGerarDOCX`

**Total: 2 actions | Prioridade: Alta**

---

### 3. Acervo
- `actionListarAcervoUnificado`
- `actionExportarAcervoCSV`

**Total: 2 actions | Prioridade: Alta**

---

### 4. Captura (Integrações Externas)
- `actionConsultarComunicacoes`
- `actionSincronizarComunicacoes`
- `actionObterCertidao`
- `actionCapturarTimeline`

**Total: 4 actions | Prioridade: Média**

---

### 5. Usuários - Atividades
- `actionBuscarEstatisticasAtividades`
- `actionBuscarProcessosAtribuidos`
- `actionBuscarAudienciasAtribuidas`
- `actionBuscarPendentesAtribuidos`
- `actionBuscarContratosAtribuidos`

**Total: 5 actions | Prioridade: Média**

---

## ✅ Actions Já Registradas por Feature

| Feature | Total Registradas |
|---------|-------------------|
| **processos** | 5 |
| **partes** | 14 (clientes, partes-contrarias, terceiros, representantes) |
| **audiencias** | 8 |
| **financeiro** | 9 |
| **expedientes** | 3 |
| **contratos** | 5 |
| **honorarios** | 3 |
| **obrigacoes** | 17 (acordos, condenações, pagamentos, repasses) |
| **usuarios** | 6 |
| **documentos** | 2 |
| **notificacoes** | 3 |
| **dashboard** | 1 |
| **formas-pagamento** | 1 |
| **tipos-expedientes** | 1 |
| **TOTAL** | **85** |

---

## ❌ Top Motivos de Exclusão

| Motivo | Total | % |
|--------|-------|---|
| Buscar por ID Interno | ~35 | 16% |
| Criar/Atualizar/Deletar (requerem ID) | ~102 | 47% |
| Operações Específicas/Sensíveis | ~35 | 16% |
| Deletar (Destrutivas) | ~22 | 10% |
| Indexação Interna (AI) | 13 | 6% |
| Upload de Arquivos | 6 | 3% |
| Auto-Save e UI | 2 | 1% |
| Autenticação/Sessão | 2 | 1% |

---

## 🔄 Adaptações Necessárias (FormData → JSON)

| Feature | Action | Prioridade |
|---------|--------|------------|
| **processos** | `actionCriarProcessoPayload` | Alta |
| **processos** | `actionAtualizarProcessoPayload` | Alta |
| **expedientes** | `actionCriarExpedientePayload` | Média |
| **expedientes** | `actionAtualizarExpedientePayload` | Média |
| **audiencias** | `actionAtualizarAudienciaPayload` | Média |
| **documentos** | `actionCriarDocumentoPayload` | Baixa |
| **documentos** | `actionAtualizarDocumentoPayload` | Baixa |

**Total: 7 adaptações**

---

## 🎯 Critérios de Decisão Rápida

### ✅ É ÚTIL se:
- [ ] Aceita **identificadores externos** (CPF, CNPJ, email, número)
- [ ] Tem **filtros semânticos** (busca, status, tipo)
- [ ] É **operação de negócio** atômica e reversível
- [ ] Gera **relatórios ou agregações**
- [ ] Faz **busca semântica (AI)**

### ❌ É INÚTIL se:
- [ ] Único parâmetro é **ID numérico interno**
- [ ] Faz **upload de arquivo binário**
- [ ] É operação de **UI** (auto-save)
- [ ] É operação de **autenticação/sessão**
- [ ] É operação **interna do sistema** (indexação)
- [ ] É operação **destrutiva** (deletar)
- [ ] É operação **muito sensível** (alterar permissões)

### 🔄 REQUER ADAPTAÇÃO se:
- [ ] Usa **FormData** mas não envolve uploads
- [ ] Dados são **serializáveis como JSON**
- [ ] Action é **útil para agentes**

---

## 📁 Documentos da Auditoria

| # | Documento | Quando Usar |
|---|-----------|-------------|
| 0 | `00-executive-summary.md` | Entender resultados em alto nível |
| 1 | `01-check-registry-output.txt` | Ver lista bruta de actions não registradas |
| 2 | `02-actions-inventory.md` | Explorar todas as 332 actions |
| 3 | `03-classification-criteria.md` | Decidir se uma nova action é útil |
| 4 | `04-actions-classification.md` | Ver decisão de classificação específica |
| 5 | `05-implementation-priority.md` | Guia de implementação (MAIS IMPORTANTE) |
| 6 | `06-exclusion-rationale.md` | Entender por que actions foram excluídas |
| - | `README.md` | Navegação e fluxo de leitura |
| - | `QUICK-REFERENCE.md` | Esta referência rápida |

---

## 🚀 Comandos Rápidos

```bash
# Verificar registry
npm run mcp:check

# Executar servidor MCP em dev
npm run mcp:dev

# Testar servidor MCP
npm run mcp:test
```

---

## 📝 Padrões de Nomenclatura

### Actions Úteis
- `actionListar*` - Listagens com filtros
- `actionBuscar*Por{CPF|CNPJ|Email|Numero}` - Buscas por identificadores externos
- `action{Confirmar|Cancelar|Estornar}*` - Operações de negócio
- `actionGerar*` - Relatórios
- `actionObter*` - Agregações
- `actionBusca{Semantica|Hibrida|RAG}*` - Buscas AI

### Actions Inúteis
- `actionBuscar*(id)` - Busca por ID interno
- `actionUpload*` - Upload de arquivos
- `actionAutoSalvar*` - Auto-save (UI)
- `actionLogin*` / `actionLogout*` - Autenticação
- `actionIndexar*` / `actionReindexar*` - Indexação interna
- `actionDeletar*` / `actionExcluir*` - Destrutivas

---

## 🎯 Metas de Implementação

### Sprint 1 (Crítico) 🔥
- [ ] Implementar 7 actions de Busca AI
- [ ] Testar integração RAG

**Resultado:** Agentes podem fazer perguntas e obter respostas contextualizadas.

---

### Sprint 2 (Alta Prioridade)
- [ ] Implementar 4 actions de Documentos/Acervo
- [ ] Testar geração de PDF/DOCX

**Resultado:** Agentes podem gerar documentos e visualizar acervo.

---

### Sprint 3 (Média Prioridade)
- [ ] Implementar 4 actions de Captura
- [ ] Implementar 5 actions de Usuários (atividades)
- [ ] Implementar 3 actions de RH
- [ ] Implementar 2 actions de Chat
- [ ] Implementar 1 action de Portal

**Resultado:** Agentes podem sincronizar dados externos e responder perguntas sobre atribuições.

---

### Backlog (Adaptações)
- [ ] Criar 7 versões JSON de actions FormData

**Resultado:** Agentes podem criar/atualizar processos, expedientes, etc. via MCP.

---

## 📊 Progress Tracker

```
Actions Úteis Implementadas: 51/78 (65%)

Faltam:
  🔥 Busca AI:        0/7   (0%)   - CRÍTICO
  📄 Documentos:      0/2   (0%)   - Alta
  📦 Acervo:          0/2   (0%)   - Alta
  📝 Contratos:       0/1   (0%)   - Alta
  🔗 Captura:         0/4   (0%)   - Média
  👥 Usuários (ativ): 0/5   (0%)   - Média
  💼 RH:              0/3   (0%)   - Média
  💬 Chat:            0/2   (0%)   - Média
  🌐 Portal:          0/1   (0%)   - Baixa

Total Faltando: 27/78 (35%)
```

---

## 🔗 Links Rápidos

- **Inventário Completo:** [`02-actions-inventory.md`](./02-actions-inventory.md)
- **Critérios de Classificação:** [`03-classification-criteria.md`](./03-classification-criteria.md)
- **Lista Priorizada (GUIA):** [`05-implementation-priority.md`](./05-implementation-priority.md)
- **Justificativas de Exclusão:** [`06-exclusion-rationale.md`](./06-exclusion-rationale.md)

---

**Última atualização:** 2025-12-31
**Próxima ação:** Implementar Busca AI (7 actions)
