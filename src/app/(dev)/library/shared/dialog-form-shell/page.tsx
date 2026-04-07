import {
  DemoPageHeader,
  DemoSection,
  DemoCanvas,
} from '../../_components/demo-section'

export default function DialogFormShellLibraryPage() {
  return (
    <div>
      <DemoPageHeader
        eyebrow="Shared"
        title="DialogFormShell"
        description="Padrão obrigatório para formulários em modal. Header com title/description, footer com botões padronizados (Cancelar + Confirmar), validação de loading state e accessibility correta."
      />

      <DemoSection title="Composição">
        <DemoCanvas>
          <pre className="overflow-x-auto text-xs leading-relaxed">
            <code>{`<DialogFormShell
  open={open}
  onOpenChange={setOpen}
  title="Editar processo"
  description="Atualize os dados do processo selecionado"
  isPending={isPending}
  onSubmit={form.handleSubmit(handleSubmit)}
>
  <FormField name="numero" label="Número" />
  <FormField name="status" label="Status" />
</DialogFormShell>`}</code>
          </pre>
        </DemoCanvas>
      </DemoSection>

      <DemoSection title="Quando usar">
        <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
          <li>Forms de criar/editar entidades em modal</li>
          <li>Confirmações com input adicional</li>
          <li>Wizards curtos (até 3 steps)</li>
        </ul>
      </DemoSection>
    </div>
  )
}
