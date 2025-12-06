-- ============================================================================
-- Schema: Dados Iniciais (Seed) do Módulo Financeiro
-- Sistema de Gestão Financeira (SGF)
-- ============================================================================
-- Dados iniciais para o plano de contas e centros de custo.
-- Execute após criar todas as tabelas do módulo financeiro.
--
-- NOTA: Este script é IDEMPOTENTE - pode ser executado múltiplas vezes sem
-- causar erros ou duplicar dados. Usa ON CONFLICT (codigo) DO NOTHING para
-- ignorar inserções de registros que já existem.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Plano de Contas Básico
-- ----------------------------------------------------------------------------
-- Estrutura hierárquica padrão para escritórios de advocacia.
-- Contas sintéticas (nível 1 e 2) não aceitam lançamentos.
-- Contas analíticas (nível 3+) aceitam lançamentos diretos.

-- 1. ATIVO (Bens e Direitos)
insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('1', 'ATIVO', 'Bens e direitos do escritório', 'ativo', 'devedora', 'sintetica', null, false, 1, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('1.1', 'Ativo Circulante', 'Bens e direitos realizáveis no curto prazo', 'ativo', 'devedora', 'sintetica',
  (select id from public.plano_contas where codigo = '1'), false, 2, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('1.1.01', 'Caixa e Bancos', 'Disponibilidades em caixa e contas bancárias', 'ativo', 'devedora', 'analitica',
  (select id from public.plano_contas where codigo = '1.1'), true, 3, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('1.1.02', 'Contas a Receber', 'Valores a receber de clientes e outros', 'ativo', 'devedora', 'analitica',
  (select id from public.plano_contas where codigo = '1.1'), true, 4, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('1.1.03', 'Aplicações Financeiras', 'Investimentos de curto prazo', 'ativo', 'devedora', 'analitica',
  (select id from public.plano_contas where codigo = '1.1'), true, 5, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('1.1.04', 'Adiantamentos', 'Adiantamentos a fornecedores e funcionários', 'ativo', 'devedora', 'analitica',
  (select id from public.plano_contas where codigo = '1.1'), true, 6, true)
on conflict (codigo) do nothing;

-- 2. PASSIVO (Obrigações)
insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('2', 'PASSIVO', 'Obrigações do escritório', 'passivo', 'credora', 'sintetica', null, false, 10, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('2.1', 'Passivo Circulante', 'Obrigações de curto prazo', 'passivo', 'credora', 'sintetica',
  (select id from public.plano_contas where codigo = '2'), false, 11, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('2.1.01', 'Contas a Pagar', 'Valores a pagar a fornecedores', 'passivo', 'credora', 'analitica',
  (select id from public.plano_contas where codigo = '2.1'), true, 12, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('2.1.02', 'Salários a Pagar', 'Salários e encargos a pagar', 'passivo', 'credora', 'analitica',
  (select id from public.plano_contas where codigo = '2.1'), true, 13, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('2.1.03', 'Impostos a Pagar', 'Tributos e contribuições a recolher', 'passivo', 'credora', 'analitica',
  (select id from public.plano_contas where codigo = '2.1'), true, 14, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('2.1.04', 'Repasses a Clientes', 'Valores de clientes a repassar', 'passivo', 'credora', 'analitica',
  (select id from public.plano_contas where codigo = '2.1'), true, 15, true)
on conflict (codigo) do nothing;

-- 3. RECEITAS
insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('3', 'RECEITAS', 'Receitas do escritório', 'receita', 'credora', 'sintetica', null, false, 20, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('3.1', 'Receitas Operacionais', 'Receitas da atividade principal', 'receita', 'credora', 'sintetica',
  (select id from public.plano_contas where codigo = '3'), false, 21, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('3.1.01', 'Honorários Advocatícios Contratuais', 'Honorários contratados com clientes', 'receita', 'credora', 'analitica',
  (select id from public.plano_contas where codigo = '3.1'), true, 22, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('3.1.02', 'Honorários Sucumbenciais', 'Honorários de sucumbência', 'receita', 'credora', 'analitica',
  (select id from public.plano_contas where codigo = '3.1'), true, 23, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('3.1.03', 'Consultorias e Pareceres', 'Receitas de consultorias jurídicas', 'receita', 'credora', 'analitica',
  (select id from public.plano_contas where codigo = '3.1'), true, 24, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('3.2', 'Receitas Financeiras', 'Receitas de aplicações e juros', 'receita', 'credora', 'sintetica',
  (select id from public.plano_contas where codigo = '3'), false, 25, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('3.2.01', 'Rendimentos de Aplicações', 'Rendimentos de investimentos financeiros', 'receita', 'credora', 'analitica',
  (select id from public.plano_contas where codigo = '3.2'), true, 26, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('3.2.02', 'Juros e Multas Recebidos', 'Juros e multas de clientes', 'receita', 'credora', 'analitica',
  (select id from public.plano_contas where codigo = '3.2'), true, 27, true)
on conflict (codigo) do nothing;

-- 4. DESPESAS
insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('4', 'DESPESAS', 'Despesas do escritório', 'despesa', 'devedora', 'sintetica', null, false, 30, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('4.1', 'Despesas com Pessoal', 'Despesas com funcionários', 'despesa', 'devedora', 'sintetica',
  (select id from public.plano_contas where codigo = '4'), false, 31, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('4.1.01', 'Salários e Ordenados', 'Salários dos funcionários', 'despesa', 'devedora', 'analitica',
  (select id from public.plano_contas where codigo = '4.1'), true, 32, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('4.1.02', 'Encargos Sociais', 'INSS, FGTS e outros encargos', 'despesa', 'devedora', 'analitica',
  (select id from public.plano_contas where codigo = '4.1'), true, 33, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('4.1.03', 'Benefícios', 'Vale-transporte, vale-refeição, plano de saúde', 'despesa', 'devedora', 'analitica',
  (select id from public.plano_contas where codigo = '4.1'), true, 34, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('4.1.04', 'Pró-Labore', 'Remuneração dos sócios', 'despesa', 'devedora', 'analitica',
  (select id from public.plano_contas where codigo = '4.1'), true, 35, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('4.2', 'Despesas Operacionais', 'Despesas da operação', 'despesa', 'devedora', 'sintetica',
  (select id from public.plano_contas where codigo = '4'), false, 36, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('4.2.01', 'Aluguel', 'Aluguel do escritório', 'despesa', 'devedora', 'analitica',
  (select id from public.plano_contas where codigo = '4.2'), true, 37, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('4.2.02', 'Condomínio', 'Taxa de condomínio', 'despesa', 'devedora', 'analitica',
  (select id from public.plano_contas where codigo = '4.2'), true, 38, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('4.2.03', 'Energia Elétrica', 'Conta de luz', 'despesa', 'devedora', 'analitica',
  (select id from public.plano_contas where codigo = '4.2'), true, 39, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('4.2.04', 'Água e Esgoto', 'Conta de água', 'despesa', 'devedora', 'analitica',
  (select id from public.plano_contas where codigo = '4.2'), true, 40, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('4.2.05', 'Telefone e Internet', 'Comunicações', 'despesa', 'devedora', 'analitica',
  (select id from public.plano_contas where codigo = '4.2'), true, 41, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('4.2.06', 'Material de Escritório', 'Papelaria e suprimentos', 'despesa', 'devedora', 'analitica',
  (select id from public.plano_contas where codigo = '4.2'), true, 42, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('4.2.07', 'Limpeza e Conservação', 'Serviços de limpeza', 'despesa', 'devedora', 'analitica',
  (select id from public.plano_contas where codigo = '4.2'), true, 43, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('4.3', 'Despesas Processuais', 'Custas e despesas de processos', 'despesa', 'devedora', 'sintetica',
  (select id from public.plano_contas where codigo = '4'), false, 44, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('4.3.01', 'Custas Processuais', 'Custas judiciais', 'despesa', 'devedora', 'analitica',
  (select id from public.plano_contas where codigo = '4.3'), true, 45, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('4.3.02', 'Honorários Periciais', 'Pagamento de peritos', 'despesa', 'devedora', 'analitica',
  (select id from public.plano_contas where codigo = '4.3'), true, 46, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('4.3.03', 'Diligências e Deslocamentos', 'Despesas com viagens e deslocamentos processuais', 'despesa', 'devedora', 'analitica',
  (select id from public.plano_contas where codigo = '4.3'), true, 47, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('4.4', 'Despesas Financeiras', 'Despesas com bancos e financeiras', 'despesa', 'devedora', 'sintetica',
  (select id from public.plano_contas where codigo = '4'), false, 48, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('4.4.01', 'Tarifas Bancárias', 'Taxas e tarifas de bancos', 'despesa', 'devedora', 'analitica',
  (select id from public.plano_contas where codigo = '4.4'), true, 49, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('4.4.02', 'Juros e Multas Pagos', 'Juros e multas por atraso', 'despesa', 'devedora', 'analitica',
  (select id from public.plano_contas where codigo = '4.4'), true, 50, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('4.5', 'Despesas com Tecnologia', 'Sistemas e infraestrutura de TI', 'despesa', 'devedora', 'sintetica',
  (select id from public.plano_contas where codigo = '4'), false, 51, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('4.5.01', 'Software e Licenças', 'Assinaturas de software', 'despesa', 'devedora', 'analitica',
  (select id from public.plano_contas where codigo = '4.5'), true, 52, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('4.5.02', 'Manutenção de Equipamentos', 'Manutenção de computadores e equipamentos', 'despesa', 'devedora', 'analitica',
  (select id from public.plano_contas where codigo = '4.5'), true, 53, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('4.5.03', 'Hospedagem e Cloud', 'Serviços de nuvem e hospedagem', 'despesa', 'devedora', 'analitica',
  (select id from public.plano_contas where codigo = '4.5'), true, 54, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('4.6', 'Tributos e Contribuições', 'Impostos sobre receita', 'despesa', 'devedora', 'sintetica',
  (select id from public.plano_contas where codigo = '4'), false, 55, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('4.6.01', 'ISS', 'Imposto Sobre Serviços', 'despesa', 'devedora', 'analitica',
  (select id from public.plano_contas where codigo = '4.6'), true, 56, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('4.6.02', 'PIS/COFINS', 'Contribuições federais', 'despesa', 'devedora', 'analitica',
  (select id from public.plano_contas where codigo = '4.6'), true, 57, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('4.6.03', 'IRPJ/CSLL', 'Imposto de Renda e Contribuição Social', 'despesa', 'devedora', 'analitica',
  (select id from public.plano_contas where codigo = '4.6'), true, 58, true)
on conflict (codigo) do nothing;

-- 5. PATRIMÔNIO LÍQUIDO
insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('5', 'PATRIMÔNIO LÍQUIDO', 'Capital próprio do escritório', 'patrimonio_liquido', 'credora', 'sintetica', null, false, 60, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('5.1', 'Capital Social', 'Capital integralizado pelos sócios', 'patrimonio_liquido', 'credora', 'sintetica',
  (select id from public.plano_contas where codigo = '5'), false, 61, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('5.1.01', 'Capital Subscrito', 'Capital subscrito pelos sócios', 'patrimonio_liquido', 'credora', 'analitica',
  (select id from public.plano_contas where codigo = '5.1'), true, 62, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('5.2', 'Reservas', 'Reservas de lucros', 'patrimonio_liquido', 'credora', 'sintetica',
  (select id from public.plano_contas where codigo = '5'), false, 63, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('5.2.01', 'Reserva de Lucros', 'Lucros acumulados', 'patrimonio_liquido', 'credora', 'analitica',
  (select id from public.plano_contas where codigo = '5.2'), true, 64, true)
on conflict (codigo) do nothing;

-- ----------------------------------------------------------------------------
-- Centros de Custo Básicos
-- ----------------------------------------------------------------------------
-- Estrutura para rastreamento de despesas por área do escritório.

insert into public.centros_custo (codigo, nome, descricao, centro_pai_id, ativo)
values ('ADM', 'Administrativo', 'Departamento administrativo e financeiro', null, true)
on conflict (codigo) do nothing;

insert into public.centros_custo (codigo, nome, descricao, centro_pai_id, ativo)
values ('JUD', 'Judicial', 'Área contenciosa e processos judiciais', null, true)
on conflict (codigo) do nothing;

insert into public.centros_custo (codigo, nome, descricao, centro_pai_id, ativo)
values ('CON', 'Consultoria', 'Consultoria jurídica e pareceres', null, true)
on conflict (codigo) do nothing;

insert into public.centros_custo (codigo, nome, descricao, centro_pai_id, ativo)
values ('TI', 'Tecnologia', 'Tecnologia da informação e sistemas', null, true)
on conflict (codigo) do nothing;

insert into public.centros_custo (codigo, nome, descricao, centro_pai_id, ativo)
values ('MKT', 'Marketing', 'Marketing e comunicação', null, true)
on conflict (codigo) do nothing;

-- Subcentros de custo (judicial por área)
insert into public.centros_custo (codigo, nome, descricao, centro_pai_id, ativo)
values ('JUD-TRAB', 'Judicial Trabalhista', 'Processos trabalhistas',
  (select id from public.centros_custo where codigo = 'JUD'), true)
on conflict (codigo) do nothing;

insert into public.centros_custo (codigo, nome, descricao, centro_pai_id, ativo)
values ('JUD-CIV', 'Judicial Cível', 'Processos cíveis',
  (select id from public.centros_custo where codigo = 'JUD'), true)
on conflict (codigo) do nothing;

insert into public.centros_custo (codigo, nome, descricao, centro_pai_id, ativo)
values ('JUD-PREV', 'Judicial Previdenciário', 'Processos previdenciários',
  (select id from public.centros_custo where codigo = 'JUD'), true)
on conflict (codigo) do nothing;

-- ----------------------------------------------------------------------------
-- Refresh da View Materializada
-- ----------------------------------------------------------------------------
-- Garante que a view materializada está atualizada após inserção dos dados.

-- Nota: Executar apenas se a view já existir
-- refresh materialized view public.v_lancamentos_pendentes;
