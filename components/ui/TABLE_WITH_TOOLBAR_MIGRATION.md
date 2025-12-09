# Guia de Migração para TableWithToolbar

## 📦 Componente Unificado

O componente `TableWithToolbar` integra `TableToolbar` + `ResponsiveTable` em um único componente reutilizável, garantindo **consistência visual total** em todas as tabelas do app.

## 🎯 Benefícios

✅ **Consistência visual garantida** - Mesmo visual em todas as páginas  
✅ **Menos código repetitivo** - Um único componente para toolbar + tabela  
✅ **Manutenção centralizada** - Mudanças de estilo em um só lugar  
✅ **Tipagem completa** - TypeScript com todos os tipos exportados  
✅ **Todas as features mantidas** - Busca, filtros, paginação, ordenação, etc.

## 🔄 Como Migrar

### Antes (Código Antigo)

```tsx
import { TableToolbar } from "@/components/ui/table-toolbar";
import { ResponsiveTable } from "@/components/ui/responsive-table";

export default function MinhaPage() {
  // ... estados e hooks ...

  return (
    <div className="space-y-4">
      {/* Toolbar separada */}
      <TableToolbar
        searchValue={busca}
        onSearchChange={setBusca}
        isSearching={isSearching}
        searchPlaceholder="Buscar..."
        filterOptions={filterOptions}
        filterGroups={filterGroups}
        selectedFilters={selectedFilterIds}
        onFiltersChange={handleFilterIdsChange}
        filterButtonsMode="buttons"
        onNewClick={() => setCreateOpen(true)}
        newButtonTooltip="Novo Item"
        extraButtons={<>...</>}
      />

      {/* Tabela separada */}
      <ResponsiveTable
        data={items}
        columns={colunas}
        pagination={paginacao}
        isLoading={isLoading}
        error={error}
        mobileLayout="cards"
        stickyFirstColumn={true}
        emptyMessage="Nenhum item encontrado."
      />
    </div>
  );
}
```

### Depois (Código Novo - Unificado)

```tsx
import { TableWithToolbar } from "@/components/ui/table-with-toolbar";

export default function MinhaPage() {
  // ... estados e hooks (MANTÉM TUDO IGUAL) ...

  return (
    <TableWithToolbar
      // Dados e colunas
      data={items}
      columns={colunas}
      // Busca
      searchValue={busca}
      onSearchChange={setBusca}
      isSearching={isSearching}
      searchPlaceholder="Buscar..."
      // Filtros
      filterOptions={filterOptions}
      filterGroups={filterGroups}
      selectedFilters={selectedFilterIds}
      onFiltersChange={handleFilterIdsChange}
      filterButtonsMode="buttons"
      // Botão de criar
      onNewClick={() => setCreateOpen(true)}
      newButtonTooltip="Novo Item"
      // Botões extras
      extraButtons={<>...</>}
      // Props da tabela
      pagination={paginacao}
      isLoading={isLoading}
      error={error}
      mobileLayout="cards"
      stickyFirstColumn={true}
      emptyMessage="Nenhum item encontrado."
    />
  );
}
```

## 📝 Checklist de Migração

Para cada página que usa tabelas, siga este checklist:

### 1. Atualizar Imports

```diff
- import { TableToolbar } from '@/components/ui/table-toolbar';
- import { ResponsiveTable, ResponsiveTableColumn } from '@/components/ui/responsive-table';
+ import { TableWithToolbar, type ResponsiveTableColumn } from '@/components/ui/table-with-toolbar';
```

### 2. Substituir o JSX

Remover o wrapper `<div className="space-y-4">` e os dois componentes separados (`TableToolbar` + `ResponsiveTable`), substituindo por um único `<TableWithToolbar>`.

### 3. Consolidar as Props

Todas as props continuam iguais, apenas passadas para o componente unificado ao invés de serem divididas entre toolbar e tabela.

### 4. Testar

- ✅ Busca funcionando
- ✅ Filtros funcionando
- ✅ Paginação funcionando
- ✅ Ordenação funcionando (se houver)
- ✅ Botão de criar funcionando
- ✅ Botões extras funcionando
- ✅ Loading state funcionando
- ✅ Empty state funcionando
- ✅ Mobile layout funcionando

## 🎨 Customização de Estilos

Se precisar customizar estilos:

```tsx
<TableWithToolbar
  // ... outras props ...
  className="espaçamento-customizado"
  toolbarClassName="estilos-da-toolbar"
  tableClassName="estilos-da-tabela"
/>
```

## 📍 Páginas para Migrar

Liste aqui as páginas que precisam ser migradas:

- [ ] `/usuarios` - Usuários
- [ ] `/partes/clientes` - Clientes
- [ ] `/partes/partes-contrarias` - Partes Contrárias
- [ ] `/acordos-condenacoes` - Acordos e Condenações
- [ ] `/audiencias` - Audiências
- [ ] `/expedientes` - Expedientes
- [ ] `/assinatura-digital/formularios` - Formulários
- [ ] `/assinatura-digital/templates` - Templates
- [ ] `/assinatura-digital/segmentos` - Segmentos
- [ ] `/assistentes` - Assistentes
- [ ] `/captura/agendamentos` - Agendamentos
- [ ] `/captura/credenciais` - Credenciais
- [ ] ... (adicionar outras conforme necessário)

## 🚀 Exemplo Completo

Veja o arquivo `usuarios-page-EXAMPLE.tsx` para um exemplo completo de migração da página de usuários.

## ⚠️ Notas Importantes

1. **Não altere a lógica de negócio** - Apenas substitua a UI
2. **Mantenha os hooks e estados** - Toda a lógica continua igual
3. **Teste em mobile e desktop** - O componente é responsivo
4. **Verifique os filtros** - Cada modo de filtro tem comportamento diferente
5. **Consistência é chave** - Use o componente em TODAS as novas tabelas

## 🎯 Próximos Passos

1. Migrar uma página por vez
2. Testar completamente antes de migrar a próxima
3. Documentar qualquer problema encontrado
4. Ajustar estilos globais se necessário
5. Deprecar o uso separado de `TableToolbar` + `ResponsiveTable`
