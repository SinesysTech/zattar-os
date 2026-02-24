## Why

A página de detalhes do usuário possui um componente "Atividades Recentes" que exibe apenas um placeholder ("Sistema de auditoria em desenvolvimento"). O banco de dados já possui a tabela `logs_alteracao` com triggers que registram ações de negócio (atribuições, transferências, mudanças de status) nas entidades principais. A infraestrutura de dados existe — falta apenas expor esses dados no frontend. Gestores precisam visualizar o histórico de ações de cada membro da equipe para acompanhamento de produtividade e rastreabilidade operacional.

## What Changes

- Criar repository para consultar `logs_alteracao` filtrada por `usuario_que_executou_id` com paginação
- Criar server action protegida por permissão para expor os logs ao frontend
- Substituir o componente placeholder `AtividadesRecentes` por uma timeline funcional que exibe as últimas ações do usuário com ícones por tipo de evento, descrições humanizadas e timestamps relativos
- Reutilizar o padrão visual do `AuthLogsTimeline` existente na feature de usuários

## Capabilities

### New Capabilities
- `audit-atividades`: Consulta e exibição de logs de atividades de negócio — repository de consulta paginada sobre `logs_alteracao`, server action com controle de permissão, e componente de timeline

### Modified Capabilities
- `usuarios-frontend`: Adicionar requirement para exibição de atividades recentes na página de detalhes do usuário (substituir placeholder por timeline funcional)

## Impact

- **Banco de dados**: Nenhuma alteração — usa tabela `logs_alteracao` existente com triggers já ativos
- **Backend**: Novo repository (`repository-audit-atividades.ts`), nova server action (`audit-atividades-actions.ts`) na feature `usuarios`
- **Frontend**: Componente `AtividadesRecentes` reescrito com timeline real, seguindo padrão do `AuthLogsTimeline`
- **Dependências**: `date-fns` já disponível no projeto (usado pelo `AuthLogsTimeline`)
