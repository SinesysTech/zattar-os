# Feature: Profiles (Perfis)

Sistema unificado de visualização de perfis para entidades como **Clientes**, **Partes Contrárias**, **Terceiros** e **Representantes**.

## Onde aparece no app

Uso típico em páginas de detalhes (exemplos):

- `src/app/app/partes/clientes/[id]/page.tsx`
- `src/app/app/partes/partes-contrarias/[id]/page.tsx`
- `src/app/app/partes/terceiros/[id]/page.tsx`
- `src/app/app/partes/representantes/[id]/page.tsx`

## Visão geral

Esta feature fornece uma UI consistente e configurável para exibição de perfis, baseada no componente `ProfileShell`.
O `ProfileShell` carrega uma configuração por tipo de entidade e renderiza header, sidebar e tabs conforme a configuração.

## Estrutura

- `components/`: componentes de UI
  - `profile-layout/`: layout base (Header, Sidebar, Tabs)
  - `sections/`: seções reutilizáveis (InfoCards, RelatedTable, ActivityTimeline, etc.)
- `configs/`: configurações por entidade
- `hooks/`: hooks de carregamento de dados
- `utils/`: adaptadores e helpers

## Como adicionar um novo tipo de perfil

1. Crie um config em `configs/` (ex.: `minha-entidade-profile.config.ts`).
2. Defina o objeto `ProfileConfig` para o novo tipo.
3. Se necessário, estenda o hook `useProfileData` para buscar dados específicos.
4. Atualize adaptadores em `utils/profile-adapters.ts` (se aplicável).
5. Use o shell na página:

```tsx
<ProfileShell entityType="minha_entidade" entityId={id} />
```

## Data fetching

Os dados são carregados via `useProfileData`, que orquestra a chamada das Server Actions apropriadas.
Entidades relacionadas podem ser buscadas conforme configuração/necessidade.
