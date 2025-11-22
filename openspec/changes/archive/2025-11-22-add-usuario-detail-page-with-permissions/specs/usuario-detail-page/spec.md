# Spec: Usuario Detail Page with Permissions Matrix

## Overview
Página dedicada para visualização completa e edição de usuários, incluindo matriz interativa de permissões granulares.

## ADDED Requirements

### Requirement: Navegação para Página de Detalhes
**ID**: `usuario-detail-page.navigation`

O sistema SHALL permitir navegação da tabela de usuários para a página de detalhes.

#### Scenario: Clicar em "Visualizar" navega para página de detalhes
**Given** o usuário está na página `/usuarios` (gestão de usuários)
**And** existe um usuário com ID `123` na tabela
**When** o usuário clica no botão "Visualizar" (ícone de olho) para o usuário ID `123`
**Then** o sistema SHALL navegar para `/usuarios/123`
**And** a página de detalhes do usuário SHALL ser exibida

#### Scenario: Clicar em "Editar" navega para página de detalhes
**Given** o usuário está na página `/usuarios` (gestão de usuários)
**And** existe um usuário com ID `456` na tabela
**When** o usuário clica no botão "Editar" (ícone de lápis) para o usuário ID `456`
**Then** o sistema SHALL navegar para `/usuarios/456`
**And** a página de detalhes do usuário SHALL ser exibida

#### Scenario: Acesso direto via URL funciona
**Given** o usuário conhece o ID de um usuário (`789`)
**When** o usuário acessa diretamente a URL `/usuarios/789`
**Then** o sistema SHALL exibir a página de detalhes do usuário ID `789`

---

### Requirement: Exibição de Dados do Usuário
**ID**: `usuario-detail-page.dados-basicos`

O sistema SHALL exibir todos os dados básicos do usuário de forma organizada.

#### Scenario: Dados pessoais são exibidos
**Given** o usuário está na página `/usuarios/123`
**And** o usuário ID `123` possui dados completos (nome, CPF, e-mail, telefone, OAB)
**When** a página carrega
**Then** o sistema SHALL exibir:
- Nome completo ou nome de exibição
- CPF formatado (XXX.XXX.XXX-XX)
- E-mail corporativo
- Telefone formatado
- OAB (número + UF) se aplicável

#### Scenario: Status do usuário é exibido
**Given** o usuário está na página `/usuarios/123`
**And** o usuário ID `123` está ativo
**When** a página carrega
**Then** o sistema SHALL exibir badge "Ativo" com cor apropriada

**Given** o usuário está na página `/usuarios/456`
**And** o usuário ID `456` está inativo
**When** a página carrega
**Then** o sistema SHALL exibir badge "Inativo" com cor apropriada

#### Scenario: Cargo organizacional é exibido
**Given** o usuário está na página `/usuarios/123`
**And** o usuário ID `123` possui cargo "Advogado Sênior"
**When** a página carrega
**Then** o sistema SHALL exibir seção "Cargo" com nome "Advogado Sênior"
**And** SHALL exibir descrição do cargo se disponível

#### Scenario: Super Admin é indicado visualmente
**Given** o usuário está na página `/usuarios/123`
**And** o usuário ID `123` tem flag `is_super_admin = true`
**When** a página carrega
**Then** o sistema SHALL exibir badge "Super Admin" com destaque visual
**And** SHALL exibir indicador visual próximo à matriz de permissões

---

### Requirement: Matriz de Permissões - Exibição
**ID**: `usuario-detail-page.matriz-exibicao`

O sistema SHALL exibir matriz completa de permissões do usuário.

#### Scenario: Matriz de permissões é exibida corretamente
**Given** o usuário está na página `/usuarios/123`
**And** o usuário autenticado tem permissão `usuarios.visualizar`
**When** a página carrega
**Then** o sistema SHALL exibir tabela de permissões com:
- 13 linhas (recursos: advogados, credenciais, acervo, audiências, pendentes, usuários, clientes, partes_contrarias, contratos, agendamentos, captura, tipos_expedientes, cargos)
- Colunas dinâmicas por recurso (operações: listar, visualizar, criar, editar, deletar, etc.)
- Total de 81 checkboxes (combinações recurso × operação)

#### Scenario: Permissões atuais são carregadas
**Given** o usuário está na página `/usuarios/123`
**And** o usuário ID `123` possui permissões:
  - `advogados.listar = true`
  - `advogados.visualizar = true`
  - `audiencias.editar = true`
**When** a página carrega
**Then** o sistema SHALL exibir checkboxes marcados para as permissões existentes
**And** checkboxes desmarcados para permissões não atribuídas

#### Scenario: Super Admin mostra todas as permissões implícitas
**Given** o usuário está na página `/usuarios/123`
**And** o usuário ID `123` tem `is_super_admin = true`
**When** a página carrega
**Then** o sistema SHALL exibir TODOS os 81 checkboxes marcados
**And** SHALL exibir mensagem: "Como Super Admin, este usuário tem acesso total a todos os recursos"
**And** SHALL indicar visualmente que as permissões são implícitas (e.g., cor diferente)

---

### Requirement: Matriz de Permissões - Edição
**ID**: `usuario-detail-page.matriz-edicao`

O sistema SHALL permitir edição interativa das permissões.

#### Scenario: Usuário com permissão pode editar matriz
**Given** o usuário está na página `/usuarios/123`
**And** o usuário autenticado tem permissão `usuarios.gerenciar_permissoes`
**When** a página carrega
**Then** os checkboxes da matriz SHALL estar habilitados para edição
**And** o botão "Salvar Alterações" SHALL estar visível

#### Scenario: Usuário sem permissão vê matriz read-only
**Given** o usuário está na página `/usuarios/123`
**And** o usuário autenticado NÃO tem permissão `usuarios.gerenciar_permissoes`
**But** tem permissão `usuarios.visualizar`
**When** a página carrega
**Then** os checkboxes da matriz SHALL estar desabilitados (read-only)
**And** o botão "Salvar Alterações" SHALL estar oculto

#### Scenario: Toggle de permissão individual
**Given** o usuário está na página `/usuarios/123`
**And** o usuário autenticado pode gerenciar permissões
**And** a permissão `advogados.criar` está desmarcada
**When** o usuário clica no checkbox "advogados.criar"
**Then** o checkbox SHALL ser marcado
**And** o estado local SHALL ser atualizado
**And** o botão "Salvar Alterações" SHALL ficar habilitado

#### Scenario: Confirmação antes de salvar
**Given** o usuário está na página `/usuarios/123`
**And** o usuário modificou 3 permissões (marcou 2, desmarcou 1)
**When** o usuário clica em "Salvar Alterações"
**Then** o sistema SHALL exibir dialog de confirmação
**And** SHALL mostrar mensagem: "Você está prestes a modificar X permissões. Confirmar?"
**And** SHALL exibir botões "Cancelar" e "Confirmar"

#### Scenario: Salvar permissões com sucesso
**Given** o usuário confirmou alterações de permissões
**When** o usuário clica em "Confirmar" no dialog
**Then** o sistema SHALL:
  1. Fazer chamada `PUT /api/permissoes/usuarios/123` com array de permissões
  2. Atualizar UI otimisticamente (não esperar response)
  3. Exibir toast "Permissões atualizadas com sucesso"
  4. Revalidar dados (SWR mutate)
  5. Fechar dialog de confirmação

#### Scenario: Rollback em caso de erro
**Given** o usuário confirmou alterações de permissões
**And** o backend retorna erro 500
**When** a API falha
**Then** o sistema SHALL:
  1. Reverter estado local para valores anteriores (rollback)
  2. Exibir toast "Erro ao salvar permissões. Tente novamente."
  3. Manter botão "Salvar Alterações" habilitado para retry
  4. NÃO fechar dialog de confirmação

---

### Requirement: Controle de Acesso
**ID**: `usuario-detail-page.acesso`

O sistema SHALL validar permissões antes de exibir conteúdo.

#### Scenario: Usuário sem permissão visualizar é bloqueado
**Given** o usuário autenticado NÃO tem permissão `usuarios.visualizar`
**When** o usuário tenta acessar `/usuarios/123`
**Then** o sistema SHALL redirecionar para `/usuarios` (listagem)
**And** SHALL exibir toast "Você não tem permissão para visualizar usuários"

#### Scenario: Usuário com permissão visualizar pode acessar
**Given** o usuário autenticado tem permissão `usuarios.visualizar`
**When** o usuário acessa `/usuarios/123`
**Then** o sistema SHALL exibir a página de detalhes
**And** SHALL carregar dados do usuário

#### Scenario: Matriz de permissões NÃO aparece em perfil próprio
**Given** o usuário autenticado está na página `/perfil`
**When** a página carrega
**Then** o sistema SHALL exibir dados do usuário logado
**And** SHALL **NÃO** exibir matriz de permissões
**And** SHALL **NÃO** exibir opção de editar permissões

---

### Requirement: Validação de Entrada
**ID**: `usuario-detail-page.validacao`

O sistema SHALL validar entradas e parâmetros.

#### Scenario: ID inválido redireciona para listagem
**Given** o usuário acessa URL `/usuarios/abc` (ID não numérico)
**When** a página tenta carregar
**Then** o sistema SHALL redirecionar para `/usuarios`
**And** SHALL exibir toast "ID de usuário inválido"

#### Scenario: Usuário não encontrado exibe 404
**Given** o usuário acessa URL `/usuarios/99999` (ID que não existe)
**When** a API retorna erro 404
**Then** o sistema SHALL exibir mensagem "Usuário não encontrado"
**And** SHALL exibir botão "Voltar para usuários" que navega para `/usuarios`

---

### Requirement: Loading States
**ID**: `usuario-detail-page.loading`

O sistema SHALL exibir estados de carregamento apropriados.

#### Scenario: Skeleton durante carregamento inicial
**Given** o usuário acessa `/usuarios/123`
**When** os dados estão sendo carregados
**Then** o sistema SHALL exibir skeleton loading para:
- Seção de dados básicos
- Seção de cargo
- Tabela de permissões

#### Scenario: Loading na matriz ao salvar
**Given** o usuário está salvando alterações de permissões
**When** a API está processando
**Then** o botão "Salvar Alterações" SHALL exibir spinner
**And** SHALL estar desabilitado (prevenir duplo-clique)
**And** checkboxes SHALL estar desabilitados temporariamente

---

### Requirement: Error Handling
**ID**: `usuario-detail-page.erro`

O sistema SHALL tratar erros de forma clara e recuperável.

#### Scenario: Erro ao carregar dados do usuário
**Given** o usuário acessa `/usuarios/123`
**And** a API retorna erro 500 ao buscar dados
**When** o erro ocorre
**Then** o sistema SHALL exibir mensagem "Erro ao carregar dados do usuário"
**And** SHALL exibir botão "Tentar novamente" que refaz o fetch

#### Scenario: Erro ao carregar permissões
**Given** o usuário acessa `/usuarios/123`
**And** dados do usuário carregaram com sucesso
**But** API de permissões retorna erro 500
**When** o erro ocorre
**Then** o sistema SHALL exibir dados do usuário normalmente
**And** SHALL exibir mensagem de erro na seção de permissões
**And** SHALL exibir botão "Recarregar permissões"

---

### Requirement: Responsividade
**ID**: `usuario-detail-page.responsive`

O sistema SHALL funcionar em diferentes tamanhos de tela.

#### Scenario: Desktop exibe layout completo
**Given** o usuário acessa a página em desktop (> 1024px)
**When** a página carrega
**Then** o sistema SHALL exibir:
- Seções lado a lado (dados + cargo)
- Matriz de permissões em largura completa
- Todos os elementos visíveis sem scroll horizontal

#### Scenario: Mobile exibe layout adaptado
**Given** o usuário acessa a página em mobile (< 640px)
**When** a página carrega
**Then** o sistema SHALL exibir:
- Seções empilhadas verticalmente
- Matriz de permissões com scroll horizontal
- Indicador visual de scroll ("arraste para ver mais")

---

### Requirement: Acessibilidade
**ID**: `usuario-detail-page.a11y`

O sistema SHALL atender padrões WCAG 2.1 AA.

#### Scenario: Navegação por teclado funciona
**Given** o usuário está na página de detalhes
**When** o usuário pressiona Tab
**Then** o foco SHALL navegar sequencialmente por todos os checkboxes
**And** cada checkbox SHALL ter indicador visual de foco claro

#### Scenario: Checkboxes têm labels apropriados
**Given** o usuário usa screen reader
**When** o foco está em um checkbox da matriz
**Then** o screen reader SHALL anunciar: "Permitir [operação] em [recurso], checkbox, [marcado/desmarcado]"
**Example**: "Permitir criar em advogados, checkbox, desmarcado"

#### Scenario: Contraste de cores adequado
**Given** a página está renderizada
**When** medido com ferramenta de contraste
**Then** todos os textos SHALL ter contraste mínimo 4.5:1
**And** elementos interativos SHALL ter contraste mínimo 3:1

---

### Requirement: Breadcrumbs
**ID**: `usuario-detail-page.breadcrumbs`

O sistema SHALL exibir breadcrumbs para navegação contextual.

#### Scenario: Breadcrumbs exibidos corretamente
**Given** o usuário está na página `/usuarios/123`
**And** o usuário ID `123` tem nome "João Silva"
**When** a página carrega
**Then** o sistema SHALL exibir breadcrumbs: "Usuários > João Silva"
**And** link "Usuários" SHALL navegar para `/usuarios`

---

### Requirement: Otimistic Updates
**ID**: `usuario-detail-page.optimistic`

O sistema SHALL usar optimistic updates para melhor UX.

#### Scenario: UI atualiza antes de confirmação do backend
**Given** o usuário marcou checkbox "advogados.criar"
**And** clicou em "Salvar Alterações" e confirmou
**When** a API está processando (ainda não retornou)
**Then** o checkbox "advogados.criar" SHALL permanecer marcado na UI
**And** o botão "Salvar" SHALL exibir loading
**And** o toast de sucesso SHALL aparecer antes da response (optimistic)

#### Scenario: Rollback automático em caso de falha
**Given** o usuário salvou alterações
**And** a API retornou erro 500
**When** o erro é detectado
**Then** o sistema SHALL reverter estado dos checkboxes para valores anteriores
**And** SHALL exibir toast de erro
**And** SHALL reabilitar botão "Salvar"

---

## Non-Functional Requirements

### Performance
- **NFR-1**: Página SHALL carregar dados em < 2 segundos (95º percentil)
- **NFR-2**: Renderização inicial de 81 checkboxes SHALL ocorrer em < 500ms
- **NFR-3**: Toggle de checkbox SHALL ter resposta < 100ms (local state update)

### Security
- **NFR-4**: Todas as permissões SHALL ser validadas no backend (API routes)
- **NFR-5**: Tokens de autenticação SHALL ser enviados em headers (não query params)
- **NFR-6**: CSRF protection SHALL estar habilitado para todas as mutations

### Accessibility
- **NFR-7**: Página SHALL atingir pontuação mínima 90 no Lighthouse Accessibility
- **NFR-8**: Navegação completa por teclado SHALL ser possível
- **NFR-9**: Screen readers SHALL anunciar corretamente todos os elementos interativos

### Maintainability
- **NFR-10**: Componentes SHALL ter JSDoc comments
- **NFR-11**: Tipos TypeScript SHALL estar completos (strict mode)
- **NFR-12**: Código SHALL seguir convenções do projeto (ver `openspec/project.md`)
