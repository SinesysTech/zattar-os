## ADDED Requirements

### Requirement: Dados Financeiros Consolidados

O sistema SHALL consolidar todas as queries de dados financeiros em uma única chamada ao repository, retornando saldo total, contas a pagar, contas a receber e alertas financeiros.

#### Scenario: Buscar dados financeiros para usuário
- **WHEN** dashboard de usuário solicita dados financeiros
- **THEN** repository executa `buscarDadosFinanceirosConsolidados(usuarioId)`
- **AND** retorna `DadosFinanceirosConsolidados` com saldoTotal, contasPagar, contasReceber e alertas
- **AND** dados são filtrados pelo usuário informado

#### Scenario: Buscar dados financeiros para admin
- **WHEN** dashboard de admin solicita dados financeiros
- **THEN** repository executa `buscarDadosFinanceirosConsolidados()` sem filtro de usuário
- **AND** retorna dados consolidados de todo o escritório

---

### Requirement: Filtragem de Widgets por Permissões

O sistema SHALL filtrar widgets exibidos no dashboard de usuário baseado nas permissões granulares do sistema, exibindo apenas widgets para recursos que o usuário possui acesso de leitura.

#### Scenario: Usuário com permissão parcial
- **WHEN** usuário possui apenas permissão `processos:read` e `audiencias:read`
- **THEN** exibe widgets de Processos e Audiências
- **AND** oculta widgets de Expedientes e Financeiro

#### Scenario: Usuário sem nenhuma permissão
- **WHEN** usuário não possui nenhuma permissão de leitura
- **THEN** exibe mensagem "Você não possui permissões para visualizar dados"
- **AND** não exibe nenhum widget

#### Scenario: Superadmin acessa dashboard de usuário
- **WHEN** superadmin acessa dashboard (mesmo na visão user)
- **THEN** todos os widgets são exibidos independente de permissões
- **AND** hook `useWidgetPermissions()` retorna `true` para todas as flags

---

### Requirement: Organização por Domínio (Admin)

O sistema SHALL organizar widgets do dashboard admin em seções agrupadas por domínio funcional da aplicação, facilitando navegação e compreensão das métricas.

#### Scenario: Exibir seções de domínio
- **WHEN** admin acessa dashboard
- **THEN** exibe seções: Processos, Audiências, Expedientes, Financeiro, Produtividade, Captura
- **AND** cada seção usa componente `DomainSection` com título, ícone e descrição opcional

#### Scenario: Seção de Processos
- **WHEN** seção Processos é renderizada
- **THEN** agrupa `WidgetProcessosResumo` e métricas de processos
- **AND** exibe ícone de Processos e título "Processos"

#### Scenario: Seção de Financeiro
- **WHEN** seção Financeiro é renderizada
- **THEN** agrupa cards de métricas, `WidgetFluxoCaixa` e `WidgetDespesasCategoria`
- **AND** exibe ícone de Financeiro e título "Financeiro"

---

### Requirement: Saudação Personalizada

O sistema SHALL exibir saudação personalizada "Olá, {nome}!" no topo do dashboard em substituição aos títulos estáticos, tanto para usuários comuns quanto para admins.

#### Scenario: Saudação em dashboard de usuário
- **WHEN** usuário comum acessa dashboard
- **THEN** exibe "Olá, {nome}!" usando `Typography.H3`
- **AND** nome é obtido de `data.usuario.nome`

#### Scenario: Saudação em dashboard de admin
- **WHEN** superadmin acessa dashboard
- **THEN** exibe "Olá, {nome}!" usando `Typography.H3`
- **AND** exibe subtítulo "Visão administrativa do escritório"
- **AND** nome do admin é buscado via service usando userId da sessão

---

### Requirement: Hook useWidgetPermissions

O sistema SHALL fornecer hook `useWidgetPermissions()` que retorna flags booleanas indicando quais widgets o usuário atual pode visualizar, baseado em suas permissões no sistema.

#### Scenario: Verificar permissões de visualização
- **WHEN** componente chama `useWidgetPermissions()`
- **THEN** retorna objeto com flags: `podeVerProcessos`, `podeVerAudiencias`, `podeVerExpedientes`, `podeVerFinanceiro`, `podeVerRH`, `podeVerCaptura`
- **AND** cada flag é `true` se usuário possui permissão correspondente ou é superadmin

#### Scenario: Mapear permissões para flags
- **WHEN** usuário possui permissão `processos:read`
- **THEN** flag `podeVerProcessos` retorna `true`
- **AND** outras flags retornam `false` se não houver permissões correspondentes

---

### Requirement: Componente DomainSection

O sistema SHALL fornecer componente `DomainSection` para agrupar widgets por domínio, exibindo título, ícone opcional, descrição opcional e grid responsivo de widgets filhos.

#### Scenario: Renderizar seção de domínio
- **WHEN** desenvolvedor usa `<DomainSection title="Processos" icon={FileText}>`
- **THEN** renderiza título com `Typography.H4` e ícone alinhado
- **AND** renderiza divider horizontal abaixo do título
- **AND** renderiza children em grid responsivo

#### Scenario: Seção com descrição
- **WHEN** `DomainSection` recebe prop `description`
- **THEN** renderiza descrição usando `Typography.Muted` abaixo do título
- **AND** mantém layout consistente com outras seções

## MODIFIED Requirements

### Requirement: Dashboard Contextual por Role

O sistema SHALL exibir dashboard personalizada baseada no perfil do usuário autenticado, diferenciando visualização para usuários comuns e superadmins, com saudação personalizada e filtragem por permissões.

#### Scenario: Usuário comum acessa dashboard
- **WHEN** usuário comum (não superadmin) acessa `/dashboard`
- **THEN** exibe saudação "Olá, {nome}!" no topo
- **AND** filtra widgets exibidos baseado em permissões do usuário via `useWidgetPermissions()`
- **AND** mostra status cards apenas para recursos com permissão de leitura
- **AND** mostra widgets apenas para recursos com permissão de leitura

#### Scenario: Superadmin acessa dashboard
- **WHEN** superadmin acessa `/dashboard`
- **THEN** exibe saudação "Olá, {nome}!" no topo
- **AND** exibe subtítulo "Visão administrativa do escritório"
- **AND** organiza widgets em seções por domínio usando `DomainSection`
- **AND** mostra todas as seções: Processos, Audiências, Expedientes, Financeiro, Produtividade, Captura

---

### Requirement: Status Cards de Resumo

O sistema SHALL exibir cards de status no topo da dashboard para visão rápida das métricas principais, filtrados por permissões do usuário e usando dados financeiros consolidados.

#### Scenario: Status cards de usuário
- **WHEN** dashboard de usuário é carregada
- **THEN** exibe cards apenas para recursos que usuário possui permissão de leitura
- **AND** cards financeiros usam dados de `data.dadosFinanceiros` consolidado
- **AND** não exibe cards para recursos sem permissão

#### Scenario: Status cards de admin
- **WHEN** dashboard de admin é carregada
- **THEN** exibe todos os cards organizados dentro das seções de domínio
- **AND** cards financeiros usam dados de `data.dadosFinanceiros` consolidado

---

### Requirement: Cache de Dados da Dashboard

O sistema SHALL implementar cache Redis para dados da dashboard visando performance e redução de carga no banco, incluindo dados financeiros consolidados.

#### Scenario: Cache de dados de usuário
- **WHEN** dados de dashboard de usuário são solicitados
- **THEN** verifica cache Redis com chave `dashboard:user:{userId}`
- **AND** cache inclui `dadosFinanceiros` consolidados
- **AND** se cache válido (< 5 min), retorna dados cacheados
- **AND** se cache inválido, consulta banco e atualiza cache

#### Scenario: Cache de dados de admin
- **WHEN** dados de dashboard de admin são solicitados
- **THEN** verifica cache Redis com chave `dashboard:admin:{userId}`
- **AND** cache inclui `dadosFinanceiros` consolidados e nome do usuário
- **AND** se cache válido (< 5 min), retorna dados cacheados

#### Scenario: Invalidação de cache
- **WHEN** expediente é criado, baixado ou alterado
- **THEN** invalida cache da dashboard do usuário responsável
- **AND** invalida cache de métricas globais (admin)
- **AND** invalida cache de dados financeiros consolidados
