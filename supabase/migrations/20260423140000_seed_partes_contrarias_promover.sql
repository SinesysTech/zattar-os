-- Migration: Seed da permissão partes_contrarias.promover
-- Data: 2026-04-23 14:00:00
-- Descrição: Concede a nova operação granular `partes_contrarias.promover`
--            para todos os usuários que atualmente têm `partes_contrarias.criar=true`.
--
-- Motivação: a promoção de parte contrária transitória (Fase 2.6) usa esta
-- operação específica para permitir gate mais fino — firmas podem restringir
-- quem promove sem revogar a permissão geral de criar partes contrárias.
-- Sem este seed, ninguém conseguiria promover transitórias no dia seguinte
-- ao deploy (regressão), pois o bit novo começa desligado por padrão.
--
-- Idempotência: ON CONFLICT DO NOTHING protege contra re-aplicação.
-- Políticas RLS da tabela permissoes são respeitadas (service_role bypass).

insert into public.permissoes (usuario_id, recurso, operacao, permitido)
select usuario_id, 'partes_contrarias', 'promover', permitido
from public.permissoes
where recurso = 'partes_contrarias'
  and operacao = 'criar'
  and permitido = true
on conflict (usuario_id, recurso, operacao) do nothing;
