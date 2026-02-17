ALTER TABLE audiencias
  ADD COLUMN IF NOT EXISTS ata_audiencia_id bigint NULL,
  ADD COLUMN IF NOT EXISTS url text NULL;

CREATE INDEX IF NOT EXISTS idx_audiencias_data_inicio ON audiencias (data_inicio);
CREATE INDEX IF NOT EXISTS idx_audiencias_data_fim ON audiencias (data_fim);
CREATE INDEX IF NOT EXISTS idx_audiencias_responsavel ON audiencias (responsavel_id);
CREATE INDEX IF NOT EXISTS idx_audiencias_tipo_virtual ON audiencias (tipo_is_virtual);
