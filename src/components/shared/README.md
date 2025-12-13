## Padrões de Componentes Compartilhados (`shared/`)

Este diretório contém componentes de UI reutilizáveis e agnósticos de negócio, que formam a base para a construção de interfaces consistentes em todo o Sinesys.

### Componentes Principais

- **`PageShell`**: Um componente de layout que envolve o conteúdo principal de uma página. Inclui título, descrição e slots para ações (como botões).
  - **Quando usar:** Em todas as páginas de nível superior dentro de um módulo para garantir consistência visual.

- **`DataShell`**: Container visual para superfícies de dados (listas/tabelas), com narrativa “colada” (header + conteúdo scrollável + footer).
  - **Quando usar:** Em páginas de listagem para unir toolbar, tabela e paginação com consistência.

- **`DataTable`**: Tabela baseada em TanStack Table, projetada para ser usada dentro do `DataShell`.
  - **Quando usar:** Para exibir conjuntos de dados tabulares (com paginação/ordenação server-side quando necessário).

- **`StatCard`**: Um card de exibição para métricas e estatísticas chave. Geralmente inclui um ícone, um valor numérico grande e uma descrição ou variação percentual.
  - **Quando usar:** Em dashboards e páginas de visão geral para destacar KPIs importantes.

### Exemplo de Composição para Agentes

Siga este padrão ao construir uma nova página de listagem em um módulo. Isso garante consistência e aproveita ao máximo os componentes compartilhados.

```tsx
// ✅ CORRETO: Usar PageShell para páginas de módulo
import { PageShell } from '@/components/shared/page-shell';
import { DataShell, DataTable, DataPagination } from '@/components/shared/data-shell';
import { TableToolbar } from '@/components/ui/table-toolbar';

export default function MinhaPaginaDeListagem() {
  return (
    <PageShell
      title="Lançamentos Financeiros"
      description="Gerencie receitas e despesas"
    >
      <DataShell
        header={<TableToolbar variant="integrated" {...propsToolbar} />}
        footer={<DataPagination {...propsPaginacao} />}
      >
        <div className="relative border-t">
          <DataTable {...propsTabela} hideTableBorder hidePagination />
        </div>
      </DataShell>
    </PageShell>
  );
}

// ❌ ERRADO: Recriar layout manualmente na página
export function PaginaIncorreta() {
    return (
        <div className="p-6">
            <h1 className="text-2xl">Lançamentos</h1>
            {/* ... recriar toolbar e tabela manualmente ... */}
        </div>
    );
}
```
