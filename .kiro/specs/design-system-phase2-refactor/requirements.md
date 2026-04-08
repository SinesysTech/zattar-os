# Documento de Requisitos — Fase 2: Refatoração do Design System (Módulos Restantes)

## Introdução

Este documento define os requisitos para a Fase 2 da refatoração de consistência visual do Sinesys/Zattar OS. A Fase 1 migrou com sucesso os módulos **partes** (padrão ouro), **processos**, **contratos**, **assinatura-digital**, **audiências** e **expedientes**. A Fase 2 expande a refatoração para todos os módulos e páginas restantes do sistema, aplicando o mesmo padrão ouro para garantir consistência visual e arquitetural completa.

### Módulos Identificados para Migração

Os módulos foram agrupados por complexidade e criticidade:

**Grupo A — Módulos Complexos (muitas páginas, sub-rotas, componentes ricos):**
financeiro, dashboard, captura, obrigacoes, usuarios, chat, pericias, rh

**Grupo B — Módulos Médios (funcionalidade focada, algumas sub-rotas):**
tarefas, documentos, pecas-juridicas, project-management, agenda/calendar, assistentes, notas, mail

**Grupo C — Módulos Leves (poucas páginas, funcionalidade simples):**
configuracoes, notificacoes, perfil, tipos-expedientes, repasses, pangea, entrevistas-trabalhistas, acervo, admin, calculadoras, enderecos, cargos, advogados, comunica-cnj, editor, ajuda

## Glossário

- **Design_System**: Conjunto de protocolos visuais e arquiteturais definidos em `design-system-protocols.md`, incluindo regras de layout, badges, tipografia, espaçamento e cores
- **PageShell**: Componente wrapper obrigatório para todas as páginas, localizado em `@/components/shared/page-shell`
- **DataShell**: Componente wrapper para tabelas de dados com toolbar integrada, localizado em `@/components/shared/data-shell`
- **getSemanticBadgeVariant**: Função centralizada em `@/lib/design-system` para obter variantes semânticas de badges sem hardcodear cores
- **Typography**: Componentes de tipografia semântica (`Heading`, `Typography.H1`, etc.) em `@/components/ui/typography`
- **FSD**: Feature-Sliced Design — arquitetura de módulos colocados com barrel exports obrigatórios via `index.ts`
- **Barrel_Export**: Arquivo `index.ts` que serve como API pública do módulo, centralizando todas as exportações
- **RULES_MD**: Arquivo `RULES.md` obrigatório em cada módulo, documentando regras de negócio para agentes de IA
- **Módulo_Alvo**: Qualquer um dos módulos a ser refatorado nesta Fase 2
- **Padrão_Ouro**: O módulo partes, que serve como referência de implementação correta do Design System
- **Grid_4px**: Sistema de espaçamento baseado em múltiplos de 4px, com valores permitidos: 0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 8, 10, 12, 14, 16, 20, 24

## Requisitos

### Requisito 1: Migração do Módulo Financeiro para o Design System

**User Story:** Como desenvolvedor, quero que o módulo financeiro siga o mesmo padrão visual do módulo partes, para manter consistência visual em todo o sistema.

**Diagnóstico Atual:**
- `layout.tsx` existe mas NÃO usa PageShell (usa `<div className="space-y-4">` manual)
- Usa `oklch()` direto em `dre/page-client.tsx` (color-mix com oklch para paleta de gráficos)
- Estrutura FSD divergente: usa `domain/` (pasta com múltiplos arquivos), `services/` (pasta), `repository/` (pasta) em vez de arquivos únicos na raiz
- Possui `server-actions.ts` e `server.ts` na raiz em vez de pasta `actions/`
- Módulo grande com sub-rotas: contas-pagar, contas-receber, conciliacao-bancaria, dre, orcamentos, plano-contas, relatorios

#### Critérios de Aceitação

1. WHEN a página principal do financeiro é renderizada, THE Módulo_Alvo SHALL utilizar PageShell como wrapper via `layout.tsx` (substituir o `<div className="space-y-4">` atual)
2. WHEN qualquer sub-página do financeiro é renderizada, THE Módulo_Alvo SHALL garantir que PageShell é herdado do layout pai ou aplicado localmente
3. THE Módulo_Alvo SHALL substituir todas as ocorrências de `oklch()` direto em `dre/page-client.tsx` por variáveis CSS do tema ou paleta de gráficos do Design System
4. THE Módulo_Alvo SHALL garantir que todos os headings utilizem componentes Typography (Heading) em vez de tags HTML com classes inline
5. THE Módulo_Alvo SHALL garantir que todos os badges utilizem getSemanticBadgeVariant em vez de funções locais ou cores hardcoded
6. THE Módulo_Alvo SHALL garantir que todos os espaçamentos seguem o Grid_4px sem valores arbitrários
7. THE Módulo_Alvo SHALL remover qualquer cor inline (`bg-{cor}-{shade}`, `text-{cor}-{shade}`) de componentes de feature, delegando ao Design System
8. THE Módulo_Alvo SHALL consolidar a estrutura FSD: migrar `domain/` (pasta) para `domain.ts` (arquivo único com re-exports), `services/` para `service.ts`, `repository/` para `repository.ts`, e `server-actions.ts` para pasta `actions/` com `index.ts`
9. THE Módulo_Alvo SHALL organizar o Barrel_Export (`index.ts`) com seções claras: Components, Hooks, Actions, Types/Domain, Utils, Errors

### Requisito 2: Migração do Módulo Dashboard para o Design System

**User Story:** Como desenvolvedor, quero que o módulo dashboard siga o mesmo padrão visual do módulo partes, para manter consistência visual em todo o sistema.

**Diagnóstico Atual:**
- `layout.tsx` já usa PageShell corretamente
- Uso extensivo de `oklch()` em widgets: `obrigacoes-treemap.tsx`, `despesas-treemap.tsx`, `meu-dia.tsx`, `aging-funnel.tsx`
- Uso extensivo de `oklch()` em mocks: `section-financeiro.tsx`, `section-expedientes.tsx`, `section-contratos.tsx`, `section-pessoal.tsx`, `primitives.tsx`, `command-hub/page.tsx`
- Headings manuais em `dashboard-unificada.tsx`
- Estrutura FSD divergente: usa `repositories/` (pasta), `services/` (pasta), `registry/`, `widgets/`, `mock/`, `v2/`

#### Critérios de Aceitação

1. THE Módulo_Alvo SHALL manter o uso correto de PageShell que já existe no `layout.tsx`
2. THE Módulo_Alvo SHALL substituir todas as ocorrências de `oklch()` direto nos widgets (`obrigacoes-treemap.tsx`, `despesas-treemap.tsx`, `meu-dia.tsx`, `aging-funnel.tsx`) por variáveis CSS do tema
3. THE Módulo_Alvo SHALL substituir todas as ocorrências de `oklch()` direto nos mocks (`section-financeiro.tsx`, `section-expedientes.tsx`, `section-contratos.tsx`, `section-pessoal.tsx`, `primitives.tsx`, `command-hub/page.tsx`) por variáveis CSS do tema
4. THE Módulo_Alvo SHALL substituir headings manuais em `dashboard-unificada.tsx` por componentes Typography
5. THE Módulo_Alvo SHALL garantir que todos os espaçamentos seguem o Grid_4px sem valores arbitrários
6. THE Módulo_Alvo SHALL remover qualquer cor inline de componentes de feature, delegando ao Design System
7. THE Módulo_Alvo SHALL consolidar a estrutura FSD: migrar `repositories/` para `repository.ts`, `services/` para `service.ts`, e organizar o Barrel_Export com seções claras

### Requisito 3: Migração do Módulo Captura para o Design System

**User Story:** Como desenvolvedor, quero que o módulo captura siga o mesmo padrão visual do módulo partes, para manter consistência visual em todo o sistema.

**Diagnóstico Atual:**
- Sem `layout.tsx` (page.tsx redireciona para sub-rota)
- Sub-páginas (advogados, credenciais, tribunais, historico/[id]) já usam PageShell individualmente
- Já usa `getSemanticBadgeVariant` corretamente em `captura-list.tsx`, `captura-erros-formatados.tsx`, `captura-raw-logs.tsx`, `agendamentos-list.tsx`
- Estrutura FSD divergente: usa `services/` (pasta com muitos subserviços), `types/` (pasta), `drivers/`, `credentials/`
- Sem `actions/index.ts` (actions espalhadas sem barrel)

#### Critérios de Aceitação

1. WHEN qualquer sub-página da captura é renderizada, THE Módulo_Alvo SHALL garantir que PageShell é utilizado (verificar cobertura completa em todas as sub-rotas: historico, agendamentos, advogados, credenciais, tribunais, configuracoes)
2. THE Módulo_Alvo SHALL manter o uso correto de getSemanticBadgeVariant que já existe nos componentes de listagem
3. THE Módulo_Alvo SHALL garantir que todos os headings utilizem componentes Typography em vez de tags HTML com classes inline (verificar `configuracoes/assistentes-tipos/page.tsx` que usa `<h1 className>`)
4. THE Módulo_Alvo SHALL garantir que todos os espaçamentos seguem o Grid_4px sem valores arbitrários
5. THE Módulo_Alvo SHALL remover qualquer cor inline de componentes de feature, delegando ao Design System
6. THE Módulo_Alvo SHALL consolidar a estrutura FSD: criar `actions/index.ts` com barrel export, consolidar `services/` com barrel export ou `service.ts`, consolidar `types/` com barrel export
7. THE Módulo_Alvo SHALL organizar o Barrel_Export (`index.ts`) com seções claras

### Requisito 4: Migração do Módulo Obrigações para o Design System

**User Story:** Como desenvolvedor, quero que o módulo obrigações siga o mesmo padrão visual do módulo partes, para manter consistência visual em todo o sistema.

**Diagnóstico Atual:**
- Sem `layout.tsx` (page.tsx redireciona para sub-rota lista)
- Sub-páginas usam PageShell em alguns casos (editar, novo) mas não em todos
- Já usa `getSemanticBadgeVariant` em `table/columns.tsx` para obrigacao_tipo, obrigacao_direcao, obrigacao_status
- Possui funções locais de cor: `getTipoColorClass`, `getDirecaoColorClass`, `getStatusColorClass` em `utils.ts`
- Possui funções locais de badge: `getStatusBadge` em `repasses-pendentes-list.tsx`, `getStatusBadge` e `getStatusRepasseBadge` em `parcelas-table.tsx`
- Headings manuais em `[id]/page.tsx` (`<h1 className>`, `<h2 className>`)
- Já usa DataShell/DataTableToolbar em table, calendar/year, calendar/month
- Possui `server-actions.ts` e `server.ts` na raiz além de pasta `actions/`
- Usa Typography parcialmente (obrigacoes/novo, obrigacoes/[id]/editar, repasses-pendentes-list)

#### Critérios de Aceitação

1. WHEN qualquer página de obrigações é renderizada, THE Módulo_Alvo SHALL garantir que PageShell é utilizado (criar `layout.tsx` ou garantir cobertura em todas as sub-rotas: lista, mes, semana, ano, [id], [id]/editar, novo)
2. THE Módulo_Alvo SHALL remover as funções locais `getTipoColorClass`, `getDirecaoColorClass` e `getStatusColorClass` de `utils.ts`, migrando para getSemanticBadgeVariant com categorias já registradas
3. THE Módulo_Alvo SHALL remover as funções locais `getStatusBadge` de `repasses-pendentes-list.tsx` e `getStatusBadge`/`getStatusRepasseBadge` de `parcelas-table.tsx`, migrando para getSemanticBadgeVariant com novas categorias `parcela_status` e `repasse_status`
4. THE Módulo_Alvo SHALL substituir headings manuais em `[id]/page.tsx` e `components/calendar/obrigacoes-day-list.tsx` por componentes Typography
5. THE Módulo_Alvo SHALL manter o uso correto de getSemanticBadgeVariant e DataShell que já existe em `table/columns.tsx` e wrappers de calendário
6. THE Módulo_Alvo SHALL garantir que todos os espaçamentos seguem o Grid_4px sem valores arbitrários
7. THE Módulo_Alvo SHALL remover qualquer cor inline de componentes de feature, delegando ao Design System
8. THE Módulo_Alvo SHALL consolidar a estrutura FSD: remover `server-actions.ts` e `server.ts` da raiz, migrar para pasta `actions/` com `index.ts`
9. THE Módulo_Alvo SHALL organizar o Barrel_Export (`index.ts`) com seções claras

### Requisito 5: Migração do Módulo Perícias para o Design System

**User Story:** Como desenvolvedor, quero que o módulo perícias siga o mesmo padrão visual do módulo partes, para manter consistência visual em todo o sistema.

**Diagnóstico Atual:**
- Sem `layout.tsx` (cada sub-página usa PageShell individualmente em page.tsx, mes, semana, ano, lista)
- Possui funções locais de badge: `getSituacaoVariant` duplicada em `columns.tsx` e `pericia-detalhes-dialog.tsx`, `getBadgeVariant` em `pericias-day-list.tsx`
- Headings manuais em `pericias-client.tsx` (`<h3 className>`)
- Sem `actions/index.ts` (apenas `actions/pericias-actions.ts` sem barrel)
- Possui `types.ts` separado do `domain.ts`

#### Critérios de Aceitação

1. WHEN qualquer página de perícias é renderizada, THE Módulo_Alvo SHALL utilizar PageShell via `layout.tsx` centralizado (substituir o uso individual em cada page.tsx)
2. THE Módulo_Alvo SHALL remover as funções locais `getSituacaoVariant` de `columns.tsx` e `pericia-detalhes-dialog.tsx`, e `getBadgeVariant` de `pericias-day-list.tsx`, migrando para getSemanticBadgeVariant com nova categoria `pericia_situacao` registrada em `variants.ts`
3. THE Módulo_Alvo SHALL substituir headings manuais em `pericias-client.tsx` por componentes Typography
4. THE Módulo_Alvo SHALL garantir que todos os espaçamentos seguem o Grid_4px sem valores arbitrários
5. THE Módulo_Alvo SHALL remover qualquer cor inline de componentes de feature, delegando ao Design System
6. THE Módulo_Alvo SHALL consolidar a estrutura FSD: criar `actions/index.ts` com barrel export, consolidar `types.ts` dentro de `domain.ts`
7. THE Módulo_Alvo SHALL organizar o Barrel_Export (`index.ts`) com seções claras

### Requisito 6: Migração do Módulo Usuários para o Design System

**User Story:** Como desenvolvedor, quero que o módulo usuários siga o mesmo padrão visual do módulo partes, para manter consistência visual em todo o sistema.

**Diagnóstico Atual:**
- Sem `layout.tsx` (page.tsx renderiza `<UsuariosPageContent />` direto)
- Headings manuais em `perfil-view.tsx` (referenciado via componentes de detalhe)
- Múltiplos repositories na raiz: `repository.ts`, `repository-atividades.ts`, `repository-audit-atividades.ts`, `repository-auth-logs.ts`
- Possui `services/` (pasta), `types/` (pasta)
- Sem `actions/index.ts` (actions espalhadas sem barrel)

#### Critérios de Aceitação

1. WHEN a página de usuários é renderizada, THE Módulo_Alvo SHALL utilizar PageShell como wrapper (criar `layout.tsx` ou aplicar PageShell no `page.tsx`)
2. THE Módulo_Alvo SHALL garantir que todos os headings utilizem componentes Typography em vez de tags HTML com classes inline
3. THE Módulo_Alvo SHALL garantir que todos os badges utilizem getSemanticBadgeVariant em vez de cores hardcoded
4. THE Módulo_Alvo SHALL garantir que todos os espaçamentos seguem o Grid_4px sem valores arbitrários
5. THE Módulo_Alvo SHALL remover qualquer cor inline de componentes de feature, delegando ao Design System
6. THE Módulo_Alvo SHALL consolidar a estrutura FSD: unificar repositories em `repository.ts` com barrel, consolidar `services/` em `service.ts`, consolidar `types/` em `domain.ts`, criar `actions/index.ts`
7. THE Módulo_Alvo SHALL organizar o Barrel_Export (`index.ts`) com seções claras

### Requisito 7: Migração do Módulo Chat para o Design System

**User Story:** Como desenvolvedor, quero que o módulo chat siga o mesmo padrão visual do módulo partes, para manter consistência visual em todo o sistema.

**Diagnóstico Atual:**
- Sem `layout.tsx` (page.tsx renderiza `<ChatLayout>` direto com `<div className="flex h-full flex-col">`)
- Uso massivo de cores hardcoded nos componentes de videochamada: `bg-gray-950`, `bg-gray-900`, `bg-gray-800`, `bg-gray-700`, `bg-gray-600` em `meeting-error-boundary.tsx`, `layout-switcher.tsx`, `custom-meeting-ui.tsx`, `video-call-dialog.tsx`, `custom-video-grid.tsx`, `meeting-skeleton.tsx`, `custom-call-controls.tsx`
- Sem `actions/index.ts` (actions espalhadas sem barrel)
- Possui `utils/` (pasta) e `utils.ts` (arquivo) duplicados
- Possui `components/types.ts` e `components/useChatStore.ts` fora do padrão FSD

#### Critérios de Aceitação

1. WHEN a página de chat é renderizada, THE Módulo_Alvo SHALL utilizar PageShell como wrapper (criar `layout.tsx` ou aplicar no `page.tsx`)
2. THE Módulo_Alvo SHALL substituir todas as cores hardcoded (`bg-gray-950`, `bg-gray-900`, `bg-gray-800`, `bg-gray-700`, `bg-gray-600`, `border-gray-800`, `text-gray-300`, `text-gray-400`) nos componentes de videochamada por variáveis CSS semânticas do tema (`bg-background`, `bg-card`, `bg-muted`, `border-border`, `text-muted-foreground`)
3. THE Módulo_Alvo SHALL garantir que todos os headings utilizem componentes Typography em vez de tags HTML com classes inline
4. THE Módulo_Alvo SHALL garantir que todos os espaçamentos seguem o Grid_4px sem valores arbitrários
5. THE Módulo_Alvo SHALL consolidar a estrutura FSD: criar `actions/index.ts`, mover `components/types.ts` para `domain.ts`, mover `components/useChatStore.ts` para `hooks/` ou `store.ts`
6. THE Módulo_Alvo SHALL organizar o Barrel_Export (`index.ts`) com seções claras

### Requisito 8: Migração do Módulo RH para o Design System

**User Story:** Como desenvolvedor, quero que o módulo RH siga o mesmo padrão visual do módulo partes, para manter consistência visual em todo o sistema.

**Diagnóstico Atual:**
- Sem `layout.tsx` (page.tsx é client component que usa PageShell diretamente)
- Possui `types.ts` separado do `domain.ts`
- Sem `actions/index.ts` (actions espalhadas: `folhas-pagamento-actions.ts`, `salarios-actions.ts`)
- Sub-rotas: folhas-pagamento, salarios (com sub-rotas próprias)

#### Critérios de Aceitação

1. WHEN a página de RH é renderizada, THE Módulo_Alvo SHALL utilizar PageShell via `layout.tsx` centralizado (substituir o uso direto no page.tsx client component)
2. THE Módulo_Alvo SHALL garantir que todos os headings utilizem componentes Typography em vez de tags HTML com classes inline
3. THE Módulo_Alvo SHALL garantir que todos os badges utilizem getSemanticBadgeVariant em vez de cores hardcoded
4. THE Módulo_Alvo SHALL garantir que todos os espaçamentos seguem o Grid_4px sem valores arbitrários
5. THE Módulo_Alvo SHALL remover qualquer cor inline de componentes de feature, delegando ao Design System
6. THE Módulo_Alvo SHALL consolidar a estrutura FSD: criar `actions/index.ts`, consolidar `types.ts` dentro de `domain.ts`
7. THE Módulo_Alvo SHALL organizar o Barrel_Export (`index.ts`) com seções claras
