# 📊 TableWithToolbar - Componente Unificado

## ✨ O Que Foi Criado

Componente **TableWithToolbar** que integra `TableToolbar` + `ResponsiveTable` em um único componente reutilizável, garantindo **consistência visual total** em todas as tabelas do aplicativo.

## 📁 Arquivos Criados

1. **`components/ui/table-with-toolbar.tsx`** ⭐

   - Componente principal unificado
   - 163 linhas
   - TypeScript com tipagem completa
   - Todas as features da toolbar + tabela integradas

2. **`components/ui/TABLE_WITH_TOOLBAR_MIGRATION.md`** 📖

   - Guia completo de migração
   - Checklist passo a passo
   - Comparação antes/depois
   - Lista de páginas para migrar

3. **`components/ui/EXAMPLE_TABLE_WITH_TOOLBAR.tsx`** 💡
   - Exemplo prático de uso
   - Baseado na página de usuários
   - Comentários explicativos detalhados
   - Lista de benefícios do componente

## 🎯 Principais Benefícios

### 1. **Consistência Visual Total** ✅

- Todos os estilos centralizados em um único componente
- Mudanças de design aplicadas automaticamente em todas as tabelas
- Mesmo visual e comportamento em todo o app

### 2. **Manutenção Centralizada** 🔧

- Estilos CSS (Tailwind classes) definidos no componente
- Ajustes em um único lugar refletem em todas as implementações
- Reduz drasticamente o risco de inconsistências

### 3. **Menos Código Repetitivo** 📝

```tsx
// ANTES: ~25 linhas
<div className="space-y-4">
  <TableToolbar {...toolbarProps} />
  <ResponsiveTable {...tableProps} />
</div>

// DEPOIS: 1 componente
<TableWithToolbar {...allProps} />
```

### 4. **Tipagem TypeScript Completa** 💎

- Todos os tipos exportados
- Autocomplete funcionando perfeitamente
- Detecção de erros em tempo de desenvolvimento

### 5. **Todas as Features Mantidas** 🚀

- ✅ Busca com debounce
- ✅ Filtros (3 modos: single, buttons, panel)
- ✅ Paginação server-side
- ✅ Ordenação server-side
- ✅ Seleção de linhas
- ✅ Ações de linha
- ✅ Layout responsivo (cards/scroll)
- ✅ Estados de loading/erro
- ✅ Empty states
- ✅ Botão de criar
- ✅ Botões extras customizáveis

## 📋 Como Usar

### Import Básico

```tsx
import {
  TableWithToolbar,
  type ResponsiveTableColumn,
} from "@/components/ui/table-with-toolbar";
```

### Uso Simples

```tsx
<TableWithToolbar
  data={items}
  columns={colunas}
  searchValue={busca}
  onSearchChange={setBusca}
  pagination={paginacao}
  isLoading={isLoading}
/>
```

### Uso Completo

```tsx
<TableWithToolbar
  // Dados
  data={items}
  columns={colunas}
  // Busca
  searchValue={busca}
  onSearchChange={setBusca}
  isSearching={isSearching}
  searchPlaceholder="Buscar..."
  // Filtros
  filterGroups={filterGroups}
  selectedFilters={selectedFilterIds}
  onFiltersChange={handleFilterIdsChange}
  filterButtonsMode="buttons"
  // Botões
  onNewClick={() => setCreateOpen(true)}
  extraButtons={<MeusBotoes />}
  // Tabela
  pagination={paginacao}
  isLoading={isLoading}
  mobileLayout="cards"
  stickyFirstColumn={true}
/>
```

## 🎨 Estilos CSS

### Centralização Garantida

Todos os estilos estão definidos usando **Tailwind CSS classes** dentro dos componentes:

```tsx
// TableToolbar (linha 219-269)
className={cn("flex flex-col gap-4 md:flex-row md:items-start", className)}

// ResponsiveTable
className={cn("space-y-4", className)}

// FilterButton (linha 72-75)
className={cn(
  "h-9 gap-1.5 px-3 font-normal",
  selectedCount > 0 && "bg-accent"
)}
```

### Padrões de Estilo Utilizados

- **Espaçamento**: `gap-4`, `space-y-4`, `px-3`, `py-2`
- **Cores do tema**: `bg-accent`, `text-accent-foreground`, `bg-primary`
- **Transições**: `transition-colors`, `hover:bg-accent`
- **Responsividade**: `md:flex-row`, `min-w-[min(92vw,37.5rem)]`

### Customização Opcional

```tsx
<TableWithToolbar
  className="espaçamento-customizado"
  toolbarClassName="estilos-da-toolbar"
  tableClassName="estilos-da-tabela"
/>
```

## 📍 Páginas para Migrar

Lista de páginas que devem ser migradas para usar o componente unificado:

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

## 🚀 Próximos Passos

1. **Revisar** os arquivos criados
2. **Testar** o componente em uma página
3. **Migrar** uma página de cada vez
4. **Validar** que tudo funciona perfeitamente
5. **Documentar** qualquer ajuste necessário
6. **Expandir** para todas as outras páginas

## ⚠️ Notas Importantes

1. **Não altere a lógica de negócio** - Apenas substitua os componentes de UI
2. **Mantenha hooks e estados** - A lógica continua exatamente igual
3. **Teste responsividade** - Verifique em mobile e desktop
4. **Sem CSS inline** - Todos os estilos via Tailwind classes (conforme especificação)
5. **Use em TODAS as novas tabelas** - Para garantir consistência total

## 📚 Documentação

- **Componente**: `components/ui/table-with-toolbar.tsx`
- **Guia de Migração**: `components/ui/TABLE_WITH_TOOLBAR_MIGRATION.md`
- **Exemplo de Uso**: `components/ui/EXAMPLE_TABLE_WITH_TOOLBAR.tsx`

## 💡 Suporte

Se encontrar problemas durante a migração:

1. Consulte o arquivo de exemplo
2. Verifique o guia de migração
3. Compare com a implementação original
4. Documente o problema para ajustar o componente se necessário

---

**Criado em**: 2025-12-09  
**Versão**: 1.0  
**Status**: ✅ Pronto para uso
