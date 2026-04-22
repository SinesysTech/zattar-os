-- Dados bancários persistidos por cliente, reutilizáveis em repasses futuros.
-- Uma única conta vigente por cliente (índice parcial único).

CREATE TABLE dados_bancarios_cliente (
  id BIGSERIAL PRIMARY KEY,
  cliente_id BIGINT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  banco_codigo TEXT NOT NULL,
  banco_nome TEXT NOT NULL,
  agencia TEXT NOT NULL,
  agencia_digito TEXT,
  conta TEXT NOT NULL,
  conta_digito TEXT,
  tipo_conta TEXT NOT NULL CHECK (tipo_conta IN ('corrente', 'poupanca', 'pagamento')),
  chave_pix TEXT,
  tipo_chave_pix TEXT CHECK (tipo_chave_pix IN ('cpf', 'cnpj', 'email', 'telefone', 'aleatoria')),
  titular_cpf TEXT NOT NULL,
  titular_nome TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  observacoes TEXT,
  origem TEXT NOT NULL DEFAULT 'prestacao_contas' CHECK (origem IN ('prestacao_contas', 'cadastro_manual', 'importacao')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX ix_dados_bancarios_cliente_ativo_unico
  ON dados_bancarios_cliente (cliente_id)
  WHERE ativo = true;

CREATE INDEX ix_dados_bancarios_cliente_cliente
  ON dados_bancarios_cliente (cliente_id);

ALTER TABLE dados_bancarios_cliente ENABLE ROW LEVEL SECURITY;

CREATE POLICY dados_bancarios_admin_all ON dados_bancarios_cliente
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

COMMENT ON TABLE dados_bancarios_cliente IS
  'Dados bancários persistidos por cliente, reutilizáveis em repasses futuros. Flag ativo garante uma única conta vigente por cliente.';
