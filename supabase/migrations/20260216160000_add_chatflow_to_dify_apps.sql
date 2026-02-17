-- Migration: Adicionar tipo 'chatflow' ao enum app_type da tabela dify_apps
-- Data: 2026-02-16
-- Descrição: Adiciona o tipo 'chatflow' que estava faltando na integração com Dify

-- Remover a constraint antiga
alter table dify_apps drop constraint if exists dify_apps_app_type_check;

-- Adicionar nova constraint com 'chatflow' incluído
alter table dify_apps add constraint dify_apps_app_type_check 
  check (app_type in ('chat', 'chatflow', 'workflow', 'completion', 'agent'));

-- Comentário explicativo
comment on column dify_apps.app_type is 
  'Tipo do aplicativo Dify: chat (chatbot básico), chatflow (conversas multi-turn com memória), workflow (tarefas single-turn), completion (geração de texto), agent (agente com ferramentas)';
