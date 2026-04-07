import { EmptyState } from '@/components/shared/empty-state'
import { FileX } from 'lucide-react'
import {
  DemoPageHeader,
  DemoSection,
  DemoCanvas,
} from '../../_components/demo-section'

export default function EmptyStateLibraryPage() {
  return (
    <div>
      <DemoPageHeader
        eyebrow="Shared"
        title="EmptyState"
        description="Estado vazio padronizado: ícone + título + descrição + ação opcional. Use sempre que uma lista/tabela/sheet não tiver dados — nunca deixe a UI vazia sem feedback."
      />

      <DemoSection title="Variantes">
        <div className="space-y-4">
          <DemoCanvas>
            <EmptyState
              icon={FileX}
              title="Nenhum processo encontrado"
              description="Não há processos cadastrados para este cliente. Crie um novo processo para começar."
            />
          </DemoCanvas>
        </div>
      </DemoSection>

      <DemoSection title="Quando usar">
        <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
          <li>Tabela/lista sem registros</li>
          <li>Search/filter sem matches (use texto contextual: &quot;Nenhum resultado para X&quot;)</li>
          <li>Sheet/dialog sem itens selecionados</li>
          <li>Estado inicial de uma feature nova</li>
        </ul>
      </DemoSection>
    </div>
  )
}
