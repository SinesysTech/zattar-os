-- Migration: Renomear tabelas formsign para assinatura_digital
-- Data: 2025-01-01

-- Renomear tabelas
ALTER TABLE formsign_templates RENAME TO assinatura_digital_templates;
ALTER TABLE formsign_formularios RENAME TO assinatura_digital_formularios;
ALTER TABLE formsign_segmentos RENAME TO assinatura_digital_segmentos;
ALTER TABLE formsign_assinaturas RENAME TO assinatura_digital_assinaturas;
ALTER TABLE formsign_sessoes_assinatura RENAME TO assinatura_digital_sessoes_assinatura;

-- Atualizar foreign keys
-- Para assinatura_digital_formularios
ALTER TABLE assinatura_digital_formularios 
  DROP CONSTRAINT IF EXISTS formsign_formularios_segmento_id_fkey,
  ADD CONSTRAINT assinatura_digital_formularios_segmento_id_fkey 
    FOREIGN KEY (segmento_id) REFERENCES assinatura_digital_segmentos(id);

-- Para assinatura_digital_assinaturas (adicionando fkeys assumindo estrutura)
ALTER TABLE assinatura_digital_assinaturas 
  DROP CONSTRAINT IF EXISTS formsign_assinaturas_segmento_id_fkey,
  ADD CONSTRAINT assinatura_digital_assinaturas_segmento_id_fkey 
    FOREIGN KEY (segmento_id) REFERENCES assinatura_digital_segmentos(id);

ALTER TABLE assinatura_digital_assinaturas 
  DROP CONSTRAINT IF EXISTS formsign_assinaturas_formulario_id_fkey,
  ADD CONSTRAINT assinatura_digital_assinaturas_formulario_id_fkey 
    FOREIGN KEY (formulario_id) REFERENCES assinatura_digital_formularios(id);

-- Nota: cliente_id e acao_id referenciam tabelas externas (clientes, acoes), não precisam ser alterados

-- Atualizar RLS policies (exemplos baseados em padrão comum)
-- Para templates
DROP POLICY IF EXISTS "formsign_templates_select" ON assinatura_digital_templates;
CREATE POLICY "assinatura_digital_templates_select" ON assinatura_digital_templates FOR SELECT USING (true);

DROP POLICY IF EXISTS "formsign_templates_insert" ON assinatura_digital_templates;
CREATE POLICY "assinatura_digital_templates_insert" ON assinatura_digital_templates FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "formsign_templates_update" ON assinatura_digital_templates;
CREATE POLICY "assinatura_digital_templates_update" ON assinatura_digital_templates FOR UPDATE USING (true);

DROP POLICY IF EXISTS "formsign_templates_delete" ON assinatura_digital_templates;
CREATE POLICY "assinatura_digital_templates_delete" ON assinatura_digital_templates FOR DELETE USING (true);

-- Para formularios
DROP POLICY IF EXISTS "formsign_formularios_select" ON assinatura_digital_formularios;
CREATE POLICY "assinatura_digital_formularios_select" ON assinatura_digital_formularios FOR SELECT USING (true);

DROP POLICY IF EXISTS "formsign_formularios_insert" ON assinatura_digital_formularios;
CREATE POLICY "assinatura_digital_formularios_insert" ON assinatura_digital_formularios FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "formsign_formularios_update" ON assinatura_digital_formularios;
CREATE POLICY "assinatura_digital_formularios_update" ON assinatura_digital_formularios FOR UPDATE USING (true);

DROP POLICY IF EXISTS "formsign_formularios_delete" ON assinatura_digital_formularios;
CREATE POLICY "assinatura_digital_formularios_delete" ON assinatura_digital_formularios FOR DELETE USING (true);

-- Para segmentos
DROP POLICY IF EXISTS "formsign_segmentos_select" ON assinatura_digital_segmentos;
CREATE POLICY "assinatura_digital_segmentos_select" ON assinatura_digital_segmentos FOR SELECT USING (true);

DROP POLICY IF EXISTS "formsign_segmentos_insert" ON assinatura_digital_segmentos;
CREATE POLICY "assinatura_digital_segmentos_insert" ON assinatura_digital_segmentos FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "formsign_segmentos_update" ON assinatura_digital_segmentos;
CREATE POLICY "assinatura_digital_segmentos_update" ON assinatura_digital_segmentos FOR UPDATE USING (true);

DROP POLICY IF EXISTS "formsign_segmentos_delete" ON assinatura_digital_segmentos;
CREATE POLICY "assinatura_digital_segmentos_delete" ON assinatura_digital_segmentos FOR DELETE USING (true);

-- Para assinaturas
DROP POLICY IF EXISTS "formsign_assinaturas_select" ON assinatura_digital_assinaturas;
CREATE POLICY "assinatura_digital_assinaturas_select" ON assinatura_digital_assinaturas FOR SELECT USING (true);

DROP POLICY IF EXISTS "formsign_assinaturas_insert" ON assinatura_digital_assinaturas;
CREATE POLICY "assinatura_digital_assinaturas_insert" ON assinatura_digital_assinaturas FOR INSERT WITH CHECK (true);

-- Para sessoes_assinatura
DROP POLICY IF EXISTS "formsign_sessoes_assinatura_select" ON assinatura_digital_sessoes_assinatura;
CREATE POLICY "assinatura_digital_sessoes_assinatura_select" ON assinatura_digital_sessoes_assinatura FOR SELECT USING (true);

DROP POLICY IF EXISTS "formsign_sessoes_assinatura_insert" ON assinatura_digital_sessoes_assinatura;
CREATE POLICY "assinatura_digital_sessoes_assinatura_insert" ON assinatura_digital_sessoes_assinatura FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "formsign_sessoes_assinatura_update" ON assinatura_digital_sessoes_assinatura;
CREATE POLICY "assinatura_digital_sessoes_assinatura_update" ON assinatura_digital_sessoes_assinatura FOR UPDATE USING (true);

-- Atualizar indexes (exemplos baseados em padrão comum)
ALTER INDEX IF EXISTS formsign_templates_ativo_idx RENAME TO assinatura_digital_templates_ativo_idx;
ALTER INDEX IF EXISTS formsign_templates_status_idx RENAME TO assinatura_digital_templates_status_idx;
ALTER INDEX IF EXISTS formsign_templates_template_uuid_idx RENAME TO assinatura_digital_templates_template_uuid_idx;

ALTER INDEX IF EXISTS formsign_formularios_ativo_idx RENAME TO assinatura_digital_formularios_ativo_idx;
ALTER INDEX IF EXISTS formsign_formularios_segmento_id_idx RENAME TO assinatura_digital_formularios_segmento_id_idx;
ALTER INDEX IF EXISTS formsign_formularios_formulario_uuid_idx RENAME TO assinatura_digital_formularios_formulario_uuid_idx;

ALTER INDEX IF EXISTS formsign_segmentos_ativo_idx RENAME TO assinatura_digital_segmentos_ativo_idx;
ALTER INDEX IF EXISTS formsign_segmentos_slug_idx RENAME TO assinatura_digital_segmentos_slug_idx;

ALTER INDEX IF EXISTS formsign_assinaturas_cliente_id_idx RENAME TO assinatura_digital_assinaturas_cliente_id_idx;
ALTER INDEX IF EXISTS formsign_assinaturas_template_uuid_idx RENAME TO assinatura_digital_assinaturas_template_uuid_idx;
ALTER INDEX IF EXISTS formsign_assinaturas_protocolo_idx RENAME TO assinatura_digital_assinaturas_protocolo_idx;

ALTER INDEX IF EXISTS formsign_sessoes_assinatura_sessao_uuid_idx RENAME TO assinatura_digital_sessoes_assinatura_sessao_uuid_idx;
ALTER INDEX IF EXISTS formsign_sessoes_assinatura_status_idx RENAME TO assinatura_digital_sessoes_assinatura_status_idx;