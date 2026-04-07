import {
  DemoPageHeader,
  DemoSection,
  DemoCanvas,
} from '../../_components/demo-section'

export default function DataShellLibraryPage() {
  return (
    <div>
      <DemoPageHeader
        eyebrow="Shared"
        title="DataShell"
        description="Padrão obrigatório para todas as tabelas do app. Wrapper sobre TanStack Table que garante toolbar, sorting, filtering, paginação e empty state consistentes."
      />

      <DemoSection title="Composição">
        <DemoCanvas>
          <pre className="overflow-x-auto text-xs leading-relaxed">
            <code>{`<DataShell
  data={processos}
  columns={columns}
  toolbar={<DataTableToolbar searchKey="numero" />}
  emptyState={<EmptyState title="Sem processos" />}
  actions={[
    { label: "Exportar", onClick: handleExport },
  ]}
/>`}</code>
          </pre>
        </DemoCanvas>
      </DemoSection>

      <DemoSection title="Componentes incluídos">
        <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
          <li><code>DataShell</code> — wrapper principal</li>
          <li><code>DataTable</code> — tabela com TanStack Table</li>
          <li><code>DataTableToolbar</code> — search + filtros + view options</li>
          <li><code>DataTableColumnHeader</code> — header sortable de coluna</li>
          <li><code>DataPagination</code> — paginação padrão</li>
        </ul>
      </DemoSection>

      <DemoSection title="Quando NÃO usar">
        <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
          <li>Para listas simples sem tabela, use cards ou listas próprias.</li>
          <li>Para grids editáveis (Excel-like), DataShell não é o padrão — considere TanStack Table puro.</li>
        </ul>
      </DemoSection>
    </div>
  )
}
