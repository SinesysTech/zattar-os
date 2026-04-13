# MCP Registries Expansion — 11 Novos Modulos

**Data:** 2026-04-13
**Scope:** Criar registries MCP para 11 modulos sem cobertura + atualizar .mcp.json
**Total de novas tools:** 53
**Total apos expansao:** 225 (172 existentes + 53 novas)

## Decisoes

- **Padrao:** Service direto (como tarefas-tools.ts) — sem overhead de safe-action
- **Naming:** snake_case com prefixo de modulo para evitar colisoes (pm_, pj_, mail_)
- **Mail adapter:** Importa diretamente de @/lib/mail/imap-client e smtp-client + getUserMailConfig
- **.mcp.json:** Adicionar entrada `zattaros-api` apontando para localhost:3000/api/mcp

## Modulos e Tools

### 1. project-management-tools.ts (16 tools)

Import: `@/app/(authenticated)/project-management/service` (namespaced: projectService, taskService, teamService, reminderService, dashboardService)

| Tool | Service | Descricao |
|------|---------|-----------|
| `pm_listar_projetos` | projectService.listarProjetos | Lista projetos com filtros (status, busca, paginacao) |
| `pm_buscar_projeto` | projectService.buscarProjeto | Busca projeto por ID |
| `pm_criar_projeto` | projectService.criarProjeto | Cria novo projeto |
| `pm_atualizar_projeto` | projectService.atualizarProjeto | Atualiza projeto existente |
| `pm_excluir_projeto` | projectService.excluirProjeto | Remove projeto |
| `pm_listar_tarefas_projeto` | taskService.listarTarefasPorProjeto | Lista tarefas de um projeto |
| `pm_listar_tarefas_global` | taskService.listarTarefasGlobal | Lista todas as tarefas com filtros |
| `pm_criar_tarefa` | taskService.criarTarefa | Cria tarefa em projeto |
| `pm_atualizar_tarefa` | taskService.atualizarTarefa | Atualiza tarefa |
| `pm_excluir_tarefa` | taskService.excluirTarefa | Remove tarefa |
| `pm_listar_membros` | teamService.listarMembros | Lista membros de um projeto |
| `pm_adicionar_membro` | teamService.adicionarMembro | Adiciona membro ao projeto |
| `pm_remover_membro` | teamService.removerMembro | Remove membro do projeto |
| `pm_listar_lembretes` | reminderService.listarLembretes | Lista lembretes do usuario |
| `pm_criar_lembrete` | reminderService.criarLembrete | Cria lembrete |
| `pm_obter_resumo_dashboard` | dashboardService.obterResumo | Metricas resumidas do PM |

Domain types: StatusProjeto, StatusTarefa, Prioridade, PapelProjeto

### 2. pecas-juridicas-tools.ts (6 tools)

Import: `@/app/(authenticated)/pecas-juridicas/service`

| Tool | Service | Descricao |
|------|---------|-----------|
| `listar_pecas_modelos` | listarPecasModelos | Lista templates de pecas juridicas com filtros |
| `buscar_peca_modelo` | buscarPecaModelo | Busca modelo por ID |
| `criar_peca_modelo` | criarPecaModelo | Cria novo template |
| `deletar_peca_modelo` | deletarPecaModelo | Remove template |
| `preview_geracao_peca` | previewGeracaoPeca | Preview de placeholders resolvidos/nao resolvidos |
| `listar_documentos_contrato` | listarDocumentosDoContrato | Lista documentos vinculados a contrato |

Domain types: TipoPecaJuridica, VisibilidadeModelo

### 3. notas-tools.ts (5 tools)

Import: `@/app/(authenticated)/notas/service`

| Tool | Service | Descricao |
|------|---------|-----------|
| `listar_notas` | listarDadosNotas | Lista notas com etiquetas |
| `criar_nota` | criarNota | Cria nota (text, checklist ou image) |
| `atualizar_nota` | atualizarNota | Atualiza titulo/conteudo/etiquetas |
| `arquivar_nota` | arquivarNota | Arquiva/desarquiva nota |
| `excluir_nota` | excluirNota | Remove nota permanentemente |

Domain types: NoteType ("text" | "checklist" | "image")

### 4. enderecos-tools.ts (4 tools)

Import: `@/app/(authenticated)/enderecos/service`

| Tool | Service | Descricao |
|------|---------|-----------|
| `listar_enderecos` | listarEnderecos | Lista enderecos com filtros |
| `buscar_enderecos_por_entidade` | buscarEnderecosPorEntidade | Enderecos de cliente/parte/terceiro |
| `criar_endereco` | criarEndereco | Cria endereco vinculado a entidade |
| `atualizar_endereco` | atualizarEndereco | Atualiza endereco existente |

Domain types: EntidadeTipoEndereco, SituacaoEndereco

### 5. tipos-expedientes-tools.ts (3 tools)

Import: `@/app/(authenticated)/tipos-expedientes/service`
Nota: Este modulo throws Error em vez de Result<T> — handlers usam try/catch

| Tool | Service | Descricao |
|------|---------|-----------|
| `listar_tipos_expedientes` | listar | Lista tipos de expediente com paginacao |
| `criar_tipo_expediente` | criar | Cria novo tipo (valida unicidade) |
| `deletar_tipo_expediente` | deletar | Remove tipo (impede se em uso) |

### 6. notificacoes-tools.ts (4 tools)

Import: `@/app/(authenticated)/notificacoes/service`

| Tool | Service | Descricao |
|------|---------|-----------|
| `listar_notificacoes` | listarNotificacoes | Lista notificacoes com paginacao |
| `contar_notificacoes_nao_lidas` | contarNotificacoesNaoLidas | Contador de nao-lidas |
| `marcar_notificacao_lida` | marcarNotificacaoComoLida | Marca uma como lida |
| `marcar_todas_notificacoes_lidas` | marcarTodasComoLidas | Marca todas como lidas |

### 7. admin-tools.ts (1 tool)

Import: `@/app/(authenticated)/admin/service`

| Tool | Service | Descricao |
|------|---------|-----------|
| `avaliar_upgrade_compute` | avaliarNecessidadeUpgrade | Avalia se upgrade de compute Supabase e necessario |

Nota: Funcao sincrona — recebe cacheHitRate, diskIOBudgetPercent, computeAtual

### 8. agenda-tools.ts (4 tools)

Import: `@/app/(authenticated)/agenda/service`

| Tool | Service | Descricao |
|------|---------|-----------|
| `listar_eventos_agenda` | listarEventosPorPeriodo | Lista eventos por periodo |
| `criar_evento_agenda` | criarEvento | Cria evento na agenda |
| `atualizar_evento_agenda` | atualizarEvento | Atualiza evento existente |
| `deletar_evento_agenda` | deletarEvento | Remove evento |

### 9. calendar-tools.ts (1 tool)

Import: `@/app/(authenticated)/calendar/service`
Nota: Throws Error em vez de Result<T> — handler usa try/catch

| Tool | Service | Descricao |
|------|---------|-----------|
| `listar_eventos_calendario_unificado` | listarEventosPorPeriodo | Agrega eventos de 5 fontes (audiencias, expedientes, obrigacoes, pericias, agenda) |

### 10. entrevistas-trabalhistas-tools.ts (4 tools)

Import: `@/app/(authenticated)/entrevistas-trabalhistas/service`

| Tool | Service | Descricao |
|------|---------|-----------|
| `buscar_entrevista` | buscarEntrevista | Busca entrevista por ID |
| `iniciar_entrevista` | iniciarEntrevista | Inicia nova entrevista trabalhista |
| `salvar_modulo_entrevista` | salvarModulo | Salva respostas de um modulo da entrevista |
| `finalizar_entrevista` | finalizarEntrevista | Finaliza entrevista concluida |

Domain types: TipoLitigio, StatusEntrevista, ModuloEntrevista

### 11. mail-tools.ts (5 tools)

Import: `@/lib/mail/imap-client` (listFolders, listMessages, getMessage, searchMessages)
Import: `@/lib/mail/smtp-client` (sendEmail)
Import: `@/lib/mail/credentials` (getUserMailConfig)

| Tool | Lib Function | Descricao |
|------|-------------|-----------|
| `mail_listar_pastas` | listFolders | Lista pastas do email (INBOX, Sent, etc.) |
| `mail_listar_mensagens` | listMessages | Lista mensagens de uma pasta com paginacao |
| `mail_ler_mensagem` | getMessage | Le mensagem completa por UID |
| `mail_buscar_mensagens` | searchMessages | Busca mensagens por criterios |
| `mail_enviar_email` | sendEmail | Envia email via SMTP |

Adapter: getUserMailConfig(SYSTEM_AGENT_USER_ID) para obter MailConfig

## Orquestracao

### registries/index.ts — adicionar 11 exports
### registry.ts — adicionar 11 await calls + atualizar JSDoc (225 tools, 34 modulos)

## .mcp.json

Adicionar:
```json
"zattaros-api": {
  "url": "http://localhost:3000/api/mcp"
}
```

## Validacao

Apos implementacao:
1. `npm run type-check` — zero erros
2. `npm run mcp:check` — zero erros de orquestracao
3. `npm run check:architecture` — sem novas violacoes
