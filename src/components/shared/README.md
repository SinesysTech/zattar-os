## Padrões de Componentes Compartilhados (`shared/`)

Este diretório contém componentes de UI reutilizáveis e agnósticos de negócio, que formam a base para a construção de interfaces consistentes em todo o Sinesys.

### Componentes Principais

- **`PageShell`**: Um componente de layout que envolve o conteúdo principal de uma página. Ele normalmente inclui o título da página, uma descrição e slots para ações (como botões).
  - **Quando usar:** Em todas as páginas de nível superior dentro de um módulo para garantir consistência visual.

- **`TableToolbar`**: Uma barra de ferramentas especializada para tabelas de dados. Inclui funcionalidades como busca (filtro de texto), botões para filtros avançados e ações primárias (ex: "Adicionar Novo").
  - **Quando usar:** Sempre que uma tabela de dados (`<ResponsiveTable />`) for exibida, para fornecer controles de usuário padronizados.

- **`ResponsiveTable`**: Um wrapper em torno do componente de tabela (`<Table />`) do `shadcn/ui`. Ele gerencia a responsividade, transformando a tabela em uma lista de "cards" em telas menores para melhor usabilidade mobile.
  - **Quando usar:** Para exibir qualquer conjunto de dados tabulares.

- **`StatCard`**: Um card de exibição para métricas e estatísticas chave. Geralmente inclui um ícone, um valor numérico grande e uma descrição ou variação percentual.
  - **Quando usar:** Em dashboards e páginas de visão geral para destacar KPIs importantes.

### Exemplo de Composição para Agentes

Siga este padrão ao construir uma nova página de listagem em um módulo. Isso garante consistência e aproveita ao máximo os componentes compartilhados.

```tsx
// ✅ CORRETO: Usar PageShell para páginas de módulo
import { PageShell } from '@/components/shared/page-shell';
import { TableToolbar } from '@/components/shared/table-toolbar';
import { ResponsiveTable } from '@/components/shared/responsive-table';

export default function MinhaPaginaDeListagem() {
  return (
    <PageShell
      title="Lançamentos Financeiros"
      description="Gerencie receitas e despesas"
    >
      <TableToolbar onSearch={...} filters={...} />
      <ResponsiveTable data={...} columns={...} />
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
