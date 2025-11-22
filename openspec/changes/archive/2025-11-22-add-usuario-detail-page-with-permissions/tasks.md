# Tasks: Add Usuario Detail Page with Permissions Matrix

## Phase 1: Backend Verification (Pre-requisites)

- [ ] **T1.1** Verificar que endpoint `GET /api/usuarios/[id]` retorna dados completos do usuário (incluindo `cargo`, `isSuperAdmin`)
- [ ] **T1.2** Verificar que endpoint `GET /api/permissoes/usuarios/[id]` retorna matriz completa de permissões
- [ ] **T1.3** Verificar que endpoint `POST /api/permissoes/usuarios/[id]` suporta batch de permissões
- [ ] **T1.4** Verificar que endpoint `PUT /api/permissoes/usuarios/[id]` suporta substituição completa

## Phase 2: Tipos e Utilidades

- [ ] **T2.1** Criar tipo `UsuarioDetalhado` em `lib/types/usuarios.ts` estendendo `Usuario` com permissões
- [ ] **T2.2** Criar tipo `PermissaoMatriz` para representar estado da matriz (recurso, operação, permitido)
- [ ] **T2.3** Criar helper `formatarPermissoes()` para transformar array de permissões em matriz 2D
- [ ] **T2.4** Criar helper `validarPermissoesMatriz()` para validação antes de salvar

## Phase 3: Hooks e Data Fetching

- [ ] **T3.1** Criar hook `useUsuarioDetail(id: number)` em `lib/hooks/use-usuario-detail.ts`
  - Fetch dados do usuário via `GET /api/usuarios/[id]`
  - Fetch permissões via `GET /api/permissoes/usuarios/[id]`
  - Retornar estado de loading, error, data
  - Implementar cache/SWR (usar `useSWR` ou similar)
- [ ] **T3.2** Criar hook `usePermissoesMatriz(usuarioId: number)` em `lib/hooks/use-permissoes-matriz.ts`
  - Gerenciar estado local da matriz (checkboxes)
  - Implementar `togglePermissao(recurso, operacao)`
  - Implementar `salvarPermissoes()` via `PUT /api/permissoes/usuarios/[id]`
  - Implementar optimistic updates
  - Retornar estados: isLoading, isSaving, error, permissoes

## Phase 4: Componentes UI - Dados do Usuário

- [ ] **T4.1** Criar `components/usuarios/usuario-dados-basicos.tsx`
  - Exibir nome, e-mail, CPF, telefone, OAB
  - Usar `Card` do shadcn/ui para agrupar
  - Mostrar badge de status (Ativo/Inativo)
  - Mostrar badge "Super Admin" se `isSuperAdmin === true`
- [ ] **T4.2** Criar `components/usuarios/usuario-cargo-section.tsx`
  - Exibir cargo atual do usuário (se tiver)
  - Mostrar descrição do cargo
  - Link para futura página de cargos (pode ser placeholder)

## Phase 5: Componentes UI - Matriz de Permissões

- [ ] **T5.1** Criar `components/usuarios/permissoes-matriz-header.tsx`
  - Título "Permissões do Usuário"
  - Indicador visual se usuário é Super Admin (avisar que permissões são implícitas)
  - Botão "Salvar Alterações" (disabled se não houver mudanças)
- [ ] **T5.2** Criar `components/usuarios/permissoes-matriz-tabela.tsx`
  - Renderizar tabela HTML semântica (`<table>`)
  - Header com nomes das operações (colunas dinâmicas por recurso)
  - Body com 13 linhas (recursos)
  - Células com `Checkbox` do shadcn/ui
  - Implementar `onChange` para atualizar estado via hook
- [ ] **T5.3** Criar `components/usuarios/permissoes-matriz.tsx` (orquestrador)
  - Compor `permissoes-matriz-header` + `permissoes-matriz-tabela`
  - Gerenciar loading states
  - Gerenciar error states
  - Implementar toast notifications para sucesso/erro ao salvar
  - Confirmar antes de salvar (dialog de confirmação)
- [ ] **T5.4** Adicionar acessibilidade ARIA à tabela
  - `role="table"`, `role="row"`, `role="cell"`
  - Labels apropriados para checkboxes (`aria-label`)
  - Suporte a navegação por teclado (Tab, Space)

## Phase 6: Página de Detalhes

- [ ] **T6.1** Criar `app/(dashboard)/usuarios/[id]/page.tsx`
  - Implementar como Server Component com Suspense
  - Buscar dados iniciais no servidor (opcional, ou usar client-side)
  - Renderizar componentes principais
  - Implementar breadcrumbs: "Usuários > [Nome do Usuário]"
- [ ] **T6.2** Criar layout da página com seções:
  - Seção 1: Dados Básicos (`usuario-dados-basicos`)
  - Seção 2: Cargo (`usuario-cargo-section`)
  - Seção 3: Permissões (`permissoes-matriz`)
  - Usar `Separator` entre seções
  - Layout responsivo (mobile-first)
- [ ] **T6.3** Implementar controle de acesso na página:
  - Verificar se usuário tem permissão `usuarios.visualizar`
  - Verificar se usuário tem permissão `usuarios.gerenciar_permissoes` para editar matriz
  - Redirecionar para `/usuarios` se não autorizado
  - Mostrar matriz como read-only se usuário não pode gerenciar permissões

## Phase 7: Integração com Página de Usuários

- [ ] **T7.1** Modificar `app/(dashboard)/usuarios/page.tsx`:
  - Importar `useRouter` do Next.js
  - No componente `UsuarioActions`, trocar `onClick` dos botões:
    - "Visualizar": `router.push('/usuarios/' + usuario.id)`
    - "Editar": `router.push('/usuarios/' + usuario.id + '?mode=edit')` (ou apenas mesmo link)
  - Remover renderização de `UsuarioViewSheet` e `UsuarioEditSheet`
- [ ] **T7.2** (Opcional) Manter sheets como fallback:
  - Adicionar query param `?view=sheet` para abrir sheet ao invés de navegar
  - Útil para casos específicos ou mobile

## Phase 8: Proteção de Rotas e Validação

- [ ] **T8.1** Adicionar validação de ID na página:
  - Verificar se `params.id` é número válido
  - Redirecionar para `/usuarios` se inválido
  - Mostrar 404 se usuário não encontrado
- [ ] **T8.2** Garantir que matriz NÃO aparece em `/perfil`:
  - Verificar que componente `permissoes-matriz` NÃO está sendo usado em `app/(dashboard)/perfil/page.tsx`
  - Adicionar comentário no código explicando que permissões só aparecem em `/usuarios/[id]`

## Phase 9: Loading States e Error Handling

- [ ] **T9.1** Implementar skeleton loading para:
  - Dados do usuário (usar `Skeleton` do shadcn/ui)
  - Matriz de permissões (skeleton de tabela)
- [ ] **T9.2** Implementar error handling:
  - Erro ao carregar usuário: mostrar mensagem + botão "Tentar novamente"
  - Erro ao carregar permissões: mostrar mensagem + botão "Tentar novamente"
  - Erro ao salvar permissões: toast de erro + não limpar estado local
- [ ] **T9.3** Implementar success feedback:
  - Toast "Permissões atualizadas com sucesso"
  - Revalidar dados após salvar
  - Animação sutil de sucesso (opcional)

## Phase 10: Testes e Validação

- [ ] **T10.1** Testar navegação:
  - Clicar em "Visualizar" na tabela → deve navegar para `/usuarios/[id]`
  - Clicar em "Editar" na tabela → deve navegar para `/usuarios/[id]`
  - URL `/usuarios/123` deve funcionar diretamente
- [ ] **T10.2** Testar matriz de permissões:
  - Selecionar/desselecionar permissões individualmente
  - Salvar alterações → verificar que API é chamada corretamente
  - Recarregar página → verificar que permissões persistem
- [ ] **T10.3** Testar Super Admin:
  - Usuário com `isSuperAdmin = true` deve mostrar todas as permissões marcadas
  - Indicador visual "Super Admin" deve aparecer
  - (Opcional) Matriz pode ser read-only para Super Admins
- [ ] **T10.4** Testar controle de acesso:
  - Usuário SEM `usuarios.visualizar` → deve ser redirecionado
  - Usuário SEM `usuarios.gerenciar_permissoes` → matriz deve ser read-only
  - Verificar que matriz NÃO aparece em `/perfil`
- [ ] **T10.5** Testar responsividade:
  - Mobile (< 640px): matriz deve ter scroll horizontal ou design adaptado
  - Tablet (640px - 1024px): layout intermediário
  - Desktop (> 1024px): layout completo
- [ ] **T10.6** Testar acessibilidade:
  - Navegação por teclado funciona
  - Screen readers anunciam corretamente
  - Contraste de cores adequado (WCAG AA)
  - Labels e ARIA attributes corretos

## Phase 11: Documentação e Cleanup

- [ ] **T11.1** Documentar componentes:
  - Adicionar JSDoc comments nos componentes principais
  - Documentar props e tipos
  - Adicionar exemplos de uso
- [ ] **T11.2** Atualizar documentação do sistema:
  - Atualizar `SISTEMA_PERMISSOES.md` mencionando a nova página
  - Adicionar screenshots (opcional)
- [ ] **T11.3** (Opcional) Depreciar sheets antigos:
  - Adicionar comentário `@deprecated` em `usuario-view-sheet.tsx`
  - Adicionar comentário `@deprecated` em `usuario-edit-sheet.tsx`
  - Considerar remoção futura ou manter como fallback
- [ ] **T11.4** Code review e refatoração:
  - Revisar nomes de variáveis e funções
  - Remover console.logs de debug
  - Garantir consistência de estilo

## Summary

**Total Tasks**: 46
**Estimated Time**: 8-12 horas de desenvolvimento
**Dependencies**: Sistema de permissões (`add-permissions-and-cargos-system`)

### Parallelizable Work
- Phase 2 (Tipos) pode ser feito independentemente
- Phase 4 (Dados do Usuário) e Phase 5 (Matriz) podem ser desenvolvidos em paralelo
- Phase 9 (Loading/Error) pode ser feito junto com Phase 6-7

### Critical Path
Phase 1 → Phase 2 → Phase 3 → Phase 5 → Phase 6 → Phase 7 → Phase 10
