# Migration Checklist - Diego Barbosa Advocacia Database

Use this checklist to track your migration progress.

## Pre-Migration

- [ ] Backup current database
- [ ] Create new Supabase project
- [ ] Install Supabase CLI (`npm install -g supabase`)
- [ ] Have database credentials ready
- [ ] Review `QUICK_START.md` and `SCHEMA_EXPORT_README.md`

## Phase 1: Extensions & Types (5 minutes)

- [ ] **Extensions** (10 total)
  - [ ] hypopg
  - [ ] index_advisor
  - [ ] pg_net
  - [ ] pg_stat_statements
  - [ ] pg_trgm
  - [ ] pgcrypto
  - [ ] uuid-ossp
  - [ ] vector
  - [ ] pg_graphql
  - [ ] supabase_vault

- [ ] **ENUM Types** (40+ total)
  - [ ] Instancia
  - [ ] NotificationSeverity
  - [ ] NotificationType
  - [ ] StatusArquivamento
  - [ ] StatusExpediente
  - [ ] SyncStatus
  - [ ] TipoAcaoHistorico
  - [ ] TipoExpedienteEnum
  - [ ] TipoTribunal
  - [ ] codigo_tribunal
  - [ ] estado_civil
  - [ ] forma_pagamento_financeiro
  - [ ] genero_usuario
  - [ ] grau_tribunal
  - [ ] meio_comunicacao
  - [ ] modalidade_audiencia
  - [ ] natureza_conta
  - [ ] nivel_conta
  - [ ] origem_expediente
  - [ ] origem_lancamento
  - [ ] papel_contratual
  - [ ] periodo_orcamento
  - [ ] polo_processual
  - [ ] situacao_pericia
  - [ ] status_audiencia
  - [ ] status_captura
  - [ ] status_conciliacao
  - [ ] status_conta_bancaria
  - [ ] status_contrato
  - [ ] status_lancamento
  - [ ] status_orcamento
  - [ ] tipo_acesso_tribunal
  - [ ] tipo_captura
  - [ ] tipo_cobranca
  - [ ] tipo_conta_bancaria
  - [ ] tipo_conta_contabil
  - [ ] tipo_contrato
  - [ ] tipo_lancamento
  - [ ] tipo_notificacao_usuario
  - [ ] tipo_peca_juridica
  - [ ] tipo_pessoa

## Phase 2: Tables (20 minutes)

- [ ] **Core Tables** (103 total)
  - [ ] acervo
  - [ ] acordos_condenacoes
  - [ ] advogados
  - [ ] agendamentos
  - [ ] arquivos
  - [ ] assistentes
  - [ ] audiencias
  - [ ] cadastros_pje
  - [ ] captura_logs_brutos
  - [ ] capturas_log
  - [ ] cargos
  - [ ] centros_custo
  - [ ] chamadas
  - [ ] chamadas_participantes
  - [ ] classe_judicial
  - [ ] clientes
  - [ ] comunica_cnj
  - [ ] conciliacao_bancaria
  - [ ] conciliacoes_bancarias
  - [ ] config_atribuicao_estado
  - [ ] config_regioes_atribuicao
  - [ ] contas_bancarias
  - [ ] contrato_documentos
  - [ ] contrato_partes
  - [ ] contrato_processos
  - [ ] contrato_status_historico
  - [ ] contrato_tags
  - [ ] contratos
  - [ ] credenciais
  - [ ] documentos
  - [ ] documentos_compartilhados
  - [ ] documentos_uploads
  - [ ] documentos_versoes
  - [ ] embeddings
  - [ ] enderecos
  - [ ] especialidades_pericia
  - [ ] expedientes
  - [ ] folhas_pagamento
  - [ ] fornecedores
  - [ ] itens_folha_pagamento
  - [ ] kanban_columns
  - [ ] kanban_tasks
  - [ ] lancamentos_financeiros
  - [ ] layouts_painel
  - [ ] links_personalizados
  - [ ] locks
  - [ ] logs_alteracao
  - [ ] mcp_audit_log
  - [ ] mcp_quotas
  - [ ] memberships
  - [ ] membros_sala_chat
  - [ ] mensagens_chat
  - [ ] nota_etiqueta_vinculos
  - [ ] nota_etiquetas
  - [ ] notas
  - [ ] notificacoes
  - [ ] orcamento_itens
  - [ ] orcamentos
  - [ ] organizations
  - [ ] orgao_julgador
  - [ ] orgaos_tribunais
  - [ ] parcelas
  - [ ] partes_chatwoot
  - [ ] partes_contrarias
  - [ ] pastas
  - [ ] pecas_modelos
  - [ ] pericias
  - [ ] permissoes
  - [ ] plano_contas
  - [ ] processo_partes
  - [ ] processo_tags
  - [ ] reminders
  - [ ] representantes
  - [ ] representantes_id_mapping
  - [ ] sala_audiencia
  - [ ] salarios
  - [ ] salas_chat
  - [ ] segmentos
  - [ ] tags
  - [ ] tarefas
  - [ ] templates
  - [ ] terceiros
  - [ ] tipo_audiencia
  - [ ] tipos_expedientes
  - [ ] todo_assignees
  - [ ] todo_comments
  - [ ] todo_files
  - [ ] todo_items
  - [ ] todo_subtasks
  - [ ] transacoes_bancarias_importadas
  - [ ] transacoes_importadas
  - [ ] tribunais
  - [ ] tribunais_config
  - [ ] usuarios

- [ ] **Digital Signature Tables**
  - [ ] assinatura_digital_assinaturas
  - [ ] assinatura_digital_documento_ancoras
  - [ ] assinatura_digital_documento_assinantes
  - [ ] assinatura_digital_documentos
  - [ ] assinatura_digital_formularios
  - [ ] assinatura_digital_sessoes_assinatura
  - [ ] assinatura_digital_templates

## Phase 3: Constraints (15 minutes)

- [ ] **Primary Keys** (~150 total)
- [ ] **Unique Constraints** (~50 total)
- [ ] **Foreign Keys** (~150 total)
- [ ] **Check Constraints** (~50 total)

## Phase 4: Indexes (10 minutes)

- [ ] **Performance Indexes** (400+ total)
  - [ ] Process indexes (acervo, audiencias, expedientes)
  - [ ] User indexes
  - [ ] Financial indexes
  - [ ] Document indexes
  - [ ] Full-text search indexes (pg_trgm)
  - [ ] Vector search indexes (pgvector)

## Phase 5: Views (2 minutes)

- [ ] audiencias_com_origem
- [ ] expedientes_com_origem
- [ ] repasses_pendentes

## Phase 6: Functions (15 minutes)

- [ ] **Atribuição (Assignment) Functions** (5 functions)
  - [ ] atribuir_responsavel_acervo
  - [ ] atribuir_responsavel_audiencia
  - [ ] atribuir_responsavel_pendente
  - [ ] atribuir_responsavel_expediente_automatico
  - [ ] atribuir_responsavel_pericia_automatico
  - [ ] atribuir_responsavel_processo_automatico

- [ ] **Status Update Functions** (3 functions)
  - [ ] atualizar_status_acordo
  - [ ] atualizar_status_parcela_atrasada
  - [ ] atualizar_status_repasse

- [ ] **Utility Functions** (10+ functions)
  - [ ] update_updated_at_column
  - [ ] log_atribuicao_responsavel
  - [ ] criar_notificacao
  - [ ] cleanup_expired_locks
  - [ ] count_processos_unicos
  - [ ] calcular_valores_parcela

- [ ] **Other Functions** (30+ more)

## Phase 7: Triggers (10 minutes)

- [ ] **Update Timestamp Triggers** (~50 triggers)
- [ ] **Logging Triggers** (~20 triggers)
- [ ] **Notification Triggers** (~15 triggers)
- [ ] **Auto-assignment Triggers** (~10 triggers)
- [ ] **Business Logic Triggers** (~10 triggers)

## Phase 8: RLS Policies (20 minutes)

- [ ] **Enable RLS on all tables** (103 tables)
- [ ] **Service Role Policies** (~50 policies - full access)
- [ ] **Authenticated User Policies** (~30 policies - read access)
- [ ] **Owner-based Policies** (~20 policies - CRUD based on ownership)
- [ ] **Public/Anon Policies** (~10 policies - limited access)

## Phase 9: Configuration (10 minutes)

- [ ] **Storage Buckets**
  - [ ] documents bucket (private)
  - [ ] uploads bucket (private)
  - [ ] Configure storage policies

- [ ] **Authentication**
  - [ ] Enable Email provider
  - [ ] Configure email templates
  - [ ] Set redirect URLs
  - [ ] Test auth flow

- [ ] **Environment Variables**
  - [ ] Update NEXT_PUBLIC_SUPABASE_URL
  - [ ] Update NEXT_PUBLIC_SUPABASE_ANON_KEY
  - [ ] Update SUPABASE_SERVICE_ROLE_KEY

## Phase 10: Verification (15 minutes)

- [ ] **Schema Verification**
  - [ ] Count tables: Should be 103
  - [ ] Count views: Should be 3
  - [ ] Count functions: Should be 50+
  - [ ] Count indexes: Should be 400+
  - [ ] Count triggers: Should be 100+
  - [ ] Count RLS policies: Should be 100+

- [ ] **Functional Testing**
  - [ ] Can insert into core tables
  - [ ] Foreign keys enforce integrity
  - [ ] Triggers fire correctly
  - [ ] Functions execute without errors
  - [ ] Views return correct data
  - [ ] RLS blocks unauthorized access
  - [ ] RLS allows authorized access

- [ ] **Application Testing**
  - [ ] Next.js app connects successfully
  - [ ] Can authenticate users
  - [ ] Can query data
  - [ ] Can insert data
  - [ ] Can upload files
  - [ ] Real-time subscriptions work

## Phase 11: Performance Optimization (10 minutes)

- [ ] Run ANALYZE on all tables
- [ ] Run VACUUM ANALYZE
- [ ] Verify index usage with EXPLAIN
- [ ] Check slow query log
- [ ] Optimize if needed

## Phase 12: Documentation (5 minutes)

- [ ] Document any changes made
- [ ] Update connection strings in docs
- [ ] Note any custom configurations
- [ ] Share credentials securely with team

## Post-Migration

- [ ] Monitor error logs for 24 hours
- [ ] Verify all features work in production
- [ ] Keep old database as backup for 30 days
- [ ] Update DNS/routing if applicable
- [ ] Celebrate successful migration! 🎉

---

## Estimated Total Time

- **Using CLI**: ~1-2 hours
- **Manual Migration**: ~3-4 hours
- **With Data Migration**: +1-2 hours

## Quick Commands

```bash
# Pull schema from current project
supabase db pull

# Push to new project
supabase db push

# Verify migration
supabase db diff

# Reset if needed
supabase db reset
```

## Notes Section

Use this space to track issues, custom changes, or important decisions:

```
Date: ___________
Issue: ___________________________________________________________
Resolution: _______________________________________________________

Date: ___________
Issue: ___________________________________________________________
Resolution: _______________________________________________________

Date: ___________
Issue: ___________________________________________________________
Resolution: _______________________________________________________
```

---

**Remember**: Always test in staging first! ✅
