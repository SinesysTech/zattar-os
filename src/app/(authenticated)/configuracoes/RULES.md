# Regras de Negocio - Configuracoes

## Contexto
Painel administrativo de configuracoes do sistema. Acesso restrito a admins — redireciona para dashboard se acesso negado.

## Estrutura
- `components/configuracoes-settings-layout.tsx` — Layout principal com navegacao lateral por abas
- `components/settings-nav-items.ts` — Definicao de abas, grupos e links externos
- `components/settings-nav.tsx` / `settings-mobile-nav.tsx` — Navegacao desktop e mobile
- `components/aparencia-content.tsx` — Configuracoes de tema e aparencia

## Abas Disponiveis
- **Sistema**: Metricas DB (saude do banco, cache, queries lentas), Seguranca (IPs bloqueados, politicas de acesso)
- **Integracoes**: Servicos externos (2FAuth, Chatwoot, Dyte, Editor IA), Assistentes IA (apps Dify)
- **Personalizacao**: Aparencia (tema, cores, tipografia), Prompts IA (prompts de sistema)

## Regras Principais
- **Acesso admin-only**: Server Component verifica permissao via `actionObterMetricasDB`; redireciona com `redirect()` se acesso negado
- **Dados pre-carregados**: Todas as integracoes e prompts sao buscados em paralelo no Server Component via `Promise.all`
- **Integracoes por tipo**: Cada tipo (twofauth, chatwoot, dyte, editor_ia) busca a integracao ativa ou a primeira disponivel
- **Link externo**: Gerenciamento de usuarios redireciona para `/app/usuarios`
- **force-dynamic**: Pagina sempre renderizada no servidor (`export const dynamic = "force-dynamic"`)
