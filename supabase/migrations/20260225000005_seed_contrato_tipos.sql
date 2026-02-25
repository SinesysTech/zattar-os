-- Seed: popular contrato_tipos com valores do enum tipo_contrato
-- e contrato_tipos_cobranca com valores do enum tipo_cobranca

insert into public.contrato_tipos (nome, slug, descricao, ativo, ordem) values
  ('Ajuizamento', 'ajuizamento', 'Contrato para ajuizamento de ação judicial', true, 0),
  ('Defesa', 'defesa', 'Contrato para defesa em ação judicial', true, 1),
  ('Ato Processual', 'ato_processual', 'Contrato para ato processual específico', true, 2),
  ('Assessoria', 'assessoria', 'Contrato de assessoria jurídica', true, 3),
  ('Consultoria', 'consultoria', 'Contrato de consultoria jurídica', true, 4),
  ('Extrajudicial', 'extrajudicial', 'Contrato para atuação extrajudicial', true, 5),
  ('Parecer', 'parecer', 'Contrato para elaboração de parecer jurídico', true, 6)
on conflict (slug) do nothing;

insert into public.contrato_tipos_cobranca (nome, slug, descricao, ativo, ordem) values
  ('Pró-Êxito', 'pro_exito', 'Cobrança condicionada ao resultado favorável', true, 0),
  ('Pró-Labore', 'pro_labore', 'Cobrança pelo trabalho realizado independente do resultado', true, 1)
on conflict (slug) do nothing;
