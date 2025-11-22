# Add Usuario Detail Page with Permissions Matrix

## Why

Atualmente, a visualização e edição de usuários na página de gestão (`/usuarios`) é feita através de **sheets** (dialogs/modals), que apresentam limitações:

1. **Espaço limitado**: A matriz de permissões possui 81 permissões distribuídas em 13 recursos, exigindo muito espaço vertical e horizontal
2. **UX complexa em modais**: Formulários extensos e matrizes interativas funcionam melhor em páginas dedicadas
3. **Navegação restrita**: Sheets não permitem URLs diretas ou compartilhamento de links para usuários específicos
4. **Organização visual**: Dados do usuário + cargo + permissões precisam ser organizados em seções bem definidas

## What

Implementar uma **página dedicada de detalhes do usuário** (`/usuarios/[id]`) que:

### Funcionalidades Principais

1. **Navegação**: Ao clicar em "Visualizar" ou "Editar" na tabela de usuários, navegar para `/usuarios/[id]`
2. **Visualização completa**: Exibir todos os dados do usuário organizados em seções:
   - Dados pessoais (nome, CPF, e-mail, telefone, OAB, etc.)
   - Cargo organizacional
   - Status (ativo/inativo)
   - Super Admin flag
3. **Matriz de permissões**: Grid interativo com:
   - Linhas = 13 recursos (advogados, credenciais, acervo, audiências, etc.)
   - Colunas = operações por recurso (listar, visualizar, criar, editar, deletar, etc.)
   - Checkboxes para selecionar permissões individualmente
   - Indicador visual quando usuário é Super Admin (bypass de todas as permissões)
4. **Controle de acesso**:
   - Matriz de permissões **NÃO** aparece na página `/perfil` (perfil do próprio usuário logado)
   - Matriz aparece apenas em `/usuarios/[id]` quando acessada por gestor/admin
   - Requerer permissão `usuarios.visualizar` para visualizar
   - Requerer permissão `usuarios.editar` ou `usuarios.gerenciar_permissoes` para modificar

### O que NÃO muda

- **Criação de usuário**: Continua usando `UsuarioCreateSheet` (modal rápido)
- **Página de perfil** (`/perfil`): Continua exibindo apenas dados do usuário logado, SEM matriz de permissões
- **API Routes**: Nenhuma alteração nas APIs de usuários ou permissões

## Impact

### Breaking Changes
**Nenhum.** A mudança é aditiva do ponto de vista técnico, mas muda a UX:
- ✅ Melhora significativa de UX e organização visual
- ✅ URLs diretas para usuários específicos (`/usuarios/123`)
- ✅ Melhor espaço para matriz de permissões

### Additive Changes
- Nova rota: `app/(dashboard)/usuarios/[id]/page.tsx`
- Novos componentes:
  - `components/usuarios/usuario-details-page.tsx` (layout principal)
  - `components/usuarios/permissoes-matriz.tsx` (grid de permissões)
  - `components/usuarios/usuario-dados-basicos.tsx` (seção de dados)
- Hook: `lib/hooks/use-usuario-detail.ts` (fetch dados do usuário + permissões)

### Modified
- `app/(dashboard)/usuarios/page.tsx`: Trocar `onClick` de sheets para `router.push('/usuarios/[id]')`
- Sheets `usuario-view-sheet.tsx` e `usuario-edit-sheet.tsx` podem ser depreciados (ou mantidos como fallback)

## Dependencies

### Sistemas Necessários
- Sistema de permissões já implementado (`add-permissions-and-cargos-system`)
- Endpoints existentes:
  - `GET /api/usuarios/[id]` (buscar usuário)
  - `GET /api/permissoes/usuarios/[id]` (listar permissões)
  - `POST /api/permissoes/usuarios/[id]` (atribuir permissões batch)
  - `PUT /api/permissoes/usuarios/[id]` (substituir permissões)

### Componentes UI Necessários
- `DataTable` (já existe)
- `Badge`, `Button`, `Card`, `Checkbox`, `Separator` (shadcn/ui - já existem)
- Layout responsivo com Tailwind CSS

## Success Criteria

1. ✅ Ao clicar em "Visualizar" ou "Editar" na tabela de usuários, navegação para `/usuarios/[id]` funciona
2. ✅ Página `/usuarios/[id]` exibe:
   - Dados completos do usuário organizados em seções
   - Cargo organizacional (se atribuído)
   - Matriz de permissões com checkboxes funcionais
   - Indicador "Super Admin" (se aplicável)
3. ✅ Matriz de permissões:
   - Carrega permissões atuais do usuário
   - Permite selecionar/desselecionar permissões
   - Salva alterações via API com audit logging
   - Mostra todas as 81 permissões corretamente
4. ✅ Controle de acesso:
   - Matriz NÃO aparece em `/perfil`
   - Requerer permissões corretas para visualizar/editar
5. ✅ UX responsiva e acessível (WCAG 2.1 AA)
6. ✅ Loading states e error handling apropriados

## Out of Scope

- Edição inline de dados do usuário (pode ser fase 2)
- Histórico de alterações de permissões (já existe em `logs_alteracao`)
- Bulk operations em permissões (selecionar todos de um recurso) - pode ser adicionado depois
- Página de perfil alterada - mantém como está

## Notes

- A matriz de permissões deve usar virtualização se performance for problema (81 checkboxes)
- Considerar layout em tabs/accordions se a página ficar muito longa:
  - Tab 1: Dados do usuário
  - Tab 2: Permissões
  - Tab 3: Histórico (futuro)
- Garantir que Super Admins tenham indicador visual claro (badge, cor diferente)
- Quando usuário é Super Admin, matriz deve mostrar todas as permissões marcadas mas com indicação de que são "implícitas" (não editáveis direto)
