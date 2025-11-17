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

