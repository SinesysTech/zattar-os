#!/bin/bash

# Add missing enums to the base migration
# Extract all enums from full_schema_dump.sql and prepend to base migration

echo "🔧 Adding missing enums to base migration..."

BASE_MIGRATION="supabase/migrations/20240101000000_base_schema.sql"
TEMP_FILE="${BASE_MIGRATION}.tmp"

# Extract enums from full schema dump (lines 43-75)
cat > "$TEMP_FILE" << 'EOF'
-- Base Schema Migration
-- Consolidated from supabase/schemas/*.sql + missing enums from full_schema_dump.sql

-- =====================================================
-- SECTION 1: EXTENSIONS
-- =====================================================

CREATE EXTENSION IF NOT EXISTS hypopg WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS index_advisor WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- =====================================================
-- SECTION 2: ALL ENUM TYPES (from full_schema_dump.sql)
-- =====================================================

CREATE TYPE public.Instancia AS ENUM ('PRIMEIRO_GRAU', 'SEGUNDO_GRAU', 'TRIBUNAL_SUPERIOR');
CREATE TYPE public.NotificationSeverity AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE public.NotificationType AS ENUM ('SYNC_FAILED', 'SYNC_EXHAUSTED', 'SCRAPE_EXECUTION_FAILED', 'TRIBUNAL_SCRAPE_FAILED', 'STORAGE_FULL', 'CLEANUP_ERROR', 'EXTERNAL_STORAGE_DOWN');
CREATE TYPE public.StatusArquivamento AS ENUM ('ATIVO', 'ARQUIVADO', 'BAIXADO');
CREATE TYPE public.StatusExpediente AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO');
CREATE TYPE public.SyncStatus AS ENUM ('PENDING', 'SYNCING', 'SYNCED', 'PARTIAL', 'FAILED', 'DELETED');
CREATE TYPE public.TipoAcaoHistorico AS ENUM ('ATRIBUIDO', 'TRANSFERIDO', 'BAIXADO', 'REVERSAO_BAIXA', 'PROTOCOLO_ADICIONADO', 'OBSERVACAO_ADICIONADA');
CREATE TYPE public.TipoExpedienteEnum AS ENUM ('IMPUGNACAO_A_CONTESTACAO', 'RAZOES_FINAIS', 'RECURSO_ORDINARIO', 'MANIFESTACAO', 'RECURSO_DE_REVISTA', 'AGRAVO_DE_INSTRUMENTO_EM_RECURSO_ORDINARIO', 'CONTRARRAZOES_AOS_EMBARGOS_DE_DECLARACAO', 'CONTRARRAZOES_AO_RECURSO_ORDINARIO', 'EMENDA_A_INICIAL', 'AGRAVO_DE_INSTRUMENTO_EM_RECURSO_DE_REVISTA', 'CONTRARRAZOES_AO_RECURSO_DE_REVISTA', 'AGRAVO_INTERNO', 'ADITAMENTO_A_INICIAL', 'IMPUGNACAO_AO_CUMPRIMENTO_DE_SENTENCA', 'IMPUGNACAO_AO_LAUDO_PERICIAL', 'IMPUGNACAO_AO_CALCULO_PERICIAL', 'APRESENTACAO_DE_CALCULOS', 'IMPUGNACAO_AOS_EMBARGOS_DE_EXECUCAO', 'APRESENTACAO_DE_QUESITOS', 'AUDIENCIA', 'CONTRARRAZOES_AO_RECURSO_ORDINARIO_ADESIVO', 'CONTRAMINUTA_AO_AGRAVO_DE_PETICAO', 'CONTRAMINUTA_AO_AGRAVO_INTERNO', 'PERICIA', 'CONTRAMINUTA_AO_AGRAVO_DE_INSTRUMENTO_EM_RECURSO_DE_REVISTA', 'CONTRAMINUTA_AO_AGRAVO_DE_INSTRUMENTO_EM_RECURSO_ORDINARIO', 'SESSAO_DE_JULGAMENTO', 'CEJUSC', 'VERIFICAR');
CREATE TYPE public.TipoTribunal AS ENUM ('TRT', 'TJ', 'TRF', 'TST', 'STF', 'STJ');
CREATE TYPE public.codigo_tribunal AS ENUM ('TRT1', 'TRT2', 'TRT3', 'TRT4', 'TRT5', 'TRT6', 'TRT7', 'TRT8', 'TRT9', 'TRT10', 'TRT11', 'TRT12', 'TRT13', 'TRT14', 'TRT15', 'TRT16', 'TRT17', 'TRT18', 'TRT19', 'TRT20', 'TRT21', 'TRT22', 'TRT23', 'TRT24', 'TST');
CREATE TYPE public.estado_civil AS ENUM ('solteiro', 'casado', 'divorciado', 'viuvo', 'uniao_estavel', 'outro');
CREATE TYPE public.forma_pagamento_financeiro AS ENUM ('dinheiro', 'transferencia_bancaria', 'ted', 'pix', 'boleto', 'cartao_credito', 'cartao_debito', 'cheque', 'deposito_judicial');
CREATE TYPE public.genero_usuario AS ENUM ('masculino', 'feminino', 'outro', 'prefiro_nao_informar');
CREATE TYPE public.grau_tribunal AS ENUM ('primeiro_grau', 'segundo_grau', 'tribunal_superior');
CREATE TYPE public.meio_comunicacao AS ENUM ('E', 'D');
CREATE TYPE public.modalidade_audiencia AS ENUM ('virtual', 'presencial', 'hibrida');
CREATE TYPE public.natureza_conta AS ENUM ('devedora', 'credora');
CREATE TYPE public.nivel_conta AS ENUM ('sintetica', 'analitica');
CREATE TYPE public.origem_expediente AS ENUM ('captura', 'manual', 'comunica_cnj');
CREATE TYPE public.origem_lancamento AS ENUM ('manual', 'acordo_judicial', 'contrato', 'folha_pagamento', 'importacao_bancaria', 'recorrente');
CREATE TYPE public.papel_contratual AS ENUM ('autora', 're');
CREATE TYPE public.periodo_orcamento AS ENUM ('mensal', 'trimestral', 'semestral', 'anual');
CREATE TYPE public.polo_processual AS ENUM ('autor', 're');
CREATE TYPE public.situacao_pericia AS ENUM ('S', 'L', 'C', 'F', 'P', 'R');
CREATE TYPE public.status_audiencia AS ENUM ('C', 'M', 'F');
CREATE TYPE public.status_captura AS ENUM ('pending', 'in_progress', 'completed', 'failed');
CREATE TYPE public.status_conciliacao AS ENUM ('pendente', 'conciliado', 'divergente', 'ignorado');
CREATE TYPE public.status_conta_bancaria AS ENUM ('ativa', 'inativa', 'encerrada');
CREATE TYPE public.status_contrato AS ENUM ('em_contratacao', 'contratado', 'distribuido', 'desistencia');
CREATE TYPE public.status_lancamento AS ENUM ('pendente', 'confirmado', 'cancelado', 'estornado');
CREATE TYPE public.status_orcamento AS ENUM ('rascunho', 'aprovado', 'em_execucao', 'encerrado');
CREATE TYPE public.tipo_acesso_tribunal AS ENUM ('primeiro_grau', 'segundo_grau', 'unificado', 'unico');
CREATE TYPE public.tipo_captura AS ENUM ('acervo_geral', 'arquivados', 'audiencias', 'pendentes', 'partes', 'comunica_cnj', 'combinada', 'pericias');
CREATE TYPE public.tipo_cobranca AS ENUM ('pro_exito', 'pro_labore');
CREATE TYPE public.tipo_conta_bancaria AS ENUM ('corrente', 'poupanca', 'investimento', 'caixa');
CREATE TYPE public.tipo_conta_contabil AS ENUM ('ativo', 'passivo', 'receita', 'despesa', 'patrimonio_liquido');
CREATE TYPE public.tipo_contrato AS ENUM ('ajuizamento', 'defesa', 'ato_processual', 'assessoria', 'consultoria', 'extrajudicial', 'parecer');
CREATE TYPE public.tipo_lancamento AS ENUM ('receita', 'despesa');
CREATE TYPE public.tipo_notificacao_usuario AS ENUM ('processo_atribuido', 'processo_movimentacao', 'audiencia_atribuida', 'audiencia_alterada', 'expediente_atribuido', 'expediente_alterado', 'prazo_vencendo', 'prazo_vencido', 'sistema_alerta');
CREATE TYPE public.tipo_peca_juridica AS ENUM ('peticao_inicial', 'contestacao', 'recurso_ordinario', 'agravo', 'embargos_declaracao', 'manifestacao', 'parecer', 'contrato_honorarios', 'procuracao', 'outro');
CREATE TYPE public.tipo_pessoa AS ENUM ('pf', 'pj');

EOF

# Append the rest of the base migration (skip the old enum section)
tail -n +20 "$BASE_MIGRATION" | grep -v "^-- From: 01_enums.sql" | grep -A 99999 "^-- From: 02_advogados.sql" >> "$TEMP_FILE"

# Replace old file
mv "$TEMP_FILE" "$BASE_MIGRATION"

echo "✅ Missing enums added to base migration"
echo ""
echo "Next steps:"
echo "1. Run: supabase start"
