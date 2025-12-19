-- Migration: Add trt and grau columns to terceiros table
-- Description: Add context columns to terceiros for scoping to tribunal/grau

-- Add trt column if not exists
ALTER TABLE terceiros
ADD COLUMN IF NOT EXISTS trt VARCHAR(10);

-- Add grau column if not exists
ALTER TABLE terceiros
ADD COLUMN IF NOT EXISTS grau VARCHAR(1) CHECK (grau IN ('1', '2'));

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_terceiros_trt_grau ON terceiros(trt, grau);

-- Add column comments
COMMENT ON COLUMN terceiros.trt IS 'Tribunal Regional do Trabalho (e.g., "3", "15")';
COMMENT ON COLUMN terceiros.grau IS 'Grau: "1" for primeiro_grau, "2" for segundo_grau';
