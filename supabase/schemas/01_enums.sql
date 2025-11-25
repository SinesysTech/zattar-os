-- Enums para o sistema de captura de dados jurídicos

-- Enum para grau do processo no TRT
create type public.grau_tribunal as enum (
  'primeiro_grau',
  'segundo_grau'
);
comment on type public.grau_tribunal is 'Grau do processo no tribunal (primeiro ou segundo grau)';

-- Enum para código do tribunal TRT
create type public.codigo_tribunal as enum (
  'TRT1',
  'TRT2',
  'TRT3',
  'TRT4',
  'TRT5',
  'TRT6',
  'TRT7',
  'TRT8',
  'TRT9',
  'TRT10',
  'TRT11',
  'TRT12',
  'TRT13',
  'TRT14',
  'TRT15',
  'TRT16',
  'TRT17',
  'TRT18',
  'TRT19',
  'TRT20',
  'TRT21',
  'TRT22',
  'TRT23',
  'TRT24'
);
comment on type public.codigo_tribunal is 'Código do Tribunal Regional do Trabalho (TRT1 a TRT24)';

-- Enum para gênero do usuário
create type public.genero_usuario as enum (
  'masculino',
  'feminino',
  'outro',
  'prefiro_nao_informar'
);
comment on type public.genero_usuario is 'Gênero do usuário do sistema';

-- Enum para tipo de pessoa (física ou jurídica)
create type public.tipo_pessoa as enum (
  'pf',
  'pj'
);
comment on type public.tipo_pessoa is 'Tipo de pessoa: física (pf) ou jurídica (pj)';

-- Enum para estado civil
create type public.estado_civil as enum (
  'solteiro',
  'casado',
  'divorciado',
  'viuvo',
  'uniao_estavel',
  'outro'
);
comment on type public.estado_civil is 'Estado civil da pessoa física';

-- Enum para área de direito
create type public.area_direito as enum (
  'trabalhista',
  'civil',
  'previdenciario',
  'criminal',
  'empresarial',
  'administrativo'
);
comment on type public.area_direito is 'Área de direito do contrato';

-- Enum para tipo de contrato
create type public.tipo_contrato as enum (
  'ajuizamento',
  'defesa',
  'ato_processual',
  'assessoria',
  'consultoria',
  'extrajudicial',
  'parecer'
);
comment on type public.tipo_contrato is 'Tipo de contrato jurídico';

-- Enum para tipo de cobrança
create type public.tipo_cobranca as enum (
  'pro_exito',
  'pro_labore'
);
comment on type public.tipo_cobranca is 'Tipo de cobrança do contrato';

-- Enum para status do contrato
create type public.status_contrato as enum (
  'em_contratacao',
  'contratado',
  'distribuido',
  'desistencia'
);
comment on type public.status_contrato is 'Status do contrato no sistema';

-- Enum para polo processual
create type public.polo_processual as enum (
  'autor',
  're'
);
comment on type public.polo_processual is 'Polo processual (autor ou ré)';

-- Enum para status de audiência
create type public.status_audiencia as enum (
  'C',  -- Cancelada
  'M',  -- Designada (Marcada)
  'F'   -- Realizada (Finalizada)
);
comment on type public.status_audiencia is 'Status da audiência: C=Cancelada, M=Designada, F=Realizada';

-- Enum para tipo de captura
create type public.tipo_captura as enum (
  'acervo_geral',
  'arquivados',
  'audiencias',
  'pendentes',
  'partes'
);
comment on type public.tipo_captura is 'Tipo de captura: acervo_geral, arquivados, audiencias, pendentes, partes';

