-- Migration: corrigir tipo do parâmetro p_resultado_decisao em baixar_expediente_atomic
--
-- Contexto: a migration 20260424140000_baixa_expediente_atomic.sql criou a função
-- com `p_resultado_decisao text`, mas a coluna `expedientes.resultado_decisao`
-- é do tipo `public.resultado_decisao_enum` (criado em 20260324142329).
--
-- O `UPDATE expedientes SET resultado_decisao = p_resultado_decisao` falha em
-- runtime com "column 'resultado_decisao' is of type public.resultado_decisao_enum
-- but expression is of type text" porque Postgres não faz cast implícito de
-- text para enum.
--
-- O bug ficou latente até agora porque, quando o caller passa NULL (a maioria
-- dos tipos de expediente, que não são recursais), Postgres aceita NULL para
-- qualquer tipo. Só quando um expediente recursal é baixado — onde o
-- formulário exige preencher 'favoravel'/'parcialmente_favoravel'/'desfavoravel'
-- — o erro aparece.
--
-- Correção: mudar o tipo do parâmetro para o enum. Não adicionamos um cast no
-- UPDATE porque o contrato da função deve refletir o domínio real; o tipo enum
-- no parâmetro faz Postgres rejeitar strings inválidas já na invocação JSON-RPC
-- e expõe o tipo correto via database.types.ts regenerado.
--
-- CREATE OR REPLACE FUNCTION não permite mudar tipo de parâmetro, então
-- precisamos DROP + CREATE com a assinatura nova.

drop function if exists public.baixar_expediente_atomic(
  bigint, bigint, text, text, timestamptz, text
);

create function public.baixar_expediente_atomic(
  p_expediente_id bigint,
  p_usuario_id bigint,
  p_protocolo_id text default null,
  p_justificativa text default null,
  p_baixado_em timestamptz default null,
  p_resultado_decisao public.resultado_decisao_enum default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_expediente public.expedientes%rowtype;
begin
  if p_expediente_id is null or p_expediente_id <= 0 then
    raise exception 'ID de expediente inválido.';
  end if;

  -- Invariante: precisa ter protocolo OU justificativa.
  if (p_protocolo_id is null or length(trim(p_protocolo_id)) = 0)
     and (p_justificativa is null or length(trim(p_justificativa)) = 0) then
    raise exception 'Informe protocolo ou justificativa para a baixa.';
  end if;

  -- Contexto para triggers de log downstream
  perform set_config('app.current_user_id', p_usuario_id::text, true);

  -- UPDATE + RETURNING atômico. Se expediente não existir, v_expediente.id será null.
  update public.expedientes
  set baixado_em = coalesce(p_baixado_em, now()),
      protocolo_id = p_protocolo_id,
      justificativa_baixa = p_justificativa,
      resultado_decisao = p_resultado_decisao,
      updated_at = now()
  where id = p_expediente_id
  returning * into v_expediente;

  if v_expediente.id is null then
    raise exception 'Expediente % não encontrado.', p_expediente_id;
  end if;

  -- Auditoria na mesma transação
  insert into public.logs_alteracao (
    tipo_entidade,
    entidade_id,
    tipo_evento,
    usuario_que_executou_id,
    dados_evento
  ) values (
    'expedientes',
    p_expediente_id,
    'baixa_expediente',
    p_usuario_id,
    jsonb_build_object(
      'protocolo_id', p_protocolo_id,
      'justificativa_baixa', p_justificativa,
      'baixado_em', v_expediente.baixado_em,
      'resultado_decisao', p_resultado_decisao
    )
  );

  return to_jsonb(v_expediente);
end;
$$;

grant execute on function public.baixar_expediente_atomic(
  bigint, bigint, text, text, timestamptz, public.resultado_decisao_enum
) to service_role;

comment on function public.baixar_expediente_atomic(
  bigint, bigint, text, text, timestamptz, public.resultado_decisao_enum
) is
  'Baixa um expediente (UPDATE) + registra log de auditoria em uma única transação. Rollback se algum passo falhar.';
