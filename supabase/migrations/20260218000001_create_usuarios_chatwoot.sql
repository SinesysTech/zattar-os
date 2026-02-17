-- Migration: Create usuarios_chatwoot table for user/agent mapping
-- Purpose: Map local Zattar users to Chatwoot agents for assignment and automation
-- Supports role-based routing and skill-based assignment

-- =============================================================================
-- TABLE: usuarios_chatwoot
-- =============================================================================

CREATE TABLE IF NOT EXISTS "public"."usuarios_chatwoot" (
    "id" BIGINT NOT NULL GENERATED ALWAYS AS IDENTITY (SEQUENCE NAME "usuarios_chatwoot_id_seq" START WITH 1 INCREMENT BY 1),
    
    -- Local user reference (from auth.users or profiles table)
    "usuario_id" UUID NOT NULL,
    
    -- Chatwoot agent reference
    "chatwoot_agent_id" BIGINT NOT NULL,
    "chatwoot_account_id" BIGINT NOT NULL,
    
    -- Agent info (cached for performance)
    "email" TEXT,
    "nome_chatwoot" TEXT,
    
    -- Role/permissions
    "role" TEXT NOT NULL DEFAULT 'agent'::TEXT
        CHECK ("role" = ANY (ARRAY['agent'::TEXT, 'supervisor'::TEXT, 'admin'::TEXT])),
    
    -- Availability
    "disponivel" BOOLEAN NOT NULL DEFAULT true,
    "disponivel_em" TIMESTAMP WITH TIME ZONE,
    
    -- Skills for smart assignment (JSON array of skill IDs/names)
    "skills" JSONB,
    
    -- Conversation count (cache)
    "contador_conversas_ativas" BIGINT NOT NULL DEFAULT 0,
    "max_conversas_simultaneas" BIGINT NOT NULL DEFAULT 10,
    
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
COMMENT ON TABLE "public"."usuarios_chatwoot" IS 'Mapeamento entre usuários locais (Zattar) e agentes do Chatwoot. Suporta atribuição baseada em skills e disponibilidade.';

-- Add comments on columns
COMMENT ON COLUMN "public"."usuarios_chatwoot"."usuario_id" IS 'ID único do usuário no Zattar (UUID from auth.users or profiles)';
COMMENT ON COLUMN "public"."usuarios_chatwoot"."chatwoot_agent_id" IS 'ID do agente no Chatwoot';
COMMENT ON COLUMN "public"."usuarios_chatwoot"."chatwoot_account_id" IS 'ID da conta no Chatwoot (suporte multi-tenant)';
COMMENT ON COLUMN "public"."usuarios_chatwoot"."email" IS 'Email armazenado em cache para convenência (sincronizado do Chatwoot)';
COMMENT ON COLUMN "public"."usuarios_chatwoot"."nome_chatwoot" IS 'Nome do agente no Chatwoot';
COMMENT ON COLUMN "public"."usuarios_chatwoot"."role" IS 'Função do agente: agent, supervisor, admin';
COMMENT ON COLUMN "public"."usuarios_chatwoot"."disponivel" IS 'Flag de disponibilidade atual do agente';
COMMENT ON COLUMN "public"."usuarios_chatwoot"."disponivel_em" IS 'Timestamp quando o agente fica disponível (se não estiver disponível)';
COMMENT ON COLUMN "public"."usuarios_chatwoot"."skills" IS 'JSON com skills para smart assignment (ex: ["corporate", "compliance", "litigation"])';
COMMENT ON COLUMN "public"."usuarios_chatwoot"."contador_conversas_ativas" IS 'Cache do número de conversas ativas atribuídas a este agente';
COMMENT ON COLUMN "public"."usuarios_chatwoot"."max_conversas_simultaneas" IS 'Limite de conversas simultâneas que este agente pode gerenciar';
COMMENT ON COLUMN "public"."usuarios_chatwoot"."ultima_sincronizacao" IS 'Timestamp da última sincronização bem-sucedida';
COMMENT ON COLUMN "public"."usuarios_chatwoot"."sincronizado" IS 'Flag indicando se o registro está sincronizado com o Chatwoot';
COMMENT ON COLUMN "public"."usuarios_chatwoot"."erro_sincronizacao" IS 'Mensagem de erro da última tentativa de sincronização (se houver)';
COMMENT ON COLUMN "public"."usuarios_chatwoot"."dados_sincronizados" IS 'Snapshot JSON dos dados sincronizados para detecção de mudanças';

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Primary lookup: user by local UUID
CREATE INDEX "idx_usuarios_chatwoot_usuario_id"
    ON "public"."usuarios_chatwoot"("usuario_id");

-- Lookup by Chatwoot agent ID
CREATE INDEX "idx_usuarios_chatwoot_chatwoot_agent"
    ON "public"."usuarios_chatwoot"("chatwoot_agent_id", "chatwoot_account_id");

-- Availability queries
CREATE INDEX "idx_usuarios_chatwoot_disponivel"
    ON "public"."usuarios_chatwoot"("disponivel", "contador_conversas_ativas")
    WHERE "disponivel" = true;

-- Role-based queries
CREATE INDEX "idx_usuarios_chatwoot_role"
    ON "public"."usuarios_chatwoot"("role");

-- Sync status queries
CREATE INDEX "idx_usuarios_chatwoot_sync"
    ON "public"."usuarios_chatwoot"("sincronizado", "ultima_sincronizacao");

-- Skills lookup for smart assignment
CREATE INDEX "idx_usuarios_chatwoot_skills"
    ON "public"."usuarios_chatwoot" USING GIN ("skills");

-- =============================================================================
-- UNIQUE CONSTRAINTS
-- =============================================================================

-- One user -> one Chatwoot agent per account
ALTER TABLE "public"."usuarios_chatwoot"
    ADD CONSTRAINT "uq_usuarios_chatwoot_usuario" 
    UNIQUE ("usuario_id");

-- One Chatwoot agent -> one user per account
ALTER TABLE "public"."usuarios_chatwoot"
    ADD CONSTRAINT "uq_usuarios_chatwoot_chatwoot_agent"
    UNIQUE ("chatwoot_agent_id", "chatwoot_account_id");

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION "public"."update_usuarios_chatwoot_updated_at"()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updated_at" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "trg_usuarios_chatwoot_updated_at" ON "public"."usuarios_chatwoot";
CREATE TRIGGER "trg_usuarios_chatwoot_updated_at"
    BEFORE UPDATE ON "public"."usuarios_chatwoot"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."update_usuarios_chatwoot_updated_at"();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE "public"."usuarios_chatwoot" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own mapping
CREATE POLICY "usuarios_chatwoot_select_policy" ON "public"."usuarios_chatwoot"
    FOR SELECT
    USING (true); -- TODO: Refine - only return own mapping or admin can see all

-- Policy: Only admins can insert/update
CREATE POLICY "usuarios_chatwoot_insert_policy" ON "public"."usuarios_chatwoot"
    FOR INSERT
    WITH CHECK (true); -- TODO: Refine - only admins

CREATE POLICY "usuarios_chatwoot_update_policy" ON "public"."usuarios_chatwoot"
    FOR UPDATE
    USING (true) -- TODO: Refine - only admins or self
    WITH CHECK (true);

-- =============================================================================
-- FOREIGN KEYS (when tables exist)
-- =============================================================================

-- Foreign key to partes_chatwoot can be added after table relationships are clarified
-- ALTER TABLE "public"."usuarios_chatwoot"
--     ADD CONSTRAINT "fk_usuarios_chatwoot_usuario"
--     FOREIGN KEY ("usuario_id")
--     REFERENCES "auth"."users"("id")
--     ON DELETE CASCADE
--     ON UPDATE CASCADE;
