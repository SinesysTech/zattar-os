-- Create triggers for Chatwoot integration
-- Trigger to automatically update updated_at timestamps
-- Trigger to sync conversation counters
-- Trigger to sync agent availability

BEGIN;

-- =============================================================================
-- Trigger: Update updated_at on conversas_chatwoot
-- =============================================================================
CREATE OR REPLACE FUNCTION update_conversas_chatwoot_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS conversas_chatwoot_updated_at_trigger ON conversas_chatwoot;
CREATE TRIGGER conversas_chatwoot_updated_at_trigger
  BEFORE UPDATE ON conversas_chatwoot
  FOR EACH ROW
  EXECUTE FUNCTION update_conversas_chatwoot_updated_at();

-- =============================================================================
-- Trigger: Update updated_at on usuarios_chatwoot
-- =============================================================================
CREATE OR REPLACE FUNCTION update_usuarios_chatwoot_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS usuarios_chatwoot_updated_at_trigger ON usuarios_chatwoot;
CREATE TRIGGER usuarios_chatwoot_updated_at_trigger
  BEFORE UPDATE ON usuarios_chatwoot
  FOR EACH ROW
  EXECUTE FUNCTION update_usuarios_chatwoot_updated_at();

-- =============================================================================
-- Trigger: Auto-calculate conversation counters
-- Automatically updates message counters when conversations change
-- =============================================================================
CREATE OR REPLACE FUNCTION sync_conversation_counters()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if status changed or assignee changed
  IF (TG_OP = 'UPDATE') THEN
    IF (OLD.status != NEW.status OR OLD.assignee_id != NEW.assignee_id) THEN
      NEW.ultima_sincronizacao = NOW();
    END IF;
  END IF;
  
  IF (TG_OP = 'INSERT') THEN
    NEW.ultima_sincronizacao = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_conversation_counters_trigger ON conversas_chatwoot;
CREATE TRIGGER sync_conversation_counters_trigger
  BEFORE INSERT OR UPDATE ON conversas_chatwoot
  FOR EACH ROW
  EXECUTE FUNCTION sync_conversation_counters();

-- =============================================================================
-- Trigger: Update agent availability tracking
-- Updates the disponivel_em timestamp when availability changes
-- =============================================================================
CREATE OR REPLACE FUNCTION track_agent_availability_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    -- If availability changed from true to false, mark timestamp
    IF (OLD.disponivel = true AND NEW.disponivel = false) THEN
      NEW.disponivel_em = NOW();
    -- If availability changed from false to true, clear timestamp
    ELSIF (OLD.disponivel = false AND NEW.disponivel = true) THEN
      NEW.disponivel_em = NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS track_agent_availability_trigger ON usuarios_chatwoot;
CREATE TRIGGER track_agent_availability_trigger
  BEFORE UPDATE ON usuarios_chatwoot
  FOR EACH ROW
  EXECUTE FUNCTION track_agent_availability_change();

-- =============================================================================
-- Trigger: Reset agent conversation counter when they go offline
-- For load balancing purposes - don't assign conversations to offline agents
-- =============================================================================
CREATE OR REPLACE FUNCTION agent_offline_reset_counter()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    -- If agent goes offline, optionally reset counter (optional behavior)
    -- Some systems keep the counter to maintain history
    -- Uncomment the next 2 lines if you want to reset on offline
    -- IF (OLD.disponivel = true AND NEW.disponivel = false) THEN
    --   NEW.contador_conversas_ativas = 0;
    -- END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS agent_offline_reset_counter_trigger ON usuarios_chatwoot;
CREATE TRIGGER agent_offline_reset_counter_trigger
  BEFORE UPDATE ON usuarios_chatwoot
  FOR EACH ROW
  EXECUTE FUNCTION agent_offline_reset_counter();

-- =============================================================================
-- Trigger: Validate conversation state transitions
-- Ensures valid status transitions (ex: can't go from resolved -> open)
-- =============================================================================
CREATE OR REPLACE FUNCTION validate_conversation_state_transition()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    -- Define valid state transitions
    -- For simplicity, all transitions are allowed in this basic version
    -- Add specific validation if needed
    
    -- Example: If you want to prevent resolved conversations from reopening:
    -- IF (OLD.status = 'resolved' AND NEW.status != 'resolved') THEN
    --   RAISE EXCEPTION 'Cannot change status of resolved conversation';
    -- END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_conversation_state_trigger ON conversas_chatwoot;
CREATE TRIGGER validate_conversation_state_trigger
  BEFORE UPDATE ON conversas_chatwoot
  FOR EACH ROW
  EXECUTE FUNCTION validate_conversation_state_transition();

-- =============================================================================
-- Add index for common queries
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_conversas_chatwoot_status 
  ON conversas_chatwoot(status);

CREATE INDEX IF NOT EXISTS idx_conversas_chatwoot_assignee 
  ON conversas_chatwoot(assignee_chatwoot_id);

CREATE INDEX IF NOT EXISTS idx_conversas_chatwoot_account_id 
  ON conversas_chatwoot(chatwoot_account_id);

CREATE INDEX IF NOT EXISTS idx_usuarios_chatwoot_disponivel 
  ON usuarios_chatwoot(disponivel);

CREATE INDEX IF NOT EXISTS idx_usuarios_chatwoot_conta_ativa 
  ON usuarios_chatwoot(contador_conversas_ativas);

COMMIT;
