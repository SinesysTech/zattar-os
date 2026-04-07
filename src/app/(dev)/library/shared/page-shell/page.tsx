import {
  DemoPageHeader,
  DemoSection,
  DemoCanvas,
} from '../../_components/demo-section'

export default function PageShellLibraryPage() {
  return (
    <div>
      <DemoPageHeader
        eyebrow="Shared"
        title="PageShell"
        description="Layout shell padrão para páginas autenticadas. Header com title/breadcrumb/actions, container com max-width consistente e gap padronizado entre seções."
      />

      <DemoSection title="Estrutura">
        <DemoCanvas>
          <pre className="overflow-x-auto text-xs leading-relaxed">
            <code>{`<PageShell
  title="Processos"
  description="Acompanhamento dos processos do escritório"
  actions={<Button>Novo processo</Button>}
  breadcrumb={[{ label: "Início", href: "/" }, { label: "Processos" }]}
>
  <DataShell>
    {/* tabela */}
  </DataShell>
</PageShell>`}</code>
          </pre>
        </DemoCanvas>
      </DemoSection>

      <DemoSection title="Quando usar">
        <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
          <li>Toda página sob <code>(authenticated)</code> deve usar PageShell.</li>
          <li>Garante max-width consistente, padding correto e header padronizado.</li>
          <li>Para páginas com tabela, combine com <code>DataShell</code> dentro.</li>
          <li>Para detalhes/sheet, use <code>DetailSheet</code> em vez disso.</li>
        </ul>
      </DemoSection>
    </div>
  )
}
