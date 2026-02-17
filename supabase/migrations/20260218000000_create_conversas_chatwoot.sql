-- Migration: Create conversas_chatwoot table for conversation tracking
-- Purpose: Track conversations between Zattar entities and Chatwoot contacts
-- Bi-directional sync with eventual consistency model

-- =============================================================================
-- TABLE: conversas_chatwoot
-- =============================================================================

CREATE TABLE IF NOT EXISTS "public"."conversas_chatwoot" (
    "id" BIGINT NOT NULL GENERATED ALWAYS AS IDENTITY (SEQUENCE NAME "conversas_chatwoot_id_seq" START WITH 1 INCREMENT BY 1),
    
    -- Chatwoot identifiers
    "chatwoot_conversation_id" BIGINT NOT NULL,
    "chatwoot_account_id" BIGINT NOT NULL,
    "chatwoot_inbox_id" BIGINT NOT NULL,
    
    -- Local entity mapping
    "mapeamento_partes_chatwoot_id" BIGINT,
    
    -- Conversation status
    "status" TEXT NOT NULL DEFAULT 'open'::TEXT
        CHECK ("status" = ANY (ARRAY['open'::TEXT, 'resolved'::TEXT, 'pending'::TEXT, 'snoozed'::TEXT])),
    
    -- Agent/user assignment
    "assignee_id" BIGINT,
    "assignee_chatwoot_id" BIGINT,
    
    -- Message tracking
    "ultima_mensagem_em" TIMESTAMP WITH TIME ZONE,
    "contador_mensagens_nao_lidas" BIGINT NOT NULL DEFAULT 0,
    "contador_mensagens_total" BIGINT NOT NULL DEFAULT 0,
    
    -- Synchronization metadata
    "ultima_sincronizacao" TIMESTAMP WITH TIME ZONE,
    "sincronizado" BOOLEAN NOT NULL DEFAULT false,
    "erro_sincronizacao" TEXT,
    
    -- Snapshots for change detection
    "dados_sincronizados" JSONB,
    
    -- Audit
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY ("id")
);

-- Add comment on table
COMMENT ON TABLE "public"."conversas_chatwoot" IS 'Rastreamento de conversas entre entidades locais e contatos do Chatwoot. Suporta sincronização bi-direcional com modelo de eventual consistency.';

-- Add comments on columns
COMMENT ON COLUMN "public"."conversas_chatwoot"."chatwoot_conversation_id" IS 'ID da conversa no Chatwoot';
COMMENT ON COLUMN "public"."conversas_chatwoot"."chatwoot_account_id" IS 'ID da conta no Chatwoot (suporte multi-tenant)';
COMMENT ON COLUMN "public"."conversas_chatwoot"."chatwoot_inbox_id" IS 'ID da inbox que contém a conversa';
COMMENT ON COLUMN "public"."conversas_chatwoot"."mapeamento_partes_chatwoot_id" IS 'Foreign key para partes_chatwoot - mapeia a entidade local';
COMMENT ON COLUMN "public"."conversas_chatwoot"."status" IS 'Status da conversa: open, resolved, pending, snoozed';
COMMENT ON COLUMN "public"."conversas_chatwoot"."assignee_chatwoot_id" IS 'ID do agente atribuído no Chatwoot';
COMMENT ON COLUMN "public"."conversas_chatwoot"."ultima_mensagem_em" IS 'Timestamp da última mensagem nesta conversa';
COMMENT ON COLUMN "public"."conversas_chatwoot"."contador_mensagens_nao_lidas" IS 'Quantidade de mensagens não lidas (cache para perf)';
COMMENT ON COLUMN "public"."conversas_chatwoot"."contador_mensagens_total" IS 'Total de mensagens na conversa (cache para perf)';
COMMENT ON COLUMN "public"."conversas_chatwoot"."ultima_sincronizacao" IS 'Timestamp da última sincronização bem-sucedida';
COMMENT ON COLUMN "public"."conversas_chatwoot"."sincronizado" IS 'Flag indicando se o registro está sincronizado com o Chatwoot';
COMMENT ON COLUMN "public"."conversas_chatwoot"."erro_sincronizacao" IS 'Mensagem de erro da última tentativa de sincronização (se houver)';
COMMENT ON COLUMN "public"."conversas_chatwoot"."dados_sincronizados" IS 'Snapshot JSON dos dados sincronizados para detecção de mudanças';

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Primary lookup: conversation by Chatwoot ID
CREATE INDEX "idx_conversas_chatwoot_chatwoot_id"
    ON "public"."conversas_chatwoot"("chatwoot_conversation_id", "chatwoot_account_id");

-- Local entity mapping lookup
CREATE INDEX "idx_conversas_chatwoot_mapeamento"
    ON "public"."conversas_chatwoot"("mapeamento_partes_chatwoot_id");

-- Status queries (e.g., find open conversations)
CREATE INDEX "idx_conversas_chatwoot_status"
    ON "public"."conversas_chatwoot"("status", "sincronizado");

-- Assignee queries
CREATE INDEX "idx_conversas_chatwoot_assignee"
    ON "public"."conversas_chatwoot"("assignee_chatwoot_id");

-- Sync status queries
CREATE INDEX "idx_conversas_chatwoot_sync"
    ON "public"."conversas_chatwoot"("sincronizado", "ultima_sincronizacao");

-- Unread messages filters
CREATE INDEX "idx_conversas_chatwoot_unread"
    ON "public"."conversas_chatwoot"("contador_mensagens_nao_lidas")
    WHERE "contador_mensagens_nao_lidas" > 0;

-- Recent activity ordering
CREATE INDEX "idx_conversas_chatwoot_recente"
    ON "public"."conversas_chatwoot"("ultima_mensagem_em" DESC);

-- =============================================================================
-- FOREIGN KEYS
-- =============================================================================

ALTER TABLE "public"."conversas_chatwoot"
    ADD CONSTRAINT "fk_conversas_chatwoot_partes_mapeamento"
    FOREIGN KEY ("mapeamento_partes_chatwoot_id")
    REFERENCES "public"."partes_chatwoot"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;

-- Note: usuario_id foreign key can be added later when usuarios_chatwoot is created

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION "public"."update_conversas_chatwoot_updated_at"()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updated_at" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "trg_conversas_chatwoot_updated_at" ON "public"."conversas_chatwoot";
CREATE TRIGGER "trg_conversas_chatwoot_updated_at"
    BEFORE UPDATE ON "public"."conversas_chatwoot"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."update_conversas_chatwoot_updated_at"();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE "public"."conversas_chatwoot" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view conversations for their assigned cases/processes
-- This will be refined based on actual authorization rules
CREATE POLICY "conversas_chatwoot_select_policy" ON "public"."conversas_chatwoot"
    FOR SELECT
    USING (true); -- TODO: Refine based on user role and assigned cases

CREATE POLICY "conversas_chatwoot_insert_policy" ON "public"."conversas_chatwoot"
    FOR INSERT
    WITH CHECK (true); -- TODO: Refine based on user role

CREATE POLICY "conversas_chatwoot_update_policy" ON "public"."conversas_chatwoot"
    FOR UPDATE
    USING (true) -- TODO: Refine based on user role
    WITH CHECK (true);

-- =============================================================================
-- UNIQUE CONSTRAINTS
-- =============================================================================

ALTER TABLE "public"."conversas_chatwoot"
    ADD CONSTRAINT "uq_conversas_chatwoot_chatwoot_id" 
    UNIQUE ("chatwoot_conversation_id", "chatwoot_account_id");

-- No duplicate local mappings for same conversation
ALTER TABLE "public"."conversas_chatwoot"
    ADD CONSTRAINT "uq_conversas_chatwoot_mapeamento_uma_conversa"
    UNIQUE ("mapeamento_partes_chatwoot_id") 
    WHERE "mapeamento_partes_chatwoot_id" IS NOT NULL;
