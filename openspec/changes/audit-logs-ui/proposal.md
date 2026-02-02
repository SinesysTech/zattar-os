# Implementação de Logs de Auditoria e Visualização

## Objetivo

Implementar um sistema robusto de logs de auditoria para **Audiências**, **Expedientes** e **Perícias**, registrando qualquer alteração feita por usuários (não-sistêmica) e permitindo a visualização desse histórico em uma linha do tempo na interface.

## Contexto

Atualmente, o sistema registra apenas alterações de "Responsável" e "Baixa de Expediente" na tabela `logs_alteracao`. Alterações em outros campos (datas, status, observações) feitas manualmente passam despercebidas. O usuário necessita de rastreabilidade total.

## Requisitos

1.  **Backend (DB/Triggers)**:
    - Criar trigger genérico `log_user_changes` que compara `OLD` vs `NEW`.
    - Ignorar alterações feitas pelo usuário de sistema (robôs/captura).
    - Ignorar colunas de controle interno (`updated_at`, `created_at`, `dados_anteriores`).
    - Aplicar trigger nas tabelas: `audiencias`, `expedientes`, `pericias`.
2.  **Frontend (UI)**:
    - Criar componente `TimelineHistory` ou `AuditLogViewer`.
    - Adicionar aba "Histórico" nos dialogs de detalhes de Audiência, Expediente e Perícia.
    - Exibir: Data/Hora, Usuário, Tipo de Evento (Edição, Criação), Detalhes (Campo X mudou de A para B).

## Plano de Implementação

1.  Criar migration com a função de trigger genérica.
2.  Aplicar trigger nas tabelas alvo.
3.  Criar Server Action ou Service para buscar logs por `entidade` e `entidade_id`.
4.  Desenvolver componente UI de Timeline.
5.  Integrar nas telas de detalhes.
