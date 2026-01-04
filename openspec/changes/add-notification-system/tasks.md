## 1. Database Schema
- [ ] 1.1 Criar enum `tipo_notificacao` com tipos: processo_atribuido, processo_movimentacao, audiencia_atribuida, audiencia_alterada, expediente_atribuido, expediente_alterado, prazo_vencendo, prazo_vencido
- [ ] 1.2 Criar tabela `notificacoes` com campos: id, usuario_id, tipo, titulo, descricao, entidade_tipo, entidade_id, lida, lida_em, dados_adicionais (jsonb), created_at, updated_at
- [ ] 1.3 Criar índices para performance: usuario_id, lida, created_at, entidade_tipo+entidade_id
- [ ] 1.4 Configurar RLS policies para notificacoes

## 2. Database Triggers
- [ ] 2.1 Criar função `criar_notificacao_processo_atribuido()` para quando `acervo.responsavel_id` é atribuído/alterado
- [ ] 2.2 Criar função `criar_notificacao_audiencia_atribuida()` para quando `audiencias.responsavel_id` é atribuído/alterado
- [ ] 2.3 Criar função `criar_notificacao_expediente_atribuido()` para quando `expedientes.responsavel_id` é atribuído/alterado
- [ ] 2.4 Criar função `criar_notificacao_movimentacao_processo()` para detectar mudanças significativas em processos atribuídos
- [ ] 2.5 Criar função `criar_notificacao_prazo_vencendo()` para alertar sobre prazos próximos

## 3. Feature Notificações (FSD)
- [ ] 3.1 Criar `src/features/notificacoes/domain.ts` com schemas Zod e tipos
- [ ] 3.2 Criar `src/features/notificacoes/repository.ts` com funções de acesso ao banco
- [ ] 3.3 Criar `src/features/notificacoes/service.ts` com casos de uso
- [ ] 3.4 Criar `src/features/notificacoes/actions/notificacoes-actions.ts` com Server Actions
- [ ] 3.5 Criar `src/features/notificacoes/index.ts` com barrel exports

## 4. Componente de Notificações
- [ ] 4.1 Atualizar `src/components/layout/header/notifications.tsx` para usar dados reais
- [ ] 4.2 Adicionar hook `use-notificacoes.ts` para buscar e gerenciar notificações
- [ ] 4.3 Implementar contador de notificações não lidas
- [ ] 4.4 Adicionar funcionalidade de marcar como lida ao clicar
- [ ] 4.5 Adicionar link para página de detalhes da entidade relacionada

## 5. Realtime
- [ ] 5.1 Configurar trigger de banco para broadcast via Supabase Realtime
- [ ] 5.2 Criar hook `use-notificacoes-realtime.ts` para escutar novas notificações
- [ ] 5.3 Integrar Realtime no componente de notificações

## 6. Testes e Validação
- [ ] 6.1 Testar criação de notificações via triggers
- [ ] 6.2 Testar Server Actions de notificações
- [ ] 6.3 Testar componente de notificações
- [ ] 6.4 Testar Realtime

