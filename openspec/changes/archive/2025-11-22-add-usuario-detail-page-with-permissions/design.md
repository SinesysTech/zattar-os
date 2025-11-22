# Design: Add Usuario Detail Page with Permissions Matrix

## Architectural Decisions

### 1. Page vs Sheet Pattern

**Decision**: Usar página dedicada (`/usuarios/[id]`) ao invés de sheet/dialog.

**Rationale**:
- Matriz de permissões (81 checkboxes) requer muito espaço vertical e horizontal
- Sheets são limitados em tamanho e não suportam URLs diretas
- Páginas dedicadas permitem melhor organização em seções/tabs
- Permite compartilhamento de links diretos (`/usuarios/123`)
- Melhor UX para formulários complexos e dados extensos

**Alternatives Considered**:
- **Expandir sheet atual**: Rejeitado - sheets não são apropriados para conteúdo tão extenso
- **Modal fullscreen**: Rejeitado - similar a página mas sem benefícios de URL e navegação
- **Tabs dentro do sheet**: Rejeitado - ainda limitado pelo espaço do sheet

**Trade-offs**:
- ➕ Melhor UX e organização visual
- ➕ URLs diretas e navegação nativa
- ➖ Mais um nível de navegação (saída da tabela)
- ➖ Precisa de loading state ao navegar

---

### 2. Matriz de Permissões - Estrutura de Dados

**Decision**: Representar matriz como tabela HTML (`<table>`) com checkboxes.

**Rationale**:
- Semântica apropriada para dados tabulares (recursos × operações)
- Acessibilidade nativa do HTML (`<table>`, `<th>`, `<td>`)
- Facilita navegação por teclado e screen readers
- CSS Grid/Flexbox teriam markup mais complexo para mesma funcionalidade
- Mais fácil de estilizar linhas/colunas alternadas

**Alternatives Considered**:
- **CSS Grid manual**: Rejeitado - perde semântica e acessibilidade
- **DataTable reutilizável**: Rejeitado - overkill para caso de uso específico (matriz não é lista paginada)
- **Accordion de recursos**: Considerado para futuro mobile, mas tabela é melhor para desktop

**Structure**:
```typescript
interface PermissaoMatriz {
  recurso: string;           // 'advogados', 'audiencias', etc.
  operacoes: {
    [operacao: string]: boolean;  // 'listar': true, 'editar': false
  };
}
```

**Trade-offs**:
- ➕ Semântica e acessibilidade apropriadas
- ➕ Código mais simples e manutenível
- ➖ Tabelas podem ter problemas em mobile (precisa scroll horizontal)
- ✅ Mitigação: Design responsivo com scroll ou collapse em mobile

---

### 3. State Management - Permissões

**Decision**: Usar estado local (React state) + SWR para cache, com optimistic updates.

**Rationale**:
- SWR fornece cache automático, revalidação, e deduplicação de requests
- Estado local para matriz permite edições rápidas sem API calls
- Optimistic updates melhoram UX (não esperar response para atualizar UI)
- Não precisa de Redux/Zustand para este caso específico

**Flow**:
1. Fetch inicial: `GET /api/permissoes/usuarios/[id]` → popular matriz
2. Edição local: Toggle checkbox → atualizar estado local
3. Salvar: `PUT /api/permissoes/usuarios/[id]` → optimistic update → revalidate
4. Erro: Rollback para estado anterior + mostrar toast de erro

**Alternatives Considered**:
- **Zustand global store**: Rejeitado - overkill para estado local de uma página
- **Server State apenas**: Rejeitado - UX ruim (API call a cada checkbox)
- **React Query**: Alternativa válida, mas SWR já é usado no projeto

**Trade-offs**:
- ➕ UX rápida e responsiva
- ➕ Cache automático reduz API calls
- ➖ Complexidade de sincronização (optimistic updates)
- ✅ Mitigação: Rollback automático em caso de erro

---

### 4. Super Admin Handling

**Decision**: Mostrar matriz completa para Super Admins, mas com indicador visual que permissões são "implícitas".

**Rationale**:
- Super Admins têm bypass de todas as permissões no backend
- Mostrar matriz vazia seria confuso ("onde estão minhas permissões?")
- Mostrar matriz completa com todas marcadas deixa claro o estado
- Indicador visual (badge, cor diferente) deixa claro que é "implícito"

**UI Behavior**:
- Badge "Super Admin" no topo da matriz
- Todos os checkboxes marcados
- (Opcional) Checkboxes desabilitados para Super Admins (não podem editar permissões individuais)
- Mensagem explicativa: "Como Super Admin, este usuário tem acesso total a todos os recursos"

**Alternatives Considered**:
- **Esconder matriz para Super Admins**: Rejeitado - confuso
- **Permitir edição de permissões individuais**: Rejeitado - conflita com conceito de Super Admin
- **Toggle para "remover Super Admin" antes de editar**: Possível para futuro

**Trade-offs**:
- ➕ Clareza visual do estado completo
- ➕ Consistência de UI (sempre mostra matriz)
- ➖ Pode dar impressão de que permissões são editáveis (mitigado por disabled state)

---

### 5. Permissões de Acesso à Página

**Decision**:
- Visualizar página: requer `usuarios.visualizar`
- Editar matriz: requer `usuarios.gerenciar_permissoes`
- Matriz NÃO aparece em `/perfil` (apenas em `/usuarios/[id]`)

**Rationale**:
- Separação clara de responsabilidades:
  - `usuarios.visualizar`: Ver dados de outros usuários
  - `usuarios.gerenciar_permissoes`: Modificar permissões de outros
- Usuário não deve ver/editar suas próprias permissões (evita escalação de privilégios)
- Admin deve gerenciar permissões de forma centralizada

**Access Control Flow**:
```typescript
// Página /usuarios/[id]
if (!temPermissao('usuarios.visualizar')) {
  redirect('/usuarios'); // Não autorizado
}

// Matriz de permissões
const podeEditarPermissoes = temPermissao('usuarios.gerenciar_permissoes');
<PermissoesMatriz readOnly={!podeEditarPermissoes} />
```

**Alternatives Considered**:
- **Usuário pode ver próprias permissões em `/perfil`**: Considerado OK para visualização, mas sem edição
- **Permissão genérica `usuarios.editar`**: Rejeitado - `gerenciar_permissoes` é mais específico

**Trade-offs**:
- ➕ Segurança (usuário não auto-promove)
- ➕ Clareza de responsabilidades
- ➖ Usuário comum não vê suas próprias permissões (pode ser adicionado read-only em `/perfil` no futuro)

---

### 6. Data Fetching Strategy

**Decision**: Client-side fetching com SWR + Suspense.

**Rationale**:
- Dados de permissões são dinâmicos e específicos do usuário logado (auth)
- SWR permite cache, revalidação, e loading states automáticos
- Suspense do React 19 melhora UX de loading
- Não precisa de Server Components para este caso (dados protegidos por auth)

**Implementation**:
```tsx
// app/(dashboard)/usuarios/[id]/page.tsx
export default function UsuarioDetailPage({ params }) {
  return (
    <Suspense fallback={<UsuarioDetailSkeleton />}>
      <UsuarioDetailContent id={params.id} />
    </Suspense>
  );
}

// components/usuarios/usuario-detail-content.tsx
function UsuarioDetailContent({ id }) {
  const { usuario, isLoading, error } = useUsuarioDetail(id);
  const { permissoes, togglePermissao, salvarPermissoes } = usePermissoesMatriz(id);
  // ...
}
```

**Alternatives Considered**:
- **Server Components + Server Actions**: Válido, mas mais complexo para estado interativo (checkboxes)
- **getServerSideProps (Pages Router)**: Projeto usa App Router
- **Static Generation**: Não aplicável (dados dinâmicos e protegidos)

**Trade-offs**:
- ➕ Código mais simples e familiar
- ➕ Interatividade imediata (client-side)
- ➖ Não aproveita RSC (mas não é necessário aqui)

---

### 7. Mobile Responsiveness

**Decision**: Tabela com scroll horizontal em mobile, com possibilidade de design alternativo no futuro.

**Rationale**:
- 81 permissões em matriz é desafiador em telas pequenas
- Scroll horizontal é solução mais simples e rápida
- Design alternativo (accordion, lista vertical) pode ser adicionado depois se necessário

**Mobile Strategy (Phase 1)**:
```css
/* Tabela scrollável em mobile */
.permissoes-matriz-container {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

@media (max-width: 640px) {
  .permissoes-matriz-tabela {
    min-width: 800px; /* Força scroll horizontal */
  }
}
```

**Future Improvements (Phase 2 - Out of Scope)**:
- Accordion por recurso (collapse/expand)
- Lista vertical com filtros
- Modo "compacto" com apenas permissões ativas

**Trade-offs**:
- ➕ Implementação rápida
- ➕ Mantém estrutura de tabela consistente
- ➖ UX não ideal em mobile (scroll horizontal)
- ✅ Mitigação: Adicionar indicador visual de scroll ("arraste para ver mais")

---

### 8. Validation and Confirmation

**Decision**: Confirmar antes de salvar alterações de permissões (dialog de confirmação).

**Rationale**:
- Alterações de permissões são críticas (afetam segurança e acesso)
- Evita cliques acidentais
- Permite revisão antes de commit
- Auditoria já é feita no backend (logs_alteracao)

**Confirmation Flow**:
1. Usuário clica "Salvar Alterações"
2. Dialog abre com resumo: "Você está prestes a modificar X permissões. Confirmar?"
3. Lista de mudanças (opcional): "Adicionadas: 3, Removidas: 2"
4. Botões: "Cancelar" | "Confirmar"
5. API call + optimistic update + toast de sucesso

**Alternatives Considered**:
- **Sem confirmação**: Rejeitado - muito arriscado para operação crítica
- **Undo/Redo**: Complexo demais para MVP
- **Auto-save on change**: Rejeitado - muitos API calls, sem revisão

**Trade-offs**:
- ➕ Segurança (evita erros acidentais)
- ➕ Permite revisão consciente
- ➖ Um clique extra (mas necessário)

---

### 9. Error Handling Strategy

**Decision**: Toast notifications para erros + rollback automático de estado.

**Rationale**:
- Toasts são não-intrusivos e consistentes com resto do sistema
- Rollback automático mantém UI sincronizada com backend
- Permite retry manual sem perder estado

**Error Scenarios**:
1. **Erro ao carregar usuário**: Mostrar mensagem + botão "Tentar novamente"
2. **Erro ao carregar permissões**: Mostrar mensagem na seção de permissões + botão "Recarregar"
3. **Erro ao salvar permissões**:
   - Toast: "Erro ao salvar permissões. Tente novamente."
   - Rollback: Estado local volta ao anterior
   - Mantém botão "Salvar" ativo para retry

**Implementation**:
```typescript
const salvarPermissoes = async () => {
  const estadoAnterior = permissoes; // Backup

  // Optimistic update
  setPermissoes(novoEstado);

  try {
    await api.put(`/permissoes/usuarios/${id}`, novoEstado);
    toast.success('Permissões atualizadas com sucesso');
    mutate(); // Revalidate SWR
  } catch (error) {
    // Rollback
    setPermissoes(estadoAnterior);
    toast.error('Erro ao salvar permissões. Tente novamente.');
  }
};
```

**Trade-offs**:
- ➕ UX consistente e clara
- ➕ Rollback automático evita estado inconsistente
- ➖ Complexidade de gerenciar backup de estado

---

## Performance Considerations

### 1. Virtualização da Tabela
- **Não necessário para MVP**: 81 checkboxes são renderizáveis sem problemas
- **Futuro**: Se adicionar mais recursos/operações (>200 checkboxes), considerar `react-virtual`

### 2. Debounce/Throttle
- **Não aplicável**: Salvamento é manual (botão "Salvar"), não auto-save

### 3. Bundle Size
- Componentes específicos da página podem ser lazy-loaded se necessário
- Matriz de permissões é ~5KB de código, aceitável

---

## Security Considerations

### 1. Client-Side Permissions Check
- ✅ Página verifica `usuarios.visualizar` antes de renderizar
- ✅ Matriz verifica `usuarios.gerenciar_permissoes` para habilitar edição
- ⚠️ **IMPORTANTE**: Backend SEMPRE valida permissões (client-side é apenas UX)

### 2. CSRF Protection
- ✅ Next.js API Routes têm proteção built-in
- ✅ Supabase Auth tokens são seguros

### 3. Audit Logging
- ✅ Backend já registra todas as alterações em `logs_alteracao`
- ✅ Inclui `executadoPor` (quem modificou as permissões)

---

## Accessibility (WCAG 2.1 AA)

### Requirements
1. **Keyboard Navigation**: Tab através de checkboxes, Space para toggle
2. **Screen Readers**: Labels apropriados para cada checkbox (e.g., "Permitir listar advogados")
3. **Color Contrast**: Mínimo 4.5:1 para texto, 3:1 para elementos interativos
4. **Focus Indicators**: Visível e distinto para elementos focáveis
5. **ARIA Attributes**: `role="table"`, `aria-label`, `aria-describedby`

### Implementation
```tsx
<Checkbox
  id={`perm-${recurso}-${operacao}`}
  checked={permitido}
  onChange={() => togglePermissao(recurso, operacao)}
  aria-label={`Permitir ${operacao} em ${recurso}`}
  aria-describedby={`perm-desc-${recurso}-${operacao}`}
/>
<label htmlFor={`perm-${recurso}-${operacao}`} className="sr-only">
  Permitir {operacao} em {recurso}
</label>
```

---

## Future Enhancements (Out of Scope)

1. **Bulk Operations**: Selecionar/desselecionar todas as operações de um recurso
2. **Preset Templates**: Aplicar templates de permissões (e.g., "Advogado Júnior", "Estagiário")
3. **Diff Visualization**: Mostrar diff antes de salvar (permissões adicionadas/removidas)
4. **Permission Groups**: Agrupar recursos por categoria (Gestão, Processos, Captura)
5. **History Timeline**: Exibir histórico de alterações de permissões com revert
6. **Mobile-Optimized View**: Accordion ou lista vertical alternativa para mobile
7. **Search/Filter**: Buscar permissões específicas dentro da matriz
8. **Edição inline de dados**: Permitir editar nome, e-mail, etc. na mesma página
