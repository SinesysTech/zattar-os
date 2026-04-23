-- Migration: Estender trigger fill_contrato_partes_nome_snapshot para suportar
--            partes contrárias transitórias.
-- Data: 2026-04-23 14:00:00
-- Motivação: A migration 20260422140000 adicionou 'parte_contraria_transitoria'
--            ao CHECK constraint de contrato_partes.tipo_entidade, mas o trigger
--            de preenchimento automático do nome_snapshot não foi atualizado.
--            Callers atuais escrevem nome_snapshot explicitamente (via API pública
--            de assinatura, RPC de promoção, server actions internas), mas o
--            trigger serve como safety net para inserções diretas (MCP tools,
--            importações em lote, admin SQL) que esqueçam de preencher o
--            snapshot.
--
-- Comportamento antes: tipo_entidade = 'parte_contraria_transitoria' + snapshot
--                      null → snapshot permanece null → bug silencioso no header.
-- Comportamento após:  trigger lê o nome em partes_contrarias_transitorias e
--                      popula automaticamente, exatamente como já faz para
--                      'cliente' e 'parte_contraria'.

create or replace function public.fill_contrato_partes_nome_snapshot()
returns trigger
language plpgsql
set search_path to ''
as $$
begin
  -- Se nome_snapshot já está preenchido, não faz nada
  if new.nome_snapshot is not null then
    return new;
  end if;

  -- Buscar nome baseado no tipo polimórfico de entidade
  if new.tipo_entidade = 'cliente' then
    select nome into new.nome_snapshot
    from public.clientes
    where id = new.entidade_id;
  elsif new.tipo_entidade = 'parte_contraria' then
    select nome into new.nome_snapshot
    from public.partes_contrarias
    where id = new.entidade_id;
  elsif new.tipo_entidade = 'parte_contraria_transitoria' then
    select nome into new.nome_snapshot
    from public.partes_contrarias_transitorias
    where id = new.entidade_id;
  end if;

  return new;
end;
$$;

comment on function public.fill_contrato_partes_nome_snapshot() is
  'Safety net BEFORE INSERT/UPDATE em contrato_partes: preenche nome_snapshot a partir da tabela alvo polimórfica (clientes, partes_contrarias ou partes_contrarias_transitorias) quando o caller esqueceu de escrever o snapshot explicitamente. Não substitui snapshots já preenchidos — idempotente.';
