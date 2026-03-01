-- Adiciona foreign key entre assinatura_digital_assinaturas.cliente_id e clientes.id
-- Necessário para que o PostgREST (Supabase) resolva automaticamente o join
-- com clientes(nome) na query de listagem de documentos.

ALTER TABLE public.assinatura_digital_assinaturas
  ADD CONSTRAINT assinatura_digital_assinaturas_cliente_id_fkey
  FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE RESTRICT;
