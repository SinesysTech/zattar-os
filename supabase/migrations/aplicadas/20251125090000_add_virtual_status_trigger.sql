BEGIN;

ALTER TABLE audiencias ADD COLUMN IF NOT EXISTS virtual_status boolean NOT NULL DEFAULT false;
ALTER TABLE audiencias ADD COLUMN IF NOT EXISTS virtual_updated_by text NOT NULL DEFAULT 'pje';
ALTER TABLE audiencias ADD COLUMN IF NOT EXISTS virtual_updated_at timestamptz NULL;

CREATE INDEX IF NOT EXISTS idx_audiencias_virtual_status ON audiencias(virtual_status);

CREATE OR REPLACE FUNCTION apply_virtual_status()
RETURNS trigger AS $$
DECLARE
  virtual_candidate boolean;
  tipo_desc text;
BEGIN
  tipo_desc := lower(coalesce(NEW.tipo_descricao, ''));
  virtual_candidate := coalesce(NEW.tipo_is_virtual, false) OR (tipo_desc LIKE '%videoconferência%') OR (NEW.url_audiencia_virtual IS NOT NULL);

  IF TG_OP = 'INSERT' THEN
    IF virtual_candidate THEN
      NEW.virtual_status := true;
      IF NEW.virtual_updated_by IS NULL THEN NEW.virtual_updated_by := 'pje'; END IF;
      NEW.virtual_updated_at := now();
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.virtual_updated_by = 'system' AND OLD.virtual_status = true THEN
      NEW.virtual_status := true;
      NEW.virtual_updated_by := 'system';
      IF NEW.virtual_status IS DISTINCT FROM OLD.virtual_status THEN NEW.virtual_updated_at := now(); END IF;
      RETURN NEW;
    END IF;

    IF virtual_candidate THEN
      IF NEW.virtual_status IS DISTINCT FROM true THEN NEW.virtual_status := true; END IF;
      IF NEW.virtual_updated_by IS NULL THEN NEW.virtual_updated_by := 'pje'; END IF;
      IF NEW.virtual_status IS DISTINCT FROM OLD.virtual_status THEN NEW.virtual_updated_at := now(); END IF;
    ELSE
      IF NEW.virtual_status IS DISTINCT FROM OLD.virtual_status THEN NEW.virtual_updated_at := now(); END IF;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_apply_virtual_status ON audiencias;
CREATE TRIGGER trg_apply_virtual_status
BEFORE INSERT OR UPDATE ON audiencias
FOR EACH ROW EXECUTE FUNCTION apply_virtual_status();

COMMIT;

