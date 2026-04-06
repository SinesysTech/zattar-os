# Regras de Negocio - Assistentes

## Contexto
Gerenciamento de assistentes de IA e iframes embarcados no sistema. Permite cadastrar tanto assistentes Dify (IA) quanto iframes externos.

## Estrutura
- `feature/domain.ts` — Schemas Zod e tipos para assistentes
- `feature/service.ts` — Logica de negocio
- `feature/repository.ts` — Acesso a dados Supabase
- `feature/actions/` — Server Actions
- `feature/components/` — Dialogs (criar/editar/deletar), formulario, grid de cards
- `feature/hooks/` — `use-assistentes` (listagem) e `use-assistente-mutations` (CRUD)

## Regras Principais
- **Dois tipos**: `iframe` (codigo HTML embarcado) e `dify` (vinculado a app Dify via UUID)
- **Schemas separados por tipo**: `criarAssistenteIframeSchema` exige `iframe_code`, `criarAssistenteDifySchema` exige `dify_app_id` (UUID)
- **Status ativo/inativo**: Campo `ativo` booleano controla visibilidade
- **Limites de validacao**: Nome max 200 chars, descricao max 1000 chars
- **Busca e filtro**: Suporta `busca` (texto) e `ativo` (booleano) como parametros de listagem
- **Grid view**: Exibicao em cards, nao em tabela
- **Criador rastreado**: Campo `criado_por` vincula ao usuario que criou
